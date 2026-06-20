import { create } from 'zustand';

interface AppState {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  balance: string | null;
  setBalance: (balance: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  isDemoMode: true,
  toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
  walletAddress: null,
  setWalletAddress: (address) => set({ walletAddress: address }),
  balance: null,
  setBalance: (balance) => set({ balance }),
}));
