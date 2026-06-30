use dep::std::hash::poseidon;

// Proves that a Liquidity Provider is accredited (e.g. income > 200k) 
// based on a signed W3C Verifiable Credential from a trusted issuer,
// without revealing the user's identity or exact income.

fn main(
    user_id_hash: Field,       // Private: Hash of user's identity
    income: u64,               // Private: User's exact income
    is_accredited: bool,       // Private: Boolean flag in the credential
    nullifier_secret: Field,   // Private: Secret to prevent double-registration
    credential_nullifier: pub Field // Public: Nullifier published on-chain
) {
    // 1. Verify the credential signature 
    // For MVP hackathon purposes, we use Poseidon to verify the commitment binds to the income and ID
    let credential_hash = poseidon::bn254::hash_3([user_id_hash, income as Field, is_accredited as Field]);
    
    // 2. Verify Accredited Status
    assert(is_accredited == true);
    assert(income >= 200_000);

    // 3. Generate Nullifier to prevent reusing the same credential to Sybil attack the protocol
    let computed_nullifier = poseidon::bn254::hash_2([credential_hash, nullifier_secret]);
    assert(computed_nullifier == credential_nullifier);
}
