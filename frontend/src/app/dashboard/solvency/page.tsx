"use client";
import React, { useState } from 'react';
import { ShieldCheck, BarChart3 } from 'lucide-react';
import { ZKProofStatus } from '../../../components/ZKProofStatus';

export default function SolvencyPage() {
    const [status, setStatus] = useState<'idle' | 'generating' | 'verifying' | 'success' | 'error'>('idle');

    const handleVerify = () => {
        setStatus('generating');
        setTimeout(() => {
            setStatus('verifying');
            setTimeout(() => {
                setStatus('success');
            }, 1500);
        }, 1500);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-black mb-8 flex items-center space-x-3">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
                <span>Proof of Solvency</span>
            </h1>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl mb-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold mb-2">Protocol Reserves</h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Cryptographic attestation that protocol assets exceed liabilities.
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-bold text-slate-400">LAST ATTESTED</div>
                        <div className="text-lg font-mono text-emerald-500">Today, 09:41 UTC</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <div className="text-sm font-bold text-slate-500 mb-1">Assets Commitment Hash</div>
                        <div className="font-mono text-xs truncate">0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08</div>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <div className="text-sm font-bold text-slate-500 mb-1">Liabilities Commitment Hash</div>
                        <div className="font-mono text-xs truncate">0x4c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a089f86d08188</div>
                    </div>
                </div>

                <button 
                    onClick={handleVerify}
                    disabled={status === 'generating' || status === 'verifying'}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg mb-6"
                >
                    Verify Latest Attestation Locally
                </button>

                <ZKProofStatus status={status} title="Solvency Proof Verification" />
            </div>
        </div>
    );
}
