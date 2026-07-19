# Contributing to Kryon Network 🛡️

Thank you for your interest in contributing to **Kryon Network** — a decentralized invoice factoring protocol powered by Stellar, Soroban, and Zero-Knowledge cryptography.

We welcome contributions from developers, cryptographers, security researchers, and DeFi enthusiasts at all levels.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Branch & Commit Conventions](#branch--commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Security Disclosures](#security-disclosures)

---

## 🤝 Code of Conduct

By participating in this project, you agree to uphold a respectful, inclusive, and harassment-free environment. All contributors are expected to:

- Be kind and respectful in all interactions.
- Welcome newcomers and help them learn.
- Accept constructive feedback gracefully.
- Prioritize the community's best interest over personal gain.

Unacceptable behavior (harassment, hate speech, trolling) will result in immediate removal from the project.

---

## 🚀 Getting Started

Before you contribute, please:

1. **Read the [README.md](./README.md)** to understand the protocol architecture.
2. **Read the [ARCHITECTURE.md](./ARCHITECTURE.md)** for a deep technical breakdown.
3. **Read the [SECURITY.md](./SECURITY.md)** to understand the security model.
4. **Set up your local development environment** (see below).

---

## 🛠️ Development Setup

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | v20.0.0+ | Frontend & Noir Orchestrator |
| Rust | 1.82.0+ | Soroban Smart Contracts |
| `wasm32v1-none` target | latest | Protocol 26 WASM compilation |
| Stellar CLI | latest | Contract deployment & testing |
| Python | 3.10+ | ZKML / EZKL circuits |
| Freighter Wallet | latest | Browser wallet (Testnet) |

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/PrinceDale99/Kryon.git
cd Kryon

# 2. Install frontend dependencies
cd frontend && npm install && cd ..

# 3. Install Noir orchestrator dependencies
cd kryon_backend_orchestrator && npm install && cd ..

# 4. Build the Soroban smart contracts
cd kryon_contracts
stellar contract build --target wasm32v1-none
cargo test
cd ..

# 5. Configure environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SOROBAN_CONTRACT_ID, KV_REST_API_URL, etc.

# 6. Start the dev server
cd frontend && npm run dev
```

---

## 💡 How to Contribute

### Areas of Contribution

| Area | Description | Skills Needed |
|---|---|---|
| **Smart Contracts** | Rust Soroban logic, ZK verifiers, multi-sig | Rust, Soroban SDK |
| **ZK Circuits** | Noir circuit design, Halo2 aggregation | Noir, Barretenberg, SNARK theory |
| **ZKML** | PyTorch model → EZKL Halo2 circuit | Python, ML, EZKL |
| **Frontend** | Next.js UI, Freighter integration | TypeScript, React, Zustand |
| **Anchor Integration** | SEP-24/SEP-31 cross-border flows | Stellar, REST APIs |
| **Documentation** | Guides, tutorials, architecture docs | Technical writing |
| **Security** | Audit, fuzzing, attack surface review | Cryptography, smart contract auditing |
| **Testing** | Unit tests, integration tests, E2E | Rust, Jest, Playwright |

### Good First Issues

Look for issues labeled [`good first issue`](https://github.com/PrinceDale99/Kryon/issues?q=label%3A%22good+first+issue%22) in the issue tracker. These are intentionally scoped to be approachable for new contributors.

---

## 🌿 Branch & Commit Conventions

### Branch Naming

```
feat/<short-description>       # New features
fix/<short-description>        # Bug fixes
docs/<short-description>       # Documentation changes
chore/<short-description>      # Build, CI, dependency updates
security/<short-description>   # Security patches
```

Examples:
- `feat/sep24-anchor-integration`
- `fix/nullifier-replay-edge-case`
- `docs/zkml-circuit-guide`

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `security`, `perf`

**Scopes:** `contracts`, `frontend`, `orchestrator`, `zkml`, `circuits`, `anchor`, `ci`

**Examples:**
```
feat(contracts): add multi-sig threshold approval for treasury withdrawals
fix(frontend): resolve Freighter wallet disconnect race condition
docs(anchor): document SEP-24 interactive flow for PHP/USD invoices
security(contracts): prevent re-entrancy in milestone payout function
```

---

## 🔄 Pull Request Process

1. **Fork** the repository and create your branch from `main`.
2. **Write tests** for any new smart contract logic — no exceptions.
3. **Run the test suite** before submitting:
   ```bash
   # Smart contract tests
   cd kryon_contracts && cargo test

   # Frontend lint
   cd frontend && npm run lint
   ```
4. **Ensure your PR** has a clear title, a description of what changed, and why.
5. **Link any related issues** using `Closes #<issue-number>` in the PR description.
6. **Request a review** from at least one maintainer.
7. PRs are merged via **squash merge** to keep history clean.

### PR Checklist

- [ ] Code compiles without warnings (`cargo build --target wasm32v1-none`)
- [ ] All existing tests pass (`cargo test`)
- [ ] New tests added for new functionality
- [ ] No hardcoded secrets or private keys committed
- [ ] README / docs updated if applicable
- [ ] Commit messages follow Conventional Commits format

---

## 🐛 Reporting Bugs

Please [open a GitHub Issue](https://github.com/PrinceDale99/Kryon/issues/new?template=bug_report.md) with:

- **Summary:** What happened vs. what you expected.
- **Steps to reproduce:** Minimal, clear reproduction steps.
- **Environment:** OS, Node version, Rust version, browser + wallet version.
- **Logs/Screenshots:** Any relevant error output.

> ⚠️ For **security vulnerabilities**, do **NOT** open a public issue. See [Security Disclosures](#security-disclosures).

---

## 💭 Suggesting Features

Feature requests are welcome! Please [open a GitHub Issue](https://github.com/PrinceDale99/Kryon/issues/new?template=feature_request.md) with:

- **Problem statement:** What problem does this feature solve?
- **Proposed solution:** How you envision it working.
- **Alternatives considered:** Any other approaches you thought of.
- **Additional context:** Links, diagrams, or references.

---

## 🔐 Security Disclosures

Kryon handles real financial assets. Security is paramount.

If you discover a vulnerability:

1. **Do NOT disclose publicly** until it is patched.
2. **Email the maintainer** directly or use GitHub's [private security advisory](https://github.com/PrinceDale99/Kryon/security/advisories/new) feature.
3. Include a clear description of the vulnerability, its impact, and steps to reproduce.
4. Allow a reasonable remediation window (typically 72 hours for critical, 14 days for medium/low).

Please review [SECURITY.md](./SECURITY.md) for the full responsible disclosure policy.

---

## 🏆 Recognition

All meaningful contributors will be:

- Added to the **Contributors** section of the README.
- Credited in release notes.
- Eligible for future protocol contributor rewards as Kryon grows.

