#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

#[test]
fn test_liquidity_deposit_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, KryonLiquidity);
    let client = KryonLiquidityClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    
    client.deposit(&user, &1000);
    client.withdraw(&user, &500);
}

#[test]
fn test_escrow_submit_invoice() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, KryonEscrow);
    let client = KryonEscrowClient::new(&env, &contract_id);

    let smb = Address::generate(&env);
    let invoice_commitment = BytesN::from_array(&env, &[1; 32]);
    let nullifier = BytesN::from_array(&env, &[2; 32]);
    let zk_proof = BytesN::from_array(&env, &[3; 64]);
    
    // Test successful submission
    client.submit_zk_factoring(&smb, &10000, &invoice_commitment, &nullifier, &zk_proof);
}
