#!/bin/bash
set -e

echo "=========================================="
echo "Kryon Network: 10-Minute End-to-End Demo"
echo "=========================================="

echo "[1/4] Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo >&2 "Node.js is required but not installed. Aborting."; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo >&2 "Rust (cargo) is required but not installed. Aborting."; exit 1; }
command -v stellar >/dev/null 2>&1 || { echo >&2 "Stellar CLI is required. Run: cargo install --locked stellar-cli --features opt"; exit 1; }

echo "[2/4] Building Soroban Contracts..."
cd kryon_contracts
cargo build --target wasm32v1-none --release
cargo test
cd ..
echo "Contracts built successfully."

echo "[3/4] Installing Frontend Dependencies..."
cd frontend
npm install
echo "Dependencies installed."

echo "[4/4] Starting Local Development Server..."
echo "The Kryon Web App will be available at http://localhost:3000"
echo "Press Ctrl+C to stop the server."
npm run dev
