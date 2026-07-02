"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '../store/useStore';
import { WalletConnectButton } from './WalletConnectButton';
import { motion } from 'framer-motion';

export const Navbar = () => {
  const { isDemoMode, toggleDemoMode, fetchExchangeRates } = useStore();

  useEffect(() => {
    fetchExchangeRates();
    const interval = setInterval(fetchExchangeRates, 10000);
    return () => clearInterval(interval);
  }, [fetchExchangeRates]);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 w-full z-50 border-b transition-colors duration-500 ${isDemoMode ? 'bg-amber-50/80 border-amber-200/50 dark:bg-slate-900/80 dark:border-amber-900/30' : 'bg-white/80 border-slate-200/50 dark:bg-slate-950/80 dark:border-slate-800/50'} backdrop-blur-xl`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center space-x-10">
            <Link href="/" className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white flex items-center group">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-indigo-600 group-hover:to-emerald-500 transition-all duration-500">Kryon</span>
              <span className="ml-1 opacity-80">Network</span>
            </Link>
            <div className="hidden md:flex space-x-8">
              <Link href="/docs" className="text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-white text-sm font-bold tracking-wide transition-colors">Docs</Link>
              <Link href="/dashboard/borrower" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white text-sm font-bold tracking-wide transition-colors">SMB Dashboard</Link>
              <Link href="/dashboard/lp" className="text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-white text-sm font-bold tracking-wide transition-colors">LP Dashboard</Link>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 ${isDemoMode ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                {isDemoMode ? 'Demo' : 'Live'}
              </span>
              <button 
                onClick={toggleDemoMode}
                className={`w-14 h-7 rounded-full relative transition-colors duration-500 shadow-inner ${isDemoMode ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700'}`}
              >
                <motion.div 
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-md ${isDemoMode ? 'left-1' : 'left-8'}`}
                />
              </button>
            </div>
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
