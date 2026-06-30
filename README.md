# Kryon Network 🛡️

**A decentralized invoice factoring and liquidity provision protocol powered by Stellar, Soroban Smart Contracts, and Zero-Knowledge (ZK) Cryptography.**

---

## 🛑 The Problem
Small to Medium Businesses (SMBs) consistently face crippling cash flow bottlenecks due to standard Net-30, Net-60, or Net-90 invoice payment terms. Traditional invoice factoring is heavily centralized, opaque, painfully slow, and predatory—often charging exorbitant fees and requiring massive amounts of manual paperwork and credit checks.

## 💡 The Solution

Kryon revolutionizes SMB financing by bringing invoice factoring on-chain. By leveraging cutting-edge **Noir Zero-Knowledge (ZK) Proofs** to cryptographically verify live ERP data (such as ERPNext, QuickBooks, or Stripe), Kryon allows businesses to tokenize their open invoices in a fully trustless and private manner.

**How ZK is Used in Kryon:**
- **Privacy Preservation**: Invoices contain highly sensitive business logic (client names, pricing, unit quantities). ZK allows the SMB to prove they hold a valid, outstanding invoice of $X amount without ever publishing the invoice details onto the public Stellar ledger.
- **Data Authenticity**: Kryon uses ZK to verify the TLS/HTTPS responses from the ERP system (similar to DECO), proving mathematically that the API response came directly from the ERP server and was not tampered with by the borrower.
- **On-chain Verification**: The generated ZK SNARK is submitted to a Soroban Smart Contract, which natively verifies the proof. This removes the need for centralized credit agencies or manual auditors.

Once the ZK Proof is mathematically verified on-chain via **Soroban Smart Contracts**, Kryon instantly routes working capital from decentralized Liquidity Provider (LP) pools directly into the borrower's Freighter wallet.

### 🌟 Key Features
- **Live ERP Integration**: Direct, secure OAuth fetches to live ERP systems (e.g. ERPNext, Stripe).
- **Noir ZK Proofs**: Generates proofs locally that an invoice exists, has a specific value, and belongs to the borrower—without leaking the corporate client's data or identity.
- **Dynamic Fiat-to-XLM Oracles**: Integrates real-time CoinGecko price oracles to instantly convert the live invoice fiat value (like PHP or USD) into the exact equivalent amount of XLM at the exact second of factoring.
- **Deep Treasury Liquidity**: Our testnet Soroban Treasury maintains a pooled balance of >100,000 XLM, instantly releasing 90% of the invoice's market value dynamically to the borrower.
- **Soroban Verification**: Ensures all logic is enforced transparently and immutably on the Stellar blockchain.

---

## 🎯 Vision and Purpose
Our mission is to democratize access to instant working capital for businesses worldwide. By removing the traditional banking middlemen and utilizing the lightning-fast, low-fee architecture of the Stellar network, Kryon aims to establish a global, borderless factoring ecosystem that is transparent, highly liquid, and universally accessible.

---

## ⚙️ Stellar Protocol 25/26 Features Used
- **Soroban Smart Contracts**: Core logic for escrow, ZK-proof verification flow, and automated yield distribution.
- **Noir Cryptography**: Employing ultra-fast ZK SNARKs tailored for Stellar's upcoming host function capabilities.
- **Stellar Horizon Testnet**: High-liquidity testnet deployment for rapid, verifiable transaction execution.
- **Stellar SDK**: Programmatic transaction building, XDR serialization, and native asset (`XLM`) routing.
- **Freighter Wallet**: Seamless, non-custodial user authentication and transaction signing.

---

## 📅 Timeline
- **Phase 1 (Current)**: Full React Next.js 16 frontend, ERPNext API integrations, Noir ZK Proof flow, dynamic CoinGecko Oracles, Freighter Wallet integration, and real-time XLM Treasury payouts.
- **Phase 2 (Protocol 26 Rollout)**: Full deployment of native ZK verifier host functions directly into Soroban, expanding beyond signature-based simulation.
- **Phase 3 (Mainnet Launch)**: Production deployment on Stellar Mainnet, integrating USDC for stablecoin factoring, and full DAO governance roll-out.

---

