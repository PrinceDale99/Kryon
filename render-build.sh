#!/usr/bin/env bash
set -e

echo "Downloading nargo (Noir compiler) for Linux..."
curl -L https://github.com/noir-lang/noir/releases/download/v0.36.0/nargo-x86_64-unknown-linux-gnu.tar.gz -o nargo.tar.gz
tar -xzf nargo.tar.gz
chmod +x nargo-x86_64-unknown-linux-gnu/nargo
export PATH=$PATH:$(pwd)/nargo-x86_64-unknown-linux-gnu

echo "Compiling Noir circuits..."
cd kryon_zk
for circuit in invoice_proof kyc_proof merkle_membership solvency_proof age_proof poseidon_util; do
    echo "Compiling $circuit..."
    cd $circuit
    nargo compile
    cd ..
done
cd ..

echo "Installing Node dependencies..."
cd kryon_backend_orchestrator
npm install
echo "Build complete!"
