import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');
  
  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    const docRef = doc(db, 'identities', wallet);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().verified === true) {
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

    // Mark as verified in persistent Firebase Firestore
    const docRef = doc(db, 'identities', wallet);
    await setDoc(docRef, {
        verified: true,
        updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
