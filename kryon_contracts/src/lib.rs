#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, BytesN, Env, Bytes};

#[cfg(target_family = "wasm")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub mod shielded;
pub mod merkle;
pub mod nullifier_registry;
pub mod solvency;
pub mod credential;
pub mod groth16;


#[contract]
pub struct KryonEscrow;

#[contractimpl]
impl KryonEscrow {
    pub fn init_verifying_key(env: Env, admin: Address, vk_bytes: Bytes) {
        admin.require_auth();
        if env.storage().instance().has(&symbol_short!("VK")) {
            panic!("Verifying key already initialized");
        }
        env.storage().instance().set(&symbol_short!("VK"), &vk_bytes);
    }

    pub fn deposit(env: Env, from: Address, token: Address, amount: i128) {
        from.require_auth();
        let client = soroban_sdk::token::Client::new(&env, &token);
        client.transfer(&from, &env.current_contract_address(), &amount);

        let mut balance: i128 = env.storage().persistent().get(&from).unwrap_or(0);
        balance += amount;
        env.storage().persistent().set(&from, &balance);
        
        let mut total: i128 = env.storage().persistent().get(&symbol_short!("Total")).unwrap_or(0);
        total += amount;
        env.storage().persistent().set(&symbol_short!("Total"), &total);
    }

    pub fn withdraw(env: Env, to: Address, token: Address, amount: i128) {
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

        let client = soroban_sdk::token::Client::new(&env, &token);
        client.transfer(&env.current_contract_address(), &to, &amount);
    }

    pub fn submit_zk_factoring(
        env: Env,
        borrower: Address,
        token: Address,
        advance_requested: i128,
        invoice_commitment: BytesN<32>,
        nullifier: BytesN<32>,
        proof_bytes: Bytes,
        public_inputs_bytes: Bytes,
    ) {
        borrower.require_auth();

        // 1. Check nullifier
        if env.storage().persistent().has(&nullifier) {
            panic!("Invoice already factored: Nullifier spent");
        }

        // 2. Real ZK verification via Native Host Functions
        let vk_bytes: Bytes = env.storage().instance()
            .get(&symbol_short!("VK"))
            .expect("VK not initialized");

        let is_valid = crate::groth16::verify_groth16_bn254_native(&env, &vk_bytes, &proof_bytes, &public_inputs_bytes);
        if !is_valid {
            panic!("ZK Proof verification failed");
        }

        // 3. Mark nullifier as spent
        env.storage().persistent().set(&nullifier, &env.ledger().sequence());

        // 4. Record the approved invoice commitment
        env.storage().persistent().set(&invoice_commitment, &advance_requested);

        // 5. Transfer funds to borrower from the escrow's total pool
        let client = soroban_sdk::token::Client::new(&env, &token);
        let current_balance = client.balance(&env.current_contract_address());
        if current_balance < advance_requested {
            panic!("Insufficient liquidity in escrow pool to fund this advance");
        }
        client.transfer(&env.current_contract_address(), &borrower, &advance_requested);

        // Deduct from global total tracked for statistics
        let mut total: i128 = env.storage().persistent().get(&symbol_short!("Total")).unwrap_or(0);
        total -= advance_requested;
        env.storage().persistent().set(&symbol_short!("Total"), &total);

        // 6. Emit event for off-chain indexing
        env.events().publish(
            (symbol_short!("factored"), borrower),
            (invoice_commitment, advance_requested)
        );
    }
}
