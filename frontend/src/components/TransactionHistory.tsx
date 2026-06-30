"use client";
import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { ExternalLink, ArrowRightLeft, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TransactionHistory = () => {
  const { walletAddress, isDemoMode, displayCurrency, exchangeRates } = useStore();
  const rate = exchangeRates[displayCurrency] || 1;
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!walletAddress) {
      setHistory([]);
      return;
    }

    if (isDemoMode) {
      setHistory([
        { id: "mock_1", type: "Liquidity Deposit", amount: "5,000 XLM", amountRaw: 5000, date: "Just now", status: "success" },
        { id: "mock_2", type: "Invoice Factored", amount: "45,000 XLM", amountRaw: 45000, date: "2 mins ago", status: "success" },
        { id: "mock_3", type: "Yield Payout", amount: "120 XLM", amountRaw: 120, date: "1 hour ago", status: "success" },
      ]);
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${walletAddress}/operations?order=desc&limit=5`);
        if (res.ok) {
          const data = await res.json();
          const parsed = data._embedded.records.map((r: any) => ({
            id: r.transaction_hash,
            type: r.type === 'payment' ? 'XLM Payment' : (r.type === 'manage_data' ? 'Factoring Request' : r.type),
            amount: r.type === 'manage_data' ? 'Pending Advance' : (r.amount ? `${r.amount} XLM` : 'Contract Invoke'),
            amountRaw: r.amount ? parseFloat(r.amount) : null,
            date: new Date(r.created_at).toLocaleString(),
            status: "success",
            link: `https://stellar.expert/explorer/testnet/tx/${r.transaction_hash}`
          }));
          setHistory(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, [walletAddress, isDemoMode]);

  if (!walletAddress) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none p-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-black tracking-tight flex items-center">
          <Activity className="w-6 h-6 mr-3 text-blue-500" /> 
          Live Activity Feed
        </h3>
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </div>
      
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 text-sm font-medium">No recent transactions found on Testnet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {history.map((tx, idx) => (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-blue-500 transition-colors">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{tx.type}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-500">{tx.amount}</p>
                  {tx.amountRaw && (
                    <p className="text-xs font-bold text-slate-400 mt-0.5">({(tx.amountRaw * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {displayCurrency.toUpperCase()})</p>
                  )}
                  {tx.link ? (
                    <a href={tx.link} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center justify-end mt-2 transition-colors">
                      View on Stellar Expert <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  ) : (
                    <p className="text-xs font-bold text-amber-500 mt-2 uppercase tracking-widest">Mock TX</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
