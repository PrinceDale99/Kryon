"use client";
import React from 'react';
import { motion } from 'framer-motion';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-20 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800"
      >
        <h1 className="text-4xl font-black mb-8 tracking-tight border-b border-slate-200 dark:border-slate-800 pb-4">
          Terms & Conditions
        </h1>
        
        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 space-y-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Effective Date: October 1, 2026</p>
          
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-8 text-red-800 dark:text-red-200 text-sm font-medium">
            IMPORTANT NOTICE: THESE TERMS AND CONDITIONS CONTAIN A BINDING ARBITRATION PROVISION AND A CLASS ACTION WAIVER. PLEASE READ THEM CAREFULLY AS THEY AFFECT YOUR LEGAL RIGHTS.
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">1. Acceptance of Terms</h2>
          <p>
            These Terms and Conditions ("Terms") constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you," "your," or "User") and the Kryon Network ("Kryon," "we," "us," or "our"), concerning your access to and use of the Kryon decentralized application, smart contracts deployed on the Stellar/Soroban network, API endpoints, Zero-Knowledge proving infrastructure, and any other related media form, channel, mobile website, or mobile application related, linked, or otherwise connected thereto (collectively, the "Protocol").
          </p>
          <p>
            By connecting a cryptographic wallet (e.g., Freighter), interacting with our smart contracts, depositing liquidity (XLM), or generating Noir/Halo2 ZK SNARKs through our interface, you expressly acknowledge that you have read, understood, and agreed to be bound by all of these Terms. If you do not agree with all of these Terms, then you are expressly prohibited from using the Protocol and you must discontinue use immediately.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">2. Nature of the Protocol</h2>
          <p>
            The Kryon Network is a decentralized, non-custodial, open-source protocol built on the Stellar blockchain. We provide a peer-to-peer infrastructure that allows Small to Medium Businesses (SMBs) to leverage Zero-Knowledge cryptography (via Noir and EZKL) to factor tokenized invoices, and allows Liquidity Providers (LPs) to supply native XLM into an autonomous Soroban escrow contract.
          </p>
          <p>
            <strong>NO BROKER OR ADVISORY RELATIONSHIP:</strong> We are developers of open-source software. We do not act as your broker, financial advisor, underwriter, or loan officer. We do not have fiduciary duties toward you. Any financial interactions occurring on the Protocol are strictly between you, the mathematical logic of the Soroban smart contracts, and other pseudonymous users of the network. We do not control, custody, or manage the digital assets deposited into the KryonEscrow contracts.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">3. Risks of Blockchain and Cryptography</h2>
          <p>
            By utilizing the Protocol, you explicitly acknowledge and assume all inherent risks associated with blockchain technology and experimental cryptography:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Smart Contract Vulnerabilities:</strong> While our Rust/Soroban contracts have undergone rigorous internal testing and simulated validation, smart contracts are inherently experimental. There is a risk of undiscovered bugs, logic flaws, or vulnerabilities that could result in the total and permanent loss of your deposited XLM or tokenized assets.</li>
            <li><strong>Zero-Knowledge Nuances:</strong> The Protocol relies heavily on cutting-edge cryptographic primitives, including Groth16, Halo2, BN254 pairing curves, and Poseidon hashing. Theoretical vulnerabilities in these underlying mathematical proofs (such as toxic waste exposure in trusted setups or unpatched library vulnerabilities in Barretenberg) could compromise the integrity of the protocol.</li>
            <li><strong>Oracle Failures:</strong> The Protocol relies on off-chain price feeds (e.g., CoinGecko) to determine the XLM-to-Fiat conversion rate at the exact moment of factoring. We are not liable for any financial losses incurred due to Oracle downtime, API deprecation, flash crashes, or malicious manipulation of price feeds.</li>
            <li><strong>Regulatory Uncertainty:</strong> The regulatory regime governing blockchain technologies, cryptocurrencies, verifiable credentials, and decentralized finance is highly uncertain. You are solely responsible for ensuring your use of the Protocol complies with your local jurisdiction's laws.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">4. User Representations & Warranties</h2>
          <p>
            By using the Protocol, you represent and warrant that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You have the legal capacity and you agree to comply with these Terms;</li>
            <li>You are not a minor in the jurisdiction in which you reside;</li>
            <li>You will not access the Protocol through automated or non-human means, except via officially supported API endpoints or Soroban RPC nodes;</li>
            <li>You will not use the Protocol for any illegal or unauthorized purpose, including but not limited to money laundering, terrorist financing, or sanctions evasion;</li>
            <li>All invoices, ERP data, and financial representations you submit for Zero-Knowledge Proof generation are strictly accurate, authentic, not subject to prior liens, and rightfully owned by your corporate entity. Submitting fraudulent invoices constitutes a material breach of these Terms and may result in the forfeiture of your cryptographic collateral via smart contract slashing mechanics.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">5. Disclaimers and Limitations of Liability</h2>
          <p>
            THE PROTOCOL IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. YOU AGREE THAT YOUR USE OF THE PROTOCOL AND OUR SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE PROTOCOL AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, CONTRIBUTORS, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, LOSS OF DIGITAL ASSETS, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE PROTOCOL, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">6. Dispute Resolution and Governing Law</h2>
          <p>
            Any dispute arising out of or in connection with this contract, including any question regarding its existence, validity, or termination, shall be referred to and finally resolved by binding arbitration under the Rules of the London Court of International Arbitration (LCIA), which Rules are deemed to be incorporated by reference into this clause. The number of arbitrators shall be one. The seat, or legal place, of arbitration shall be determined by the Protocol developers. The language to be used in the arbitral proceedings shall be English. 
          </p>
          <p>
            <strong>Class Action Waiver:</strong> You agree that any arbitration or proceeding shall be limited to the dispute between us and you individually. To the full extent permitted by law, (a) no arbitration or proceeding shall be joined with any other; (b) there is no right or authority for any dispute to be arbitrated or resolved on a class action-basis or to utilize class action procedures; and (c) there is no right or authority for any dispute to be brought in a purported representative capacity on behalf of the general public or any other persons.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">7. Severability</h2>
          <p>
            If any provision or part of a provision of these Terms is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from these Terms and does not affect the validity and enforceability of any remaining provisions.
          </p>

          <div className="mt-12 p-6 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-500 text-center uppercase tracking-wide">
            END OF TERMS AND CONDITIONS.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
