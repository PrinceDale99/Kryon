import * as StellarSdk from '@stellar/stellar-sdk';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * KryonOracle: Signs ZK proof attestations after off-chain verification.
 * The oracle's Ed25519 public key is registered in the Soroban contract.
 * Soroban verifies oracle signatures natively via env.crypto().verify_sig_ed25519().
 */
export class KryonOracle {
    private keypair: StellarSdk.Keypair;

    constructor() {
        const secretKey = process.env.ORACLE_SECRET_KEY;
        if (!secretKey) {
            throw new Error('ORACLE_SECRET_KEY environment variable not set. ' +
                'Generate one with: stellar keys generate oracle --network testnet');
        }
        this.keypair = StellarSdk.Keypair.fromSecret(secretKey);
    }

    get publicKey(): string {
        return this.keypair.publicKey();
    }

    get rawPublicKeyBytes(): Buffer {
        // Returns the raw 32-byte Ed25519 public key (not the Stellar G-address)
        return Buffer.from(this.keypair.rawPublicKey());
    }

    /**
     * Verify a Barretenberg proof off-chain using the BB WASM verifier,
     * then sign an attestation message that Soroban can verify.
     *
     * @param proofBytes - The raw proof bytes from Barretenberg
     * @param publicInputs - Array of hex-encoded field elements (public circuit inputs)
     * @param nullifier - 32-byte nullifier as hex string
     * @param circuitType - Which circuit was used
     * @returns Signed attestation object
     */
    async verifyAndAttest(
        proofBytes: Uint8Array,
        publicInputs: string[],
        nullifier: string,
        circuitType: 'invoice' | 'kyc' | 'merkle' | 'solvency' | 'age'
    ): Promise<OracleAttestation> {
        // Step 1: Verify the proof off-chain using Barretenberg's UltraPlonk verifier
        const isValid = await this.verifyProofOffChain(proofBytes, publicInputs, circuitType);
        if (!isValid) {
            throw new Error(`Oracle: ZK proof verification FAILED for circuit=${circuitType}`);
        }

        // Step 2: Build the attestation message
        // Format: SHA256(circuit_type || nullifier || public_inputs_concat || timestamp)
        const timestamp = Math.floor(Date.now() / 1000);
        const messageHash = this.buildAttestationMessage(
            circuitType, nullifier, publicInputs, timestamp
        );

        // Step 3: Sign with oracle's Ed25519 key (same as Stellar signing)
        const signature = this.keypair.sign(messageHash);

        return {
            isValid: true,
            circuitType,
            nullifier,
            publicInputs,
            timestamp,
            messageHash: messageHash.toString('hex'),
            signature: Buffer.from(signature).toString('hex'),
            oraclePublicKey: this.rawPublicKeyBytes.toString('hex'),
        };
    }

    /**
     * Verify a Barretenberg UltraPlonk proof off-chain.
     * Uses @noir-lang/backend_barretenberg directly.
     */
    private async verifyProofOffChain(
        proofBytes: Uint8Array,
        publicInputs: string[],
        circuitType: string
    ): Promise<boolean> {
        // Dynamically import the compiled circuit artifact
        const artifactPath = path.resolve(
            __dirname,
            `../../kryon_zk/${circuitType}_proof/target/${circuitType}_proof.json`
        );

        if (!fs.existsSync(artifactPath)) {
            throw new Error(
                `Circuit artifact not found: ${artifactPath}. ` +
                `Run 'nargo compile' in kryon_zk/${circuitType}_proof/`
            );
        }

        const circuit = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));

        // @ts-ignore
        const { BarretenbergBackend } = await import('@noir-lang/backend_barretenberg');
        const backend = new BarretenbergBackend(circuit, { threads: 4 });

        try {
            // UltraPlonk verification  real cryptographic check
            const result = await backend.verifyFinalProof({
                proof: proofBytes,
                publicInputs: publicInputs,
            });
            return result;
        } finally {
            await backend.destroy();
        }
    }

    buildAttestationMessage(
        circuitType: string,
        nullifier: string,
        publicInputs: string[],
        timestamp: number
    ): Buffer {
        const hash = crypto.createHash('sha256');
        hash.update(circuitType);
        hash.update(nullifier);
        hash.update(publicInputs.join(''));
        hash.update(timestamp.toString());
        return hash.digest();
    }
}

export interface OracleAttestation {
    isValid: boolean;
    circuitType: string;
    nullifier: string;
    publicInputs: string[];
    timestamp: number;
    messageHash: string;
    signature: string;           // hex-encoded 64-byte Ed25519 signature
    oraclePublicKey: string;     // hex-encoded 32-byte Ed25519 pubkey
}
