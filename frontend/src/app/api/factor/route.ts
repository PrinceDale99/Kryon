import { NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';

export async function POST(req: Request) {
  try {
    const { destination, amount } = await req.json();

    if (!destination || !amount) {
      return NextResponse.json({ success: false, error: 'Missing destination or amount' }, { status: 400 });
    }

    const secret = process.env.TREASURY_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, error: 'Treasury secret not configured' }, { status: 500 });
    }

    const treasuryKeypair = StellarSdk.Keypair.fromSecret(secret);
    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

    // Load treasury account
    const account = await server.loadAccount(treasuryKeypair.publicKey());
    const fee = await server.fetchBaseFee();

    // Verify treasury has enough balance
    const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
    if (!nativeBalance || parseFloat(nativeBalance.balance) < parseFloat(amount)) {
      return NextResponse.json({ success: false, error: 'Treasury has insufficient liquidity.' }, { status: 400 });
    }

    // Build payment transaction
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: fee.toString(),
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: destination,
        asset: StellarSdk.Asset.native(),
        amount: amount.toString(),
      }))
      .setTimeout(60)
      .build();

    tx.sign(treasuryKeypair);
    
    // Submit to Horizon
    const response = await server.submitTransaction(tx);
    
    return NextResponse.json({ success: true, hash: response.hash });
  } catch (error: any) {
    console.error("Payout error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
