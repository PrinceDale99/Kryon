use soroban_sdk::{contract, contractimpl, BytesN, Env, Address, symbol_short};

#[contract]
pub struct CredentialVerifier;

#[contractimpl]
impl CredentialVerifier {
    pub fn verify_credential(
        env: Env,
        holder: Address,
        credential_type: u32,
        credential_nullifier: BytesN<32>,
        message_hash: BytesN<32>,
        oracle_signature: BytesN<64>,
        attestation_timestamp: u64,
    ) -> bool {
        holder.require_auth();

        if env.storage().persistent().has(&credential_nullifier) {
            panic!("Credential nullifier already used: Sybil attack detected");
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

        env.storage().persistent().set(&credential_nullifier, &env.ledger().sequence());

        env.storage().persistent().set(
            &(symbol_short!("Cred"), holder.clone(), credential_type),
            &env.ledger().sequence()
        );

        env.events().publish(
            (symbol_short!("cred"), symbol_short!("verify")),
            (holder, credential_type)
        );

        true
    }

    pub fn verify_credential_proof(
        env: Env,
        holder: Address,
        credential_type: u32,
        credential_nullifier: BytesN<32>,
        proof_bytes: soroban_sdk::Bytes,
        public_inputs_bytes: soroban_sdk::Bytes,
    ) -> bool {
        holder.require_auth();
        
        if env.storage().persistent().has(&credential_nullifier) {
            panic!("Credential nullifier already used: Sybil attack detected");
        }

        let vk_bytes = env.storage().instance().get::<_, soroban_sdk::Bytes>(&symbol_short!("VK"))
            .unwrap_or_else(|| panic!("Verifying key not initialized"));
            
        let is_valid = crate::groth16::verify_groth16_bn254_native(&env, &vk_bytes, &proof_bytes, &public_inputs_bytes);
        if !is_valid {
            panic!("ZK Proof verification failed");
        }

        env.storage().persistent().set(&credential_nullifier, &env.ledger().sequence());
        env.storage().persistent().set(
            &(symbol_short!("Cred"), holder.clone(), credential_type),
            &env.ledger().sequence()
        );

        env.events().publish(
            (symbol_short!("cred"), symbol_short!("zkverify")),
            (holder, credential_type)
        );
        true
    }

    pub fn has_credential(env: Env, holder: Address, credential_type: u32) -> bool {
        env.storage().persistent().has(&(symbol_short!("Cred"), holder, credential_type))
    }
}
