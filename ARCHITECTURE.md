# Kryon v2: Zero Knowledge Architecture & Roadmap

Kryon v2 transforms the existing invoice factoring platform into a comprehensive, privacy-preserving, decentralized finance powerhouse. Built for the Stellar DoraHacks competition, this architecture leverages the bleeding-edge capabilities of **Stellar Protocol 25/26** combined with **Noir**, **Barretenberg**, and a suite of advanced cryptographic primitives to deliver a production-ready Zero Knowledge ecosystem.

---

## 1. Zero Knowledge Framework

Kryon utilizes a hybrid proving architecture:
- **Off-Chain Proving:** Heavy computational lifting is done off-chain by the borrower's client using **Noir** (compiling to **Barretenberg** backend for PLONK/Groth16 proofs) or **Circom/snarkJS** where specialized legacy circuits are needed.
- **On-Chain Verification:** Soroban smart contracts serve exclusively as verifiers, minimizing gas costs and leveraging Stellar's native cryptographic host functions.

### Supported Proving Systems
- **Primary:** Noir (PLONK / Groth16) for business logic circuits.
- **Secondary:** Arkworks / Halo2 for complex aggregated proofs (Proof of Solvency, ZKML).
- **zkVM Integration:** Future readiness for RISC Zero/SP1 for arbitrary Rust execution proofs.

---

## 2. Stellar Protocol 25/26 Integration

Kryon deeply integrates Stellar's newest cryptographic capabilities:
- **BN254 Elliptic Curve Operations:** Used natively in Soroban for cheap Groth16/PLONK verification.
- **Poseidon / Poseidon2 Hashing:** Efficient on-chain state commitments and Merkle tree verification.
- **Scalar Field Arithmetic & Multi-Scalar Multiplication:** For native on-chain curve checks and cryptographic note generation.

---

## 3. Cryptographic Building Blocks

To ensure the system is modular and reusable, Kryon is built on the following primitives:
- **Incremental Merkle Trees:** For maintaining global state of factored invoices and valid credentials.
- **Nullifier Registry:** To prevent double-spending of invoices and replay attacks.
- **Poseidon Commitments:** Creating blinding factors to hide invoice amounts and borrower identities.
- **Recursive Proof Aggregation:** Batching multiple invoice proofs into a single verify transaction to save gas.

---

## 4. Core Features & ZK Modules

### A. Confidential Factoring & Private Invoicing
*Problem:* Businesses do not want to publicly reveal their clients, invoice amounts, or financial distress.
*Solution:* **Shielded Invoice Factoring**.
1. Borrower fetches invoice from ERPNext.
2. Borrower generates a ZK Proof (using Noir) proving:
   - Invoice outstanding amount > requested advance.
   - Invoice is digitally signed by trusted ERP oracle.
   - Invoice has not been factored before (Nullifier generation).
3. The Soroban contract verifies the proof and deposits a **Shielded Stablecoin** (e.g., private USDC variant) or native XLM to a Stealth Address.

### B. Digital Identity & Verifiable Credentials
*Problem:* KYC/AML compliance is required for liquidity providers, but revealing identity on-chain is a privacy risk.
*Solution:* **Anonymous Credentials & Sybil Resistance**.
- LPs use W3C Verifiable Credentials to prove they are accredited investors or KYC compliant without revealing *who* they are.
- Soroban verifies the ZK proof of the credential signature against a trusted issuer's public key.

### C. Proof of Solvency & Liquidity Pool Integrity
*Problem:* Liquidity providers need assurance that the protocol is solvent without revealing individual borrower debts.
*Solution:* **ZK Proof of Solvency**.
- The protocol generates a daily zk-SNARK proving that `Total Protocol Assets > Total LP Liabilities`.

### D. Stealth Addresses & One-Time Payments
*Problem:* Address reuse links borrowing activity.
*Solution:* Funds are disbursed to cryptographically derived one-time stealth addresses, ensuring on-chain anonymity.

---

## 5. Security & Performance Optimization

### Security Mechanisms
- **Strict Nullifier Checks:** Prevents double-factoring the same invoice.
- **Replay Protection:** Incorporating `env.ledger().sequence()` and unique nonces into circuit public inputs.
- **Threshold Cryptography:** Multi-sig escrow controlled by DAO governance for large liquidations.

### Soroban Optimizations
- Verification gas costs are minimized by using native `verify_sig` and BN254 host functions.
- Merkle paths are verified efficiently using Poseidon hashes.
- Proof compression allows handling larger state transitions with minimal byte payloads.

---

## 6. Implementation Roadmap

### Phase 1: Core ZK Verification (Current)
- [x] Set up Noir project structure (`kryon_zk`).
- [x] Write Noir circuit for Invoice Integrity (`outstanding_amount > advance`).
- [x] Integrate Soroban ZK Verifier stub.

### Phase 2: Privacy & Identity
- [ ] Implement Poseidon-based Merkle Tree for Shielded Accounts.
- [ ] Create Nullifier registry in Soroban to prevent double-spending.
- [ ] Implement ZK KYC (Proof of Accredited Investor).

### Phase 3: Advanced Ecosystem
- [ ] Deploy Shielded Pool Contract for confidential XLM/USDC transfers.
- [ ] Implement Proof of Solvency circuit.
- [ ] Finalize DoraHacks presentation, architecture diagrams, and benchmark tests.
