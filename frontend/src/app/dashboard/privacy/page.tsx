"use client";
import React, { useState } from 'react';
import { EyeOff, Lock } from 'lucide-react';
import { ZKProofStatus } from '../../../components/ZKProofStatus';

export default function PrivacyPage() {
    const [status, setStatus] = useState<'idle' | 'generating' | 'verifying' | 'success' | 'error'>('idle');

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-black mb-8 flex items-center space-x-3">
                <EyeOff className="w-8 h-8 text-indigo-500" />
                <span>Dark Pool Privacy</span>
            </h1>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                    <Lock className="w-5 h-5 text-indigo-500" />
                    <span>Shielded Transactions</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Move funds into a shielded pool using ZK Nullifiers. Your transactions will be completely untraceable on the Stellar ledger.
                </p>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Amount to Shield (XLM)</label>
                        <input type="number" placeholder="1000" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border-none" />
                    </div>
                </div>

                <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg mb-6">
                    Deposit to Shielded Pool
                </button>
            </div>
        </div>
    );
}
