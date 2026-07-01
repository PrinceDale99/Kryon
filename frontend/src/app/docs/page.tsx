"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Code, ShieldCheck, ExternalLink, Lock, CheckCircle, FileText, Cpu, Scale, EyeOff, Network, Database, Zap, FileJson, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DocsPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  // State to handle animated demonstrations
  const [demoState, setDemoState] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoState(s => (s + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 relative">
      <div className="absolute top-40 -left-40 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-80 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16 text-center"
      >
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">Kryon Network <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Docs</span></h1>
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
          The fully decentralized, Zero-Knowledge invoice factoring and liquidity protocol on Soroban.
        </p>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-12"
      >
        {/* The Problem & Solution */}
        <motion.section variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl">
                  <EyeOff className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black">The Problem</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-4">
                Small to Medium Businesses (SMBs) consistently face crippling cash flow bottlenecks due to standard Net-30, Net-60, or Net-90 invoice payment terms. 
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                Traditional factoring is heavily centralized, opaque, painfully slow, and predatory—charging exorbitant fees and requiring massive amounts of manual paperwork, invasive audits, and exposing proprietary client lists to third parties.
              </p>
            </div>
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black">The Kryon Solution</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-4">
                Kryon brings invoice factoring entirely on-chain while preserving complete corporate privacy. 
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                By leveraging cutting-edge <strong>Noir Zero-Knowledge (ZK) Proofs</strong> and <strong>EZKL Machine Learning Models (ZKML)</strong>, businesses can tokenize open invoices trustlessly. Liquidity Providers supply capital to a decentralized Soroban Treasury, earning reliable yield as borrowers factor invoices instantly.
              </p>
            </div>
          </div>
        </motion.section>

        {/* System Architecture */}
        <motion.section variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Network className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black">Comprehensive Architecture</h2>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 md:space-x-8">
              {/* Animated Architecture Diagram */}
              <div className="flex-1 w-full space-y-6 relative">
                {/* Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ minHeight: '300px' }}>
                  <motion.path 
                    d="M 150 50 C 250 50, 250 150, 350 150" 
                    stroke="currentColor" strokeWidth="2" fill="none" className="text-slate-300 dark:text-slate-700" 
                    strokeDasharray="5,5" 
                    animate={{ strokeDashoffset: [0, -20] }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  />
                  <motion.path 
                    d="M 150 250 C 250 250, 250 150, 350 150" 
                    stroke="currentColor" strokeWidth="2" fill="none" className="text-slate-300 dark:text-slate-700" 
                    strokeDasharray="5,5" 
                    animate={{ strokeDashoffset: [0, -20] }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  />
                </svg>

                {/* Left side: Actors */}
                <div className="flex flex-col space-y-12 z-10 relative w-64">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-indigo-500 shadow-lg flex items-center space-x-3">
                    <Database className="w-6 h-6 text-indigo-500" />
                    <span className="font-bold">ERP (Stripe/QuickBooks)</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-emerald-500 shadow-lg flex items-center space-x-3">
                    <Lock className="w-6 h-6 text-emerald-500" />
                    <span className="font-bold">ZK Identity Store</span>
                  </div>
                </div>

                {/* Middle: Frontend/Backend */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-64">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-4 border-blue-500 shadow-2xl flex flex-col items-center justify-center space-y-2 text-center">
                    <Zap className="w-10 h-10 text-blue-500" />
                    <span className="font-black text-lg">Kryon Frontend & Noir ZK Prover</span>
                  </div>
                </div>

                {/* Right: Blockchain */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-64">
                  <div className="bg-slate-900 dark:bg-black p-6 rounded-2xl border-2 border-slate-700 shadow-2xl flex flex-col items-center justify-center space-y-2 text-center text-white">
                    <Code className="w-10 h-10 text-slate-300" />
                    <span className="font-black text-lg">Soroban Smart Contracts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-slate-600 dark:text-slate-300">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">1. Decoupled Proving</h4>
              <p>The client fetches OAuth data from the ERP. The Noir Backend generates an execution trace proving integrity, while the EZKL microservice runs a PyTorch model for risk assessment.</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">2. Trustless Execution</h4>
              <p>Soroban Smart Contracts receive ONLY the SNARK proofs, not the raw data. Soroban verifies the cryptography and releases the XLM from the Liquidity Pool instantly.</p>
            </div>
          </div>
        </motion.section>

        {/* ZK Visualizations */}
        <motion.section variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none">
          <div className="flex items-center space-x-4 mb-12">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Zap className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black">Zero-Knowledge Implementation (Animated)</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* ZK Identity */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center">
              <h3 className="text-xl font-bold mb-4">1. Persistent ZK Identity</h3>
              <div className="h-40 w-full flex items-center justify-center mb-4 relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <motion.div 
                  animate={{ 
                    x: demoState === 0 ? 0 : (demoState === 1 ? -100 : 100),
                    opacity: demoState === 0 ? 1 : 0
                  }}
                  className="absolute flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg"
                >
                  <FileText className="text-slate-500" /> <span>Raw KYC Data</span>
                </motion.div>
                <motion.div 
                  animate={{ 
                    scale: demoState === 1 ? [1, 1.2, 1] : 1,
                    opacity: demoState === 1 ? 1 : (demoState === 0 ? 0 : 0.5)
                  }}
                  className="absolute text-emerald-500"
                >
                  <Lock size={64} />
                </motion.div>
                <motion.div 
                  animate={{ 
                    y: demoState === 2 ? 0 : 50,
                    opacity: demoState === 2 ? 1 : 0
                  }}
                  className="absolute flex flex-col items-center text-emerald-500"
                >
                  <CheckCircle size={48} className="mb-2" />
                  <span className="font-bold font-mono">Proof Verified</span>
                </motion.div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Proves a borrower holds a valid digital identity (KYC/AML) without leaking specific PII to the public ledger. Verified status is persisted globally across devices via a KV store.
              </p>
            </div>

            {/* ZK Invoice Integrity */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center">
              <h3 className="text-xl font-bold mb-4">2. Confidential Factoring (Noir)</h3>
              <div className="h-40 w-full flex items-center justify-center mb-4 relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <motion.div 
                  animate={{ 
                    rotateY: demoState === 0 ? 0 : 180,
                    opacity: demoState === 2 ? 0 : 1
                  }}
                  transition={{ duration: 1 }}
                  className="absolute bg-blue-100 dark:bg-blue-900/50 p-4 rounded-xl border border-blue-500"
                >
                  {demoState === 0 ? (
                    <div className="flex flex-col items-center"><FileJson className="text-blue-500 mb-1" /> <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Invoice $50k</span></div>
                  ) : (
                    <div className="flex flex-col items-center"><ShieldCheck className="text-blue-500 mb-1" /> <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300">0x8f...2a1</span></div>
                  )}
                </motion.div>
                <motion.div 
                  animate={{ 
                    scale: demoState === 2 ? 1 : 0,
                    opacity: demoState === 2 ? 1 : 0
                  }}
                  className="absolute text-emerald-500 flex flex-col items-center"
                >
                  <CheckCircle size={48} />
                  <span className="font-bold text-sm mt-2">Soroban Verified</span>
                </motion.div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Generates a Groth16 SNARK proving that an invoice from Stripe/ERPNext is digitally signed and valid, fully concealing the corporate client and trade margins.
              </p>
            </div>

            {/* ZKML EZKL */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center">
              <h3 className="text-xl font-bold mb-4">3. ZKML Risk Model (EZKL)</h3>
              <div className="h-40 w-full flex items-center justify-center mb-4 relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <motion.div 
                  animate={{ 
                    scale: demoState === 1 ? [1, 1.2, 1] : 1,
                    rotate: demoState === 1 ? 360 : 0
                  }}
                  transition={{ duration: 2 }}
                  className="absolute text-purple-500"
                >
                  <Cpu size={64} />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: demoState === 2 ? 1 : 0,
                    y: demoState === 2 ? -20 : 0
                  }}
                  className="absolute bg-purple-500 text-white font-bold px-3 py-1 rounded-full shadow-lg"
                >
                  Risk Score: 12 (Low) + SNARK
                </motion.div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                A PyTorch Neural Network executes inside a Halo2 circuit. It evaluates default risk and generates a cryptographic proof that the exact, untampered AI model was used.
              </p>
            </div>

            {/* Solvency Proof */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center">
              <h3 className="text-xl font-bold mb-4">4. Proof of Solvency</h3>
              <div className="h-40 w-full flex items-center justify-center mb-4 relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <motion.div 
                  animate={{ 
                    rotate: demoState === 0 ? -15 : (demoState === 1 ? 15 : 0)
                  }}
                  transition={{ type: "spring", stiffness: 50 }}
                  className="absolute text-amber-500 origin-bottom"
                >
                  <Scale size={64} />
                </motion.div>
                <motion.div 
                  animate={{ opacity: demoState === 2 ? 1 : 0 }}
                  className="absolute bottom-4 font-mono font-bold text-emerald-500 text-sm bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full"
                >
                  Assets {">"} Liabilities (Verified)
                </motion.div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Assures Liquidity Providers that the Soroban treasury is perfectly healthy. Proves Total Assets exceed Liabilities without exposing specific underlying loans.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Feature Comparison Table */}
        <motion.section variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none overflow-x-auto">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black">With ZK vs. Without ZK</h2>
          </div>
          
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 font-bold text-slate-900 dark:text-white">Feature</th>
                <th className="p-4 font-bold text-rose-500 flex items-center"><XCircle className="w-4 h-4 mr-2"/> Without Zero-Knowledge</th>
                <th className="p-4 font-bold text-emerald-500 flex items-center"><ShieldCheck className="w-4 h-4 mr-2"/> With ZK (Kryon)</th>
                <th className="p-4 font-bold text-slate-900 dark:text-white">How ZK Improves It</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">Invoice Integrity</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">Upload raw invoices directly to smart contract. Exposes secrets.</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">Generates a Groth16/Halo2 SNARK off-chain. Submits only the proof.</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 text-sm"><strong>Total Privacy:</strong> Competitors cannot see your corporate clients or pricing on the public blockchain.</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">Credit Risk Assessment</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">Manual human review or black-box centralized AI model.</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">PyTorch model executes inside a Halo2 circuit (ZKML).</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 text-sm"><strong>Unbiased:</strong> Borrowers cryptographically verify they were evaluated fairly without human bias.</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">Identity & KYC</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">Upload passports/IDs to central databases (honeypots).</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">Localized ZK Identity Proof confirms compliance signatures.</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 text-sm"><strong>Security:</strong> Eliminates data breach risks. Proves Age {">"} 18 without touching actual data.</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">Factoring Speed</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">Weeks of legal paperwork and human underwriters.</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">Takes {"<"} 15 seconds to generate SNARK and submit to Soroban.</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 text-sm"><strong>Hyper-efficiency:</strong> Math removes the need for human trust, enabling instant atomic settlement.</td>
              </tr>
            </tbody>
          </table>
        </motion.section>

        {/* Installation & Setup */}
        <motion.section variants={item} className="bg-slate-900 p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl text-white">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-slate-800 text-white rounded-2xl">
              <Code className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black">Installation & Setup</h2>
          </div>
          <div className="space-y-6 text-slate-300">
            <p>To run the entire suite locally (Frontend, ZK Backend, and Smart Contracts), ensure you follow these instructions precisely.</p>
            
            <h3 className="text-xl font-bold text-white mt-6 mb-2">Prerequisites</h3>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-6">
              <li>Node.js v20.0.0+</li>
              <li>Rust 1.70.0+ (with <code>wasm32-unknown-unknown</code>)</li>
              <li>Soroban CLI v22.0.0+</li>
              <li>Python 3.10+</li>
            </ul>

            <div className="bg-black/50 p-6 rounded-xl border border-slate-800">
              <h4 className="font-bold text-white mb-4">Phase 1: Deploy Soroban Contracts</h4>
              <pre className="text-sm font-mono overflow-x-auto text-emerald-400 bg-black p-4 rounded-lg">
{`cd kryon_contracts
soroban contract build
cargo test
soroban contract deploy \\
  --wasm target/wasm32-unknown-unknown/release/kryon_escrow.wasm \\
  --source admin_wallet \\
  --network testnet`}
              </pre>
            </div>

            <div className="bg-black/50 p-6 rounded-xl border border-slate-800">
              <h4 className="font-bold text-white mb-4">Phase 2: Next.js Frontend</h4>
              <pre className="text-sm font-mono overflow-x-auto text-blue-400 bg-black p-4 rounded-lg">
{`cd frontend
npm install
cp .env.example .env.local

# Required in .env.local:
# NEXT_PUBLIC_SOROBAN_CONTRACT_ID="<YOUR_CONTRACT_ID>"
# KV_REST_API_URL="<YOUR_KVDB_URL>"

npm run dev`}
              </pre>
            </div>
          </div>
        </motion.section>

      </motion.div>
    </div>
  );
}
