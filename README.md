# Kryon Network 🛡️

![Kryon Logo](public/logo.svg)

**A decentralized invoice factoring and liquidity provision protocol powered by Stellar, Soroban Smart Contracts, Zero-Knowledge (ZK) Cryptography, and ZKML Risk Assessment.**

---

## 🛑 The Problem
Small to Medium Businesses (SMBs) consistently face crippling cash flow bottlenecks due to standard Net-30, Net-60, or Net-90 invoice payment terms. Traditional invoice factoring is heavily centralized, opaque, painfully slow, and predatory—often charging exorbitant fees and requiring massive amounts of manual paperwork and credit checks.

## 💡 The Solution

Kryon revolutionizes SMB financing by bringing invoice factoring on-chain. By leveraging cutting-edge **Noir Zero-Knowledge (ZK) Proofs** and **EZKL Machine Learning Models**, Kryon allows businesses to tokenize their open invoices in a fully trustless and private manner.

### How ZK is Used in Kryon:
- **Privacy Preservation**: Invoices contain highly sensitive business logic (client names, pricing). ZK allows the SMB to prove they hold a valid invoice without publishing details to the public ledger.
- **ZKML Risk Assessment**: AI dynamically scores default risk using an EZKL PyTorch model. The generated zk-SNARK proves that the AI model ran correctly and wasn't tampered with, allowing the Soroban Smart Contract to execute loan parameters trustlessly.
- **On-chain Verification**: The generated ZK SNARKs are submitted to a Soroban Smart Contract, which natively verifies the proof. This completely removes the need for centralized credit agencies or manual auditors.

---

## 🏗 System Architecture

The architecture is divided into three highly decoupled trustless systems: the Client, the ZK Proving Engines, and the Soroban Smart Contracts.

```mermaid
sequenceDiagram
    participant SMB as 🏢 SMB (Borrower)
    participant ERP as 🗄️ ERP / Stripe
    participant App as 💻 Kryon Frontend
    participant Noir as ⚡ Noir ZK Engine
    participant EZKL as 🧠 ZKML Microservice
    participant SC as ⛓️ Soroban Contract

    SMB->>App: 1. Connects Wallet
    App->>ERP: 2. OAuth Fetch Invoices
    ERP-->>App: 3. Returns Invoice JSON
    
    rect rgb(240, 248, 255)
    Note over App, EZKL: 🛡️ Zero-Knowledge Proof Generation Phase
    App->>Noir: 4a. Request Invoice Validity Proof
    Noir-->>App: 5a. Return Noir zk-SNARK
    App->>EZKL: 4b. Request AI Risk Assessment
    EZKL-->>App: 5b. Return EZKL zk-SNARK & Score
    end
    
    App->>SC: 6. submit_zk_factoring(Proofs)
    
    rect rgb(230, 255, 230)
    Note over SC: ⛓️ Blockchain Settlement Phase
    SC->>SC: 7. Verify ZK Proofs On-Chain
    SC->>SC: 8. Spend Invoice Nullifier
    SC-->>SMB: 9. Payout XLM from Treasury
    end
```

---

## 🛡️ The Zero-Knowledge Implementation

We have implemented a comprehensive suite of Zero-Knowledge circuits to ensure total privacy, compliance, and security across the protocol:

### 1. Confidential Invoice Factoring (`invoice_proof`)
Proves that a borrower holds a valid, digitally signed invoice from an ERP without leaking the corporate client's data or identity.

### 2. ZKML AI Risk Assessment (`zkml_risk_model`)
Uses **EZKL** to compile a PyTorch Neural Network into a Halo2 circuit. It evaluates the invoice amount and borrower history, generating a risk score and a cryptographic proof that the exact AI model was used without tampering.

### 3. Digital Identity & Verifiable Credentials (`kyc_proof` & `age_proof`)
Verifies compliance (Proof of Accredited Investor, Age > 18) by checking cryptographic signatures against a trusted issuer's public key inside the circuit (Sybil resistance).

### 4. Proof of Solvency (`solvency_proof`)
Generates a zk-SNARK proving that `Total Protocol Assets > Total LP Liabilities`, assuring Liquidity Providers that the protocol is healthy without revealing trade secrets.

---

## 🌟 Key Features
- **Live ERP Integration**: Direct, secure OAuth fetches to live ERP systems (e.g. ERPNext, Stripe).
- **Dynamic Fiat-to-XLM Oracles**: Integrates real-time CoinGecko price oracles to instantly convert the live invoice fiat value into XLM.
- **Deep Treasury Liquidity**: Our testnet Soroban Treasury maintains a pooled balance of >100,000 XLM, instantly releasing liquidity.
- **Soroban Verification**: Ensures all logic is enforced transparently and immutably on the Stellar blockchain.

---

## 📸 App Gallery

| Wallet Connected | ZK Factoring Process | Settlement Complete |
| :---: | :---: | :---: |
| ![Balance](public/Balance%20+%20Wallet%20Connected.png) | ![Transaction](public/Transaction.png) | ![Success](public/Successful%20Transaction.png) |

---

## 📅 Development Timeline
- **Phase 1 (Current)**: Full React Next.js frontend, ERP integrations, Noir ZK Proof flow, EZKL ZKML models, and real-time XLM payouts.
- **Phase 2 (Protocol 26 Rollout)**: Full deployment of native ZK verifier host functions directly into Soroban, dropping the Oracle for fully decentralized verification.
- **Phase 3 (Mainnet Launch)**: Production deployment on Stellar Mainnet, integrating USDC for stablecoin factoring, and full DAO governance.

---

## 🛠 Prerequisites & Running Locally

1. **Node.js**: `v20.0.0` or higher
2. **Rust**: `rustc 1.70.0` (with `wasm32-unknown-unknown` target)
3. **Soroban CLI**: `stellar-cli v22.0.0+`
4. **Python 3.10+**: For EZKL ZKML circuit compilation.

### The Frontend & ZK Backend
```bash
cd frontend
npm install
npm run dev
```

### The EZKL ZKML Microservice
```bash
cd kryon_zk/zkml_risk_model
pip install -r requirements.txt
uvicorn app:app --reload
```

### The Soroban Smart Contracts
```bash
cd kryon_contracts
soroban contract build
cargo test
```

## 📄 License
This project is licensed under the **MIT License**.
