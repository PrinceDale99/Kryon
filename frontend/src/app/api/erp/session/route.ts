import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    const payload = await req.json();
    const cookieStore = await cookies();

    if (payload.erpnextUrl) {
        cookieStore.set('erp_url', payload.erpnextUrl, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600 });
        cookieStore.set('erp_key', payload.apiKey, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600 });
        cookieStore.set('erp_secret', payload.apiSecret, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600 });
    }
    
    if (payload.stripeSecretKey) {
        cookieStore.set('stripe_secret', payload.stripeSecretKey, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600 });
    }
    
    if (payload.qbCompanyId && payload.qbToken) {
        cookieStore.set('qb_company', payload.qbCompanyId, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600 });
        cookieStore.set('qb_token', payload.qbToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600 });
    }

    return NextResponse.json({ success: true });
}

export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete('erp_url');
    cookieStore.delete('erp_key');
    cookieStore.delete('erp_secret');
    cookieStore.delete('stripe_secret');
    cookieStore.delete('qb_company');
    cookieStore.delete('qb_token');
    return NextResponse.json({ success: true });
}
