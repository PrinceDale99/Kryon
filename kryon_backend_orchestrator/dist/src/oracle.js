"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KryonOracle = void 0;
const StellarSdk = __importStar(require("@stellar/stellar-sdk"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
/**
 * KryonOracle: Signs ZK proof attestations after off-chain verification.
 * The oracle's Ed25519 public key is registered in the Soroban contract.
 * Soroban verifies oracle signatures natively via env.crypto().verify_sig_ed25519().
 */
class KryonOracle {
    keypair;
    constructor() {
        const secretKey = process.env.ORACLE_SECRET_KEY;
        if (!secretKey) {
            console.warn('WARNING: ORACLE_SECRET_KEY environment variable not set. Generating a temporary random keypair for this session.');
            this.keypair = StellarSdk.Keypair.random();
        }
        else {
            this.keypair = StellarSdk.Keypair.fromSecret(secretKey);
        }
    }
    get publicKey() {
        return this.keypair.publicKey();
    }
    get rawPublicKeyBytes() {
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
    async verifyAndAttest(proofBytes, publicInputs, nullifier, circuitType) {
        // Step 1: Verify the proof off-chain using Barretenberg's UltraPlonk verifier
        const isValid = await this.verifyProofOffChain(proofBytes, publicInputs, circuitType);
        if (!isValid) {
            throw new Error(`Oracle: ZK proof verification FAILED for circuit=${circuitType}`);
        }
        // Step 2: Build the attestation message
        // Format: SHA256(circuit_type || nullifier || public_inputs_concat || timestamp)
        const timestamp = Math.floor(Date.now() / 1000);
        const messageHash = this.buildAttestationMessage(circuitType, nullifier, publicInputs, timestamp);
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
    async verifyProofOffChain(proofBytes, publicInputs, circuitType) {
        // Dynamically import the compiled circuit artifact
        const artifactPath = path.resolve(__dirname, `../../kryon_zk/${circuitType}_proof/target/${circuitType}_proof.json`);
        if (!fs.existsSync(artifactPath)) {
            throw new Error(`Circuit artifact not found: ${artifactPath}. ` +
                `Run 'nargo compile' in kryon_zk/${circuitType}_proof/`);
        }
        const circuit = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
        // @ts-ignore
        const { BarretenbergBackend } = await Promise.resolve().then(() => __importStar(require('@noir-lang/backend_barretenberg')));
        const backend = new BarretenbergBackend(circuit, { threads: 4 });
        try {
            // UltraPlonk verification  real cryptographic check
            const result = await backend.verifyFinalProof({
                proof: proofBytes,
                publicInputs: publicInputs,
            });
            return result;
        }
        finally {
            await backend.destroy();
        }
    }
    buildAttestationMessage(circuitType, nullifier, publicInputs, timestamp) {
        const hash = crypto.createHash('sha256');
        hash.update(circuitType);
        hash.update(nullifier);
        hash.update(publicInputs.join(''));
        hash.update(timestamp.toString());
        return hash.digest();
    }
}
exports.KryonOracle = KryonOracle;
