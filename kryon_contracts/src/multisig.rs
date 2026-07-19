//! Multi-signature approval module for Kryon Network.
//!
//! Implements an M-of-N threshold multi-party approval system for privileged
//! treasury operations (large withdrawals, parameter changes, contract upgrades).
//!
//! Design:
//! - An admin registers a set of N authorized signers and a threshold M.
//! - Any signer can propose a transaction (identified by a unique action hash).
//! - Each signer independently calls `approve_action` to register their vote.
//! - Once M approvals are reached, `execute_action` can be called to unlock execution.
//! - Executed or cancelled proposals cannot be re-used (replay protection via nullifier).
//!
//! This replaces single-admin `require_auth()` for high-value operations.

use soroban_sdk::{contracttype, symbol_short, Address, BytesN, Env, Vec};

// ── Storage Keys ──────────────────────────────────────────────────────────────

/// Key: stores the list of authorized signer addresses
const SIGNERS_KEY: soroban_sdk::Symbol = symbol_short!("SIGNERS");
/// Key: stores the approval threshold M
const THRESHOLD_KEY: soroban_sdk::Symbol = symbol_short!("THRESH");

/// Per-proposal storage key: (action_id) → MultiSigProposal
#[contracttype]
#[derive(Clone)]
pub struct ProposalKey {
    pub action_id: BytesN<32>,
}

// ── Data Types ────────────────────────────────────────────────────────────────

/// Status of a multi-sig proposal
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum ProposalStatus {
    /// Proposal is open and accepting approvals
    Pending,
    /// Proposal has reached threshold and has been executed
    Executed,
    /// Proposal was cancelled by the original proposer
    Cancelled,
}

/// A multi-sig proposal record stored on-chain
#[contracttype]
#[derive(Clone)]
pub struct MultiSigProposal {
    /// The address that originally proposed this action
    pub proposer: Address,
    /// Human-readable action description hash (Keccak/SHA256 of payload)
    pub action_id: BytesN<32>,
    /// List of signers who have already approved this proposal
    pub approvals: Vec<Address>,
    /// Current status
    pub status: ProposalStatus,
    /// Ledger sequence at proposal creation (for expiry checks)
    pub created_at: u32,
}

// ── Public Interface ──────────────────────────────────────────────────────────

/// Initialize the multi-sig registry.
/// Must be called once by the bootstrapping admin.
/// `signers`: the N authorized signer addresses.
/// `threshold`: minimum approvals M required to execute.
pub fn init_multisig(env: &Env, admin: &Address, signers: Vec<Address>, threshold: u32) {
    admin.require_auth();

    if env.storage().instance().has(&SIGNERS_KEY) {
        panic!("MultiSig: already initialized");
    }

    let n = signers.len();
    if threshold == 0 || threshold > n {
        panic!("MultiSig: threshold must be between 1 and number of signers");
    }
    if n > 10 {
        panic!("MultiSig: maximum 10 signers supported");
    }

    env.storage().instance().set(&SIGNERS_KEY, &signers);
    env.storage().instance().set(&THRESHOLD_KEY, &threshold);
}

/// Propose a new multi-sig action.
/// `proposer` must be one of the registered signers.
/// `action_id` is a unique 32-byte identifier for this action (e.g. SHA256 of payload).
/// The proposer's approval is automatically counted.
pub fn propose_action(env: &Env, proposer: &Address, action_id: BytesN<32>) {
    proposer.require_auth();
    assert_is_signer(env, proposer);

    let key = ProposalKey { action_id: action_id.clone() };

    if env.storage().persistent().has(&key) {
        panic!("MultiSig: proposal already exists for this action_id");
    }

    let mut approvals: Vec<Address> = Vec::new(env);
    approvals.push_back(proposer.clone());

    let proposal = MultiSigProposal {
        proposer: proposer.clone(),
        action_id: action_id.clone(),
        approvals,
        status: ProposalStatus::Pending,
        created_at: env.ledger().sequence(),
    };

    env.storage().persistent().set(&key, &proposal);

    env.events().publish(
        (symbol_short!("ms_prop"), proposer.clone()),
        action_id,
    );
}

