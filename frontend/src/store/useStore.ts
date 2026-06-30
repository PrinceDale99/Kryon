import { create } from 'zustand';

interface AppState {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  balance: string | null;
  setBalance: (balance: string | null) => void;
  displayCurrency: string;
  setDisplayCurrency: (c: string) => void;
  exchangeRates: Record<string, number>;
  fetchExchangeRates: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  isDemoMode: true,
  toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
  walletAddress: null,
  setWalletAddress: (address) => set({ walletAddress: address }),
  balance: null,
  setBalance: (balance) => set({ balance }),
  displayCurrency: 'php',
  setDisplayCurrency: (c) => set({ displayCurrency: c.toLowerCase() }),
  exchangeRates: { usd: 0.1, php: 5.2, eur: 0.09, gbp: 0.08, jpy: 15.0 }, // fallback
  fetchExchangeRates: async () => {
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd,php,eur,gbp,jpy`);
      const data = await res.json();
      if (data && data.stellar) {
        set({ exchangeRates: data.stellar });
      }
    } catch (e) {
      console.warn("Failed to fetch exchange rates", e);
    }
  }
}));
