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
    
    /// Spend a Shielded UTXO using a ZK Proof verified by oracle
    pub fn spend_shielded(
        env: Env,
        nullifier: BytesN<32>,
        new_commitment: BytesN<32>,
        message_hash: BytesN<32>,
        oracle_signature: BytesN<64>,
        attestation_timestamp: u64,
    ) {
        if env.storage().persistent().has(&nullifier) {
            panic!("Double spend detected: Nullifier already spent");
        }

        let oracle_pubkey: BytesN<32> = env.storage().instance()
            .get(&symbol_short!("OKey"))
            .expect("Oracle not initialized");

        let current_time = env.ledger().timestamp();
        if current_time > attestation_timestamp + 300 {
            panic!("Attestation expired");
        }

        env.crypto().ed25519_verify(
            &oracle_pubkey,
            &message_hash.clone().into(),
            &oracle_signature,
        );

        env.storage().persistent().set(&nullifier, &env.ledger().sequence());
        env.storage().persistent().set(&new_commitment, &env.ledger().sequence());

        env.events().publish(
            (symbol_short!("spent"), symbol_short!("utxo")),
            (nullifier, new_commitment)
        );
    }
}
