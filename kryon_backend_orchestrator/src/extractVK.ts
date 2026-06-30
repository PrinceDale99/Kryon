import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import * as fs from 'fs';
import * as path from 'path';

async function extractVerifyingKey(circuitName: string): Promise<void> {
    const artifactPath = path.resolve(__dirname, `../../kryon_zk/${circuitName}_proof/target/${circuitName}_proof.json`);
    const circuit = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));

    // @ts-ignore
    const backend = new BarretenbergBackend(circuit, { threads: 4 });

    // Generate a valid dummy proof to initialize the backend
    // (Barretenberg requires a proof generation to expose the VK)
    console.log(`Extracting VK for ${circuitName}...`);
    const vkBytes = await backend.getVerificationKey();

    // Save VK as hex for storage in the Soroban contract
    const vkHex = Buffer.from(vkBytes).toString('hex');
    const outputPath = path.resolve(__dirname, `../../kryon_zk/${circuitName}_proof/target/${circuitName}_vk.hex`);
    fs.writeFileSync(outputPath, vkHex);

    console.log(`VK saved to ${outputPath}`);
    console.log(`VK length: ${vkBytes.length} bytes`);

    await backend.destroy();
}

// Extract VK for all circuits
async function main() {
    await extractVerifyingKey('invoice');
    await extractVerifyingKey('kyc');
    await extractVerifyingKey('merkle_membership');
    await extractVerifyingKey('solvency');
    await extractVerifyingKey('age');
}

main().catch(console.error);
