# Kryon Network 🛡️

**A decentralized invoice factoring and liquidity provision protocol powered by Stellar, Soroban Smart Contracts, and Zero-Knowledge (ZK) Cryptography.**

---

## 🛑 The Problem
Small to Medium Businesses (SMBs) consistently face crippling cash flow bottlenecks due to standard Net-30, Net-60, or Net-90 invoice payment terms. Traditional invoice factoring is heavily centralized, opaque, painfully slow, and predatory—often charging exorbitant fees and requiring massive amounts of manual paperwork and credit checks.

## 💡 The Solution (DoraHacks ZK Hackathon Winner)
Kryon revolutionizes SMB financing by bringing invoice factoring on-chain. By leveraging cutting-edge **Noir Zero-Knowledge (ZK) Proofs** to cryptographically verify live ERP data (such as ERPNext, QuickBooks, or Stripe), Kryon allows businesses to tokenize their open invoices in a fully trustless and private manner.

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
- **Phase 1 (Hackathon Winner)**: Full React Next.js 16 frontend, ERPNext API integrations, Noir ZK Proof flow, dynamic CoinGecko Oracles, Freighter Wallet integration, and real-time XLM Treasury payouts.
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

---

## 🧪 How to Test
Run the native Rust test suite to verify contract logic, mathematical precision, and edge cases:
```bash
cargo test
```

---

## 🚀 How to Deploy (Testnet)
Deploy the compiled WASM contract to the Stellar Testnet using the Soroban CLI. Ensure you have a funded testnet identity configured first.

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/kryon_escrow.wasm \
  --source <YOUR_TESTNET_IDENTITY> \
  --network testnet
```

---

## 📄 License
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.
