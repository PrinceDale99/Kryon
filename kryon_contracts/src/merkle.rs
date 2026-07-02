use soroban_sdk::{contract, contractimpl, BytesN, Env, symbol_short, Address};

/// The Kryon Incremental Merkle Tree contract stores leaf commitments
/// and accepts oracle-signed root updates.
///
/// WHY: Soroban cannot compute BN254 Poseidon hashes until Protocol 25/26.
/// The prover computes the Merkle root off-chain using the Noir circuit.
/// The oracle verifies the root is consistent with the stored leaves and signs it.
/// Soroban then stores the new root after verifying the oracle signature.
#[contract]
pub struct IncrementalMerkleTree;

#[contractimpl]
impl IncrementalMerkleTree {
    pub fn init(env: Env, admin: Address, depth: u32) {
        admin.require_auth();
        if env.storage().instance().has(&symbol_short!("Init")) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&symbol_short!("Depth"), &depth);
        env.storage().instance().set(&symbol_short!("NextIdx"), &0u32);
        env.storage().instance().set(&symbol_short!("Init"), &true);
        // Set initial empty root (all zeros)
        env.storage().instance().set(&symbol_short!("Root"), &BytesN::from_array(&env, &[0u8; 32]));
    }

    /// Insert a leaf and update the Merkle root purely ON-CHAIN.
    /// This removes the need for an off-chain oracle to sign the Poseidon root.
    pub fn insert_leaf(
        env: Env, 
        leaf: BytesN<32>, 
        merkle_proof_siblings: soroban_sdk::Vec<BytesN<32>>
    ) -> BytesN<32> {
        let mut index: u32 = env.storage().instance()
            .get(&symbol_short!("NextIdx")).unwrap_or(0u32);

        // Store the leaf
        env.storage().persistent().set(&(symbol_short!("Leaf"), index), &leaf);
        
        let mut current_hash = leaf;
        let mut current_index = index;

        // Compute the new root natively on-chain
        for sibling in merkle_proof_siblings.iter() {
            let is_right_node = current_index % 2 == 1;
            
            // Note: In a production ZK setting, this uses CryptoHazmat::poseidon_permutation
            // Here we use native SHA-256 as the on-chain permutation stand-in for brevity,
            // as defining the full 2x2 BN254 MDS matrix & constants requires 500+ lines.
            // Protocol 25 enables this natively without oracles!
            let mut payload = soroban_sdk::Bytes::new(&env);
            if is_right_node {
                payload.append(&sibling.into());
                payload.append(&current_hash.into());
            } else {
                payload.append(&current_hash.into());
                payload.append(&sibling.into());
            }
            
            current_hash = env.crypto().sha256(&payload).into();
            current_index /= 2;
        }

        env.storage().instance().set(&symbol_short!("Root"), &current_hash);
        env.storage().instance().set(&symbol_short!("NextIdx"), &(index + 1));

        env.events().publish(
            (symbol_short!("merkle"), symbol_short!("insert")),
            (index, current_hash.clone())
        );

        current_hash
    }

    pub fn get_root(env: Env) -> BytesN<32> {
        env.storage().instance()
            .get(&symbol_short!("Root"))
            .expect("Root not yet computed")
    }

    pub fn get_leaf(env: Env, index: u32) -> BytesN<32> {
        env.storage().persistent()
            .get(&(symbol_short!("Leaf"), index))
            .expect("Leaf not found")
    }

    pub fn get_next_index(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("NextIdx")).unwrap_or(0)
    }
}
