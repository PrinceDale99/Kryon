# Security Policy

## Supported Versions

The Kryon Protocol is currently in early development (Hackathon MVP phase). As such, security updates are only provided for the latest main branch.

| Version | Supported          |
| ------- | ------------------ |
| Main    | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover any security vulnerabilities within the Kryon smart contracts, ZK-SNARK circuits, or the frontend API, please DO NOT report them via public GitHub issues. 

Instead, please email the development team directly or submit a private vulnerability report via GitHub.

Please provide the following details in your report:
- A description of the vulnerability and its potential impact.
- Steps to reproduce the issue (including any malicious inputs or transaction payloads).
- Potential mitigation strategies if known.

We aim to acknowledge receipt of all vulnerability reports within 48 hours and provide regular updates as we investigate and develop a patch.

## Security Architecture Overview

Kryon utilizes a multi-layered security model combining Zero-Knowledge proofs and Smart Contracts:
1. **Privacy Preservation (Noir ZK):** User identity (KYC/AML status) is verified locally using Noir WASM circuits. Only the mathematical proof and a nullifier hash are posted on-chain, preventing Sybil attacks while preserving complete privacy.
2. **Oracle Integrity (EZKL):** Machine Learning inferences for invoice risk scoring are verified via EZKL Halo2 SNARKs, ensuring the underlying PyTorch model evaluation was mathematically accurate and unmanipulated.
3. **Soroban Smart Contracts:** Ensure atomicity in invoice tokenization and liquidity pool transfers, utilizing Stellar's secure consensus protocols.

## Disclaimer

This software is provided "as is", without warranty of any kind. While we employ advanced cryptographic primitives, the codebase has not yet undergone a formal security audit by a third-party firm. Please use caution when interacting with the protocol on mainnet environments.