## 🛠 Prerequisites
To build, test, and deploy the smart contracts locally, ensure you have the following installed:
* **Node.js**: `v20.0.0` or higher (for the frontend and orchestrator)
* **Rust**: `rustc 1.70.0` or higher
* **Target**: `wasm32-unknown-unknown`
* **Soroban CLI**: `stellar-cli` (v21.0.0 or later)
* **Nargo (Noir)**: For compiling ZK circuits.

Install the WASM target if you haven't already:
```bash
rustup target add wasm32-unknown-unknown
```

---

## 🏗 How to Build & Run
### 1. The Frontend & ZK Backend
```bash
cd frontend
npm install
npm run dev
```
The application will launch on `http://localhost:3000`.

### 2. The Smart Contracts
To compile the Soroban smart contracts into WebAssembly (WASM):
```bash
cd kryon_contracts
soroban contract build
```
This will output the `.wasm` binaries into your `target/wasm32-unknown-unknown/release/` directory.

## 🛡️ The Zero-Knowledge Implementation

Kryon uses a highly flexible, multi-mode ZK verification engine built directly into the Soroban Smart Contracts. It dynamically switches between verification strategies depending on the network's capabilities:

### Mode 0: Ed25519 Oracle Attestation (Production Default)
- **Off-chain**: The Node.js Orchestrator uses `@aztec/bb.js` to compile the Noir circuits, generate a real `Barretenberg` Groth16 proof, and calculate the exact BN254 `poseidonHash`. If the proof is valid, the Oracle signs the `msg_hash` with its secure Ed25519 key.
- **On-chain**: Soroban uses its highly optimized, native `env.crypto().ed25519_verify()` to validate the Oracle's signature. This allows Kryon to operate securely and cheaply on the Stellar Mainnet *today*, bypassing current WASM budget limitations.

### Mode 1: Arkworks WASM Verifier (Option C)
- **Off-chain**: Generates standard Groth16 proofs.
- **On-chain**: Uses `ark-bn254` and `ark-groth16` compiled directly into the Soroban contract (`wasm32-unknown-unknown` `no_std`). The contract natively verifies the mathematical pairing of the proof on-chain. Requires high WASM instruction budgets.

### Mode 2: Protocol 25/26 Native ZK (Option A)
- **Future-proofed**: Ready for Stellar's upcoming host functions for native BN254 curve arithmetic. This will make native Groth16 pairing verification computationally cheap and native to the Stellar protocol.

---

## 📅 Timeline
- **Phase 1 (Current)**: Full React Next.js 16 frontend, ERPNext API integrations, Noir ZK Proof flow (Barretenberg), dynamic CoinGecko Oracles, Freighter Wallet integration, and real-time XLM Treasury payouts.
- **Phase 2 (Protocol 26 Rollout)**: Full deployment of native ZK verifier host functions directly into Soroban, dropping the Oracle for fully decentralized verification.
- **Phase 3 (Mainnet Launch)**: Production deployment on Stellar Mainnet, integrating USDC for stablecoin factoring, and full DAO governance roll-out.

---

## 🛠 Prerequisites
To build, test, and deploy the smart contracts locally, ensure you have the following installed:
* **Node.js**: `v20.0.0` or higher
* **Rust**: `rustc 1.70.0` or higher (with `wasm32-unknown-unknown` target)
* **Soroban CLI**: `stellar-cli` (v22.0.0 or later)
* **Nargo (Noir)**: For compiling ZK circuits.

---

## 🏗 How to Build & Run
### 1. The Frontend & ZK Backend
```bash
cd frontend
npm install
npm run dev
```
The backend ZK prover runs simultaneously on `http://localhost:4000/api/zk/prove`.

### 2. The Smart Contracts
Run the native Rust test suite to verify contract logic, Oracle Ed25519 signatures, timestamp expiry, and edge cases:
```bash
cd kryon_contracts
cargo test
```

---

## 🚀 How to Deploy (Testnet)

We provide an automated deployment script for Windows environments that handles compiling the Soroban contracts, registering the Oracle Ed25519 public keys, and extracting the Groth16 VKs.

1. Create a `.env` file in the root directory:
```env
TREASURY_SECRET_KEY=S...
TREASURY_PUBLIC_KEY=G...
```
2. Run the deployment script via PowerShell:
```powershell
.\scripts\deploy.ps1
```
This will automatically append the deployed `KRYON_VERIFIER_CONTRACT_ID` and the `ORACLE_SECRET_KEY` into your `.env` file.

---

## 📄 License
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.
