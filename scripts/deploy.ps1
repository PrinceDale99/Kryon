$ErrorActionPreference = "Stop"

Write-Host "=== Kryon Protocol Deployment Script ==="

# 1. Build WASM contracts
Write-Host "[1/6] Building Soroban contracts..."
Set-Location kryon_contracts
cargo build --target wasm32-unknown-unknown --release
Set-Location ..

$WASM = "kryon_contracts/target/wasm32-unknown-unknown/release/kryon_contracts.wasm"

# Read .env file
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match "^(.*?)=(.*)$") {
            Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2]
        }
    }
}

$TREASURY_SECRET_KEY = $env:TREASURY_SECRET_KEY
$TREASURY_PUBLIC_KEY = $env:TREASURY_PUBLIC_KEY
$ORACLE_SECRET_KEY = $env:ORACLE_SECRET_KEY

if (-not $TREASURY_SECRET_KEY) {
    Write-Host "Error: TREASURY_SECRET_KEY not found in .env"
    exit 1
}

# 2. Deploy KryonVerifier contract
Write-Host "[2/6] Deploying KryonVerifier..."
$VERIFIER_OUTPUT = stellar contract deploy --wasm $WASM --source $TREASURY_SECRET_KEY --network testnet 2>&1
$VERIFIER_ID = $VERIFIER_OUTPUT[-1].ToString().Trim()
Write-Host "KryonVerifier contract ID: $VERIFIER_ID"

# 3. Generate oracle keypair (if not set)
if (-not $ORACLE_SECRET_KEY) {
    Write-Host "[3/6] Generating oracle keypair..."
    stellar keys generate oracle --network testnet
    $ORACLE_SECRET_KEY = (stellar keys show oracle --secret).Trim()
    $ORACLE_PUBLIC_KEY = (stellar keys show oracle).Trim()
    Write-Host "Add to .env: ORACLE_SECRET_KEY=$ORACLE_SECRET_KEY"
} else {
    try {
        $ORACLE_PUBLIC_KEY = (stellar keys show oracle).Trim()
    } catch {
        $ORACLE_PUBLIC_KEY = (stellar keys from-secret $ORACLE_SECRET_KEY).Trim()
    }
}

# Get raw 32-byte pubkey (strip G-address encoding)
$NODE_CMD = @"
const {Keypair} = require('@stellar/stellar-sdk');
const kp = Keypair.fromPublicKey('$ORACLE_PUBLIC_KEY');
console.log(Buffer.from(kp.rawPublicKey()).toString('hex'));
"@
$ORACLE_RAW_PUBKEY = (node -e $NODE_CMD).Trim()

# 4. Initialize oracle in the contract
Write-Host "[4/6] Registering oracle public key in KryonVerifier..."
stellar contract invoke --id $VERIFIER_ID --source $TREASURY_SECRET_KEY --network testnet -- init_oracle --admin $TREASURY_PUBLIC_KEY --oracle_pubkey $ORACLE_RAW_PUBKEY

# 5. Extract and store the Groth16 verifying key for invoice circuit
Write-Host "[5/6] Extracting and storing Groth16 VK for invoice circuit..."
Set-Location kryon_backend_orchestrator
$VK_HEX = (npx ts-node src/extractVK.ts).Trim()
Set-Location ..

Write-Host "VK_HEX: $VK_HEX"

# Note: The ts-node script might output extra lines. Assuming the last line or specific output is the hex.
# If extractVK.ts just outputs logs, we might need to read the generated .hex file directly.
$VK_FILE = "kryon_zk/invoice_proof/target/invoice_vk.hex"
if (Test-Path $VK_FILE) {
    $VK_HEX_CONTENT = Get-Content $VK_FILE -Raw
    stellar contract invoke --id $VERIFIER_ID --source $TREASURY_SECRET_KEY --network testnet -- init_verifying_key --admin $TREASURY_PUBLIC_KEY --vk_bytes $VK_HEX_CONTENT
} else {
    Write-Host "VK file not found at $VK_FILE"
}

# 6. Update .env with deployed contract IDs
Write-Host "[6/6] Writing contract IDs to .env..."
if (Test-Path .env) {
    $envContent = Get-Content .env
    $envContent = $envContent -replace "^KRYON_VERIFIER_CONTRACT_ID=.*", "KRYON_VERIFIER_CONTRACT_ID=$VERIFIER_ID"
    $envContent | Set-Content .env
}

Write-Host ""
Write-Host "=== Deployment Complete ==="
Write-Host "Verifier contract: $VERIFIER_ID"
Write-Host "Oracle public key: $ORACLE_PUBLIC_KEY"
Write-Host "Verification mode: 0 (Oracle/Option B)"
Write-Host ""
