"use client";
import { useState } from 'react';
import { useStore } from '../../../store/useStore';
import { useFreighter } from '../../../hooks/useFreighter';
import { submitFactoringRequest } from '../../../utils/sorobanService';
import { CheckCircle2, Loader2, FileText, ChevronRight, Zap, XCircle } from 'lucide-react';
import { TransactionHistory } from '../../../components/TransactionHistory';
import { motion, AnimatePresence } from 'framer-motion';

export default function BorrowerDashboard() {
  const { isDemoMode } = useStore();
  const { walletAddress } = useFreighter();
  const [loadingStep, setLoadingStep] = useState(0);
  const [successHash, setSuccessHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [erpConnected, setErpConnected] = useState<'stripe' | 'quickbooks' | 'erpnext' | false>(false);
  const [isConnectingErp, setIsConnectingErp] = useState<'stripe' | 'quickbooks' | 'erpnext' | false>(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [liveInvoices, setLiveInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');

  const fetchLiveInvoices = async (provider: 'stripe' | 'quickbooks' | 'erpnext') => {
    setIsConnectingErp(provider);
    try {
      const res = await fetch(`/api/invoices/${provider}`);
      const json = await res.json();
      if (json.success) {
        setLiveInvoices(json.data);
        if (json.data.length > 0) setSelectedInvoice(json.data[0].id);
        setErpConnected(provider);
      } else {
        setErrorMsg(`Failed to fetch from ${provider}: ${json.error}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsConnectingErp(false);
    }
  };

  const initiateFactor = () => {
    if (!walletAddress) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }
    setIsConfirming(true);
  };

  const executeFactor = async () => {
    setIsConfirming(false);
    setLoadingStep(1);
    setErrorMsg(null);
    await new Promise(r => setTimeout(r, 1000));
    setLoadingStep(2);
    await new Promise(r => setTimeout(r, 1000));
    setLoadingStep(3);
    
    try {
      let faceValue = 50000;
      if (!isDemoMode && erpConnected) {
        const inv = liveInvoices.find(i => i.id === selectedInvoice);
        if (inv) faceValue = inv.amount_due;
      }
      
      const hash = await submitFactoringRequest(selectedInvoice || "mock_hash_12345", faceValue, walletAddress || "", isDemoMode);
      
      if (!isDemoMode && erpConnected) {
        const inv = liveInvoices.find(i => i.id === selectedInvoice);
        
        // Fetch live exchange rate from CoinGecko
        let xlmRate = 0.1; // Fallback rate (1 XLM = $0.10)
        let currency = inv?.currency?.toLowerCase() || 'usd';
        
        try {
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=${currency}`);
          const data = await res.json();
          if (data && data.stellar && data.stellar[currency]) {
            xlmRate = data.stellar[currency];
          }
        } catch(e) {
          console.warn("Failed to fetch live XLM price, using fallback.");
        }

        // Calculate exact XLM advance
        let advanceAmountInXlm = (faceValue / xlmRate) * 0.9;
        
        const payoutRes = await fetch('/api/factor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination: walletAddress, amount: advanceAmountInXlm.toFixed(7) })
        });
        const payoutJson = await payoutRes.json();
        
        if (!payoutJson.success) {
          throw new Error("ZK Proof Validated, but Treasury payout failed: " + payoutJson.error);
        }
        
        setSuccessHash(payoutJson.hash); // Show the actual payment hash!
      } else {
        setSuccessHash(hash);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Factoring failed. Did you decline the prompt?");
    } finally {
      setLoadingStep(0);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -z-10" />
      
      <div className="flex flex-col md:flex-row gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full md:w-72 flex-shrink-0 space-y-4"
        >
          <div className="p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Connected Wallet</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="font-mono text-sm truncate font-medium text-slate-700 dark:text-slate-300">
                {walletAddress || "Not Connected"}
              </p>
            </div>
          </div>
          
          <div className="relative overflow-hidden p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl text-white shadow-xl shadow-blue-900/20">
            <div className="absolute top-0 right-0 p-4 opacity-20"><Zap className="w-24 h-24" /></div>
            <h2 className="text-sm font-semibold opacity-90 mb-2 relative z-10">Available Credit Line</h2>
            <p className="text-4xl font-black relative z-10 tracking-tight">150,000 <span className="text-2xl text-blue-200">XLM</span></p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 space-y-6"
        >
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-none p-8 relative overflow-hidden">
            <h2 className="text-3xl font-black mb-8 tracking-tight">Factor an Invoice</h2>
            
            <AnimatePresence mode="wait">
              {isDemoMode ? (
                <motion.div 
                  key="demo"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-900/10">
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                      <p className="text-amber-600 dark:text-amber-500 text-sm font-bold tracking-wide uppercase">Mock ERP Connection</p>
                    </div>
                    <select className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-shadow cursor-pointer shadow-sm">
                      <option>Invoice #1042 - Apple Inc. - $50,000</option>
                      <option>Invoice #1043 - Google LLC - $25,000</option>
                      <option>Invoice #1044 - Amazon - $100,000</option>
                    </select>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="live"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  {!erpConnected ? (
                    <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center shadow-inner">
                      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <FileText className="w-8 h-8 text-blue-500" />
                      </div>
                      <h3 className="font-bold text-xl mb-2">Connect your ERP</h3>
                      <p className="text-slate-500 text-sm mb-6 max-w-xs">Link Stripe or QuickBooks to fetch live, verifiable invoice data.</p>
                      
                      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full justify-center">
                        <button 
                          onClick={() => fetchLiveInvoices('stripe')}
                          disabled={isConnectingErp !== false}
                          className="px-6 py-3 bg-[#635BFF] text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-70 disabled:hover:scale-100 flex-1 max-w-[200px]"
                        >
                          {isConnectingErp === 'stripe' ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /><span>Authenticating...</span></>
                          ) : (
                            <span>Stripe (Test)</span>
                          )}
                        </button>
                        
                        <button 
                          onClick={() => fetchLiveInvoices('quickbooks')}
                          disabled={isConnectingErp !== false}
                          className="px-6 py-3 bg-[#2CA01C] text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-70 disabled:hover:scale-100 flex-1 max-w-[200px]"
                        >
                          {isConnectingErp === 'quickbooks' ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /><span>Authenticating...</span></>
                          ) : (
                            <span>QuickBooks</span>
                          )}
                        </button>

                        <button 
                          onClick={() => fetchLiveInvoices('erpnext')}
                          disabled={isConnectingErp !== false}
                          className="px-6 py-3 bg-[#0089FF] text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-70 disabled:hover:scale-100 flex-1 max-w-[200px]"
                        >
                          {isConnectingErp === 'erpnext' ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /><span>Authenticating...</span></>
                          ) : (
                            <span>ERPNext</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700/50 bg-emerald-50/50 dark:bg-emerald-900/10">
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <p className="text-emerald-600 dark:text-emerald-500 text-sm font-bold tracking-wide uppercase">
                          {erpConnected === 'stripe' ? 'Stripe Connected (Live)' : erpConnected === 'quickbooks' ? 'QuickBooks Connected (Live)' : 'ERPNext Connected (Live)'}
                        </p>
                      </div>
                      <select 
                        className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow cursor-pointer shadow-sm"
                        value={selectedInvoice}
                        onChange={(e) => setSelectedInvoice(e.target.value)}
                      >
                        {liveInvoices.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.invoice_number} - {inv.customer_name} - {new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency || 'USD' }).format(inv.amount_due)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              whileHover={loadingStep === 0 && (isDemoMode || erpConnected) ? { scale: 1.02 } : {}}
              whileTap={loadingStep === 0 && (isDemoMode || erpConnected) ? { scale: 0.98 } : {}}
              onClick={initiateFactor}
              disabled={loadingStep > 0 || (!isDemoMode && !erpConnected)}
              className={`mt-8 w-full py-5 rounded-2xl text-lg font-bold text-white transition-all shadow-xl flex items-center justify-center space-x-3 
                ${isDemoMode ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20' 
                             : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20'} 
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loadingStep > 0 ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="tracking-wide">
                    {loadingStep === 1 && "Notarizing API Data..."}
                    {loadingStep === 2 && "Generating ZK Proof..."}
                    {loadingStep === 3 && "Minting on Soroban..."}
                  </span>
                </>
              ) : (
                <>
                  <span>Generate ZK Proof & Factor</span>
                  <ChevronRight className="w-6 h-6" />
                </>
              )}
            </motion.button>
          </div>

          <TransactionHistory />

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
                  <h3 className="text-3xl font-black mb-3 tracking-tight">Confirm Factoring</h3>
                  <p className="text-slate-500 mb-8 leading-relaxed">You are about to generate a ZK proof and factor this invoice for an instant XLM advance. Proceed?</p>
                  
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => setIsConfirming(false)} 
                      className="w-1/2 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={executeFactor} 
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
                  <h3 className="text-3xl font-black mb-3 tracking-tight">XLM Deposited!</h3>
                  <p className="text-slate-500 mb-8 leading-relaxed">
                    The requested XLM has been instantly advanced to your Freighter wallet.
                  </p>
                  
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
        </motion.div>
      </div>
    </div>
  );
}
