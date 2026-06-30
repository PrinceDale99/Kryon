// Proves user is above a minimum age threshold without revealing birthdate.
use dep::std::hash::poseidon;

fn main(
    birth_year: u32,                 // Private
    current_year: pub u32,           // Public (injected by prover from system time)
    minimum_age: pub u32,            // Public (e.g., 18)
    user_secret: Field,              // Private blinding factor
    age_commitment: pub Field,       // Public: Poseidon(birth_year, user_secret)
) {
    // Verify the commitment matches
    let computed = poseidon::bn254::hash_2([birth_year as Field, user_secret]);
    assert(computed == age_commitment);

    // Verify age claim
    let age = current_year - birth_year;
    assert(age >= minimum_age);
}

#[test]
fn test_adult_verification() {
    let birth_year: u32 = 1995;
    let current_year: u32 = 2025;
    let min_age: u32 = 18;
    let secret = 12345 as Field;
    let commitment = poseidon::bn254::hash_2([birth_year as Field, secret]);
    main(birth_year, current_year, min_age, secret, commitment);
}

#[test(should_fail)]
fn test_underage_rejected() {
    let birth_year: u32 = 2015;  // 10 years old
    let current_year: u32 = 2025;
    let min_age: u32 = 18;
    let secret = 99 as Field;
    let commitment = poseidon::bn254::hash_2([birth_year as Field, secret]);
    main(birth_year, current_year, min_age, secret, commitment); // Must fail
}
