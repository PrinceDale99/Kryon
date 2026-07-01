const { BarretenbergBackend } = require('@noir-lang/backend_barretenberg');
const { Noir } = require('@noir-lang/noir_js');
const invoiceCircuit = require('../../kryon_zk/invoice_proof/target/invoice_proof.json');

async function test() {
    console.log('Testing...');
    const backend = new BarretenbergBackend(invoiceCircuit);
    const noir = new Noir(invoiceCircuit, backend);
    
    // We mock a commitment and nullifier that are just strings 
    const invoiceAmount = 1000;
    const advanceRequested = 900;
    const invoiceSecret = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    // The previous mocked values that the frontend used (just the secret itself)
    const mockCommitment = invoiceSecret;
    const mockNullifierSecret = '0x0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba';
    const mockNullifier = mockNullifierSecret;
    
    const input = {
        invoice_amount: invoiceAmount,
        advance_requested: advanceRequested,
        invoice_secret: invoiceSecret,
        invoice_commitment: mockCommitment,
        nullifier_secret: mockNullifierSecret,
        nullifier: mockNullifier
    };
    
    try {
        await noir.execute(input);
        console.log('SUCCESS');
    } catch(e) {
        console.error('FAILED TO EXECUTE WITH MOCKED VALUES:', e);
    }
}
test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
