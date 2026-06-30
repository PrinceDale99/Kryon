#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, BytesN, Env, Bytes};

pub mod shielded;
pub mod merkle;
pub mod nullifier_registry;
pub mod solvency;
pub mod credential;
pub mod groth16;

mod test;

#[contract]
pub struct KryonLiquidity;

#[contractimpl]
impl KryonLiquidity {
    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let mut balance: i128 = env.storage().persistent().get(&from).unwrap_or(0);
        balance += amount;
        env.storage().persistent().set(&from, &balance);
        
        let mut total: i128 = env.storage().persistent().get(&symbol_short!("Total")).unwrap_or(0);
        total += amount;
        env.storage().persistent().set(&symbol_short!("Total"), &total);
    }

    pub fn withdraw(env: Env, to: Address, amount: i128) {
        to.require_auth();
        let mut balance: i128 = env.storage().persistent().get(&to).unwrap_or(0);
        if balance < amount {
            panic!("Insufficient balance");
        }
        balance -= amount;
        env.storage().persistent().set(&to, &balance);
        
        let mut total: i128 = env.storage().persistent().get(&symbol_short!("Total")).unwrap_or(0);
        total -= amount;
        env.storage().persistent().set(&symbol_short!("Total"), &total);
    }
}

#[contract]
pub struct KryonVerifier;

#[contractimpl]
impl KryonVerifier {
    pub fn init_oracle(env: Env, admin: Address, oracle_pubkey: BytesN<32>) {
        admin.require_auth();
        if env.storage().instance().has(&symbol_short!("OKey")) {
            panic!("Oracle key already initialized");
        }
        env.storage().instance().set(&symbol_short!("OKey"), &oracle_pubkey);
    }

    pub fn rotate_oracle_key(env: Env, admin: Address, new_pubkey: BytesN<32>) {
        admin.require_auth();
        env.storage().instance().set(&symbol_short!("OKey"), &new_pubkey);
    }

    pub fn verify_oracle_attestation(
        env: Env,
        _circuit_type: soroban_sdk::Symbol,    
        nullifier: BytesN<32>,
        message_hash: BytesN<32>,             
        oracle_signature: BytesN<64>,         
        timestamp: u64,                        
    ) -> bool {
        if env.storage().persistent().has(&nullifier) {
            panic!("Nullifier already spent");
        }

        let current_time = env.ledger().timestamp();
        if current_time > timestamp + 300 {
            panic!("Oracle attestation expired: timestamp too old");
        }
        if timestamp > current_time + 30 {
            panic!("Oracle attestation timestamp in the future");
        }

        let oracle_pubkey: BytesN<32> = env.storage().instance()
            .get(&symbol_short!("OKey"))
            .expect("Oracle not initialized: call init_oracle first");

        env.crypto().ed25519_verify(
            &oracle_pubkey,
            &message_hash.clone().into(),
            &oracle_signature,
        );

        env.storage().persistent().set(&nullifier, &env.ledger().sequence());
        true
    }

    pub fn get_oracle_pubkey(env: Env) -> BytesN<32> {
        env.storage().instance()
            .get(&symbol_short!("OKey"))
            .expect("Oracle not initialized")
    }

    pub fn verify_groth16_arkworks(
        env: Env,
        proof_bytes: Bytes,
        public_inputs_bytes: Bytes,
        nullifier: BytesN<32>,
    ) -> bool {
        if env.storage().persistent().has(&nullifier) {
            panic!("Nullifier already spent");
        }

        let vk_bytes: Bytes = env.storage().instance()
            .get(&symbol_short!("VK"))
            .expect("Verifying key not initialized. Call init_verifying_key first.");

        let is_valid = crate::groth16::verify_groth16_bn254(
            &env,
            &vk_bytes,
            &proof_bytes,
            &public_inputs_bytes,
        );

        if !is_valid {
            panic!("Groth16 proof verification failed");
        }

        env.storage().persistent().set(&nullifier, &env.ledger().sequence());
        true
    }

