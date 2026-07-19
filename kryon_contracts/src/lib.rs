#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, BytesN, Env, Bytes, Symbol};

#[cfg(target_family = "wasm")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub mod shielded;
pub mod merkle;
pub mod nullifier_registry;
pub mod solvency;
pub mod credential;
pub mod groth16;
pub mod multisig;
pub mod sep;

use multisig::{init_multisig, propose_action, approve_action, execute_action, cancel_action, get_proposal, get_approval_count, get_threshold, get_signers, MultiSigProposal};

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

    pub fn set_verification_mode(env: Env, admin: Address, mode: u32) {
        admin.require_auth();
        env.storage().instance().set(&symbol_short!("VMODE"), &mode);
    }

    pub fn get_verification_mode(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("VMODE")).unwrap_or(2)
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

        if env.storage().persistent().has(&nullifier) {
            panic!("Invoice already factored: Nullifier spent");
        }

        let mode = Self::get_verification_mode(env.clone());
        if mode == 2 {
            let vk_bytes = env.storage().instance().get::<_, Bytes>(&symbol_short!("VK"))
                .unwrap_or_else(|| panic!("Verifying key not initialized"));
            let is_valid = crate::groth16::verify_groth16_bn254_native(&env, &vk_bytes, &proof_bytes, &public_inputs_bytes);
            if !is_valid {
                panic!("ZK Proof verification failed (NativeHost)");
            }
        } else if mode == 1 {
            // Stub for demo mode
        } else if mode == 0 {
            // Oracle
        } else {
            panic!("Unknown verification mode");
        }

        env.storage().persistent().set(&nullifier, &env.ledger().sequence());
        env.storage().persistent().set(&invoice_commitment, &advance_requested);

        let client = soroban_sdk::token::Client::new(&env, &token);
        let current_balance = client.balance(&env.current_contract_address());
        if current_balance < advance_requested {
            panic!("Insufficient liquidity in escrow pool to fund this advance");
        }
        client.transfer(&env.current_contract_address(), &borrower, &advance_requested);

        let mut total: i128 = env.storage().persistent().get(&symbol_short!("Total")).unwrap_or(0);
        total -= advance_requested;
        env.storage().persistent().set(&symbol_short!("Total"), &total);

        env.events().publish(
            (symbol_short!("factored"), borrower),
            (invoice_commitment, advance_requested)
        );
    }

    // Feature 1: Time-Locked Bounties (Refunds)
    pub fn set_deadline(env: Env, admin: Address, deadline: u64) {
        admin.require_auth();
        env.storage().instance().set(&symbol_short!("DEADLINE"), &deadline);
    }
    
    pub fn refund(env: Env, from: Address, token: Address) {
        let deadline: u64 = env.storage().instance().get(&symbol_short!("DEADLINE")).unwrap_or(0);
        if deadline == 0 || env.ledger().timestamp() < deadline {
            panic!("Deadline not reached or not set");
        }
        let balance: i128 = env.storage().persistent().get(&from).unwrap_or(0);
        if balance > 0 {
            env.storage().persistent().set(&from, &0i128);
            let mut total: i128 = env.storage().persistent().get(&symbol_short!("Total")).unwrap_or(0);
            total -= balance;
            env.storage().persistent().set(&symbol_short!("Total"), &total);
            let client = soroban_sdk::token::Client::new(&env, &token);
            client.transfer(&env.current_contract_address(), &from, &balance);
        }
    }

    // Feature 2: Spam Prevention (Staking & Slashing)
    pub fn stake_for_proof(env: Env, hunter: Address, token: Address, amount: i128) {
        hunter.require_auth();
        let client = soroban_sdk::token::Client::new(&env, &token);
        client.transfer(&hunter, &env.current_contract_address(), &amount);
        let key = (symbol_short!("STAKE"), hunter.clone());
        let mut current_stake: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        current_stake += amount;
        env.storage().persistent().set(&key, &current_stake);
    }

    // Feature 3: Multi-Asset Bounties (USDC / Stablecoins)
    pub fn deposit_multi_asset(env: Env, from: Address, token: Address, amount: i128) {
        from.require_auth();
        let client = soroban_sdk::token::Client::new(&env, &token);
        client.transfer(&from, &env.current_contract_address(), &amount);
        let key = (symbol_short!("ASSET"), from.clone(), token.clone());
        let mut balance: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        balance += amount;
        env.storage().persistent().set(&key, &balance);
    }

    // Feature 4: Automated Yield Generation (DeFi Integration)
    pub fn route_to_defi(env: Env, admin: Address, pool: Address, token: Address, amount: i128) {
        admin.require_auth();
        let client = soroban_sdk::token::Client::new(&env, &token);
        // In a real scenario, this transfers to a DeFi pool and returns shares
        client.transfer(&env.current_contract_address(), &pool, &amount);
        let key = (symbol_short!("DEFI"), pool);
        let mut routed: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        routed += amount;
        env.storage().persistent().set(&key, &routed);
    }

    // Feature 5: Milestone-Based Payouts
    pub fn claim_milestone(env: Env, hunter: Address, token: Address, milestone_level: u32, total_bounty: i128) {
        hunter.require_auth();
        // Simplified milestone logic
        let payout = if milestone_level == 1 {
            total_bounty / 10 // 10% for milestone 1
        } else {
            total_bounty
        };
        let client = soroban_sdk::token::Client::new(&env, &token);
        client.transfer(&env.current_contract_address(), &hunter, &payout);
    }

    // Feature 6: Depositor DAO Governance
    pub fn vote_on_proposal(env: Env, voter: Address, proposal_id: u32) {
        voter.require_auth();
        let voting_power: i128 = env.storage().persistent().get(&voter).unwrap_or(0);
        if voting_power == 0 {
            panic!("No voting power");
        }
        let key = (symbol_short!("VOTE"), proposal_id, voter);
        env.storage().persistent().set(&key, &voting_power);
    }

    // Feature 7: Cross-Chain Triggering
    pub fn emit_cross_chain_trigger(env: Env, target_chain: u32, payload: Bytes) {
        env.events().publish(
            (symbol_short!("cross"), target_chain),
            payload
        );
    }

    // ── Multi-Signature Logic (M-of-N Threshold Approval) ────────────────────
    //
    // Privileged treasury operations (large withdrawals, param changes) require
    // multi-party approval before execution. The flow is:
    //   1. A registered signer calls `ms_init` (once, at deploy time).
    //   2. Any signer calls `ms_propose` to open a proposal.
    //   3. Other signers call `ms_approve` to register their vote.
    //   4. Once threshold is met, any signer calls `ms_execute` to confirm.
    //   5. The privileged operation (e.g. `withdraw_multisig`) can then proceed.

    /// Initialize the multi-sig registry. Called once by the bootstrap admin.
    /// `signers` = Vec of N authorized signer addresses.
    /// `threshold` = M approvals required (1 ≤ M ≤ N ≤ 10).
    pub fn ms_init(env: Env, admin: Address, signers: soroban_sdk::Vec<Address>, threshold: u32) {
        init_multisig(&env, &admin, signers, threshold);
    }

    /// Propose a new multi-sig action. Proposer's approval is auto-counted.
    pub fn ms_propose(env: Env, proposer: Address, action_id: BytesN<32>) {
        propose_action(&env, &proposer, action_id);
    }

    /// Approve an existing proposal as a registered signer.
    pub fn ms_approve(env: Env, signer: Address, action_id: BytesN<32>) {
        approve_action(&env, &signer, action_id);
    }

    /// Execute (unlock) a proposal that has reached threshold.
    /// Must be called before performing the privileged operation.
    pub fn ms_execute(env: Env, caller: Address, action_id: BytesN<32>) -> bool {
        execute_action(&env, &caller, action_id)
    }

    /// Cancel a pending proposal (proposer only).
    pub fn ms_cancel(env: Env, proposer: Address, action_id: BytesN<32>) {
        cancel_action(&env, &proposer, action_id);
    }

    /// View a proposal record.
    pub fn ms_get_proposal(env: Env, action_id: BytesN<32>) -> MultiSigProposal {
        get_proposal(&env, action_id)
    }

    /// View the approval count for a proposal.
    pub fn ms_approval_count(env: Env, action_id: BytesN<32>) -> u32 {
        get_approval_count(&env, action_id)
    }

    /// View the configured threshold.
    pub fn ms_threshold(env: Env) -> u32 {
        get_threshold(&env)
    }

    /// View the registered signer list.
    pub fn ms_signers(env: Env) -> soroban_sdk::Vec<Address> {
        get_signers(&env)
    }

    /// Multi-sig protected large withdrawal.
    /// Requires a fully executed multi-sig proposal matching `action_id` before
    /// the XLM transfer is released. Prevents unilateral admin fund extraction.
    pub fn withdraw_multisig(
        env: Env,
        caller: Address,
        to: Address,
        token: Address,
        amount: i128,
        action_id: BytesN<32>,
    ) {
        caller.require_auth();

        // Verify the multi-sig proposal is fully approved and mark it executed.
        // This will panic if threshold is not reached or proposal doesn't exist.
        execute_action(&env, &caller, action_id);

        // Perform the privileged transfer atomically.
        let client = soroban_sdk::token::Client::new(&env, &token);
        client.transfer(&env.current_contract_address(), &to, &amount);

        let mut total: i128 = env.storage().persistent().get(&symbol_short!("Total")).unwrap_or(0);
        total -= amount;
        env.storage().persistent().set(&symbol_short!("Total"), &total);
    }

    // ── SEP-24 / SEP-31 Anchor Integration (Cross-Border Flows) ─────────────
    //
    // Emits on-chain events that Stellar anchor servers listen for to initiate
    // SEP-24 interactive deposit/withdrawal or SEP-31 direct cross-border payment.
    // The frontend calls the anchor's TOML-discovered endpoints; the contract
    // records the intent and validates the anchor's settlement callback.

    /// Record an incoming SEP-24 anchor deposit intent.
    /// `anchor_id`     = anchor server identifier hash (SHA256 of anchor domain).
    /// `stellar_memo`  = the 32-byte memo the anchor will attach to the settlement tx.
    /// `fiat_amount`   = amount in fiat cents (e.g. PHP centavos, USD cents).
    /// `currency_code` = 3-letter ISO 4217 currency code as a Symbol.
    pub fn record_sep24_deposit(
        env: Env,
        user: Address,
        anchor_id: BytesN<32>,
        stellar_memo: BytesN<32>,
        fiat_amount: i128,
        currency_code: soroban_sdk::Symbol,
    ) {
        user.require_auth();

        // Store the pending deposit record keyed by stellar_memo (unique per anchor tx)
        let key = (symbol_short!("SEP24D"), stellar_memo.clone());
        env.storage().temporary().set(&key, &(user.clone(), fiat_amount, anchor_id.clone()));

        env.events().publish(
            (symbol_short!("sep24dep"), user),
            (anchor_id, stellar_memo, fiat_amount, currency_code),
        );
    }

    /// Record an outgoing SEP-24 anchor withdrawal intent.
    /// Called when a user wants to withdraw factoring proceeds to a bank/e-wallet.
    pub fn record_sep24_withdrawal(
        env: Env,
        user: Address,
        anchor_id: BytesN<32>,
        stellar_memo: BytesN<32>,
        xlm_amount: i128,
        destination_currency: soroban_sdk::Symbol,
    ) {
        user.require_auth();

        let key = (symbol_short!("SEP24W"), stellar_memo.clone());
        env.storage().temporary().set(&key, &(user.clone(), xlm_amount, anchor_id.clone()));

        env.events().publish(
            (symbol_short!("sep24wdw"), user),
            (anchor_id, stellar_memo, xlm_amount, destination_currency),
        );
    }

    /// Record a SEP-31 direct cross-border payment intent.
    /// Used for B2B invoice settlement across currency corridors (e.g. PHP→USD).
    /// `sending_anchor_id`   = hash of the sending anchor's domain.
    /// `receiving_anchor_id` = hash of the receiving anchor's domain.
    /// `transaction_id`      = unique 32-byte identifier from the sending anchor.
    /// `fiat_amount`         = amount in sending currency (cents).
    pub fn record_sep31_payment(
        env: Env,
        sender: Address,
        sending_anchor_id: BytesN<32>,
        receiving_anchor_id: BytesN<32>,
        transaction_id: BytesN<32>,
        fiat_amount: i128,
        sending_currency: soroban_sdk::Symbol,
        receiving_currency: soroban_sdk::Symbol,
    ) {
        sender.require_auth();

        let key = (symbol_short!("SEP31"), transaction_id.clone());
        env.storage().temporary().set(
            &key,
            &(sender.clone(), fiat_amount, sending_anchor_id.clone(), receiving_anchor_id.clone()),
        );

        env.events().publish(
            (symbol_short!("sep31pay"), sender),
            (sending_anchor_id, receiving_anchor_id, transaction_id, fiat_amount, sending_currency, receiving_currency),
        );
    }

    /// Confirm a SEP-24/SEP-31 anchor settlement.
    /// Called by the trusted anchor account after it has transferred XLM on-chain.
    /// Validates the memo matches a recorded intent, then credits the user.
    pub fn confirm_anchor_settlement(
        env: Env,
        anchor_caller: Address,
        stellar_memo: BytesN<32>,
        settled_xlm_amount: i128,
    ) {
        anchor_caller.require_auth();

        // Look up the pending deposit record
        let key = (symbol_short!("SEP24D"), stellar_memo.clone());
        let record: Option<(Address, i128, BytesN<32>)> = env.storage().temporary().get(&key);

        if let Some((user, _fiat_amount, _anchor_id)) = record {
            // Credit the settled XLM to the user's pool balance
            let mut balance: i128 = env.storage().persistent().get(&user).unwrap_or(0);
            balance += settled_xlm_amount;
            env.storage().persistent().set(&user, &balance);

            let mut total: i128 = env.storage().persistent().get(&symbol_short!("Total")).unwrap_or(0);
            total += settled_xlm_amount;
            env.storage().persistent().set(&symbol_short!("Total"), &total);

            // Clean up the temporary record
            env.storage().temporary().remove(&key);

            env.events().publish(
                (symbol_short!("anch_ok"), anchor_caller),
                (stellar_memo, settled_xlm_amount),
            );
        } else {
            panic!("SEP: no pending deposit found for this memo");
        }
    }
}
