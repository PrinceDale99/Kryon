"use client";
import { motion } from 'framer-motion';
import { BookOpen, Code, ShieldCheck, ExternalLink } from 'lucide-react';

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 relative">
      <div className="absolute top-40 -left-40 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-80 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16 text-center"
      >
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-6">Kryon Network <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Docs</span></h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">The decentralized Accounts Receivable factoring protocol on Soroban.</p>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-12"
      >
        <motion.section variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black">Introduction</h2>
          </div>
          <div className="space-y-4 text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
            <p>
              Small and Medium-sized Businesses (SMBs) often suffer from severe cash flow issues because corporate clients take 60 to 90 days to pay their invoices.
            </p>
            <p>
              <strong>Kryon Network</strong> solves this by allowing SMBs to instantly factor (sell) their unpaid invoices for an immediate XLM advance. Liquidity Providers (LPs) fund these advances and earn yield when the invoice is ultimately paid by the corporation.
            </p>
          </div>
        </motion.section>

        <motion.section variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black">Zero-Knowledge (ZK) Proofs</h2>
          </div>
          <div className="space-y-4 text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
            <p>
              Traditionally, factoring requires intensive manual audits. Kryon Network removes this friction using <strong>Zero-Knowledge Proofs</strong> (simulating Chainlink DECO).
            </p>
            <p>
              SMBs connect their ERPs (like QuickBooks, Stripe, or ERPNext) via OAuth. The protocol generates a cryptographic ZK Proof that mathematically guarantees three things:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Authenticity:</strong> The invoice data was fetched directly from the ERP's secure servers and hasn't been tampered with.</li>
              <li><strong>Integrity:</strong> The invoice amount, due date, and ownership strictly match what is being claimed.</li>
              <li><strong>Privacy:</strong> The sensitive business data (who the client is, line items, corporate rates) is <em>never</em> exposed to the public Stellar ledger.</li>
            </ul>
            <p className="mt-4">
              This proof is then submitted to the Soroban smart contract, which acts as a decentralized verifier. If the math checks out, the contract autonomously triggers the liquidity release without any human intervention.
            </p>
          </div>
        </motion.section>

        <motion.section variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
              <Code className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black">Soroban Smart Contracts</h2>
          </div>
          <div className="space-y-6 text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
            <p>The protocol runs on two primary Rust smart contracts deployed to the Stellar Testnet:</p>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">1. KryonLiquidity</h3>
              <p className="text-base mb-6">Manages the decentralized pool of XLM. LPs call the <code>deposit()</code> function to add funds to the pool, increasing the Total Value Locked (TVL).</p>
              
              <a 
                href="https://stellar.expert/explorer/testnet/account/GCO5RGVLRVNIF42JRQYCOCIC4Z66W2WIBVO3EMEUIM4LYHPOIM5KPGSG" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                <span>View Treasury on Stellar Expert</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">2. KryonEscrow</h3>
              <p className="text-base mb-6">Verifies the ZK proof logic and manages the factoring execution. When an SMB calls <code>submit_invoice()</code> with a valid proof, the contract instructs the Liquidity pool to release a 90% advance directly to the SMB's Freighter wallet.</p>
              
              <a 
                href="https://stellar.expert/explorer/testnet/contract/CCJUOYAZCR4JHADRXSV7IOAHPX45SW3IXH6FJ4A4FM22ARIWDNTJYNNP" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                <span>View Live Contract on Stellar Expert</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </motion.section>
      </motion.div>

      {/* Animation Flow Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        className="mt-24 mb-24"
      >
        <div className="flex flex-col items-center mb-16 text-center">
          <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-3xl shadow-xl shadow-orange-500/20 mb-6 transform -rotate-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">How Kryon Works</h2>
          <p className="text-slate-500 text-lg max-w-xl">A seamless, trustless protocol turning unpaid invoices into instant liquidity.</p>
        </div>

        <div className="max-w-4xl mx-auto relative px-4">
          {/* Central animated line */}
          <motion.div 
            initial={{ height: 0 }}
            whileInView={{ height: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 via-emerald-500 to-amber-500 md:-ml-[3px] rounded-full hidden md:block"
          />
          
          {[
            { 
              step: 1, 
              title: "1. Connect ERP", 
              desc: "Borrower connects accounting software (QuickBooks/Stripe) to the protocol securely via OAuth. No manual document uploads.", 
              color: "from-blue-500 to-cyan-500", 
              shadow: "shadow-blue-500/20",
              align: "left"
            },
            { 
              step: 2, 
              title: "2. ZK Proof Generation", 
              desc: "A Zero-Knowledge cryptographic proof is generated locally, mathematically proving the invoice is valid without leaking your private client data to the public.", 
              color: "from-emerald-400 to-teal-500", 
              shadow: "shadow-emerald-500/20",
              align: "right"
            },
            { 
              step: 3, 
              title: "3. Smart Contract Execution", 
              desc: "KryonEscrow validates the ZK Proof on the Stellar Network via Soroban. The smart contract acts as the decentralized judge.", 
              color: "from-purple-500 to-indigo-500", 
              shadow: "shadow-purple-500/20",
              align: "left"
            },
            { 
              step: 4, 
              title: "4. Dynamic Price Oracle", 
              desc: "The protocol queries a live CoinGecko API oracle to instantly convert the fiat invoice value (e.g., PHP, USD) into the exact, to-the-second equivalent amount of XLM.", 
              color: "from-blue-500 to-indigo-400", 
              shadow: "shadow-blue-500/20",
              align: "right"
            },
            { 
              step: 5, 
              title: "5. Instant XLM Advance", 
              desc: "KryonLiquidity releases exactly 90% of the live XLM converted value instantly into the borrower's Freighter Wallet from its massive >100k XLM testnet treasury. No waiting 60 days.", 
              color: "from-amber-400 to-orange-500", 
              shadow: "shadow-amber-500/20",
              align: "left"
            },
            { 
              step: 6, 
              title: "6. Invoice Paid & Yield", 
              desc: "The Corporation pays the invoice on day 60. The remaining 10% is released to the borrower, minus a protocol fee distributed to LPs as yield.", 
              color: "from-rose-500 to-pink-600", 
              shadow: "shadow-rose-500/20",
              align: "right"
            }
          ].map((node, i) => (
            <motion.div 
              key={node.step}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.4 }}
              className={`relative flex items-center justify-between mb-16 md:mb-24 w-full ${
                node.align === 'left' ? 'md:flex-row-reverse' : 'md:flex-row'
              } flex-col`}
            >
              {/* Empty space for alternating layout */}
              <div className="hidden md:block w-5/12"></div>

              {/* Central Node */}
              <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center z-10 hidden md:flex">
                <motion.div 
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", delay: (i * 0.4) + 0.3 }}
                  className={`w-14 h-14 rounded-full bg-gradient-to-br ${node.color} shadow-lg ${node.shadow} border-4 border-white dark:border-slate-900 flex items-center justify-center`}
                >
                  <span className="text-white font-black text-xl">{node.step}</span>
                </motion.div>
                
                {/* Ping effect */}
                <motion.div 
                  className={`absolute inset-0 rounded-full bg-gradient-to-br ${node.color} -z-10`}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                />
              </div>

              {/* Content Card */}
              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                className={`w-full md:w-5/12 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl ${node.shadow} relative overflow-hidden group ml-12 md:ml-0 mt-8 md:mt-0`}
              >
                <div className={`absolute top-0 ${node.align === 'left' ? 'right-0' : 'left-0'} w-2 h-full bg-gradient-to-b ${node.color}`} />
                <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">{node.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">{node.desc}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
