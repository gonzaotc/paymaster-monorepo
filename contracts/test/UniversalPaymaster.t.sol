// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// External
// ethereum-infinitism
import {EntryPoint} from "@eth-infinitism/account-abstraction/contracts/core/EntryPoint.sol";
// openzeppelin
import {ERC4337Utils} from "@openzeppelin/contracts/account/utils/draft-ERC4337Utils.sol";
import {PackedUserOperation} from "@openzeppelin/contracts/interfaces/draft-IERC4337.sol";
import {IEntryPoint} from "@openzeppelin/contracts/interfaces/draft-IERC4337.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";

// Internal
import {UniversalPaymaster} from "../src/UniversalPaymaster.sol";
import {MinimalAccountEIP7702} from "test/mocks/accounts/MinimalAccountEIP7702.sol";
import {UserOpHelper} from "../test/helpers/UserOpHelper.sol";
import {TestingUtils} from "../test/helpers/TestingUtils.sol";
import {ERC20Mock} from "../test/mocks/ERC20Mock.sol";
import {OracleMock} from "../test/mocks/OracleMock.sol";

// Test
import {Test, Vm} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";

contract UniversalPaymasterTest is Test, UserOpHelper, TestingUtils {
    using ERC4337Utils for *;
    using SafeCast for *;

    // The ERC-4337 EntryPoint Singleton
    EntryPoint public entryPoint;
    // The ERC-4337 bundler
    address public bundler;

    // Someone funding the Paymaster in the EntryPointwith an initial deposit
    address public depositor;

    // Someone rebalancing the pool
    address public rebalancer;

    // The UniversalPaymaster contract being tested
    UniversalPaymaster public paymaster;

    // An ERC-20 token accepted by a particular [ETH, token] pool
    ERC20Mock public token;

    uint256 tokenId;

    // The Oracle for the token
    OracleMock public oracle;

    // The EOA that will get sponsored by the paymaster
    // forge-lint: disable-next-line
    address EOA;
    // The private key of the EOA used to sign the user operations
    // forge-lint: disable-next-line
    uint256 EOAPrivateKey;

    // An OpenZeppelin ERC-4337 ECDSA Account Instance to delegate to
    MinimalAccountEIP7702 public account;

    // Someone receiving tokens from "EOA" because of the sponsored userop
    address receiver;

    struct GasConfiguration {
        uint256 callGasLimit; // The amount of gas to allocate the main execution call
        uint256 verificationGasLimit; //The amount of gas to allocate for the verification step
        uint256 preVerificationGas; // Extra gas to pay the bundler
        uint256 paymasterVerificationGasLimit; // The amount of gas to allocate for the paymaster validation code (only if paymaster exists)
        uint256 paymasterPostOpGasLimit; // The amount of gas to allocate for the paymaster post-operation code (only if paymaster exists)
        uint256 maxFeePerGas; // Maximum fee per gas (similar to EIP-1559 max_fee_per_gas)
        uint256 maxPriorityFeePerGas; // Maximum priority fee per gas (similar to EIP-1559 max_priority_fee_per_gas)
    }

    function setUp() public {
        // deploy the entrypoint
        deployCodeTo(
            "account-abstraction/contracts/core/EntryPoint.sol",
            address(ERC4337Utils.ENTRYPOINT_V08)
        );
        entryPoint = EntryPoint(payable(address(ERC4337Utils.ENTRYPOINT_V08)));

        // deploy the paymaster
        paymaster = new UniversalPaymaster();

        // create a ERC20 with permit.
        token = new ERC20Mock();
        tokenId = uint256(uint160(address(token)));

        // deploy the oracle, fixed price of (1 token = 1 eth)
        oracle = new OracleMock(1e18);

        // Deploy the ECDSA account to delegate to
        account = new MinimalAccountEIP7702();

        // initialize the pool
        paymaster.initializePool(address(token), 100, 100, address(oracle));

        // create accounts
        (bundler) = makeAddr("bundler");
        (depositor) = makeAddr("depositor");
        (rebalancer) = makeAddr("rebalancer");
        (EOA, EOAPrivateKey) = makeAddrAndKey("EOA");
        (receiver) = makeAddr("receiver");

        // fund bundler
        vm.deal(bundler, 1e18);

        // fund depositor
        vm.deal(depositor, 100e18);

        // fund rebalancer
        vm.deal(rebalancer, 1e18);
    }

    // EIP-7702 tests require Foundry nightly with Vm.SignedDelegation support
    function test_eip7702_delegation() public {
        assertEq(address(EOA).code.length, 0);
        Vm.SignedDelegation memory signedDelegation =
            vm.signDelegation(address(account), EOAPrivateKey);
        vm.attachDelegation(signedDelegation);
        bytes memory expectedCode = abi.encodePacked(hex"ef0100", address(account));
        assertEq(address(EOA).code, expectedCode);
    }

    function test_ERC1271_signature() public {
        Vm.SignedDelegation memory signedDelegation =
            vm.signDelegation(address(account), EOAPrivateKey);
        vm.attachDelegation(signedDelegation);
        string memory text = "Hello, world!";
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n13", text));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(EOAPrivateKey, hash);
        bytes memory signature = abi.encodePacked(r, s, v);
        bytes4 result = IERC1271(EOA).isValidSignature(hash, signature);
        assertEq(result, IERC1271.isValidSignature.selector);
    }

    function test_sponsor_user_operation() public {
        // 1. EOA has 1000 tokens but no eth.
        token.mint(EOA, 1000e18);
        assertEq(token.balanceOf(EOA), 1000e18);

        uint256 userBalanceBefore = EOA.balance;
        uint256 depositorBalanceBefore = depositor.balance;
        uint256 rebalancerBalanceBefore = rebalancer.balance;
        uint256 bundlerBalanceBefore = bundler.balance;
        uint256 entrypointBalanceBefore = entryPoint.balanceOf(address(paymaster));
        assertEq(userBalanceBefore, 0);
        assertEq(entrypointBalanceBefore, 0);

        uint256 userTokensBefore = token.balanceOf(EOA);
        uint256 depositorTokensBefore = token.balanceOf(depositor);
        uint256 rebalancerTokensBefore = token.balanceOf(rebalancer);
        uint256 receiverTokensBefore = token.balanceOf(receiver);

        // depositor deposits 1 eth for the token pool
        vm.startPrank(depositor);
        paymaster.deposit{value: 1e18}(1e18, depositor, tokenId);
        vm.stopPrank();

        // paymater now has 1 eth deposited in the entrypoint
        assertEq(entryPoint.balanceOf(address(paymaster)), 1e18);

        // paymaster now has 1 eth deposited in the token pool
        assertEq(paymaster.totalAssets(tokenId), 1e18);

        // paymaster has emited 1e18 shares for the depositor
        assertEq(paymaster.totalSupply(tokenId), 1e18);

        // depositor now has 1e18 shares of the token pool
        assertEq(paymaster.balanceOf(depositor, tokenId), 1e18);

        // user approves the paymaster to spend the tokens
        // will later be refactored into Permit1+Permit2 for gasless approval.
        vm.prank(EOA);
        token.approve(address(paymaster), type(uint256).max);
        assertEq(token.allowance(EOA, address(paymaster)), type(uint256).max);

        // 2. Delegate to the account
        Vm.SignedDelegation memory signedDelegation =
            vm.signDelegation(address(account), EOAPrivateKey);
        vm.attachDelegation(signedDelegation);

        GasConfiguration memory gasConfig = GasConfiguration({
            preVerificationGas: 1_000, // Extra gas to pay the bundler operational costs such as bundle tx cost and entrypoint static code execution.
            verificationGasLimit: 49_990, // The amount of gas to allocate for the verification step
            paymasterVerificationGasLimit: 63_450, // The amount of gas to allocate for the paymaster validation code (only if paymaster exists)
            paymasterPostOpGasLimit: 22_100, // The amount of gas to allocate for the paymaster post-operation code (only if paymaster exists)
            callGasLimit: 30_250, // The amount of gas to allocate the main execution call
            maxPriorityFeePerGas: 1 gwei, // Maximum priority fee per gas (similar to EIP-1559 max_priority_fee_per_gas)
            maxFeePerGas: 1 gwei // Maximum fee per gas (similar to EIP-1559 max_fee_per_gas)
        });

        // 3. Build paymaster data
        bytes memory paymasterData = buildPaymasterData(
            address(paymaster), // paymaster
            uint128(gasConfig.paymasterVerificationGasLimit), // verification gas limit
            uint128(gasConfig.paymasterPostOpGasLimit), // post-op gas limit
            address(token)
        );

        // 4. Build calldata, where account sends 1 token to receiver
        bytes memory callData = abi.encodeWithSelector(
            MinimalAccountEIP7702.execute.selector,
            address(token),
            0,
            abi.encodeWithSelector(token.transfer.selector, receiver, 1e18)
        );

        // 5. Build UserOperation
        PackedUserOperation memory userOp = buildUserOp(
            EOA,
            MinimalAccountEIP7702(payable(EOA)).getNonce(),
            callData,
            paymasterData,
            gasConfig.verificationGasLimit,
            gasConfig.callGasLimit,
            gasConfig.preVerificationGas,
            gasConfig.maxPriorityFeePerGas,
            gasConfig.maxFeePerGas
        );

        // 6. Sign UserOperation
        userOp = this.signUserOp(userOp, EOAPrivateKey, address(entryPoint));

        // 7. Bundle the user operation
        PackedUserOperation[] memory userOps = new PackedUserOperation[](1);
        userOps[0] = userOp;

        console.log("Sponsoring!");
        vm.startPrank(bundler);
        vm.expectEmit(true, true, true, true);
        emit IERC20.Transfer(EOA, receiver, 1e18);
        IEntryPoint(address(entryPoint)).handleOps(userOps, payable(bundler));
        vm.stopPrank();
        console.log("Sponsoring done!");

        uint256 depositorAssetsAfterSponsoring = paymaster.maxWithdraw(depositor, tokenId);
        uint256 totalAssetsAfterSponsoring = paymaster.totalAssets(tokenId);
        uint256 entryPointDepositAfterSponsoring = entryPoint.balanceOf(address(paymaster));

        // console.log("total assets after sponsoring: ", totalAssetsAfterSponsoring);
        // console.log("entry point deposit after sponsoring: ", entryPointDepositAfterSponsoring);

        int256 entryPointVsDepositorDelta =
            int256(entryPointDepositAfterSponsoring) - int256(depositorAssetsAfterSponsoring);
        console.log("entry point vs depositor delta: ", entryPointVsDepositorDelta);

        assertEq(
            depositorAssetsAfterSponsoring,
            totalAssetsAfterSponsoring,
            "depositor assets != total assets"
        );
        assertApproxEqAbs(
            entryPointDepositAfterSponsoring,
            depositorAssetsAfterSponsoring,
            1e12,
            "entry point deposit != depositor assets"
        );

        // 8. Rebalancer rebalances the pool buying all the tokens available
        vm.startPrank(rebalancer);
        uint256 tokenReserves = paymaster.getPoolTokenReserves(address(token));
        paymaster.rebalance{value: 1e18}(address(token), tokenReserves, rebalancer);
        vm.stopPrank();

        // pool should not have tokens any longer
        assertEq(token.balanceOf(address(paymaster)), 0);

        // 9. Depositor withdraws their eth
        uint256 depositorAssets = paymaster.maxWithdraw(depositor, tokenId);
        uint256 totalAssets = paymaster.totalAssets(tokenId);
        assertGe(
            totalAssets,
            depositorAssets,
            "total assets should be greater than or equal to depositor assets"
        );
        assertEq(
            depositorAssets,
            totalAssets - 1,
            "depositor assets should be the total assets minus the inflation protection"
        );

        vm.startPrank(depositor);
        paymaster.withdraw(depositorAssets, depositor, depositor, tokenId);
        vm.stopPrank();

        uint256 userBalanceAfter = EOA.balance;
        uint256 depositorBalanceAfter = depositor.balance;
        uint256 rebalancerBalanceAfter = rebalancer.balance;
        uint256 bundlerBalanceAfter = bundler.balance;
        uint256 entrypointBalanceAfter = entryPoint.balanceOf(address(paymaster));

        int256 userDelta = int256(userBalanceAfter) - int256(userBalanceBefore);
        int256 depositorDelta = int256(depositorBalanceAfter) - int256(depositorBalanceBefore);
        int256 rebalancerDelta = int256(rebalancerBalanceAfter) - int256(rebalancerBalanceBefore);
        int256 bundlerDelta = int256(bundlerBalanceAfter) - int256(bundlerBalanceBefore);
        int256 entrypointDelta = int256(entrypointBalanceAfter) - int256(entrypointBalanceBefore);

        uint256 userTokensAfter = token.balanceOf(EOA);
        uint256 depositorTokensAfter = token.balanceOf(depositor);
        uint256 rebalancerTokensAfter = token.balanceOf(rebalancer);
        uint256 receiverTokensAfter = token.balanceOf(receiver);

        // depositor should not have received any tokens
        assertEq(depositorTokensAfter, 0);

        int256 userTokensDelta = int256(userTokensAfter) - int256(userTokensBefore);
        int256 depositorTokensDelta = int256(depositorTokensAfter) - int256(depositorTokensBefore);
        int256 rebalancerTokensDelta =
            int256(rebalancerTokensAfter) - int256(rebalancerTokensBefore);
        int256 receiverTokensDelta = int256(receiverTokensAfter) - int256(receiverTokensBefore);

        int256 rebalancerProfit = rebalancerTokensDelta + rebalancerDelta;

        // user should not have paid neither received any eth
        assertEq(userDelta, 0);

        // console.log("user eth delta", userDelta);
        console.log("user tokens delta", userTokensDelta + 1e18);

        // console.log("receiver tokens delta", receiverTokensDelta);

        console.log("depositor eth delta (profit)", depositorDelta);
        // console.log("depositor tokens delta", depositorTokensDelta);

        // console.log("rebalancer eth delta", rebalancerDelta);
        // console.log("rebalancer tokens delta", rebalancerTokensDelta);
        console.log("rebalancer profit (1eth=1token)", rebalancerProfit);

        console.log("bundler eth delta (profit)", bundlerDelta);

        console.log("entrypoint eth delta", entrypointDelta);
    }
}
