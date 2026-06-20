import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const qboToken = process.env.QBO_ACCESS_TOKEN || 'mock_token';
    const companyId = process.env.QBO_COMPANY_ID || 'mock_company';

    let data;
    if (qboToken === 'mock_token') {
      data = [
        { id: 'qbo_101', invoice_number: 'QBO-1001', customer_name: 'Google (QBO)', amount_due: 300000, currency: 'usd' },
        { id: 'qbo_102', invoice_number: 'QBO-1002', customer_name: 'Apple (QBO)', amount_due: 500000, currency: 'usd' }
      ];
    } else {
      // Placeholder for real QBO fetch
      const response = await fetch(`https://sandbox-quickbooks.api.intuit.com/v3/company/${companyId}/query?query=select * from Invoice where Balance > '0'`, {
        headers: {
          'Authorization': `Bearer ${qboToken}`,
          'Accept': 'application/json'
        }
      });
      const qboData = await response.json();
      
      data = (qboData.QueryResponse.Invoice || []).map((inv: any) => ({
        id: inv.Id,
        invoice_number: inv.DocNumber,
        customer_name: inv.CustomerRef?.name || 'Unknown Customer',
        amount_due: parseFloat(inv.Balance),
        currency: inv.CurrencyRef?.value || 'USD'
      }));
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
