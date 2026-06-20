import { signTransaction } from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';
import { KRYON_NETWORK_CONFIG } from '../constants';

// Helper to execute a native XLM transaction on Testnet to verify Freighter + Live Network
const executeTestnetTransaction = async (publicKey: string, amount: string, isPaymentToTreasury: boolean = true): Promise<string> => {
  try {
    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
    const account = await server.loadAccount(publicKey);
    const fee = await server.fetchBaseFee();

    // A mock treasury address on testnet
    const TREASURY_ADDRESS = "GBWY47I7ECEDE4Y56J6CBS6P4ZGG7I72CSCS5PXSQS6IBWNQVXWYZKYG";

    let operation;
    if (isPaymentToTreasury) {
      operation = StellarSdk.Operation.payment({
        destination: TREASURY_ADDRESS,
        asset: StellarSdk.Asset.native(),
        amount: amount, 
      });
    } else {
      // For factoring requests, the user shouldn't SEND money. 
      // We simulate the smart contract invocation using a ManageData operation so it costs 0 XLM but generates a real hash.
      operation = StellarSdk.Operation.manageData({
        name: "FactoringRequest",
        value: "Requested Advance",
      });
    }

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: fee.toString(),
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(operation)
    .setTimeout(60)
    .build();

    const xdr = transaction.toXDR();
    
    // Request Freighter to sign it
    const signedResp: any = await signTransaction(xdr, { 
      network: "TESTNET",
      networkPassphrase: StellarSdk.Networks.TESTNET
    });
    
    if (signedResp && typeof signedResp === 'object' && signedResp.error) {
      const errMsg = typeof signedResp.error === 'string' ? signedResp.error : JSON.stringify(signedResp.error);
      throw new Error(errMsg);
    }
    
    const finalSignedXdr = typeof signedResp === 'string' ? signedResp : signedResp.signedTxXdr || signedResp.signedTx || signedResp.signedTransaction || signedResp.transaction;

    if (!finalSignedXdr || typeof finalSignedXdr !== 'string') {
      throw new Error("Failed to sign transaction: " + JSON.stringify(signedResp));
    }

    const signedTx = StellarSdk.TransactionBuilder.fromXDR(finalSignedXdr, StellarSdk.Networks.TESTNET);
    
    // Submit to Horizon Testnet
    const response = await server.submitTransaction(signedTx);
    return response.hash;
  } catch (err) {
    console.error("Testnet transaction failed:", err);
    throw err;
  }
};

export const depositLiquidity = async (amount: number, publicKey: string, isDemo: boolean): Promise<string> => {
  if (isDemo) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`mock_hash_lp_deposit_${Date.now()}`);
      }, 2000);
    });
  }

  // Format amount securely (e.g., 50 -> "50.0000000")
  const formattedAmount = Number(amount).toFixed(7);

  // Live Mode: Execute a real Stellar Testnet Transaction using the actual amount
  return await executeTestnetTransaction(publicKey, formattedAmount); 
};

export const submitFactoringRequest = async (invoiceHash: string, faceValue: number, publicKey: string, isDemo: boolean): Promise<string> => {
  if (isDemo) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`mock_hash_escrow_factor_${Date.now()}`);
      }, 3000);
    });
  }

  // Live Mode: The borrower is receiving funds, not sending them!
  // To get a real blockchain hash without taking money from the borrower, we simulate the smart contract invocation using a ManageData operation (which costs 0 XLM).
  // The 'false' flag tells the helper to use ManageData instead of Payment.
  return await executeTestnetTransaction(publicKey, "0", false);
};
