"use client";
import React, { useState } from 'react';
import { useFreighter } from '../../../hooks/useFreighter';
import { ZKProofStatus } from '../../../components/ZKProofStatus';
import { ShieldCheck, Fingerprint } from 'lucide-react';

export default function IdentityPage() {
    const { walletAddress } = useFreighter();
    const [status, setStatus] = useState<'idle' | 'generating' | 'verifying' | 'success' | 'error'>('idle');

    const handleGenerateKYC = async () => {
        setStatus('generating');
        // Simulate proof generation
        setTimeout(() => {
            setStatus('verifying');
            // Simulate verification
            setTimeout(() => {
                setStatus('success');
            }, 2000);
        }, 2000);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-black mb-8 flex items-center space-x-3">
                <Fingerprint className="w-8 h-8 text-blue-500" />
                <span>Zero Knowledge Identity</span>
            </h1>
            
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
                <h2 className="text-xl font-bold mb-4">KYC Accreditation</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Generate a ZK Proof to prove you meet the income requirements for accredited investing, without revealing your actual income or identity to the network.
                </p>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Annual Income (Private)</label>
                        <input type="number" placeholder="$250,000" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border-none" />
                    </div>
                </div>

                <button 
                    onClick={handleGenerateKYC}
                    disabled={status === 'generating' || status === 'verifying'}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg mb-6 disabled:opacity-50"
                >
                    Generate & Submit Proof
                </button>

                <ZKProofStatus status={status} title="KYC Credential Proof" />
            </div>
        </div>
    );
}
