import * as fs from 'fs';
import * as path from 'path';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import * as invoiceCircuit from '../../kryon_zk/invoice_proof/target/invoice_proof.json';
import * as kycCircuit from '../../kryon_zk/kyc_proof/target/kyc_proof.json';
import { Horizon, TransactionBuilder, Networks, Contract, xdr } from '@stellar/stellar-sdk';
/**
 * ZK Orchestrator for Kryon Protocol
 * Responsible for generating Zero Knowledge Proofs via Barretenberg
 * and submitting the verified payloads to Soroban smart contracts.
 */
export class ZKOrchestrator {
    rpcServer;
    constructor(rpcUrl = 'https://soroban-testnet.stellar.org') {
        this.rpcServer = new Horizon.Server(rpcUrl);
    }
    /**
     * Helper to safely prefix hex strings with 0x for Noir witness generation
     */
    formatHex(val) {
        if (typeof val === 'string' && !val.startsWith('0x') && /^[0-9a-fA-F]+$/.test(val)) {
            return '0x' + val;
        }
        return val;
    }
    /**
     * Generate a ZK Proof for Invoice Factoring
     */
    async generateInvoiceProof(invoiceAmount, advanceRequested, invoiceSecret, invoiceCommitment, nullifierSecret, nullifier) {
        console.log("Compiling Noir Circuit...");
        // Ensure @ts-ignore for hackathon mock types
        // @ts-ignore
        const backend = new BarretenbergBackend(invoiceCircuit);
        // @ts-ignore
        const noir = new Noir(invoiceCircuit, backend);
        const input = {
            invoice_amount: invoiceAmount,
            advance_requested: advanceRequested,
            invoice_secret: this.formatHex(invoiceSecret),
            invoice_commitment: this.formatHex(invoiceCommitment),
            nullifier_secret: this.formatHex(nullifierSecret),
            nullifier: this.formatHex(nullifier)
        };
        console.log("Generating Groth16/PLONK Proof...");
        const { witness } = await noir.execute(input);
        const proof = await backend.generateProof(witness);
        console.log("Proof successfully generated off-chain!");
        return proof.proof; // Hex/Bytes payload ready for Soroban
    }
    /**
     * Generate a ZK KYC Proof for Liquidity Providers
     */
    async generateKYCProof(userIdHash, income, isAccredited, nullifierSecret, credentialNullifier) {
        console.log("Compiling KYC Circuit...");
        // @ts-ignore
        const backend = new BarretenbergBackend(kycCircuit);
        // @ts-ignore
        const noir = new Noir(kycCircuit, backend);
        const input = {
            user_id_hash: this.formatHex(userIdHash),
            income: income,
            is_accredited: isAccredited,
            nullifier_secret: this.formatHex(nullifierSecret),
            credential_nullifier: this.formatHex(credentialNullifier)
        };
        const { witness } = await noir.execute(input);
        const proof = await backend.generateProof(witness);
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
        const contract = new Contract(contractId);
        // Pad/truncate buffers to exact byte lengths required by Soroban BytesN<32> / BytesN<64>
        const padTo = (buf, len) => {
            if (buf.length === len)
                return buf;
            if (buf.length > len)
                return buf.slice(0, len);
            return Buffer.concat([buf, Buffer.alloc(len - buf.length)]);
        };
        const tx = new TransactionBuilder(await this.rpcServer.loadAccount(borrowerKeypair.publicKey()), { fee: '10000', networkPassphrase: Networks.TESTNET })
            .addOperation(contract.call('submit_zk_factoring', 
        // borrower: Address
        xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(borrowerKeypair.xdrPublicKey())), 
        // advance_requested: i128
        xdr.ScVal.scvI128(new xdr.Int128Parts({
            hi: new xdr.Int64(0),
            lo: new xdr.Uint64(advanceRequested)
        })), 
        // invoice_commitment: BytesN<32>
        xdr.ScVal.scvBytes(padTo(invoiceCommitment, 32)), 
        // nullifier: BytesN<32>
        xdr.ScVal.scvBytes(padTo(nullifier, 32)), 
        // message_hash: BytesN<32>
        xdr.ScVal.scvBytes(padTo(messageHash, 32)), 
        // oracle_signature: BytesN<64>
        xdr.ScVal.scvBytes(padTo(oracleSignature, 64)), 
        // attestation_timestamp: u64
        xdr.ScVal.scvU64(new xdr.Uint64(attestationTimestamp))))
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
        const merkleCircuit = await import('../../kryon_zk/merkle_membership/target/merkle_membership.json');
        // @ts-ignore
        const backend = new BarretenbergBackend(merkleCircuit);
        // @ts-ignore
        const noir = new Noir(merkleCircuit, backend);
        const input = {
            leaf: this.formatHex(leaf),
            path_elements: pathElements.map(p => this.formatHex(p)),
            path_indices: pathIndices.map(x => x === 1 || x === true),
            root: this.formatHex(root)
        };
        const { witness } = await noir.execute(input);
        const proof = await backend.generateProof(witness);
        return proof.proof;
    }
    /**
     * Generate a Proof of Solvency
     */
    async generateSolvencyProof(totalAssets, totalLiabilities, blindingFactor) {
        // @ts-ignore
        const solvencyCircuit = await import('../../kryon_zk/solvency_proof/target/solvency_proof.json');
        // @ts-ignore
        const backend = new BarretenbergBackend(solvencyCircuit);
        // @ts-ignore
        const noir = new Noir(solvencyCircuit, backend);
        const assetCommitment = await this.poseidonHashPublic([totalAssets, parseInt(blindingFactor)]);
        const liabCommitment = await this.poseidonHashPublic([totalLiabilities, parseInt(blindingFactor)]);
        const input = {
            total_assets: totalAssets,
            total_liabilities: totalLiabilities,
            blinding_factor: this.formatHex(blindingFactor),
            assets_commitment: this.formatHex(assetCommitment),
            liabilities_commitment: this.formatHex(liabCommitment),
            is_solvent: totalAssets > totalLiabilities,
        };
        const { witness } = await noir.execute(input);
        const proof = await backend.generateProof(witness);
        return proof.proof;
    }
    /**
     * Generate an Age Verification proof
     */
    async generateAgeProof(birthYear, currentYear, minimumAge, userSecret) {
        // @ts-ignore
        const ageCircuit = await import('../../kryon_zk/age_proof/target/age_proof.json');
        // @ts-ignore
        const backend = new BarretenbergBackend(ageCircuit);
        // @ts-ignore
        const noir = new Noir(ageCircuit, backend);
        const ageCommitment = await this.poseidonHashPublic([birthYear, parseInt(userSecret)]);
        const input = {
            birth_year: birthYear,
            current_year: currentYear,
            minimum_age: minimumAge,
            user_secret: this.formatHex(userSecret),
            age_commitment: this.formatHex(ageCommitment),
        };
        const { witness } = await noir.execute(input);
        const proof = await backend.generateProof(witness);
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
        const { BarretenbergBackend } = await import('@noir-lang/backend_barretenberg');
        // @ts-ignore
        const { Noir } = await import('@noir-lang/noir_js');
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
        const contract = new Contract(contractId);
        const padTo = (buf, len) => {
            if (buf.length === len)
                return buf;
            if (buf.length > len)
                return buf.slice(0, len);
            return Buffer.concat([buf, Buffer.alloc(len - buf.length)]);
        };
        const tx = new TransactionBuilder(await this.rpcServer.loadAccount(holderKeypair.publicKey()), { fee: '10000', networkPassphrase: Networks.TESTNET })
            .addOperation(contract.call('verify_credential', 
        // holder: Address
        xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(holderKeypair.xdrPublicKey())), 
        // credential_type: u32
        xdr.ScVal.scvU32(credentialType), 
        // credential_nullifier: BytesN<32>
        xdr.ScVal.scvBytes(padTo(credentialNullifier, 32)), 
        // message_hash: BytesN<32>
        xdr.ScVal.scvBytes(padTo(messageHash, 32)), 
        // oracle_signature: BytesN<64>
        xdr.ScVal.scvBytes(padTo(oracleSignature, 64)), 
        // attestation_timestamp: u64
        xdr.ScVal.scvU64(new xdr.Uint64(attestationTimestamp))))
            .setTimeout(30)
            .build();
        tx.sign(holderKeypair);
        return await this.rpcServer.submitTransaction(tx);
    }
}