/// Register an approval from a signer for an existing proposal.
/// Each signer can only approve once. When threshold is reached the proposal
/// status does NOT auto-execute — the caller must invoke `execute_action` separately
/// so the actual treasury call can be made in the same transaction.
pub fn approve_action(env: &Env, signer: &Address, action_id: BytesN<32>) {
    signer.require_auth();
    assert_is_signer(env, signer);

    let key = ProposalKey { action_id: action_id.clone() };
    let mut proposal: MultiSigProposal = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| panic!("MultiSig: proposal not found"));

    if proposal.status != ProposalStatus::Pending {
        panic!("MultiSig: proposal is no longer pending");
    }

    // Check signer has not already approved
    for existing in proposal.approvals.iter() {
        if existing == *signer {
            panic!("MultiSig: signer has already approved this proposal");
        }
    }

    proposal.approvals.push_back(signer.clone());
    env.storage().persistent().set(&key, &proposal);

    env.events().publish(
        (symbol_short!("ms_appr"), signer.clone()),
        action_id,
    );
}

/// Verify that a proposal has reached threshold and mark it as executed.
/// Returns `true` if execution is authorized and was just unlocked.
/// Panics if threshold not yet met or proposal already executed/cancelled.
///
/// The calling function (e.g. `withdraw_multisig`) must call this first,
/// then perform the privileged operation atomically in the same invocation.
pub fn execute_action(env: &Env, caller: &Address, action_id: BytesN<32>) -> bool {
    caller.require_auth();

    let key = ProposalKey { action_id: action_id.clone() };
    let mut proposal: MultiSigProposal = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| panic!("MultiSig: proposal not found"));

    if proposal.status != ProposalStatus::Pending {
        panic!("MultiSig: proposal already executed or cancelled");
    }

    let threshold: u32 = env
        .storage()
        .instance()
        .get(&THRESHOLD_KEY)
        .unwrap_or_else(|| panic!("MultiSig: not initialized"));

    if proposal.approvals.len() < threshold {
        panic!("MultiSig: threshold not reached ({} of {} approvals)", proposal.approvals.len(), threshold);
    }

    proposal.status = ProposalStatus::Executed;
    env.storage().persistent().set(&key, &proposal);

    env.events().publish(
        (symbol_short!("ms_exec"), caller.clone()),
        action_id,
    );

    true
}

/// Cancel a pending proposal. Only the original proposer can cancel.
pub fn cancel_action(env: &Env, proposer: &Address, action_id: BytesN<32>) {
    proposer.require_auth();

    let key = ProposalKey { action_id: action_id.clone() };
    let mut proposal: MultiSigProposal = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| panic!("MultiSig: proposal not found"));

    if proposal.proposer != *proposer {
        panic!("MultiSig: only the proposer can cancel");
    }
    if proposal.status != ProposalStatus::Pending {
        panic!("MultiSig: proposal is not pending");
    }

    proposal.status = ProposalStatus::Cancelled;
    env.storage().persistent().set(&key, &proposal);
}

/// Read a proposal record (view function).
pub fn get_proposal(env: &Env, action_id: BytesN<32>) -> MultiSigProposal {
    let key = ProposalKey { action_id };
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| panic!("MultiSig: proposal not found"))
}

/// Read the current approval count for a proposal.
pub fn get_approval_count(env: &Env, action_id: BytesN<32>) -> u32 {
    let key = ProposalKey { action_id };
    let proposal: MultiSigProposal = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| panic!("MultiSig: proposal not found"));
    proposal.approvals.len()
}

/// Get the configured threshold.
pub fn get_threshold(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&THRESHOLD_KEY)
        .unwrap_or(0)
}

/// Get the registered signer list.
pub fn get_signers(env: &Env) -> Vec<Address> {
    env.storage()
        .instance()
        .get(&SIGNERS_KEY)
        .unwrap_or_else(|| Vec::new(env))
}

// ── Internal Helpers ──────────────────────────────────────────────────────────

/// Assert that `addr` is a registered signer. Panics otherwise.
fn assert_is_signer(env: &Env, addr: &Address) {
    let signers: Vec<Address> = env
        .storage()
        .instance()
        .get(&SIGNERS_KEY)
        .unwrap_or_else(|| panic!("MultiSig: not initialized"));

    for signer in signers.iter() {
        if signer == *addr {
            return;
        }
    }
    panic!("MultiSig: caller is not a registered signer");
}
