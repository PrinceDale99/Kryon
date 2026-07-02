# Kryon: DoraHacks Demo Runbook

This guide allows judges to run an end-to-end, confidential invoice factoring demo in under 10 minutes.

## Prerequisites
- Docker & Docker Compose (Recommended) OR
- Node.js `20+`, Rust `1.82.0+` with `wasm32v1-none`, `stellar-cli`, and `nargo` installed locally.

## One-Minute Demo (Simulated Mode)
To see the UX flow without compiling the ZK circuits yourself:
1. Navigate to the web app: `https://kryon.network` (or run `npm run dev` in `frontend/`)
2. Connect your Freighter Wallet (Testnet).
3. Toggle **"Demo Mode"** on the dashboard.
4. Select "Apple Inc. - $50,000" and click **Factor Invoice**.
5. Approve the Soroban transaction in your Freighter wallet.

## 10-Minute Full Local Demo (Production Mode)

We have provided a unified script to run the entire verification pipeline end-to-end locally. This compiles the Noir circuit, generates a valid Groth16 proof using Barretenberg, submits it to a local Soroban sandbox, and performs strict native verification.

### Option A: Using Docker (Easiest)
```bash
docker build -t kryon-dev -f docker/dev.Dockerfile .
docker run -it kryon-dev bash
# Inside the container:
./demos/run_invoice_demo.sh
```

### Option B: Local Native Execution
Ensure your `.env` contains standard stellar testnet variables, then run:
```bash
# 1. Compile the contract and tests
cd kryon_contracts
stellar contract build --target wasm32v1-none
cargo test

# 2. Run the end-to-end demo script
cd ..
./demos/run_invoice_demo.sh
```

### What does the demo script do?
1. Compiles the `invoice_proof` Noir circuit into a JSON artifact.
2. Extracts the `invoice_vk.hex` verifier key.
3. Generates a Groth16 proof over sample public inputs (simulating a valid SMB invoice).
4. Executes the Soroban `submit_zk_factoring` method via a local test harness.
5. Emits the `factored` event, verifying that the on-chain BN254 host functions strictly evaluated the proof!
