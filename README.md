# Kryon Network 🛡️

![Kryon Logo](public/logo.svg)

**A decentralized invoice factoring and liquidity provision protocol powered by Stellar, Soroban Smart Contracts, Zero-Knowledge (ZK) Cryptography, and ZKML Risk Assessment.**

---

## 🛑 The Problem

Small to Medium Businesses (SMBs) consistently face crippling cash flow bottlenecks due to standard Net-30, Net-60, or Net-90 invoice payment terms. Traditional invoice factoring is heavily centralized, opaque, painfully slow, and predatory—often charging exorbitant fees and requiring massive amounts of manual paperwork, invasive background audits, and extensive credit checks. Because legacy factoring companies possess all the leverage, SMBs are forced to leak proprietary trade secrets, supplier lists, and pricing data to third-party underwriters.

## 💡 The Kryon Solution

Kryon revolutionizes SMB financing by bringing invoice factoring entirely on-chain while preserving complete corporate privacy. By leveraging cutting-edge **Noir Zero-Knowledge (ZK) Proofs** and **EZKL Machine Learning Models (ZKML)**, Kryon allows businesses to tokenize their open invoices in a fully trustless and private manner. Liquidity Providers (LPs) supply capital (XLM) to a decentralized Soroban Treasury, earning a reliable yield as borrowers factor their invoices safely and securely.

---

## 📖 Real-World Scenario: Sarah's Supply Co.

**The Problem:**
Sarah runs a mid-sized lumber supply company. She just landed a massive $50,000 contract with a major corporate construction firm and delivered the materials immediately. However, the corporate firm operates on strict **Net-90 terms**—meaning Sarah won't see a dime of that $50,000 for three months. Meanwhile, she needs cash *today* to pay her employees, buy more inventory, and keep the lights on. Traditional banks deny her a loan because she lacks years of credit history, and legacy factoring companies want to charge her 15% in fees and spend weeks auditing her books.

**How Kryon Solves It:**
1. **Instant Connection:** Sarah connects her company's ERP (ERPNext, Stripe, or QuickBooks) to Kryon via OAuth.
2. **Total Privacy (ZK Identity):** Kryon mathematically proves Sarah's corporate identity and compliance without storing sensitive physical IDs on a central server.
3. **Confidential Proof of Integrity:** Kryon's **Noir ZK Engine** mathematically proves that the $50,000 invoice is real, digitally signed, and untampered with—without leaking the corporate client's name or proprietary pricing to the public Stellar ledger.
4. **Unbiased ZKML AI:** Kryon's **EZKL AI Oracle** evaluates her business history and the invoice data, generating a low-risk score and proving the AI inference on-chain via a Halo2 zk-SNARK.
5. **Immediate Liquidity:** The Soroban smart contract on the Stellar network instantly verifies the cryptography and releases $45,000 (90%) worth of XLM directly to Sarah's Freighter wallet within 5 seconds.
6. **The Outcome:** Sarah makes payroll today. In 90 days, when the corporate firm pays the invoice, the Soroban contract routes the remaining 10% (minus a small, transparent protocol fee) back to Sarah, while Liquidity Providers earn yield on the transaction.

---

## 🏗 Comprehensive System Architecture

The architecture of Kryon is highly complex and divided into several decoupled, trustless microservices and execution environments. This separation ensures that no single point of failure can compromise the privacy or funds of the users.

```mermaid
graph TD
    %% Core Entities
    SMB["🏢 Borrower (SMB)"]
    LP["💧 Liquidity Providers"]
    ERP["🗄️ ERP Systems (ERPNext, Stripe, QuickBooks)"]

    %% Kryon Network Components
    subgraph Kryon Network
        App["💻 Kryon Frontend (Next.js Edge)"]
        Persist["💽 KV Store (Vercel KV / Persistent Identifiers)"]
        Noir["⚡ Noir ZK Engine (Groth16/Barretenberg Backend)"]
        EZKL["🧠 ZKML AI Engine (PyTorch -> Halo2 SNARK)"]
        SC["⛓️ Soroban Smart Contracts (Rust / WASM)"]
        Oracle["🔗 Price Oracle (CoinGecko Fiat-to-XLM)"]
    end

    %% LP Flow
    LP -- "1. Deposits XLM" --> SC
    
    %% Identity Flow
    SMB -- "2a. ZK Identity Verification" --> App
    App -- "2b. Generate Local ZK Proof" --> Persist
    
    %% Factoring Flow
    SMB -- "3. Connects Wallet & Selects Invoice" --> App
    App -- "4. OAuth/API Fetch Invoice Data" --> ERP
    ERP -- "5. Returns Signed Payload" --> App
    
    %% Cryptographic Pipeline
    App -- "6a. Request Integrity Proof (Noir)" --> Noir
    Noir -- "7a. Return Noir zk-SNARK Proof" --> App
    
    App -- "6b. Request AI Risk Score (ZKML)" --> EZKL
    EZKL -- "7b. Return Halo2 zk-SNARK Proof" --> App
    
    %% Smart Contract Execution
    App -- "8. fetch live fiat conversion" --> Oracle
    Oracle -- "9. returns XLM/USD rate" --> App
    
    App -- "10. submit_zk_factoring(proofs, hash)" --> SC
    SC -- "11. Verify Cryptography via Precompiles" --> SC
    SC -- "12. Escrow Release (XLM)" --> SMB

    %% Styling
    classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px,color:#000
    classDef contract fill:#e0f7fa,stroke:#006064,stroke-width:2px,color:#000
    classDef backend fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
    classDef ai fill:#fce4ec,stroke:#880e4f,stroke-width:2px,color:#000
    classDef external fill:#f3e5f5,stroke:#4a148c,stroke-width:2px,color:#000
    classDef storage fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#000

    class SC contract
    class Noir backend
    class EZKL ai
    class ERP external
    class Persist storage
    class Oracle external
```

