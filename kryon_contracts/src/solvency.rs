use soroban_sdk::{contract, contractimpl, BytesN, Env, symbol_short};

#[contract]
pub struct SolvencyAttestation;

#[contractimpl]
impl SolvencyAttestation {
    pub fn attest_solvency(
        env: Env,
        assets_commitment: BytesN<32>,
        liabilities_commitment: BytesN<32>,
        message_hash: BytesN<32>,
        oracle_signature: BytesN<64>,
        attestation_timestamp: u64,
    ) {
        let oracle_pubkey: BytesN<32> = env.storage().instance()
            .get(&symbol_short!("OKey"))
            .expect("Oracle not initialized");

        let current_time = env.ledger().timestamp();
        if current_time > attestation_timestamp + 86400 {
            panic!("Solvency attestation too old");
        }

        env.crypto().ed25519_verify(
            &oracle_pubkey,
            &message_hash.clone().into(),
            &oracle_signature,
        );

        env.storage().instance().set(&symbol_short!("ACom"), &assets_commitment);
        env.storage().instance().set(&symbol_short!("LCom"), &liabilities_commitment);
        env.storage().instance().set(&symbol_short!("ATime"), &attestation_timestamp);

        env.events().publish(
            (symbol_short!("solvent"), symbol_short!("attest")),
            attestation_timestamp
        );
    }
}
