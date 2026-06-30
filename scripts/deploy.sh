#!/bin/bash
set -e

echo "=== Kryon Protocol Deployment Script ==="

# Load environment
source .env

# 1. Build WASM contracts
echo "[1/6] Building Soroban contracts..."
cd kryon_contracts
cargo build --target wasm32-unknown-unknown --release
cd ..

WASM=kryon_contracts/target/wasm32-unknown-unknown/release/kryon_contracts.wasm

# 2. Deploy KryonVerifier contract
echo "[2/6] Deploying KryonVerifier..."
VERIFIER_ID=$(stellar contract deploy \
    --wasm $WASM \
    --source "$TREASURY_SECRET_KEY" \
    --network testnet 2>&1 | tail -1)
echo "KryonVerifier contract ID: $VERIFIER_ID"

# 3. Generate oracle keypair (if not set)
if [ -z "$ORACLE_SECRET_KEY" ]; then
    echo "[3/6] Generating oracle keypair..."
    stellar keys generate oracle --network testnet
    ORACLE_SECRET_KEY=$(stellar keys show oracle --secret)
    ORACLE_PUBLIC_KEY=$(stellar keys show oracle)
    echo "Add to .env: ORACLE_SECRET_KEY=$ORACLE_SECRET_KEY"
else
    ORACLE_PUBLIC_KEY=$(stellar keys show oracle 2>/dev/null || stellar keys from-secret "$ORACLE_SECRET_KEY")
fi

# Get raw 32-byte pubkey (strip G-address encoding)
ORACLE_RAW_PUBKEY=$(node -e "
const {Keypair} = require('@stellar/stellar-sdk');
const kp = Keypair.fromPublicKey('$ORACLE_PUBLIC_KEY');
console.log(Buffer.from(kp.rawPublicKey()).toString('hex'));
")

# 4. Initialize oracle in the contract
echo "[4/6] Registering oracle public key in KryonVerifier..."
stellar contract invoke \
    --id "$VERIFIER_ID" \
    --source "$TREASURY_SECRET_KEY" \
    --network testnet \
    -- init_oracle \
    --admin "$TREASURY_PUBLIC_KEY" \
    --oracle_pubkey "$ORACLE_RAW_PUBKEY"

# 5. Extract and store the Groth16 verifying key for invoice circuit
echo "[5/6] Extracting and storing Groth16 VK for invoice circuit..."
cd kryon_backend_orchestrator
VK_HEX=$(npx ts-node src/extractVK.ts --circuit invoice --output hex)
cd ..

stellar contract invoke \
    --id "$VERIFIER_ID" \
    --source "$TREASURY_SECRET_KEY" \
    --network testnet \
    -- init_verifying_key \
    --admin "$TREASURY_PUBLIC_KEY" \
    --vk_bytes "$VK_HEX"

# 6. Update .env with deployed contract IDs
echo "[6/6] Writing contract IDs to .env..."
sed -i "s/KRYON_VERIFIER_CONTRACT_ID=.*/KRYON_VERIFIER_CONTRACT_ID=$VERIFIER_ID/" .env

echo ""
echo "=== Deployment Complete ==="
echo "Verifier contract: $VERIFIER_ID"
echo "Oracle public key: $ORACLE_PUBLIC_KEY"
echo "Verification mode: 0 (Oracle/Option B)"
echo ""
echo "To switch to Arkworks (Option C): stellar contract invoke --id $VERIFIER_ID ... set_verification_mode --mode 1"
echo "To switch to P25/26 (Option A) when available: ... set_verification_mode --mode 2"
