"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface ZKProofStatusProps {
    status: 'idle' | 'generating' | 'verifying' | 'success' | 'error';
    title: string;
    errorMessage?: string;
}

export function ZKProofStatus({ status, title, errorMessage }: ZKProofStatusProps) {
    if (status === 'idle') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 backdrop-blur-md flex items-center justify-between"
            >
                <div className="flex items-center space-x-4">
                    {status === 'success' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : status === 'error' ? (
                        <div className="w-6 h-6 text-red-500 rounded-full border-2 border-red-500 flex items-center justify-center font-bold text-xs">X</div>
                    ) : (
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    )}
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {status === 'generating' && "Generating Zero Knowledge Proof locally..."}
                            {status === 'verifying' && "Verifying Proof on Soroban..."}
                            {status === 'success' && "ZK Proof successfully verified."}
                            {status === 'error' && (errorMessage || "Proof verification failed.")}
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
