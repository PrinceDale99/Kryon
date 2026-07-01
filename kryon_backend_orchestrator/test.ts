import { ZKOrchestrator } from './src/zkService';
import * as crypto from 'crypto';
async function test() {
    const orchestrator = new ZKOrchestrator();
    const invoiceAmount = 1000;
    const advanceRequested = 900;
    const invoiceSecret = crypto.randomUUID().replace(/-/g, '');
    const nullifierSecret = crypto.randomUUID().replace(/-/g, '');
    
    console.log('Secret:', invoiceSecret);
    
    const realInvoiceCommitment = await orchestrator.poseidonHashPublic([invoiceAmount, '0x' + invoiceSecret]);
    const realNullifier = await orchestrator.poseidonHashPublic([realInvoiceCommitment, '0x' + nullifierSecret]);
    
    console.log('Commitment:', realInvoiceCommitment);
    console.log('Nullifier:', realNullifier);
    
    try {
        await orchestrator.generateInvoiceProof(
            invoiceAmount, advanceRequested, invoiceSecret,
            realInvoiceCommitment, nullifierSecret, realNullifier
        );
        console.log('SUCCESS');
    } catch (e) {
        console.log('FAILED:', e);
    }
}
test().then(() => { console.log("DONE"); process.exit(0); }).catch((e) => { console.log(e); process.exit(1); });
