import Link from 'next/link';
import { Twitter, Github, Disc as Discord } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white flex items-center group mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-indigo-600 group-hover:to-emerald-500 transition-all duration-500">Kryon</span>
              <span className="ml-1 opacity-80">Network</span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Decentralized Accounts Receivable factoring powered by Stellar, Soroban, and Zero-Knowledge Cryptography.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Protocol</h4>
            <ul className="space-y-2 font-medium">
              <li><Link href="/docs" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">Documentation</Link></li>
              <li><Link href="/dashboard/borrower" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">SMB Dashboard</Link></li>
              <li><Link href="/dashboard/lp" className="text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors">LP Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Community</h4>
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://github.com/PrinceDale99/Kryon" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-500 transition-colors">
                <Discord className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} Kryon Network. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0 text-sm font-bold">
            <span className="text-slate-500">Built on Stellar</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-500">Secured by Noir ZK</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
