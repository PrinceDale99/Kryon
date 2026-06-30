use dep::std::hash::poseidon;

fn main(a: Field, b: Field) -> pub Field {
    poseidon::bn254::hash_2([a, b])
}

#[test]
fn test_deterministic() {
    let h1 = poseidon::bn254::hash_2([1 as Field, 2 as Field]);
    let h2 = poseidon::bn254::hash_2([1 as Field, 2 as Field]);
    assert(h1 == h2);
}
