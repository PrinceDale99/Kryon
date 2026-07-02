# Kryon Proof Aggregation & Batching

This directory contains the pipeline for compressing and aggregating multiple proofs into a single recursive proof payload to submit to Soroban.

## Why Aggregate?
Soroban smart contracts have strict WASM CPU instruction limits (currently around 100M instructions per invocation). While the Protocol 26 BN254 host functions significantly reduce the cost of a single verification, validating a batch of 50 KYC updates independently would exceed the transaction budget.

Instead, Kryon utilizes **Recursive ZK Proofs** (proofs verifying other proofs). We aggregate 50 proofs off-chain into a single Groth16 proof. Soroban then verifies this 1 aggregated proof, updating 50 states for the cost of 1 verification!

## Architecture

1. **Leaf Proofs**: Standard Groth16/UltraPlonk proofs representing individual transactions (e.g., KYC, invoices).
2. **Aggregation Circuit (Noir / Barretenberg)**: A specialized circuit that recursively verifies the mathematical validity of the leaf proofs.
3. **Soroban Contract**: Takes the `aggregated_proof_bytes` and natively verifies it using `env.crypto().bn254().pairing_check()`.

### Example Aggregation Circuit (Noir)
```rust
use dep::std;

// Verifies two independent proofs recursively and ensures their public inputs match the expected root.
fn main(
    verification_key: [Field; 114], 
    proof1: [Field; 93], 
    public_inputs1: [Field; 2],
    proof2: [Field; 93], 
    public_inputs2: [Field; 2],
    expected_root: pub Field
) {
    // Recursively verify proof 1
    std::verify_proof(
        verification_key.as_slice(),
        proof1.as_slice(),
        public_inputs1.as_slice(),
        0
    );

    // Recursively verify proof 2
    std::verify_proof(
        verification_key.as_slice(),
        proof2.as_slice(),
        public_inputs2.as_slice(),
        0
    );

    // Compress state
    let compressed = std::hash::poseidon::bn254::hash_2([public_inputs1[0], public_inputs2[0]]);
    assert(compressed == expected_root);
}
```

## Running the Batcher
The `batcher.js` script (in root) pulls pending transactions, generates the aggregated proof via the Barretenberg backend, and submits the batched payload to the network.
