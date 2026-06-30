import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    const { erpnextUrl, apiKey, apiSecret } = await req.json();
    
    // Basic validation
    if (!erpnextUrl || !apiKey || !apiSecret) {
        return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const cookieStore = await cookies();
    // Store credentials server-side only - never readable by client JS
    cookieStore.set('erp_url', erpnextUrl, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600 });
    cookieStore.set('erp_key', apiKey, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600 });
    cookieStore.set('erp_secret', apiSecret, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600 });

    return NextResponse.json({ success: true });
}

export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete('erp_url');
    cookieStore.delete('erp_key');
    cookieStore.delete('erp_secret');
    return NextResponse.json({ success: true });
}
