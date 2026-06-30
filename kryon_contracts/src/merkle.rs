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
    /// Initialize the tree with the oracle public key and depth
    pub fn init(env: Env, admin: Address, oracle_pubkey: BytesN<32>, depth: u32) {
        admin.require_auth();
        if env.storage().instance().has(&symbol_short!("Init")) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&symbol_short!("OKey"), &oracle_pubkey);
        env.storage().instance().set(&symbol_short!("Depth"), &depth);
        env.storage().instance().set(&symbol_short!("NextIdx"), &0u32);
        env.storage().instance().set(&symbol_short!("Init"), &true);
    }

    /// Insert a leaf commitment (e.g., invoice commitment or credential commitment).
    /// The leaf is stored. The Merkle root must then be updated via update_root().
    pub fn insert_leaf(env: Env, leaf: BytesN<32>) -> u32 {
        let index: u32 = env.storage().instance()
            .get(&symbol_short!("NextIdx")).unwrap_or(0u32);

        // Store the leaf at its index
        env.storage().persistent().set(&(symbol_short!("Leaf"), index), &leaf);
        env.storage().instance().set(&symbol_short!("NextIdx"), &(index + 1));

        env.events().publish(
            (symbol_short!("merkle"), symbol_short!("insert")),
            (index, leaf)
        );

        index
    }

    /// Update the Merkle root with an oracle-signed attestation.
    /// The oracle computes the true Poseidon root off-chain and signs it.
    pub fn update_root(
        env: Env,
        new_root: BytesN<32>,
        leaf_count: u32,              // Must match current NextIdx
        message_hash: BytesN<32>,     // SHA256(new_root || leaf_count || timestamp)
        oracle_signature: BytesN<64>,
        timestamp: u64,
    ) {
        let oracle_pubkey: BytesN<32> = env.storage().instance()
            .get(&symbol_short!("OKey"))
            .expect("Not initialized");

        let current_idx: u32 = env.storage().instance()
            .get(&symbol_short!("NextIdx")).unwrap_or(0);

        if leaf_count != current_idx {
            panic!("Leaf count mismatch: expected {}", current_idx);
        }

        let current_time = env.ledger().timestamp();
        if current_time > timestamp + 300 {
            panic!("Root update attestation expired");
        }

        // Real Ed25519 oracle verification
        env.crypto().ed25519_verify(
            &oracle_pubkey,
            &message_hash.clone().into(),
            &oracle_signature,
        );

        env.storage().instance().set(&symbol_short!("Root"), &new_root);
        env.storage().instance().set(&symbol_short!("RootTime"), &timestamp);

        env.events().publish(
            (symbol_short!("merkle"), symbol_short!("root")),
            new_root
        );
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
