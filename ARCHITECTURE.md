# Kryon v2: Zero Knowledge Architecture & Roadmap

Kryon v2 transforms the existing invoice factoring platform into a comprehensive, privacy-preserving, decentralized finance powerhouse. Built for the Stellar DoraHacks competition, this architecture leverages the bleeding-edge capabilities of **Stellar Protocol 25/26** combined with **Noir**, **Barretenberg**, **EZKL (ZKML)**, and a suite of advanced cryptographic primitives to deliver a production-ready Zero Knowledge ecosystem.

---

## 1. Zero Knowledge Framework

Kryon utilizes a multi-engine, hybrid proving architecture:

### A. The Proving Engines (Off-Chain)
Heavy computational lifting is done off-chain by specialized cryptographic engines depending on the required task:
- **Noir (Barretenberg Backend):** Used for standard programmatic logic (Invoice Identity, Age, KYC, Solvency). Compiles to PLONK/Groth16 proofs.
- **EZKL (Halo2 Backend):** Used exclusively for **Zero-Knowledge Machine Learning (ZKML)**. Compiles PyTorch Neural Networks into Halo2 circuits to mathematically prove that an AI Risk Assessment Model was executed correctly on the exact invoice data without tampering.

### B. The Verifiers (On-Chain)
Soroban smart contracts serve exclusively as verifiers, minimizing gas costs and leveraging Stellar's native cryptographic host functions.

**Supported Verification Modes:**
- **Primary (Mode 0):** Ed25519 Oracle Attestation via Node.js Orchestrator & Render ZKML Microservice. Secure, cheap, and ready for mainnet today using native `ed25519_verify`.
- **Secondary (Mode 1):** Arkworks / Halo2 WASM execution in Soroban. Mathematically verifies pure PLONK/Groth16/Halo2 proofs natively on-chain. Requires high WASM bounds and `no_std` `alloc`.
- **Production (Mode 2):** Protocol 25/26 Native ZK using built-in Soroban host functions for ultra-cheap BN254 arithmetic and native `poseidon_permutation` hash limits. Completely removes oracle reliance.

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

### A. ZKML Risk Assessment (EZKL)
*Problem:* Centralized credit agencies are slow, biased, and require full access to private corporate accounting to determine risk.
*Solution:* **On-Chain AI Risk Oracles**.
1. Borrower submits normalized invoice data (amount, borrower history score) to the EZKL Microservice.
2. The PyTorch Neural Network executes inference, outputting a highly accurate Risk Score (1-100).
3. EZKL compiles the execution trace into a Halo2 zk-SNARK.
4. Soroban verifies the Halo2 proof, guaranteeing that the Risk Score is mathematically accurate and hasn't been maliciously altered by the borrower to get a better rate.

### B. Confidential Factoring & Private Invoicing (Noir)
*Problem:* Businesses do not want to publicly reveal their clients, invoice amounts, or financial distress.
*Solution:* **Shielded Invoice Factoring**.
1. Borrower fetches invoice from ERPNext.
2. Borrower generates a ZK Proof (using Noir) proving:
   - Invoice outstanding amount > requested advance.
   - Invoice is digitally signed by trusted ERP oracle.
   - Invoice has not been factored before (Nullifier generation).
3. The Soroban contract verifies the proof and deposits funds.

### C. Digital Identity & Verifiable Credentials
*Problem:* KYC/AML compliance is required for liquidity providers, but revealing identity on-chain is a privacy risk.
*Solution:* **Anonymous Credentials & Sybil Resistance**.
- LPs use W3C Verifiable Credentials to prove they are accredited investors or KYC compliant without revealing *who* they are.
- Soroban verifies the ZK proof of the credential signature against a trusted issuer's public key.

### D. Proof of Solvency & Liquidity Pool Integrity
*Problem:* Liquidity providers need assurance that the protocol is solvent without revealing individual borrower debts.
*Solution:* **ZK Proof of Solvency**.
- The protocol generates a daily zk-SNARK proving that `Total Protocol Assets > Total LP Liabilities`.

### E. Stealth Addresses & One-Time Payments
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

### Phase 1: Core ZK Verification (Completed)
- [x] Set up Noir project structure (`kryon_zk`).
- [x] Write Noir circuit for Invoice Integrity (`outstanding_amount > advance`).
- [x] Integrate Soroban ZK Verifier (KryonVerifier using Oracle Attestation + Arkworks BN254).

### Phase 2: ZKML AI Integration (Completed)
- [x] Build PyTorch MLP for AI Risk Assessment (`kryon_zk/zkml_risk_model`).
- [x] Integrate EZKL pipeline (ONNX export, calibration, settings gen).
- [x] Deploy ZKML Python Microservice API for Next.js frontend consumption.
- [x] Generate Halo2 zk-SNARK proving honest AI inference.

### Phase 3: Privacy & Identity (Completed)
- [x] Implement Poseidon-based Merkle Tree for Shielded Accounts (MerkleMembership circuit).
- [x] Create Nullifier registry in Soroban to prevent double-spending.
- [x] Implement ZK KYC (Proof of Accredited Investor) and Age Verification.

### Phase 4: Advanced Ecosystem (Completed)
- [x] Deploy Shielded Pool Contract for confidential XLM/USDC transfers.
- [x] Implement Proof of Solvency circuit.
- [x] Finalize automated deployment script (`deploy.ps1`) and Multi-Mode verification architecture.

### Phase 5: Production Hardening (Completed)
- [x] Integrate full BN254 Protocol 25/26 Native On-Chain Pairing capabilities.
- [x] Remove centralized oracle attestation in favor of Native Poseidon Hashing.
- [x] Implement Multi-Prover compatibility (Circom + snarkJS).
- [x] Architect recursive proof aggregation pipeline for batching proofs (`kryon_zk/aggregation`).
- [x] Fully automate GitHub Actions CI pipeline and bash submission toolchains.