### Detailed Component Breakdown:
1. **The Client Frontend (Next.js, Tailwind, Zustand):** The gateway to the protocol. Handles the Freighter wallet connection, manages persistent ZK identity state across devices, and bridges the gap between external APIs and the blockchain. 
2. **Persistent KV Store:** A high-speed caching and persistence layer (using platforms like kvdb.io/Vercel KV) ensuring that a user's ZK identity verification is maintained across devices and sessions without requiring re-computation.
3. **The Noir ZK Backend Orchestrator (Node.js):** Generates ACVM execution traces and handles the heavy lifting of proving that an invoice matches the ERP signature. The resulting SNARK is a mathematical guarantee of the invoice's authenticity.
4. **The ZKML EZKL Microservice (Python/PyTorch):** Translates a trained PyTorch model for risk assessment into a provable Halo2 circuit. It evaluates variables like invoice age, client history, and amount to assign an unbiased risk score, outputting both the score and a SNARK proving the evaluation was untampered.
5. **Soroban Smart Contracts (Rust):** The absolute source of truth. Acts as the escrow pool and liquidity treasury. It takes the submitted ZK Proofs, uses Stellar's native capabilities to verify them, and atomically executes the XLM transfer based on real-time Oracle pricing.

---

## ⚔️ Feature Comparison: With ZK vs. Without ZK

Zero-Knowledge technology is not just a buzzword for Kryon; it is the fundamental building block that allows institutional-grade invoice factoring to occur on a transparent, public ledger.

| Protocol Feature | ❌ Without Zero-Knowledge | 🛡️ With Zero-Knowledge (Kryon) | How ZK Improves It |
| :--- | :--- | :--- | :--- |
| **Invoice Integrity Verification** | Requires uploading raw invoices directly to a smart contract or third-party centralized auditor. | Generates a Groth16/Halo2 SNARK off-chain. Only the cryptographic proof is submitted to Soroban. | **Total Privacy:** Competitors cannot see your corporate clients, contract sizes, or proprietary margins on the public blockchain. |
| **Credit Risk Assessment** | Requires a human loan officer to manually review the company's books, or uses a black-box AI model hosted by a central authority that could be biased. | A PyTorch model executes inside a Halo2 circuit (ZKML), generating a verifiable proof of the exact inference. | **Unbiased & Trustless:** Borrowers can cryptographically verify that they were evaluated using the exact same risk model as everyone else. No hidden biases or manual tampering. |
| **Identity & KYC** | Requires users to upload passports and tax IDs to a central database (honeypot for hackers). | User generates a localized ZK Identity Proof that confirms they possess valid compliance signatures without revealing the data. | **Security:** Eliminates data breach risks. The protocol confirms compliance (e.g., Age > 18, Business License valid) without ever touching the actual data. |
| **Protocol Solvency** | LPs must blindly trust the protocol operators, or auditors must publish the full ledger of all active factored invoices. | Protocol runs a batch ZK proof aggregating all outstanding liabilities vs. the Soroban treasury balance. | **Transparent Solvency:** LPs get cryptographic assurance that their yield is backed by real assets 24/7 without exposing the specific underlying loans. |
| **Factoring Approval Speed** | Takes weeks due to manual reviews, legal paperwork, and human underwriters verifying client integrity. | Takes < 15 seconds to compile the circuit, generate the witness, create the SNARK, and submit to the Soroban contract. | **Hyper-efficiency:** The mathematical certainty of ZK removes the need for human trust, enabling instant atomic settlement. |

---

## 🌟 Comprehensive Protocol Capabilities

### 1. Unified Liquidity Provision (LP)
- Users can connect their Freighter wallet and deposit native XLM into the decentralized Soroban Treasury pool.
- The UI handles fetching the current Total Value Locked (TVL) directly from the Stellar Testnet ledger.
- LPs earn a passive APY derived from the transparent protocol fees charged on successful invoice factoring settlements.

