import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get('erp_key')?.value || process.env.ERPNEXT_API_KEY;
    const apiSecret = cookieStore.get('erp_secret')?.value || process.env.ERPNEXT_API_SECRET;
    const baseUrl = cookieStore.get('erp_url')?.value || process.env.ERPNEXT_URL || 'https://demo.erpnext.com';

    if (!apiKey || !apiSecret) {
      throw new Error("ERPNext credentials missing. Please provide API Key and Secret.");
    }

    const response = await fetch(`${baseUrl}/api/resource/Sales%20Invoice?fields=["name","customer_name","outstanding_amount","currency"]&filters=[["outstanding_amount",">",0],["status","=","Unpaid"]]`, {
      headers: {
        'Authorization': `token ${apiKey}:${apiSecret}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch from ERPNext: ${response.statusText}`);
    }

    const erpData = await response.json();
    
    const data = (erpData.data || []).map((inv: { name: string; customer_name?: string; outstanding_amount?: string | number; currency?: string }) => ({
      id: inv.name,
      invoice_number: inv.name,
      customer_name: inv.customer_name || 'Unknown Customer',
      amount_due: parseFloat(inv.outstanding_amount as string || '0'),
      currency: inv.currency || 'USD'
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
