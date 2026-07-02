"use client";
import React from 'react';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-20 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800"
      >
        <h1 className="text-4xl font-black mb-8 tracking-tight border-b border-slate-200 dark:border-slate-800 pb-4">
          Privacy Policy
        </h1>
        
        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 space-y-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Effective Date: October 1, 2026</p>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">1. Introduction</h2>
          <p>
            Welcome to the Kryon Network ("we," "our," "us," or "the Protocol"). We respect your privacy and are deeply committed to protecting your personal data, corporate trade secrets, financial records, and cryptographic identity. This Privacy Policy ("Policy") explains comprehensively how we collect, use, process, disclose, and safeguard your information when you access our decentralized application (dApp), interact with our Soroban smart contracts, utilize our Zero-Knowledge Machine Learning (ZKML) Oracles, or engage with our API endpoints and Web3 interfaces (collectively, the "Services").
          </p>
          <p>
            By accessing or using the Services, you unequivocally consent to the data practices described in this Policy. If you do not agree with the terms of this Policy, you must immediately cease all use of the Services, disconnect your Web3 wallet (e.g., Freighter), and revoke any active OAuth tokens connected to your Enterprise Resource Planning (ERP) systems.
          </p>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">2. Zero-Knowledge Architecture & Privacy Guarantees</h2>
          <p>
            The fundamental premise of the Kryon Network is mathematical privacy through Zero-Knowledge (ZK) cryptography. Unlike legacy Web2 factoring platforms or traditional Web3 lending protocols, we operate under a strict "Trustless Privacy" mandate:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Cryptographic Obfuscation:</strong> When you generate a proof of an invoice, the underlying data (e.g., your client's name, the line items, the exact fiat amount, and proprietary margins) is NEVER published to the Stellar blockchain. Only the resulting `proof_bytes` and `public_inputs` (commitments and nullifiers) are submitted to the Soroban execution environment.</li>
            <li><strong>Client-Side Proving:</strong> Wherever feasible, SNARK generation occurs within your local execution environment (via WebAssembly or local Node orchestrators), meaning raw plaintext data does not traverse our servers.</li>
            <li><strong>ZKML Disassociation:</strong> Our EZKL Risk Oracle evaluates your financial standing in an enclave or localized circuit. The generated credit score is proven mathematically, meaning the underlying transactions that contributed to that score remain entirely opaque to the public and to us.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">3. Information We Collect</h2>
          <p>
            Despite our heavy reliance on Zero-Knowledge proofs, the practical operation of a frontend interface and ERP bridging requires the temporary handling of certain data vectors:
          </p>
          <h3 className="text-xl font-semibold mt-4">A. Information You Provide Directly</h3>
          <p>
            When you connect external systems (such as Stripe, QuickBooks, or ERPNext), you explicitly grant us OAuth access tokens or API keys. We use these credentials strictly to fetch invoice metadata for the sole purpose of feeding the local or secure-enclave ZK Prover.
          </p>
          <h3 className="text-xl font-semibold mt-4">B. Blockchain Data (Publicly Available)</h3>
          <p>
            We index and query public Stellar blockchain data, including your public wallet address (e.g., `G...`), transaction hashes, XLM balances, and interactions with the KryonEscrow smart contract (`C...`). Because blockchain ledgers are immutable and public by design, we cannot delete or alter this information.
          </p>
          <h3 className="text-xl font-semibold mt-4">C. Telemetry and Usage Data</h3>
          <p>
            We utilize standard web analytics tools to collect non-identifiable usage metrics, such as IP addresses (anonymized where required), browser types, operating systems, clickstream data, and latency metrics to optimize our RPC node routing and Next.js edge caching.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">4. How We Use Your Information</h2>
          <p>
            We process the collected data under the principles of data minimization and purpose limitation. Your data is used exclusively to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Facilitate the compilation of Noir circuits and the generation of Groth16/Halo2 SNARKs.</li>
            <li>Authenticate your Web3 session via Soroban authorization (`require_auth()`).</li>
            <li>Execute automated fiat-to-XLM conversions using real-time oracle price feeds (e.g., CoinGecko API).</li>
            <li>Maintain persistent Zero-Knowledge Identity states in our KV databases to prevent Sybil attacks and redundant verification computations.</li>
            <li>Comply with applicable Anti-Money Laundering (AML) and Know Your Customer (KYC) regulations via W3C Verifiable Credentials without storing the raw underlying PII.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">5. Data Retention & Deletion</h2>
          <p>
            We retain your temporary ERP API tokens and localized invoice cache only for the duration of the active browser session or until the ZK proof is successfully generated and broadcasted. Once the Soroban smart contract emits the `factored` event, the localized plaintext cache is aggressively purged. You may request the deletion of your persistent ZK Identity mapping by contacting our support channels, though be advised that on-chain cryptographic nullifiers cannot be reversed.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">6. Third-Party Disclosures</h2>
          <p>
            We do not sell, rent, or trade your corporate financial data. We may share necessary cryptographic hashes with trusted third-party RPC providers (e.g., Stellar Horizon nodes) strictly to broadcast your transactions to the decentralized network. If compelled by a valid subpoena or court order, we will comply with law enforcement; however, due to our ZK architecture, we often possess zero mathematically decryptable plaintext data to surrender.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">7. International Data Transfers</h2>
          <p>
            The Kryon Network is a decentralized, globally accessible protocol. Your interaction with the Services may result in the routing of data through servers located in various jurisdictions. By utilizing the Services, you consent to the cross-border transmission of your localized session data.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">8. Modifications to this Policy</h2>
          <p>
            We reserve the right to unilaterally amend, update, or modify this Privacy Policy at any time and for any reason. We will notify you of any material changes by updating the "Effective Date" at the top of this document. It is your strict responsibility to periodically review this Policy to stay informed of our privacy practices.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">9. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy, our Zero-Knowledge data handling practices, or your rights under applicable data protection frameworks (e.g., GDPR, CCPA), please contact the protocol maintainers via the official GitHub repository or our decentralized community channels.
          </p>
          
          <div className="mt-12 p-6 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-500 text-center">
            END OF PRIVACY POLICY. BY CONTINUING TO USE THE KRYON NETWORK, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREED TO ALL TERMS OUTLINED ABOVE.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
