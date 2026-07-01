const { BarretenbergBackend } = require('@noir-lang/backend_barretenberg');
const { Noir } = require('@noir-lang/noir_js');
const fs = require('fs');
const invoiceCircuit = JSON.parse(fs.readFileSync('../kryon_zk/invoice_proof/target/invoice_proof.json', 'utf8'));
const poseidonCircuit = JSON.parse(fs.readFileSync('../kryon_zk/poseidon_util/target/poseidon_util.json', 'utf8'));

async function test() {
    console.log('Testing real hash matching...');
    const backendUtil = new BarretenbergBackend(poseidonCircuit);
    const noirUtil = new Noir(poseidonCircuit, backendUtil);
    
    const invoiceAmount = 1000;
    const advanceRequested = 900;
    const invoiceSecret = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const nullifierSecret = '0x0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba';
    
    // Hash invoice commitment
    let res = await noirUtil.execute({ a: invoiceAmount.toString(), b: invoiceSecret });
    const realInvoiceCommitment = res.returnValue;
    
    // Hash nullifier
    res = await noirUtil.execute({ a: realInvoiceCommitment, b: nullifierSecret });
    const realNullifier = res.returnValue;
    
    console.log('Real Commitment:', realInvoiceCommitment);
    console.log('Real Nullifier:', realNullifier);
    
    const backend = new BarretenbergBackend(invoiceCircuit);
    const noir = new Noir(invoiceCircuit, backend);
    
    const input = {
        invoice_amount: invoiceAmount,
        advance_requested: advanceRequested,
        invoice_secret: invoiceSecret,
        invoice_commitment: realInvoiceCommitment,
        nullifier_secret: nullifierSecret,
        nullifier: realNullifier
    };
    
    try {
        await noir.execute(input);
        console.log('SUCCESS: Execution completed without constraint errors');
    } catch(e) {
        console.error('FAILED TO EXECUTE:', e);
    }
}
test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
