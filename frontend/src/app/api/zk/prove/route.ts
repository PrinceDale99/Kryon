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
        return NextResponse.json(
            { error: `Oracle unreachable: ${err.message}. Is the oracle server running on port 4000?` },
            { status: 503 }
        );
    }
}
