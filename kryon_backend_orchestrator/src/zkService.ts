import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import * as invoiceCircuit from '../../kryon_zk/invoice_proof/target/invoice_proof.json';
import * as kycCircuit from '../../kryon_zk/kyc_proof/target/kyc_proof.json';
import { Server, Keypair, TransactionBuilder, Networks, Contract, xdr } from '@stellar/stellar-sdk';

/**
 * ZK Orchestrator for Kryon Protocol
 * Responsible for generating Zero Knowledge Proofs via Barretenberg
 * and submitting the verified payloads to Soroban smart contracts.
 */
export class ZKOrchestrator {
    private rpcServer: Server;

    constructor(rpcUrl: string = 'https://soroban-testnet.stellar.org') {
        this.rpcServer = new Server(rpcUrl);
    }

    /**
     * Generate a ZK Proof for Invoice Factoring
     */
    async generateInvoiceProof(
        invoiceAmount: number,
        advanceRequested: number,
        invoiceSecret: string,
        invoiceCommitment: string,
        nullifierSecret: string,
        nullifier: string
    ) {
        console.log("Compiling Noir Circuit...");
        
        // Ensure @ts-ignore for hackathon mock types
        // @ts-ignore
        const backend = new BarretenbergBackend(invoiceCircuit);
        // @ts-ignore
        const noir = new Noir(invoiceCircuit, backend);

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
    async generateKYCProof(
        userIdHash: string,
        income: number,
        isAccredited: boolean,
        nullifierSecret: string,
        credentialNullifier: string
    ) {
        console.log("Compiling KYC Circuit...");
        
        // @ts-ignore
        const backend = new BarretenbergBackend(kycCircuit);
        // @ts-ignore
        const noir = new Noir(kycCircuit, backend);

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
     * Submit the generated ZK Proof to Soroban Verifier Contract
     */
    async submitFactoringProofToSoroban(
        contractId: string, 
        borrowerKeypair: Keypair,
        advanceRequested: number,
        invoiceCommitment: Buffer,
        nullifier: Buffer,
        zkProofPayload: Uint8Array
    ) {
        console.log("Broadcasting ZK Proof to Stellar Protocol...");
        
        const contract = new Contract(contractId);
        
        const tx = new TransactionBuilder(await this.rpcServer.loadAccount(borrowerKeypair.publicKey()), {
            fee: '10000',
            networkPassphrase: Networks.TESTNET,
        })
        .addOperation(
            contract.call('submit_zk_factoring',
                xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(borrowerKeypair.xdrPublicKey())),
                xdr.ScVal.scvI128(new xdr.Int128Parts({
                    hi: new xdr.Int64(0),
                    lo: new xdr.Uint64(advanceRequested)
                })),
                xdr.ScVal.scvBytes(invoiceCommitment),
                xdr.ScVal.scvBytes(nullifier),
                xdr.ScVal.scvBytes(Buffer.from(zkProofPayload))
            )
        )
        .setTimeout(30)
        .build();

        tx.sign(borrowerKeypair);

        console.log("Submitting transaction...");
        const result = await this.rpcServer.submitTransaction(tx);
        console.log("Transaction Result:", result);
        return result;
    }
}
