import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.ERPNEXT_API_KEY;
    const apiSecret = process.env.ERPNEXT_API_SECRET;
    const baseUrl = process.env.ERPNEXT_URL || 'https://demo.erpnext.com';

    if (!apiKey || !apiSecret) {
      throw new Error("ERPNext credentials missing in environment");
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
    
    const data = (erpData.data || []).map((inv: any) => ({
      id: inv.name,
      invoice_number: inv.name,
      customer_name: inv.customer_name || 'Unknown Customer',
      amount_due: parseFloat(inv.outstanding_amount || 0),
      currency: inv.currency || 'USD'
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
