import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '../components/Navbar';

import { Background } from '../components/Background';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kryon Network - Accounts Receivable Factoring',
  description: 'Factor invoices for instant XLM payouts using simulated Zero-Knowledge proofs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 dark:bg-slate-950">
      <body className={`${inter.className} h-full antialiased text-slate-900 dark:text-slate-100`}>
        <Background />
        <Navbar />
        <main className="pt-16 min-h-screen relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
