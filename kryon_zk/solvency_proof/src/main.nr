// Proves total_assets > total_liabilities without revealing individual values.
// Used by the protocol to generate a daily solvency attestation.
use dep::std::hash::poseidon;

fn main(
    total_assets: u64,              // Private
    total_liabilities: u64,         // Private
    blinding_factor: Field,         // Private
    assets_commitment: pub Field,   // Public: Poseidon(total_assets, blinding_factor)
    liabilities_commitment: pub Field, // Public
    is_solvent: pub bool,           // Public: true if assets > liabilities
) {
    // Verify commitments
    let computed_assets_commit = poseidon::bn254::hash_2([total_assets as Field, blinding_factor]);
    assert(computed_assets_commit == assets_commitment);

    let computed_liab_commit = poseidon::bn254::hash_2([total_liabilities as Field, blinding_factor]);
    assert(computed_liab_commit == liabilities_commitment);

    // Verify solvency claim
    assert(is_solvent == (total_assets > total_liabilities));
    assert(total_assets > total_liabilities);
}

#[test]
fn test_solvent_protocol() {
    let assets = 5_000_000_u64;
    let liabilities = 3_000_000_u64;
    let bf = 999 as Field;
    let ac = poseidon::bn254::hash_2([assets as Field, bf]);
    let lc = poseidon::bn254::hash_2([liabilities as Field, bf]);
    main(assets, liabilities, bf, ac, lc, true);
}

#[test]
#[should_fail]
fn test_insolvent_protocol() {
    let assets = 2_000_000_u64; // less than liabilities
    let liabilities = 3_000_000_u64;
    let bf = 999 as Field;
    let ac = poseidon::bn254::hash_2([assets as Field, bf]);
    let lc = poseidon::bn254::hash_2([liabilities as Field, bf]);
    main(assets, liabilities, bf, ac, lc, true); // Must fail
}
