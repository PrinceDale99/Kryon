use soroban_sdk::{contract, contractimpl, BytesN, Env, Address, symbol_short};

#[contract]
pub struct NullifierRegistry;

#[contractimpl]
impl NullifierRegistry {
    /// Register a nullifier. Panics if already registered.
    pub fn register(env: Env, nullifier: BytesN<32>) {
        if env.storage().persistent().has(&nullifier) {
            panic!("Nullifier already registered: double-spend detected");
        }
        env.storage().persistent().set(&nullifier, &env.ledger().sequence());
    }

    /// Check if a nullifier has been spent.
    pub fn is_spent(env: Env, nullifier: BytesN<32>) -> bool {
        env.storage().persistent().has(&nullifier)
    }

    /// Get the ledger sequence when a nullifier was registered.
    pub fn get_spend_ledger(env: Env, nullifier: BytesN<32>) -> Option<u32> {
        env.storage().persistent().get(&nullifier)
    }
}
