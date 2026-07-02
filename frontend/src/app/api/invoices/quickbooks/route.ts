import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const qboToken = process.env.QBO_ACCESS_TOKEN;
    const companyId = process.env.QBO_COMPANY_ID;

    if (!qboToken || !companyId) {
        throw new Error('QuickBooks token or company ID is missing.');
    }

    const response = await fetch(`https://sandbox-quickbooks.api.intuit.com/v3/company/${companyId}/query?query=select * from Invoice where Balance > '0'`, {
      headers: {
        'Authorization': `Bearer ${qboToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
        throw new Error(`QuickBooks API error: ${response.statusText}`);
    }

    const qboData = await response.json();
    
    const data = (qboData.QueryResponse.Invoice || []).map((inv: any) => ({
      id: inv.Id,
      invoice_number: inv.DocNumber,
      customer_name: inv.CustomerRef?.name || 'Unknown Customer',
      amount_due: parseFloat(inv.Balance),
      currency: inv.CurrencyRef?.value || 'USD'
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
