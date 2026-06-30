#!/usr/bin/env bash
set -e

echo "Downloading nargo (Noir compiler) for Linux..."
curl -L https://github.com/noir-lang/noir/releases/download/v1.0.0-beta.22/nargo-x86_64-unknown-linux-gnu.tar.gz -o nargo.tar.gz
tar -xzf nargo.tar.gz
chmod +x nargo
export PATH=$PATH:$(pwd)

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
