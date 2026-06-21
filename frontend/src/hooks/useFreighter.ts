import { useState, useEffect } from 'react';
import { isConnected, requestAccess, getAddress } from '@stellar/freighter-api';
import { useStore } from '../store/useStore';

export const useFreighter = () => {
  const [hasFreighter, setHasFreighter] = useState(false);
  const { setWalletAddress, walletAddress, setBalance } = useStore();

  useEffect(() => {
    const checkInstallation = async () => {
      const connected: any = await isConnected();
      const isConn = !!(connected === true || (connected && connected.isConnected));
      setHasFreighter(isConn);
      if (isConn && localStorage.getItem('kryon_wallet_connected') === 'true') {
        connect();
      }
    };
    checkInstallation();
  }, []);

  const fetchBalance = async (pubKey: string) => {
    try {
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${pubKey}`);
      if (!response.ok) {
        setBalance("0.00");
        return;
      }
      const data = await response.json();
      const nativeBalance = data.balances.find((b: any) => b.asset_type === 'native');
      if (nativeBalance) {
        setBalance(parseFloat(nativeBalance.balance).toFixed(2));
      }
    } catch (e) {
      console.error(e);
      setBalance("0.00");
    }
  };

  useEffect(() => {
    if (!walletAddress) return;
    fetchBalance(walletAddress);
    const interval = setInterval(() => fetchBalance(walletAddress), 5000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  const connect = async () => {
    try {
      let access: any = await requestAccess();
      if (access && typeof access === 'object' && access.error) {
        console.error("Freighter access error:", typeof access.error === 'string' ? access.error : access.error.message || "User declined or access failed");
        return;
      }
      let keyResp: any = await getAddress();
      let key = typeof keyResp === 'object' && keyResp.address ? keyResp.address : keyResp;
      
      if (typeof key === 'string') {
        setWalletAddress(key);
        localStorage.setItem('kryon_wallet_connected', 'true');
      } else {
         console.error("Invalid key format returned from getAddress");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const disconnect = () => {
    setWalletAddress(null);
    setBalance(null);
    localStorage.removeItem('kryon_wallet_connected');
  };

  return { hasFreighter, connect, disconnect, walletAddress };
};
