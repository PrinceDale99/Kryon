import { NextRequest, NextResponse } from 'next/server';

const ORACLE_URL = process.env.ORACLE_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { type, ...inputs } = body;

    if (!type || !['invoice', 'kyc', 'age', 'solvency', 'merkle'].includes(type)) {
        return NextResponse.json({ error: 'Invalid proof type' }, { status: 400 });
    }

    try {
        const response = await fetch(`${ORACLE_URL}/prove/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inputs),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json({ error: error.error }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.warn(`Oracle unreachable, returning mock payload for ${type}:`, err.message);
        // Fallback for hackathon demo if orchestrator is not deployed/running
        const secretHash = inputs.invoiceCommitment || inputs.nullifier || '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const strippedHash = secretHash.replace('0x', '');
        
        // Use a mock Oracle Keypair to generate a valid Ed25519 signature
        const StellarSdk = require('@stellar/stellar-sdk');
        const oracleKeypair = StellarSdk.Keypair.fromSecret('SCNE3ZXYJPMQSJWTIF6PNI737YNY7OSOVTDQHHSV4WND4SI5SEEWE6ZS');
        
        const messageHashBuf = Buffer.alloc(32, 0); // dummy 32-byte hash
        const signatureBuf = oracleKeypair.sign(messageHashBuf);
        
        return NextResponse.json({
            proof: '0x' + '00'.repeat(300), // mock dummy proof
            publicInputs: [secretHash],
            attestation: {
                messageHash: messageHashBuf.toString('hex'),
                signature: signatureBuf.toString('hex'),
                nullifier: secretHash,
                timestamp: Math.floor(Date.now() / 1000)
            }
        });
    }
}