### 2. Multi-ERP Connection Matrix
- **Seamless Integrations:** Kryon includes a specialized modal to natively connect to major ERP systems.
- **Stripe & QuickBooks:** Connects via standard API tokens.
- **ERPNext Integration:** Features an auto-fill sandbox environment (Vertigral's ERP) for seamless testing. By fetching live, unpaid invoices via API (`/api/resource/Sales Invoice`), Kryon prevents double-factoring and fraudulent invoice creation.

### 3. ZK Identity Locking & Persistence
- Before a borrower can pledge an invoice or an LP can deposit funds, they must execute a ZK Identity Verification.
- **Cross-Device Persistence:** The generated verification status is securely posted to a persistent Key-Value database mapping the wallet address. This means the user's status is preserved across device swaps or long-term absences.
- **Strict UI Guards:** The UI is explicitly designed to lock interactions, providing instructional prompts to reverify if the user attempts unauthorized actions.

### 4. Real-time Asset Oracles
- Invoices are denominated in fiat (e.g., PHP, USD, EUR), but Soroban payouts occur in XLM.
- Kryon utilizes live integration with CoinGecko's V3 API to constantly poll the exact conversion rate, dynamically calculating the XLM payout required to cover 90% of the fiat invoice value in real-time.

---

## 🛠 Complete Installation & Setup Guide

To run the entire suite locally (Frontend, ZK Backend, and Smart Contracts), ensure you follow these instructions precisely.

### Prerequisites
1. **Node.js**: `v20.0.0` or higher (Required for Next.js and Noir Backend)
2. **Rust**: `rustc 1.70.0+` with the `wasm32-unknown-unknown` target installed.
3. **Soroban CLI**: `stellar-cli v22.0.0+` for smart contract compilation and deployment.
4. **Python**: `3.10+` (Required if you wish to recompile the EZKL PyTorch circuits).
5. **Freighter Wallet**: The official browser extension installed and set to **Testnet**.

### Phase 1: Deploying the Soroban Smart Contracts
The backend heart of the protocol runs on Stellar's smart contract environment.

```bash
cd kryon_contracts

# Build the Rust contract into WASM
soroban contract build

# Run the comprehensive test suite
cargo test

# Deploy to Testnet (Ensure you have a funded identity setup in stellar-cli)
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/kryon_escrow.wasm \
  --source admin_wallet \
  --network testnet
```
*Note the output Contract ID. You will need to plug this into your frontend environment variables.*

### Phase 2: Starting the Noir ZK Orchestrator
The orchestrator is a dedicated Node.js microservice handling the heavy Barretenberg proving logic for invoice integrity.

```bash
cd kryon_backend_orchestrator

# Install dependencies
npm install

# Start the orchestrator service on port 8000
npm start
```

### Phase 3: Launching the Frontend Application
The Next.js application serves as the primary gateway.

```bash
cd frontend

# Install UI and protocol dependencies
npm install

# Set up your environment variables
cp .env.example .env.local
```
**Required `.env.local` Variables:**
```env
NEXT_PUBLIC_SOROBAN_CONTRACT_ID="<YOUR_CONTRACT_ID>"
NEXT_PUBLIC_ORACLE_URL="http://localhost:8000"
KV_REST_API_URL="<YOUR_KVDB_URL_OR_VERCEL_KV_URL>"
```

```bash
# Launch the development server
npm run dev
```

Visit `http://localhost:3000` in your browser. Ensure your Freighter wallet is unlocked, set to Testnet, and funded with test XLM from the Stellar laboratory faucet.

---

## 🏗️ Hackathon Status & Transparency (Honest WIP)

Because Kryon is a highly ambitious protocol encompassing Zero-Knowledge machine learning, frontend WASM generation, and smart contracts, we utilized a few architectural adaptations to ensure a smooth hackathon presentation:
- **ZK Identity Generation:** Real Noir circuit compilation and proving in the browser takes ~15 seconds. For the live UI demo, the identity verification button visually simulates this exact execution delay, utilizing a remote Key-Value database to persist your verified status across devices instead of fully computing a 50MB WASM proof.
- **EZKL ZKML Engine:** The microservice successfully executes a PyTorch evaluation, but dynamically generating a Halo2 zk-SNARK for *every* invoice takes too much server RAM for standard free-tier hosting.
- **Noir Oracle Fallback:** The Vercel frontend natively connects to a Node.js orchestrator (`kryon_backend_orchestrator`) for Groth16 Noir invoice proofs. If the orchestrator server goes to sleep, the frontend API route intercepts timeouts and returns a securely-formatted mock payload to ensure the Soroban pipeline doesn't crash during live demos.
- **Soroban Verification:** Currently, Soroban lacks native precompiles for extremely cheap Halo2/Groth16 verification on-chain. The `KryonEscrow` smart contract currently mocks the final cryptographic verification boolean check before releasing liquidity until protocol-level precompiles are fully integrated into Stellar.

---

## 📄 License
This project is licensed under the **MIT License**.
