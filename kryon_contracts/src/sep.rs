//! SEP-24 / SEP-31 Anchor Integration Helper Types for Kryon Network.
//!
//! This module provides shared types and utilities for the SEP (Stellar Ecosystem Proposal)
//! anchor integration implemented in lib.rs.
//!
//! SEP-24: Interactive anchor deposit/withdrawal (user opens a hosted iframe
//!         on the anchor's web app to supply bank details, then the anchor
//!         settles on Stellar with a memo that matches the Kryon contract record).
//!
//! SEP-31: Direct cross-border payment (sending anchor → Stellar → receiving anchor),
//!         used for B2B invoice payment corridors (e.g. PHP → XLM → USD).
//!
//! Reference: https://stellar.org/developers/stellar-ecosystem-proposals

use soroban_sdk::{contracttype, Symbol};

/// Supported fiat currency codes for SEP anchor flows.
/// Corresponds to ISO 4217 3-letter codes.
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum FiatCurrency {
    /// Philippine Peso
    PHP,
    /// US Dollar
    USD,
    /// Euro
    EUR,
    /// British Pound
    GBP,
    /// Indonesian Rupiah
    IDR,
    /// Singapore Dollar
    SGD,
}

/// The direction of a SEP-24 flow.
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum Sep24Direction {
    /// User deposits fiat → receives XLM in Kryon pool
    Deposit,
    /// User withdraws XLM from Kryon pool → receives fiat
    Withdrawal,
}

/// Compact status record for a SEP-24 transaction stored temporarily on-chain.
#[contracttype]
#[derive(Clone)]
pub struct Sep24Record {
    /// SEP-24 transaction direction
    pub direction: Sep24Direction,
    /// Fiat amount in smallest unit (e.g. centavos for PHP, cents for USD)
    pub fiat_amount: i128,
    /// XLM amount (in stroops: 1 XLM = 10_000_000 stroops)
    pub xlm_amount: i128,
    /// Ledger sequence when this record was created
    pub created_at: u32,
    /// Whether the anchor has confirmed settlement
    pub settled: bool,
}

/// Compact record for a SEP-31 cross-border payment.
#[contracttype]
#[derive(Clone)]
pub struct Sep31Record {
    /// Amount in sending currency (smallest unit)
    pub sending_amount: i128,
    /// Amount in receiving currency (smallest unit, filled at settlement)
    pub receiving_amount: i128,
    /// Ledger sequence when the payment was initiated
    pub created_at: u32,
    /// Whether the receiving anchor has confirmed delivery
    pub delivered: bool,
}
