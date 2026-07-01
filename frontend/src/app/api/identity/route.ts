import { NextResponse } from 'next/server';

const KV_BUCKET_URL = 'https://kvdb.io/6E8YCJv8JnU31fac64XVgE';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');
  
  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${KV_BUCKET_URL}/${wallet}`);
    if (res.status === 200) {
        return NextResponse.json({ verified: true });
    }
    return NextResponse.json({ verified: false });
  } catch(e) {
    return NextResponse.json({ verified: false });
  }
}

export async function POST(req: Request) {
  try {
    const { wallet } = await req.json();
    
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Mark as verified in persistent KV store
    await fetch(`${KV_BUCKET_URL}/${wallet}`, {
        method: 'POST',
        body: 'true'
    });
    
    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
