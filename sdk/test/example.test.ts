import { describe, it, expect, vi } from 'vitest';
import { parseUnits, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import type { PoolKey } from '../src/uniswapV4';

// Mock the router module to avoid blockchain calls
vi.mock('../src/router.js', () => {
	const mockPoolKey: PoolKey = {
		currency0: '0x0000000000000000000000000000000000000000' as Address,
		currency1: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as Address, // USDC on Sepolia
		fee: 5000,
		tickSpacing: 60,
		hooks: '0x0000000000000000000000000000000000000000' as Address,
	};

	return {
		router: {
			findBestPoolKey: vi.fn().mockResolvedValue(mockPoolKey),
		},
	};
});

// Import after mocking
import { permit2, router, PAYMASTER_ADDRESS, USDC_ADDRESS } from '../src/index';

describe('SDK Smoke Tests', () => {
	// Mock account for testing (well-known test private key, never use in production)
	const mockAccount = privateKeyToAccount(
		'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
	);

	describe('permit2', () => {
		it('should build permit2 single without errors', () => {
			const permit2Single = permit2.buildPermit2Single(
				USDC_ADDRESS,
				parseUnits('10', 6),
				PAYMASTER_ADDRESS,
				0, // nonce
				BigInt(Math.floor(Date.now() / 1000) + 86400), // sigDeadline (24h)
				0 // expiration
			);

			expect(permit2Single).toBeDefined();
			expect(permit2Single.details.token).toBe(USDC_ADDRESS);
			expect(permit2Single.details.amount).toBe(parseUnits('10', 6));
			expect(permit2Single.spender).toBe(PAYMASTER_ADDRESS);
			expect(permit2Single.details.nonce).toBe(0);
		});

		it('should sign permit2 single without errors', async () => {
			const permit2Single = permit2.buildPermit2Single(
				USDC_ADDRESS,
				parseUnits('10', 6),
				PAYMASTER_ADDRESS,
				0,
				BigInt(Math.floor(Date.now() / 1000) + 86400),
				0
			);

			const signature = await permit2.signPermit2Single(permit2Single, mockAccount, sepolia.id);

			expect(signature).toBeDefined();
			expect(signature).toMatch(/^0x[a-fA-F0-9]+$/);
			expect(signature.length).toBeGreaterThan(130); // typical EIP-712 signature length
		});
	});

	describe('router', () => {
		it('should find best pool key (mocked)', async () => {
			const amount = parseUnits('10', 6);
			const poolKey = await router.findBestPoolKey(USDC_ADDRESS, amount, sepolia);

			expect(poolKey).toBeDefined();
			expect(poolKey.currency1).toBe(USDC_ADDRESS);
			expect(poolKey.fee).toBe(5000);
			expect(poolKey.tickSpacing).toBe(60);
		});
	});

	describe('full flow', () => {
		it('should execute complete flow without errors', async () => {
			const amount = parseUnits('10', 6);

			// 1. Find best pool
			const poolKey = await router.findBestPoolKey(USDC_ADDRESS, amount, sepolia);
			expect(poolKey).toBeDefined();

			// 2. Build permit2
			const permit2Single = permit2.buildPermit2Single(
				USDC_ADDRESS,
				amount,
				PAYMASTER_ADDRESS,
				0,
				BigInt(Math.floor(Date.now() / 1000) + 86400),
				0
			);
			expect(permit2Single).toBeDefined();

			// 3. Sign permit2
			const signature = await permit2.signPermit2Single(permit2Single, mockAccount, sepolia.id);
			expect(signature).toBeDefined();

			// Note: paymaster.buildPaymasterData() is currently commented out in the SDK
			// Uncomment this once the function is implemented:
			// const paymasterData = paymaster.buildPaymasterData({
			//   poolKey,
			//   permit: permit2Single,
			//   signature,
			// });
		});
	});
});
