"use client";
import { useState, useEffect } from 'react';
import { useStore } from '../../../store/useStore';
import { useFreighter } from '../../../hooks/useFreighter';
import { depositLiquidity } from '../../../utils/sorobanService';
import { ArrowUpRight, TrendingUp, Layers, Droplets, XCircle, CheckCircle2 } from 'lucide-react';
import { TransactionHistory } from '../../../components/TransactionHistory';
import { motion, AnimatePresence } from 'framer-motion';

export default function LPDashboard() {
  const { isDemoMode, displayCurrency, exchangeRates } = useStore();
  const { walletAddress } = useFreighter();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successHash, setSuccessHash] = useState<string | null>(null);
  const [successAmount, setSuccessAmount] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState<string>('--');
  const [treasuryBalanceRaw, setTreasuryBalanceRaw] = useState<number>(0);

  useEffect(() => {
    if (isDemoMode) {
      setTreasuryBalance("2.45M");
      setTreasuryBalanceRaw(2450000);
      return;
    }
    const fetchTVL = async () => {
      try {
        const TREASURY = "GCO5RGVLRVNIF42JRQYCOCIC4Z66W2WIBVO3EMEUIM4LYHPOIM5KPGSG";
        const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${TREASURY}`);
        if (res.ok) {
          const data = await res.json();
          const native = data.balances.find((b: any) => b.asset_type === 'native');
          if (native) {
            const num = parseFloat(native.balance);
            setTreasuryBalanceRaw(num);
            if (num > 1000000) {
              setTreasuryBalance((num / 1000000).toFixed(2) + 'M');
            } else if (num > 1000) {
              setTreasuryBalance((num / 1000).toFixed(1) + 'k');
            } else {
              setTreasuryBalance(num.toLocaleString());
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch TVL", e);
      }
    };
    fetchTVL();
    const interval = setInterval(fetchTVL, 10000);
    return () => clearInterval(interval);
  }, [isDemoMode]);

  const initiateDeposit = () => {
    if (!walletAddress) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    setIsConfirming(true);
  };

  const executeDeposit = async () => {
    setIsConfirming(false);
    setLoading(true);
    setErrorMsg(null);
    try {
      const hash = await depositLiquidity(Number(amount), walletAddress || "", isDemoMode);
      setSuccessHash(hash);
      setSuccessAmount(amount);
      setAmount('');
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Deposit transaction failed. Did you decline the prompt?");
    } finally {
      setLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" } }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 relative">
      <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-black tracking-tight mb-2">Liquidity Provider Portal</h1>
        <p className="text-slate-500 text-lg font-medium">Fund SMB invoices and earn yield securely on Soroban.</p>
      </motion.div>

      {/* Metrics Row */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
      >
        <motion.div variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Layers className="w-24 h-24 text-blue-500" /></div>
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><Layers className="w-6 h-6" /></div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Value Locked</h3>
          </div>
          <div>
            <p className="text-5xl font-black tracking-tighter">{isDemoMode ? "2.45M" : treasuryBalance} <span className="text-2xl text-slate-400 font-medium tracking-normal">XLM</span></p>
            <p className="text-sm font-bold text-slate-400 mt-2">({treasuryBalanceRaw ? (treasuryBalanceRaw * (exchangeRates[displayCurrency] || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '...'} {displayCurrency.toUpperCase()})</p>
          </div>
        </motion.div>
        
        <motion.div variants={item} className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-3xl text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-24 h-24 text-white" /></div>
          <div className="flex items-center space-x-4 mb-6 relative z-10">
            <div className="p-3 bg-white/20 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
            <h3 className="text-sm font-bold opacity-90 uppercase tracking-widest">Current APY</h3>
          </div>
          <p className="text-5xl font-black relative z-10 tracking-tighter">{isDemoMode ? "7.5%" : "--"}</p>
        </motion.div>

        <motion.div variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ArrowUpRight className="w-24 h-24 text-purple-500" /></div>
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl"><ArrowUpRight className="w-6 h-6" /></div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Invoices</h3>
          </div>
          <p className="text-5xl font-black tracking-tighter">{isDemoMode ? "142" : "--"}</p>
        </motion.div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Deposit Interface */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full lg:w-1/3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none p-8"
        >
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black">Provide Liquidity</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Amount to Deposit</label>
              <div className="relative group">
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-3xl font-bold p-5 pr-20 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">XLM</div>
              </div>
            </div>
            <motion.button 
              whileHover={!loading && amount ? { scale: 1.02 } : {}}
              whileTap={!loading && amount ? { scale: 0.98 } : {}}
              onClick={initiateDeposit}
              disabled={loading || !amount || isNaN(Number(amount)) || Number(amount) <= 0}
              className={`w-full py-5 rounded-2xl text-lg font-bold text-white transition-all shadow-xl 
                ${isDemoMode ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20' 
                             : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20'} 
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
            >
              {loading ? "Processing..." : "Deposit XLM"}
            </motion.button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full lg:w-2/3"
        >
          <TransactionHistory />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none p-8"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="w-full md:w-1/2">
            <h2 className="text-2xl font-black mb-3">Proof of Solvency</h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-6">
              Cryptographically prove that Kryon's assets exceed its liabilities without disclosing the exact amounts.
              Ideal for institutional partners and liquidity providers verifying the Treasury's health.
            </p>
          </div>
          <div className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <form className="flex flex-col space-y-4">
              <label className="flex flex-col">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Asset Commitment Hash</span>
                <input type="text" placeholder="0x..." className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 outline-none focus:border-emerald-500 transition-colors font-mono text-sm" />
              </label>
              <label className="flex flex-col">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Liability Commitment Hash</span>
                <input type="text" placeholder="0x..." className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 outline-none focus:border-emerald-500 transition-colors font-mono text-sm" />
              </label>
              <button type="button" className="bg-emerald-600 text-white py-3 px-4 rounded-xl hover:bg-emerald-700 transition font-bold shadow-lg shadow-emerald-500/20 mt-2">
                Verify Solvency on Stellar
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isConfirming && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center relative overflow-hidden"
            >
              <h3 className="text-3xl font-black mb-3 tracking-tight">Confirm Deposit</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">Are you sure you want to deposit <span className="font-bold text-blue-500">{amount} XLM</span> into the liquidity pool?</p>
              
              <div className="flex space-x-4">
                <button 
                  onClick={() => setIsConfirming(false)} 
                  className="w-1/2 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDeposit} 
                  className="w-1/2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {successHash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <h3 className="text-3xl font-black mb-3 tracking-tight">Deposit Successful!</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">Your <span className="font-bold text-blue-500">{Number(successAmount).toLocaleString()} XLM</span> has been added to the liquidity pool.</p>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl mb-8 break-all shadow-inner">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction Hash</p>
                <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{successHash}</p>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSuccessHash(null)} 
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg"
              >
                Done
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-rose-600" />
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <XCircle className="w-10 h-10" />
              </motion.div>
              <h3 className="text-3xl font-black mb-3 tracking-tight">Transaction Failed</h3>
              <p className="text-slate-500 mb-8 leading-relaxed px-4">{errorMsg}</p>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setErrorMsg(null)} 
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg"
              >
                Dismiss
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
