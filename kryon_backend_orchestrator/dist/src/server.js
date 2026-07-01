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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const oracle_1 = require("./oracle");
const zkService_1 = require("./zkService");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '10mb' }));
const oracle = new oracle_1.KryonOracle();
const orchestrator = new zkService_1.ZKOrchestrator(process.env.STELLAR_RPC_URL || 'https://horizon-testnet.stellar.org');
/**
 * POST /prove/invoice
 * Body: { invoiceAmount, advanceRequested, invoiceSecret, invoiceCommitment, nullifierSecret, nullifier }
 * Returns: { proof (hex), publicInputs, attestation }
 */
app.post('/prove/invoice', async (req, res) => {
    try {
        const { invoiceAmount, advanceRequested, invoiceSecret, invoiceCommitment, nullifierSecret, nullifier } = req.body;
        if (!invoiceAmount || !advanceRequested || !invoiceSecret || !invoiceCommitment || !nullifierSecret || !nullifier) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Step 1: Generate proof off-chain using Barretenberg
        const proofBytes = await orchestrator.generateInvoiceProof(invoiceAmount, advanceRequested, invoiceSecret, invoiceCommitment, nullifierSecret, nullifier);
        // Step 2: Oracle verifies the proof and signs attestation
        const publicInputs = [
            String(advanceRequested),
            invoiceCommitment,
            nullifier
        ];
        const attestation = await oracle.verifyAndAttest(proofBytes, publicInputs, nullifier, 'invoice');
        res.json({
            proof: Buffer.from(proofBytes).toString('hex'),
            publicInputs,
            attestation,
        });
    }
    catch (err) {
        console.error('[/prove/invoice]', err.message);
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /prove/kyc
 */
app.post('/prove/kyc', async (req, res) => {
    try {
        const { userIdHash, income, isAccredited, nullifierSecret, credentialNullifier } = req.body;
        const proofBytes = await orchestrator.generateKYCProof(userIdHash, income, isAccredited, nullifierSecret, credentialNullifier);
        const publicInputs = [credentialNullifier];
        const attestation = await oracle.verifyAndAttest(proofBytes, publicInputs, credentialNullifier, 'kyc');
        res.json({ proof: Buffer.from(proofBytes).toString('hex'), publicInputs, attestation });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /prove/age
 */
app.post('/prove/age', async (req, res) => {
    try {
        const { birthYear, currentYear, minimumAge, userSecret } = req.body;
        const proofBytes = await orchestrator.generateAgeProof(birthYear, currentYear, minimumAge, userSecret);
        const ageCommitment = await orchestrator.poseidonHashPublic([birthYear, parseInt(userSecret)]);
        const publicInputs = [String(currentYear), String(minimumAge), ageCommitment];
        const attestation = await oracle.verifyAndAttest(proofBytes, publicInputs, ageCommitment, 'age');
        res.json({ proof: Buffer.from(proofBytes).toString('hex'), publicInputs, attestation });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /prove/solvency
 */
app.post('/prove/solvency', async (req, res) => {
    try {
        const { totalAssets, totalLiabilities, blindingFactor } = req.body;
        const proofBytes = await orchestrator.generateSolvencyProof(totalAssets, totalLiabilities, blindingFactor);
        const assetsCommitment = await orchestrator.poseidonHashPublic([totalAssets, parseInt(blindingFactor)]);
        const liabCommitment = await orchestrator.poseidonHashPublic([totalLiabilities, parseInt(blindingFactor)]);
        const publicInputs = [assetsCommitment, liabCommitment, 'true'];
        const attestation = await oracle.verifyAndAttest(proofBytes, publicInputs, assetsCommitment, 'solvency');
        res.json({ proof: Buffer.from(proofBytes).toString('hex'), publicInputs, attestation });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /oracle/pubkey  Frontend calls this to display the oracle's public key
 */
app.get('/oracle/pubkey', (_req, res) => {
    res.json({ publicKey: oracle.publicKey, rawHex: oracle.rawPublicKeyBytes.toString('hex') });
});
const PORT = Number(process.env.PORT || process.env.ORACLE_PORT || 4000);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kryon Oracle Relayer running on port ${PORT}`);
    console.log(`Oracle public key: ${oracle.publicKey}`);
});
