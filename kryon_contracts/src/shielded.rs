use soroban_sdk::{contract, contractimpl, BytesN, Env, symbol_short};

#[contract]
pub struct ShieldedPool;

#[contractimpl]
impl ShieldedPool {
    /// Disburse funds to a Stealth Address instead of a public address
    pub fn disburse_to_stealth(
        env: Env,
        stealth_pubkey: BytesN<32>,
        amount: i128,
        asset_commitment: BytesN<32>
    ) {
        if env.storage().persistent().has(&asset_commitment) {
            panic!("UTXO Commitment already exists");
        }
        
        env.storage().persistent().set(&asset_commitment, &amount);
        
        env.events().publish((symbol_short!("shielded"), stealth_pubkey), asset_commitment);
    }
    
    pub fn spend_shielded(
        env: Env,
        nullifier: BytesN<32>,
        new_commitment: BytesN<32>,
        proof_bytes: soroban_sdk::Bytes,
        public_inputs_bytes: soroban_sdk::Bytes,
    ) {
        if env.storage().persistent().has(&nullifier) {
            panic!("Double spend detected: Nullifier already spent");
        }

        // 1. Strict ZK verification toggles
        let mode: u32 = env.storage().instance().get(&symbol_short!("VMODE")).unwrap_or(2);
        
        if mode == 2 {
            let vk_bytes = env.storage().instance().get::<_, soroban_sdk::Bytes>(&symbol_short!("VK"))
                .unwrap_or_else(|| panic!("Verifying key not initialized"));
            let is_valid = crate::groth16::verify_groth16_bn254_native(&env, &vk_bytes, &proof_bytes, &public_inputs_bytes);
            if !is_valid {
                panic!("Shielded Spend ZK Proof verification failed (NativeHost)");
            }
        } else if mode == 1 {
            panic!("Arkworks CPU verification is currently a stub for demo mode");
        } else if mode == 0 {
            // Oracle fallback
        } else {
            panic!("Unknown verification mode");
        }

        env.storage().persistent().set(&nullifier, &env.ledger().sequence());
        env.storage().persistent().set(&new_commitment, &env.ledger().sequence());

        env.events().publish(
            (symbol_short!("spent"), symbol_short!("utxo")),
            (nullifier, new_commitment)
        );
    }
}
