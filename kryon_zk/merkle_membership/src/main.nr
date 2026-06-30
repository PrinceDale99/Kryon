// Proves that a leaf value is a member of a Merkle tree
// without revealing the leaf index or sibling path values.
use poseidon::poseidon;

global DEPTH: u32 = 20; // 2^20 = 1M leaves

fn merkle_hash(left: Field, right: Field) -> Field {
    poseidon::bn254::hash_2([left, right])
}

fn main(
    leaf: Field,                     // Private: the leaf value (e.g., invoice commitment)
    path_elements: [Field; 20],      // Private: sibling hashes along the path
    path_indices: [u1; 20],          // Private: 0 = current is left, 1 = current is right
    root: pub Field,                 // Public: the Merkle root stored on-chain
) {
    let mut current = leaf;
    for i in 0..DEPTH {
        let (left, right) = if path_indices[i] == 0 {
            (current, path_elements[i])
        } else {
            (path_elements[i], current)
        };
        current = merkle_hash(left, right);
    }
    assert(current == root);
}

#[test]
fn test_single_leaf_tree() {
    let leaf = poseidon::bn254::hash_2([42 as Field, 1 as Field]);
    let sibling0 = poseidon::bn254::hash_2([99 as Field, 1 as Field]);
    
    let mut current = merkle_hash(leaf, sibling0);
    let mut path_elements = [0 as Field; 20];
    path_elements[0] = sibling0;
    
    for i in 1..20 {
        let zero_hash = 0 as Field;
        path_elements[i] = zero_hash;
        current = merkle_hash(current, zero_hash);
    }
    
    let root = current;
    let path_indices = [0 as u1; 20];
    
    main(leaf, path_elements, path_indices, root);
}

#[test(should_fail)]
fn test_invalid_membership() {
    let leaf = 12345 as Field;
    let path_elements = [0 as Field; 20];
    let path_indices = [0 as u1; 20];
    let root = 99999 as Field; // Fake root
    main(leaf, path_elements, path_indices, root); // Must fail
}
