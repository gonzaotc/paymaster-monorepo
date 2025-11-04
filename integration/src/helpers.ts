import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Abi, Hex } from 'viem';

/**
 * Load a Forge-compiled contract artifact from the contracts package
 */
export function loadForgeArtifact(contractName: string): {
	abi: Abi;
	bytecode: Hex;
} {
	const artifactPath = resolve(
		__dirname,
		`../../contracts/out/${contractName}.sol/${contractName}.json`
	);
	const artifact = JSON.parse(readFileSync(artifactPath, 'utf-8')) as {
		abi: Abi;
		bytecode: { object: string };
	};
	const bytecode: string = artifact.bytecode.object;

	// Ensure bytecode has 0x prefix
	const prefixedBytecode = bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`;

	return {
		abi: artifact.abi,
		bytecode: prefixedBytecode as Hex,
	};
}
