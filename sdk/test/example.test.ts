// import { describe, it, expect, vi } from 'vitest';
// import { parseUnits, type Address } from 'viem';
// import { privateKeyToAccount } from 'viem/accounts';
// import { sepolia } from 'viem/chains';
// import type { Pool } from 'paymaster-sdk';

// const USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as Address;
// const ORACLE_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

// // Mock the router module to avoid blockchain calls
// vi.mock('../src/router.js', () => {
// 	const mockPoolKey: Pool= {
// 		token: USDC_ADDRESS,
// 		oracle: ORACLE_ADDRESS,
// 		lpFeeBps: 200,
// 		rebalancingFeeBps: 300,
// 	};

// 	return {
// 		router: {
// 			findBestPoolKey: vi.fn().mockResolvedValue(mockPoolKey),
// 		},
// 	};
// });

// // Import after mocking
// import { router, PAYMASTER_ADDRESS } from '../src/index';

// describe('SDK Smoke Tests', () => {
// 	// Mock account for testing (well-known test private key, never use in production)
// 	const mockAccount = privateKeyToAccount(
// 		'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
// 	);

// 	describe('router', () => {
// 		it('should find best pool key (mocked)', async () => {
// 			const amount = parseUnits('10', 6);
// 			const poolKey = await router.findBestPoolKey(USDC_ADDRESS, amount, sepolia);

// 			expect(poolKey).toBeDefined();
// 			expect(poolKey.token).toBe(USDC_ADDRESS);
// 			expect(poolKey.oracle).toBe(ORACLE_ADDRESS);
// 			expect(poolKey.lpFeeBps).toBe(200);
// 			expect(poolKey.rebalancingFeeBps).toBe(300);
// 		});
// 	});

// 	describe('full flow', () => {
// 		it('should execute complete flow without errors', async () => {
// 			const amount = parseUnits('10', 6);

// 			// 1. Find best pool
// 			const poolKey = await router.findBestPoolKey(USDC_ADDRESS, amount, sepolia);
// 			expect(poolKey).toBeDefined();

// 			// // 2. Build permit2
// 			// const permit2Single = permit2.buildPermit2Single(
// 			// 	USDC_ADDRESS,
// 			// 	amount,
// 			// 	PAYMASTER_ADDRESS,
// 			// 	0,
// 			// 	BigInt(Math.floor(Date.now() / 1000) + 86400),
// 			// 	0
// 			// );
// 			// expect(permit2Single).toBeDefined();

// 			// // 3. Sign permit2
// 			// const signature = await permit2.signPermit2Single(permit2Single, mockAccount, sepolia.id);
// 			// expect(signature).toBeDefined();

// 			// Note: paymaster.buildPaymasterData() is currently commented out in the SDK
// 			// Uncomment this once the function is implemented:
// 			// const paymasterData = paymaster.buildPaymasterData({
// 			//   poolKey,
// 			//   permit: permit2Single,
// 			//   signature,
// 			// });
// 		});
// 	});
// });
