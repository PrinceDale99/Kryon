import { NextResponse } from 'next/server';

// In-memory store for the hackathon demo. 
// This will persist cross-device as long as the Vercel function stays warm.
const globalAny: any = global;
if (!globalAny.verifiedWallets) {
  globalAny.verifiedWallets = {};
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');
  
  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  const isVerified = !!globalAny.verifiedWallets[wallet];
  return NextResponse.json({ verified: isVerified });
}

export async function POST(req: Request) {
  try {
    const { wallet } = await req.json();
    
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Mark as verified
    globalAny.verifiedWallets[wallet] = true;
    
    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
