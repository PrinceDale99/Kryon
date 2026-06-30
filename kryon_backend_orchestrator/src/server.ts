import express, { Request, Response } from 'express';
import { KryonOracle } from './oracle';
import { ZKOrchestrator } from './zkService';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const oracle = new KryonOracle();
const orchestrator = new ZKOrchestrator(process.env.STELLAR_RPC_URL || 'https://horizon-testnet.stellar.org');

/**
 * POST /prove/invoice
 * Body: { invoiceAmount, advanceRequested, invoiceSecret, invoiceCommitment, nullifierSecret, nullifier }
 * Returns: { proof (hex), publicInputs, attestation }
 */
app.post('/prove/invoice', async (req: Request, res: Response) => {
    try {
        const { invoiceAmount, advanceRequested, invoiceSecret, invoiceCommitment, nullifierSecret, nullifier } = req.body;

        if (!invoiceAmount || !advanceRequested || !invoiceSecret || !invoiceCommitment || !nullifierSecret || !nullifier) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Step 1: Generate proof off-chain using Barretenberg
        const proofBytes = await orchestrator.generateInvoiceProof(
            invoiceAmount, advanceRequested, invoiceSecret,
            invoiceCommitment, nullifierSecret, nullifier
        );

        // Step 2: Oracle verifies the proof and signs attestation
        const publicInputs = [
            String(advanceRequested),
            invoiceCommitment,
            nullifier
        ];

        const attestation = await oracle.verifyAndAttest(
            proofBytes, publicInputs, nullifier, 'invoice'
        );

        res.json({
            proof: Buffer.from(proofBytes).toString('hex'),
            publicInputs,
            attestation,
        });
    } catch (err: any) {
        console.error('[/prove/invoice]', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /prove/kyc
 */
app.post('/prove/kyc', async (req: Request, res: Response) => {
    try {
        const { userIdHash, income, isAccredited, nullifierSecret, credentialNullifier } = req.body;
        const proofBytes = await orchestrator.generateKYCProof(
            userIdHash, income, isAccredited, nullifierSecret, credentialNullifier
        );
        const publicInputs = [credentialNullifier];
        const attestation = await oracle.verifyAndAttest(
            proofBytes, publicInputs, credentialNullifier, 'kyc'
        );
        res.json({ proof: Buffer.from(proofBytes).toString('hex'), publicInputs, attestation });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /prove/age
 */
app.post('/prove/age', async (req: Request, res: Response) => {
    try {
        const { birthYear, currentYear, minimumAge, userSecret } = req.body;
        const proofBytes = await orchestrator.generateAgeProof(birthYear, currentYear, minimumAge, userSecret);
        const ageCommitment = await orchestrator.poseidonHashPublic([birthYear, parseInt(userSecret)]);
        const publicInputs = [String(currentYear), String(minimumAge), ageCommitment];
        const attestation = await oracle.verifyAndAttest(
            proofBytes, publicInputs, ageCommitment, 'age'
        );
        res.json({ proof: Buffer.from(proofBytes).toString('hex'), publicInputs, attestation });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /prove/solvency
 */
app.post('/prove/solvency', async (req: Request, res: Response) => {
    try {
        const { totalAssets, totalLiabilities, blindingFactor } = req.body;
        const proofBytes = await orchestrator.generateSolvencyProof(totalAssets, totalLiabilities, blindingFactor);
        const assetsCommitment = await orchestrator.poseidonHashPublic([totalAssets, parseInt(blindingFactor)]);
        const liabCommitment = await orchestrator.poseidonHashPublic([totalLiabilities, parseInt(blindingFactor)]);
        const publicInputs = [assetsCommitment, liabCommitment, 'true'];
        const attestation = await oracle.verifyAndAttest(
            proofBytes, publicInputs, assetsCommitment, 'solvency'
        );
        res.json({ proof: Buffer.from(proofBytes).toString('hex'), publicInputs, attestation });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /oracle/pubkey  Frontend calls this to display the oracle's public key
 */
app.get('/oracle/pubkey', (_req: Request, res: Response) => {
    res.json({ publicKey: oracle.publicKey, rawHex: oracle.rawPublicKeyBytes.toString('hex') });
});

const PORT = process.env.PORT || process.env.ORACLE_PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kryon Oracle Relayer running on port ${PORT}`);
    console.log(`Oracle public key: ${oracle.publicKey}`);
});
