import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_placeholder_key';
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any });

    let data;
    if (stripeKey === 'sk_test_mock_placeholder_key') {
      data = [
        { id: 'in_1OkPqzL', invoice_number: 'STR-9921', customer_name: 'Microsoft (Stripe)', amount_due: 150000, currency: 'usd' },
        { id: 'in_1OkPqzM', invoice_number: 'STR-9922', customer_name: 'Tesla Inc. (Stripe)', amount_due: 85000, currency: 'usd' },
        { id: 'in_1OkPqzN', invoice_number: 'STR-9923', customer_name: 'Meta (Stripe)', amount_due: 210000, currency: 'usd' }
      ];
    } else {
      const invoices = await stripe.invoices.list({ status: 'open' });
      data = invoices.data.map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.number,
        customer_name: inv.customer_name || 'Unknown Customer',
        amount_due: inv.amount_due / 100, // Stripe uses cents
        currency: inv.currency
      }));
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
