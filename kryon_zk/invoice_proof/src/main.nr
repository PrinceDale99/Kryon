// ZK Circuit for Invoice Factoring (Noir)
// Proves that a user has a valid invoice with sufficient balance, without revealing the exact balance or the customer.

// We import the standard library for hashing (Poseidon)
use poseidon::poseidon;

fn main(
    invoice_amount: u64,           // Private: The actual amount on the invoice
    advance_requested: pub u64,    // Public: The amount of XLM the user is requesting
    invoice_secret: Field,         // Private: A random blinding factor specific to this invoice
    invoice_commitment: pub Field, // Public: The hash commitment of the invoice (stored on-chain)
    nullifier_secret: Field,       // Private: User's secret used to generate the nullifier
    nullifier: pub Field           // Public: The generated nullifier to prevent double-factoring
) {
    // 1. Verify that the requested advance does not exceed 90% of the invoice amount.
    let max_advance = (invoice_amount * 90) / 100;
    assert(advance_requested as u64 <= max_advance);

    // 2. Verify the invoice commitment
    // In a real scenario, an oracle (e.g. ERPNext zkTLS node) signs this commitment.
    let computed_commitment = poseidon::bn254::hash_2([invoice_amount as Field, invoice_secret]);
    assert(computed_commitment == invoice_commitment);

    // 3. Verify the nullifier to prevent replay attacks and double spending
    let computed_nullifier = poseidon::bn254::hash_2([invoice_commitment, nullifier_secret]);
    assert(computed_nullifier == nullifier);
}

#[test]
fn test_valid_invoice() {
    let invoice_amount = 100_000;
    let advance_requested = 85_000; // <= 90,000
    let invoice_secret = 12345;
    
    let invoice_commitment = poseidon::bn254::hash_2([invoice_amount as Field, invoice_secret]);
    let nullifier_secret = 67890;
    let nullifier = poseidon::bn254::hash_2([invoice_commitment, nullifier_secret]);

    main(
        invoice_amount,
        advance_requested,
        invoice_secret,
        invoice_commitment,
        nullifier_secret,
        nullifier
    );
}
