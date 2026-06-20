#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, BytesN, Env};

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
pub struct KryonEscrow;

#[contractimpl]
impl KryonEscrow {
    pub fn submit_invoice(env: Env, smb: Address, invoice_hash: BytesN<32>, face_value: i128, zk_proof_mock: bool) {
        smb.require_auth();
        
        if env.storage().persistent().has(&invoice_hash) {
            panic!("Invoice already factored");
        }
        
        if zk_proof_mock {
            let _advance = (face_value * 90) / 100;
            env.storage().persistent().set(&invoice_hash, &true);
        } else {
            panic!("Invalid ZK Proof");
        }
    }
}
