import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const stripeKey = cookieStore.get('stripe_secret')?.value || process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('Stripe Secret Key is missing.');
    }

    const response = await fetch('https://api.stripe.com/v1/invoices?status=open', {
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
    }

    const stripeData = await response.json();
    const data = (stripeData.data || []).map((inv: any) => ({
      id: inv.id,
      invoice_number: inv.number,
      customer_name: inv.customer_name || inv.customer_email || 'Unknown',
      amount_due: inv.amount_due / 100, // Stripe amounts are in cents
      currency: inv.currency
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
