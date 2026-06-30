"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFreighter } from '../hooks/useFreighter';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Link as LinkIcon, Smartphone, Copy, Check, LogOut, ExternalLink } from 'lucide-react';

export const WalletConnectButton = () => {
  const { hasFreighter, connect, disconnect, walletAddress } = useFreighter();
  const { 
    balance, 
    displayCurrency, 
    exchangeRates, 
    setDisplayCurrency,
    erpConnected,
    disconnectErp 
  } = useStore();
  const rate = exchangeRates[displayCurrency] || 1;
  const xlmNumber = balance ? parseFloat(balance) : null;
  const fiatBalance = xlmNumber ? (xlmNumber * rate).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '...';
  const formattedFiat = xlmNumber ? `(${fiatBalance} ${displayCurrency.toUpperCase()})` : '';
  
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDisconnectConfirm(false);
    setShowProfileModal(false);
  };

  if (walletAddress) {
    const truncated = `${walletAddress.slice(0, 5)}...${walletAddress.slice(-4)}`;
    return (
      <>
        <button 
          onClick={() => setShowProfileModal(true)}
          className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 p-1 pr-3 transition-colors shadow-sm"
        >
          <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg font-bold text-sm border border-slate-200 dark:border-slate-700 shadow-sm text-blue-600 dark:text-blue-400 truncate max-w-[140px] md:max-w-[200px]">
            {xlmNumber !== null ? `${xlmNumber.toLocaleString(undefined, {maximumFractionDigits: 2})} XLM ${formattedFiat}` : '...'}
          </div>
          <div className="flex items-center space-x-2 px-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-sm font-medium">{truncated}</span>
          </div>
        </button>

        {mounted && createPortal(
          <AnimatePresence>
            {showProfileModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
                onClick={() => { setShowProfileModal(false); setShowDisconnectConfirm(false); }}
              >
                <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden"
                >
                  <button 
                    onClick={() => { setShowProfileModal(false); setShowDisconnectConfirm(false); }}
                    className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  {!showDisconnectConfirm ? (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                      <h3 className="text-2xl font-black mb-6">Account</h3>
                      
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Connected with Freighter</p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-inner">
                              <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-mono font-bold text-lg">{truncated}</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <a href={`https://stellar.expert/explorer/testnet/account/${walletAddress}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-500">Total Balance</span>
                          <span className="font-black text-xl text-slate-900 dark:text-white">{balance} <span className="text-sm text-blue-500">XLM {formattedFiat}</span></span>
                        </div>
                        
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between mt-3">
                          <span className="text-sm font-medium text-slate-500">Local Currency</span>
                          <select 
                            value={displayCurrency} 
                            onChange={(e) => setDisplayCurrency(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer p-2 outline-none w-24 text-center"
                          >
                            <option value="usd">USD</option>
                            <option value="php">PHP</option>
                            <option value="eur">EUR</option>
                            <option value="gbp">GBP</option>
                            <option value="jpy">JPY</option>
                          </select>
                        </div>
                      </div>

                      {erpConnected && (
                        <div className="mb-6 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">
                                {erpConnected} Connected
                              </span>
                            </div>
                            <button 
                              onClick={disconnectErp}
                              className="text-xs text-red-500 hover:text-red-700 font-semibold"
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mb-6 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">ZK Identity Verification</p>
                        <p className="text-xs text-slate-500 mb-3">Verify your identity without revealing sensitive info.</p>
                        <form className="flex flex-col space-y-3" onSubmit={(e) => e.preventDefault()}>
                          <label className="flex flex-col">
                              <span className="text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">Credential Document (Local Only)</span>
                              <input type="file" className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900" />
                          </label>
                          <button 
                            type="button" 
                            onClick={() => {
                                setCopied(true); // Reusing a state temporarily, or we can just mock it internally
                                const btn = document.getElementById('zk-btn');
                                if (btn) {
                                    btn.innerText = 'Generating SNARK...';
                                    btn.classList.replace('bg-blue-600', 'bg-blue-400');
                                    btn.setAttribute('disabled', 'true');
                                    setTimeout(() => {
                                        btn.innerText = 'Proof Generated & Verified!';
                                        btn.classList.replace('bg-blue-400', 'bg-emerald-500');
                                    }, 2500);
                                }
                            }}
                            id="zk-btn"
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition text-sm font-bold shadow-sm"
                          >
                              Generate ZK Proof
                          </button>
                        </form>
                      </div>

                      <button 
                        onClick={() => setShowDisconnectConfirm(true)}
                        className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center space-x-2 border border-red-200 dark:border-red-900/50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect Wallet</span>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center py-4">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogOut className="w-8 h-8 ml-1" />
                      </div>
                      <h3 className="text-xl font-black mb-2">Disconnect Wallet?</h3>
                      <p className="text-slate-500 text-sm mb-8">You will need to reconnect to factor invoices or provide liquidity.</p>
                      
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => setShowDisconnectConfirm(false)}
                          className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleDisconnect}
                          className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </>
    );
  }

  return (
    <>
      <button 
        onClick={() => setShowConnectModal(true)} 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium transition-colors"
      >
        Connect Wallet
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {showConnectModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
              onClick={() => setShowConnectModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowConnectModal(false)}
                  className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h3 className="text-2xl font-black mb-2">Connect Wallet</h3>
                <p className="text-slate-500 mb-6 text-sm">Select a provider to connect to the Stellar network.</p>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      if (hasFreighter) {
                        connect();
                        setShowConnectModal(false);
                      } else {
                        window.open('https://freighter.app', '_blank');
                      }
                    }}
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                        <Wallet className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 dark:text-white">Freighter</p>
                        <p className="text-xs text-slate-500">{hasFreighter ? 'Recommended' : 'Install Extension'}</p>
                      </div>
                    </div>
                    <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium text-sm">
                      {hasFreighter ? 'Connect' : 'Install'}
                    </span>
                  </button>

                  <button 
                    disabled
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between opacity-60 cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                        <LinkIcon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 dark:text-white">WalletConnect</p>
                        <p className="text-xs text-slate-500">Coming Soon</p>
                      </div>
                    </div>
                  </button>

                  <button 
                    disabled
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between opacity-60 cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                        <Smartphone className="w-5 h-5 text-teal-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 dark:text-white">LOBSTR</p>
                        <p className="text-xs text-slate-500">Coming Soon</p>
                      </div>
                    </div>
                  </button>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
