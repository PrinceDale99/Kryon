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
    let invoice_hash = BytesN::from_array(&env, &[0; 32]);
    
    client.submit_invoice(&smb, &invoice_hash, &10000, &true);
}