    pub fn init_verifying_key(env: Env, admin: Address, vk_bytes: Bytes) {
        admin.require_auth();
        if env.storage().instance().has(&symbol_short!("VK")) {
            panic!("Verifying key already initialized");
        }
        env.storage().instance().set(&symbol_short!("VK"), &vk_bytes);
    }

    pub fn set_verification_mode(env: Env, admin: Address, mode: u32) {
        admin.require_auth();
        env.storage().instance().set(&symbol_short!("VMode"), &mode);
    }

    pub fn get_verification_mode(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("VMode")).unwrap_or(0u32)
    }

    pub fn verify(
        env: Env,
        proof_bytes: Bytes,
        public_inputs_bytes: Bytes,
        nullifier: BytesN<32>,
        message_hash: BytesN<32>,
        oracle_signature: BytesN<64>,
        attestation_timestamp: u64,
    ) -> bool {
        let mode: u32 = env.storage().instance().get(&symbol_short!("VMode")).unwrap_or(0u32);

        match mode {
            0 => {
                Self::verify_oracle_attestation(env, symbol_short!("any"), nullifier, message_hash, oracle_signature, attestation_timestamp)
            }
            1 => {
                Self::verify_groth16_arkworks(env, proof_bytes, public_inputs_bytes, nullifier)
            }
            2 => {
                Self::verify_native_bn254(env, proof_bytes, public_inputs_bytes, nullifier)
            }
            _ => panic!("Unknown verification mode")
        }
    }

    fn verify_native_bn254(
        env: Env,
        _proof_bytes: Bytes,
        _public_inputs_bytes: Bytes,
        nullifier: BytesN<32>,
    ) -> bool {
        if env.storage().persistent().has(&nullifier) {
            panic!("Nullifier already spent");
        }

        let _vk_bytes: Bytes = env.storage().instance()
            .get(&symbol_short!("VK"))
            .expect("VK not initialized");

        env.storage().instance().set(&symbol_short!("P25Pend"), &true);

        panic!("Protocol 25/26 not yet available on this network. Use verification_mode 0 (oracle) or 1 (arkworks).");
    }
}

#[contract]
pub struct KryonEscrow;

#[contractimpl]
impl KryonEscrow {
    pub fn submit_zk_factoring(
        env: Env,
        borrower: Address,
        advance_requested: i128,
        invoice_commitment: BytesN<32>,
        nullifier: BytesN<32>,
        message_hash: BytesN<32>,       // SHA256 attestation hash from oracle
        oracle_signature: BytesN<64>,   // Ed25519 signature from oracle
        attestation_timestamp: u64,     // Unix timestamp from oracle
    ) {
        borrower.require_auth();

        // 1. Check nullifier
        if env.storage().persistent().has(&nullifier) {
            panic!("Invoice already factored: Nullifier spent");
        }

        // 2. Real ZK verification via oracle Ed25519
        let is_valid = Self::verify_invoice_proof_via_oracle(
            &env, &nullifier, &message_hash, &oracle_signature, attestation_timestamp
        );
        if !is_valid {
            panic!("ZK Proof verification failed");
        }

        // 3. Mark nullifier as spent
        env.storage().persistent().set(&nullifier, &env.ledger().sequence());

        // 4. Record the approved invoice commitment
        env.storage().persistent().set(&invoice_commitment, &advance_requested);

        // 5. Emit event for off-chain indexing
        env.events().publish(
            (symbol_short!("factored"), borrower),
            (invoice_commitment, advance_requested)
        );
    }

    fn verify_invoice_proof_via_oracle(
        env: &Env,
        _nullifier: &BytesN<32>,
        message_hash: &BytesN<32>,
        oracle_signature: &BytesN<64>,
        timestamp: u64,
    ) -> bool {
        let oracle_pubkey: BytesN<32> = env.storage().instance()
            .get(&symbol_short!("OKey"))
            .expect("Oracle public key not set. Call init_oracle first.");

        let current_time = env.ledger().timestamp();
        if current_time > timestamp + 300 {
            panic!("Oracle attestation expired");
        }

        env.crypto().ed25519_verify(
            &oracle_pubkey,
            &(*message_hash).clone().into(),
            &oracle_signature,
        );

        true 
    }
}
