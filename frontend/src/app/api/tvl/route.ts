import { NextResponse } from 'next/server';
import { rpc, xdr, StrKey } from '@stellar/stellar-sdk';

export async function GET() {
    try {
        const server = new rpc.Server('https://soroban-testnet.stellar.org');
        const contractId = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || 'CD66AYN7K3O4EHKPPNETOZQL23UIBTBFYDI2EMNAWHQUC6FPBHQ5EOUG';
        
        const key = xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({
            contract: xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(contractId)),
            key: xdr.ScVal.scvSymbol('Total'),
            durability: xdr.ContractDataDurability.persistent()
        }));
        
        const res = await server.getLedgerEntries(key);
        
        if (res && res.entries && res.entries.length > 0) {
            const val = res.entries[0].val.contractData().val().i128();
            // Convert stroops to XLM
            const lo = val.lo().toString();
            const hi = val.hi().toString();
            // Soroban i128 hi is usually 0 for anything under max uint64, so lo is enough for up to 18.4B XLM
            const stroops = Number(lo);
            const xlm = stroops / 10000000;
            return NextResponse.json({ success: true, tvl: xlm });
        }
        
        return NextResponse.json({ success: true, tvl: 0 });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
