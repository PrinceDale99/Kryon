#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, BytesN, Env};
use ed25519_dalek::{SigningKey, Signer, VerifyingKey};
use rand_core::OsRng;

#[test]
fn test_liquidity_deposit_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(KryonLiquidity, ());
    let client = KryonLiquidityClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    
    client.deposit(&user, &1000);
    client.withdraw(&user, &500);
}

// Test: Real Ed25519 oracle signature verification in KryonVerifier
#[test]
fn test_oracle_signature_verification_succeeds() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(KryonVerifier, ());
    let client = KryonVerifierClient::new(&env, &contract_id);

    // Generate a real Ed25519 keypair for the oracle
    let mut csprng = OsRng;
    let oracle_kp = SigningKey::generate(&mut csprng);
    let oracle_pubkey = BytesN::from_array(&env, &oracle_kp.verifying_key().to_bytes());

    // Register oracle key and admin
    let admin = Address::generate(&env);
    client.init_oracle(&admin, &oracle_pubkey);

    // Build the attestation message
    let nullifier = BytesN::from_array(&env, &[42u8; 32]);
    let msg_hash = BytesN::from_array(&env, &[1u8; 32]);
    let timestamp = env.ledger().timestamp();

    // Sign with oracle key
    let sig = oracle_kp.sign(&msg_hash.to_array());
    let oracle_sig = BytesN::from_array(&env, &sig.to_bytes());

    // Must succeed  real Ed25519 verify
    let result = client.verify_oracle_attestation(
        &soroban_sdk::symbol_short!("invoice"),
        &nullifier,
        &msg_hash,
        &oracle_sig,
        &timestamp,
    );
    assert!(result);
}

// Test: Wrong signature is rejected
#[test]
#[should_panic]
fn test_invalid_oracle_signature_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(KryonVerifier, ());
    let client = KryonVerifierClient::new(&env, &contract_id);

    let mut csprng = OsRng;
    let oracle_kp = SigningKey::generate(&mut csprng);
    let oracle_pubkey = BytesN::from_array(&env, &oracle_kp.verifying_key().to_bytes());
    
    let admin = Address::generate(&env);
    client.init_oracle(&admin, &oracle_pubkey);

    let nullifier = BytesN::from_array(&env, &[42u8; 32]);
    let msg_hash = BytesN::from_array(&env, &[1u8; 32]);
    let timestamp = env.ledger().timestamp();

    // Use WRONG/random signature  must panic
    let bad_sig = BytesN::from_array(&env, &[0u8; 64]);
    client.verify_oracle_attestation(
        &soroban_sdk::symbol_short!("invoice"),
        &nullifier,
        &msg_hash,
        &bad_sig,
        &timestamp,
    );
}

// Test: Expired attestation is rejected
#[test]
#[should_panic(expected = "Oracle attestation expired")]
fn test_expired_attestation_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(KryonVerifier, ());
    let client = KryonVerifierClient::new(&env, &contract_id);

    let mut csprng = OsRng;
    let oracle_kp = SigningKey::generate(&mut csprng);
    let oracle_pubkey = BytesN::from_array(&env, &oracle_kp.verifying_key().to_bytes());

    let admin = Address::generate(&env);
    client.init_oracle(&admin, &oracle_pubkey);

    let nullifier = BytesN::from_array(&env, &[42u8; 32]);
    let msg_hash = BytesN::from_array(&env, &[1u8; 32]);
    let old_timestamp = 1000u64; // Far in the past

    // Set ledger time to far future
    env.ledger().with_mut(|l| { l.timestamp = 100_000; });

    let sig = oracle_kp.sign(&msg_hash.to_array());
    let oracle_sig = BytesN::from_array(&env, &sig.to_bytes());

    // Must panic: attestation too old
    client.verify_oracle_attestation(
        &soroban_sdk::symbol_short!("invoice"),
        &nullifier,
        &msg_hash,
        &oracle_sig,
        &old_timestamp,
    );
}
