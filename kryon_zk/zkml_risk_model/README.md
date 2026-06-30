# ZKML Risk Assessment Circuit (EZKL)

This directory contains the implementation of a Zero-Knowledge Machine Learning (ZKML) circuit designed to replace the centralized Gemini LLM Oracle currently used in the frontend.

By using **EZKL** (an engine for doing inference for deep learning models in zk-SNARKs), we can train an AI model to evaluate invoice default risk, and then mathematically prove on-chain that the AI model produced a specific risk score for the borrower's hidden data, without ever revealing the underlying invoice details to the public.

## Architecture

1. **`risk_model.py`**: A PyTorch Neural Network (MLP) that takes normalized invoice parameters (e.g., amount, borrower history, client trust) and outputs a risk score (0 to 1).
2. **ONNX Export**: The PyTorch model is exported to the standard ONNX computational graph format (`network.onnx`).
3. **EZKL Circuit Compilation**: EZKL reads the ONNX computation graph and converts it into a highly efficient Halo2 zk-SNARK circuit.
4. **On-Chain Verification**: The resulting ZK Proof guarantees the ML model was executed fairly. The proof can be validated natively within Soroban using our Arkworks WASM verifier integration.

## Setup & Requirements

To compile the ZKML circuit locally, you need Python and `ezkl` installed:

```bash
pip install torch
pip install ezkl
```

## How to Run & Generate Proofs

1. **Export the Model**: Run the Python script to generate the ONNX model and the `input.json` containing the hidden invoice data.
   ```bash
   python risk_model.py
   ```

2. **Generate the EZKL Proof**: Run the standard EZKL pipeline to compile the Halo2 circuit and generate the ZK proof.
   ```bash
   # Generate configuration settings
   ezkl gen-settings -M network.onnx
   
   # Calibrate the settings for optimal performance
   ezkl calibrate-settings -M network.onnx -D input.json --target resources
   
   # Compile the Halo2 circuit
   ezkl compile-circuit -M network.onnx -S settings.json -C network.compiled
   
   # Get SRS parameters
   ezkl get-srs -S settings.json
   
   # Setup Proving Key (PK) and Verifying Key (VK)
   ezkl setup -M network.compiled -S settings.json -V vk.key -P pk.key
   
   # Generate the witness
   ezkl gen-witness -D input.json -M network.compiled -W witness.json
   
   # Generate the ZK Proof
   ezkl prove -W witness.json -M network.compiled -P pk.key -O proof.json
   
   # Verify the proof locally
   ezkl verify -P proof.json -S settings.json -V vk.key
   ```
