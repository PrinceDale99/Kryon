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
exports.ZKOrchestrator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const backend_barretenberg_1 = require("@noir-lang/backend_barretenberg");
const noir_js_1 = require("@noir-lang/noir_js");
const invoiceCircuit = __importStar(require("../../kryon_zk/invoice_proof/target/invoice_proof.json"));
const kycCircuit = __importStar(require("../../kryon_zk/kyc_proof/target/kyc_proof.json"));
const stellar_sdk_1 = require("@stellar/stellar-sdk");
/**
 * ZK Orchestrator for Kryon Protocol
 * Responsible for generating Zero Knowledge Proofs via Barretenberg
 * and submitting the verified payloads to Soroban smart contracts.
 */
class ZKOrchestrator {
    rpcServer;
    constructor(rpcUrl = 'https://soroban-testnet.stellar.org') {
        this.rpcServer = new stellar_sdk_1.Server(rpcUrl);
    }
    /**
     * Generate a ZK Proof for Invoice Factoring
     */
    async generateInvoiceProof(invoiceAmount, advanceRequested, invoiceSecret, invoiceCommitment, nullifierSecret, nullifier) {
        console.log("Compiling Noir Circuit...");
        // Ensure @ts-ignore for hackathon mock types
        // @ts-ignore
        const backend = new backend_barretenberg_1.BarretenbergBackend(invoiceCircuit);
        // @ts-ignore
        const noir = new noir_js_1.Noir(invoiceCircuit, backend);
        const input = {
            invoice_amount: invoiceAmount,
            advance_requested: advanceRequested,
            invoice_secret: invoiceSecret,
            invoice_commitment: invoiceCommitment,
            nullifier_secret: nullifierSecret,
            nullifier: nullifier
        };
        console.log("Generating Groth16/PLONK Proof...");
        const proof = await noir.generateFinalProof(input);
        console.log("Proof successfully generated off-chain!");
        return proof.proof; // Hex/Bytes payload ready for Soroban
    }
    /**
     * Generate a ZK KYC Proof for Liquidity Providers
     */
    async generateKYCProof(userIdHash, income, isAccredited, nullifierSecret, credentialNullifier) {
        console.log("Compiling KYC Circuit...");
        // @ts-ignore
        const backend = new backend_barretenberg_1.BarretenbergBackend(kycCircuit);
        // @ts-ignore
        const noir = new noir_js_1.Noir(kycCircuit, backend);
        const input = {
            user_id_hash: userIdHash,
            income: income,
            is_accredited: isAccredited,
            nullifier_secret: nullifierSecret,
            credential_nullifier: credentialNullifier
        };
        const proof = await noir.generateFinalProof(input);
        return proof.proof;
    }
    /**
     * Submit a ZK factoring proof to Soroban via oracle attestation.
     * Calls KryonEscrow::submit_zk_factoring with the oracle-signed attestation.
     */
    async submitFactoringProofToSoroban(contractId, borrowerKeypair, advanceRequested, invoiceCommitment, // 32 bytes
    nullifier, // 32 bytes
    messageHash, // 32 bytes  SHA256 attestation from oracle
    oracleSignature, // 64 bytes  Ed25519 sig from oracle
    attestationTimestamp) {
        console.log('Broadcasting ZK Proof to Stellar Protocol via oracle attestation...');
        const contract = new stellar_sdk_1.Contract(contractId);
        // Pad/truncate buffers to exact byte lengths required by Soroban BytesN<32> / BytesN<64>
        const padTo = (buf, len) => {
            if (buf.length === len)
                return buf;
            if (buf.length > len)
                return buf.slice(0, len);
            return Buffer.concat([buf, Buffer.alloc(len - buf.length)]);
        };
        const tx = new stellar_sdk_1.TransactionBuilder(await this.rpcServer.loadAccount(borrowerKeypair.publicKey()), { fee: '10000', networkPassphrase: stellar_sdk_1.Networks.TESTNET })
            .addOperation(contract.call('submit_zk_factoring', 
        // borrower: Address
        stellar_sdk_1.xdr.ScVal.scvAddress(stellar_sdk_1.xdr.ScAddress.scAddressTypeAccount(borrowerKeypair.xdrPublicKey())), 
        // advance_requested: i128
        stellar_sdk_1.xdr.ScVal.scvI128(new stellar_sdk_1.xdr.Int128Parts({
            hi: new stellar_sdk_1.xdr.Int64(0),
            lo: new stellar_sdk_1.xdr.Uint64(advanceRequested)
        })), 
        // invoice_commitment: BytesN<32>
        stellar_sdk_1.xdr.ScVal.scvBytes(padTo(invoiceCommitment, 32)), 
        // nullifier: BytesN<32>
        stellar_sdk_1.xdr.ScVal.scvBytes(padTo(nullifier, 32)), 
        // message_hash: BytesN<32>
        stellar_sdk_1.xdr.ScVal.scvBytes(padTo(messageHash, 32)), 
        // oracle_signature: BytesN<64>
        stellar_sdk_1.xdr.ScVal.scvBytes(padTo(oracleSignature, 64)), 
        // attestation_timestamp: u64
        stellar_sdk_1.xdr.ScVal.scvU64(new stellar_sdk_1.xdr.Uint64(attestationTimestamp))))
            .setTimeout(30)
            .build();
        tx.sign(borrowerKeypair);
        console.log('Submitting transaction to Soroban...');
        const result = await this.rpcServer.submitTransaction(tx);
        console.log('Transaction Result:', result);
        return result;
    }
    /**
     * Generate a ZK Merkle Membership proof
     * Proves a leaf (e.g., invoice commitment) exists in the Merkle tree
     * without revealing its index or sibling values.
     */
    async generateMerkleProof(leaf, pathElements, // 20 sibling hashes as hex strings
    pathIndices, // 20 values: 0 or 1
    root // public Merkle root
    ) {
        // @ts-ignore
        const merkleCircuit = await Promise.resolve().then(() => __importStar(require('../../kryon_zk/merkle_membership/target/merkle_membership.json')));
        // @ts-ignore
        const backend = new backend_barretenberg_1.BarretenbergBackend(merkleCircuit);
        // @ts-ignore
        const noir = new noir_js_1.Noir(merkleCircuit, backend);
        const input = { leaf, path_elements: pathElements, path_indices: pathIndices, root };
        const proof = await noir.generateFinalProof(input);
        return proof.proof;
    }
    /**
     * Generate a Proof of Solvency
     */
    async generateSolvencyProof(totalAssets, totalLiabilities, blindingFactor) {
        // @ts-ignore
        const solvencyCircuit = await Promise.resolve().then(() => __importStar(require('../../kryon_zk/solvency_proof/target/solvency_proof.json')));
        // @ts-ignore
        const backend = new backend_barretenberg_1.BarretenbergBackend(solvencyCircuit);
        // @ts-ignore
        const noir = new noir_js_1.Noir(solvencyCircuit, backend);
        const assetCommitment = await this.poseidonHashPublic([totalAssets, parseInt(blindingFactor)]);
        const liabCommitment = await this.poseidonHashPublic([totalLiabilities, parseInt(blindingFactor)]);
        const input = {
            total_assets: totalAssets,
            total_liabilities: totalLiabilities,
            blinding_factor: blindingFactor,
            assets_commitment: assetCommitment,
            liabilities_commitment: liabCommitment,
            is_solvent: totalAssets > totalLiabilities,
        };
        const proof = await noir.generateFinalProof(input);
        return proof.proof;
    }
    /**
     * Generate an Age Verification proof
     */
    async generateAgeProof(birthYear, currentYear, minimumAge, userSecret) {
        // @ts-ignore
        const ageCircuit = await Promise.resolve().then(() => __importStar(require('../../kryon_zk/age_proof/target/age_proof.json')));
        // @ts-ignore
        const backend = new backend_barretenberg_1.BarretenbergBackend(ageCircuit);
        // @ts-ignore
        const noir = new noir_js_1.Noir(ageCircuit, backend);
        const ageCommitment = await this.poseidonHashPublic([birthYear, parseInt(userSecret)]);
        const input = {
            birth_year: birthYear,
            current_year: currentYear,
            minimum_age: minimumAge,
            user_secret: userSecret,
            age_commitment: ageCommitment,
        };
        const proof = await noir.generateFinalProof(input);
        return proof.proof;
    }
    /**
     * Compute Poseidon BN254 hash matching Noir's stdlib poseidon::bn254::hash_2.
     * This uses Barretenberg's WASM directly to guarantee output matches Noir circuits.
     * Public method  exported so oracle.ts can use it too.
     */
    /**
     * Compute Poseidon BN254 hash matching Noir's poseidon::bn254::hash_2.
     * Uses the compiled poseidon_util circuit via Barretenberg to guarantee
     * bit-exact compatibility with all Noir circuits.
     */
    async poseidonHashPublic(inputs) {
        const artifactPath = path.resolve(__dirname, '../../kryon_zk/poseidon_util/target/poseidon_util.json');
        if (!fs.existsSync(artifactPath)) {
            throw new Error('poseidon_util circuit not compiled. Run: cd kryon_zk/poseidon_util && nargo compile');
        }
        const circuit = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
        // @ts-ignore
        const { BarretenbergBackend } = await Promise.resolve().then(() => __importStar(require('@noir-lang/backend_barretenberg')));
        // @ts-ignore
        const { Noir } = await Promise.resolve().then(() => __importStar(require('@noir-lang/noir_js')));
        const backend = new BarretenbergBackend(circuit, { threads: 1 });
        const noir = new Noir(circuit, backend);
        try {
            const { returnValue } = await noir.execute({
                a: inputs[0].toString(),
                b: inputs[1].toString(),
            });
            return returnValue;
        }
        finally {
            await backend.destroy();
        }
    }
    /**
     * Submit a KYC credential proof to the CredentialVerifier contract via oracle attestation.
     */
    async submitKYCCredential(contractId, holderKeypair, credentialType, credentialNullifier, // 32 bytes
    messageHash, // 32 bytes  oracle attestation SHA256
    oracleSignature, // 64 bytes  oracle Ed25519 signature
    attestationTimestamp) {
        const contract = new stellar_sdk_1.Contract(contractId);
        const padTo = (buf, len) => {
            if (buf.length === len)
                return buf;
            if (buf.length > len)
                return buf.slice(0, len);
            return Buffer.concat([buf, Buffer.alloc(len - buf.length)]);
        };
        const tx = new stellar_sdk_1.TransactionBuilder(await this.rpcServer.loadAccount(holderKeypair.publicKey()), { fee: '10000', networkPassphrase: stellar_sdk_1.Networks.TESTNET })
            .addOperation(contract.call('verify_credential', 
        // holder: Address
        stellar_sdk_1.xdr.ScVal.scvAddress(stellar_sdk_1.xdr.ScAddress.scAddressTypeAccount(holderKeypair.xdrPublicKey())), 
        // credential_type: u32
        stellar_sdk_1.xdr.ScVal.scvU32(credentialType), 
        // credential_nullifier: BytesN<32>
        stellar_sdk_1.xdr.ScVal.scvBytes(padTo(credentialNullifier, 32)), 
        // message_hash: BytesN<32>
        stellar_sdk_1.xdr.ScVal.scvBytes(padTo(messageHash, 32)), 
        // oracle_signature: BytesN<64>
        stellar_sdk_1.xdr.ScVal.scvBytes(padTo(oracleSignature, 64)), 
        // attestation_timestamp: u64
        stellar_sdk_1.xdr.ScVal.scvU64(new stellar_sdk_1.xdr.Uint64(attestationTimestamp))))
            .setTimeout(30)
            .build();
        tx.sign(holderKeypair);
        return await this.rpcServer.submitTransaction(tx);
    }
}
exports.ZKOrchestrator = ZKOrchestrator;
