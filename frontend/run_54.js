import { Keypair, Server, TransactionBuilder, Networks, Contract, xdr, Asset, Operation } from '@stellar/stellar-sdk';
import fs from 'fs';

const server = new Server('https://soroban-testnet.stellar.org');
const networkPassphrase = Networks.TESTNET;

// We need the contract ID and token ID
const CONTRACT_ID = process.env.CONTRACT_ID || "REPLACE_ME";
const XLM_TOKEN_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'; // native testnet token

async function fundAccount(publicKey) {
  const response = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`);
  if (!response.ok) {
    throw new Error(`Failed to fund account ${publicKey}: ${response.statusText}`);
  }
}

async function runInteractions() {
  const csvData = ['Wallet Address,Transaction Hash,Stellar Expert Link,Status'];
  const NUM_ACCOUNTS = 54;
  
  console.log(`Starting generation of ${NUM_ACCOUNTS} accounts...`);
  
  for (let i = 0; i < NUM_ACCOUNTS; i++) {
    let success = false;
    let retries = 0;
    while (!success && retries < 5) {
      try {
        const kp = Keypair.random();
        console.log(`[${i+1}/${NUM_ACCOUNTS}] Created account: ${kp.publicKey()}`);
        
        await fundAccount(kp.publicKey());
        console.log(`  - Funded account ${kp.publicKey()}`);
        
        // Let's do a deposit interaction.
        const account = await server.getAccount(kp.publicKey());
        const contract = new Contract(CONTRACT_ID);
        
        // Deposit 1 XLM (10000000 stroops)
        const amount = xdr.ScVal.scvI128(new xdr.Int128Parts({
          hi: new xdr.Int64(0, 0),
          lo: new xdr.Uint64(10000000, 0)
        }));
        
        const depositOp = contract.call(
          'deposit',
          xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(kp.xdrPublicKey())),
          xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeContract(Buffer.from(XLM_TOKEN_ID, 'hex'))), // might need proper encoding for address
          amount
        );

        // wait this requires proper ScVal encoding for address. 
        // A simpler way is to use Soroban client, but stellar-sdk is enough if we encode it properly.
        // Actually, we can use the native builder if we use the right sdk versions.
        
      } catch (err) {
        console.error(`  - Failed: ${err.message}. Retrying...`);
        retries++;
      }
    }
  }
}

runInteractions();
