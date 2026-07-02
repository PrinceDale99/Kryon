# Kryon ZK-ML Credit Risk Model

This directory contains the Zero-Knowledge Machine Learning (ZK-ML) pipelines used for private credit risk scoring on the Kryon network.

## Problem Statement
Traditional lending requires users to reveal their entire financial history to a centralized credit bureau to obtain a credit score. With ZK-ML, Kryon allows users to run a certified machine learning model *locally* on their private financial data. 

The user submits only the final risk score and a ZK Proof. The smart contract verifies that the score was legitimately produced by the exact neural network weights approved by the protocol, without ever seeing the inputs.

## Implementation Details
We utilize a quantized Neural Network translated into a Noir circuit.

### Model Architecture
- **Type**: 3-Layer Multi-Layer Perceptron (MLP)
- **Quantization**: INT8 (to fit efficiently within finite field arithmetic)
- **Inputs**: Private user financial vectors (cash flow history, debt-to-income ratio)
- **Weights**: Publicly known constants embedded in the circuit.
- **Output**: Credit Risk Tier (0-100)

### Noir Circuit Snippet
```rust
use dep::std;

global INPUT_SIZE: u32 = 4;
global HIDDEN_SIZE: u32 = 4;

// Publicly certified weights
global LAYER1_WEIGHTS: [[Field; 4]; 4] = [
    [1, 2, 0, 1],
    [0, 1, 3, 0],
    [2, 0, 1, 1],
    [1, 1, 1, 0]
];

fn relu(x: Field) -> Field {
    if (x as u64) > 1000000 { 0 } else { x }
}

fn main(
    private_financial_data: [Field; INPUT_SIZE], 
    public_risk_score: pub Field
) {
    let mut hidden_layer = [0; HIDDEN_SIZE];
    
    // Matrix Multiplication (Dot Product)
    for i in 0..HIDDEN_SIZE {
        for j in 0..INPUT_SIZE {
            hidden_layer[i] += private_financial_data[j] * LAYER1_WEIGHTS[i][j];
        }
        hidden_layer[i] = relu(hidden_layer[i]);
    }
    
    // Aggregation to single score
    let mut final_score = 0;
    for i in 0..HIDDEN_SIZE {
        final_score += hidden_layer[i];
    }
    
    assert(final_score == public_risk_score);
}
```

## Running the ZK-ML Pipeline
1. The user downloads the weights and executes `nargo prove` locally.
2. The Barretenberg prover generates the Groth16 proof representing the valid model inference.
3. The proof and public `risk_score` are submitted to Soroban.
