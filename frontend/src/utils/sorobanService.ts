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

export const submitFactoringRequest = async (
    invoiceId: string,
    faceValue: number,
    publicKey: string,
    isDemo: boolean,
    invoiceSecret?: string,
    nullifierSecret?: string,
): Promise<string> => {
    if (isDemo) {
        return new Promise(resolve => setTimeout(() =>
            resolve(`demo_zk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`), 3000
        ));
    }

    // Step 1: Generate inputs
    const secret = invoiceSecret || crypto.randomUUID().replace(/-/g, '');
    const nullSecret = nullifierSecret || crypto.randomUUID().replace(/-/g, '');
    const advanceRequested = Math.floor(faceValue * 0.9);

    // Step 2: Generate proof + oracle attestation
    const proveResponse = await fetch('/api/zk/prove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'invoice',
            invoiceAmount: faceValue,
            advanceRequested,
            invoiceSecret: secret,
            invoiceCommitment: `0x${secret}`,
            nullifierSecret: nullSecret,
            nullifier: `0x${nullSecret}`,
        }),
    });

    if (!proveResponse.ok) {
        const err = await proveResponse.json();
        throw new Error(`Proof generation failed: ${err.error}`);
    }

    const { attestation } = await proveResponse.json();
    const { messageHash, signature, nullifier, timestamp } = attestation;
    const realInvoiceCommitment = (await proveResponse.clone().json()).publicInputs[1];

    // Step 3: Build Soroban contract invocation using SorobanRpc
    const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
    const contractId = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID;
    if (!contractId) {
        throw new Error('NEXT_PUBLIC_ESCROW_CONTRACT_ID env var is not set');
    }

    // Convert attestation hex strings to Buffers for XDR encoding
    const msgHashBuf = Buffer.from(messageHash, 'hex').slice(0, 32);
    const sigBuf = Buffer.from(signature, 'hex').slice(0, 64);
    const nullifierBuf = Buffer.from(nullifier.replace('0x', ''), 'hex').slice(0, 32);
    // Invoice commitment = Poseidon(faceValue, secret)  for now use the raw secret hash
    const commitmentBuf = Buffer.from(realInvoiceCommitment.replace('0x', ''), 'hex').slice(0, 32);

    // Pad to exact byte lengths
    const padTo = (buf: Buffer, len: number): Buffer => {
        if (buf.length === len) return buf;
        if (buf.length > len) return buf.slice(0, len);
        return Buffer.concat([buf, Buffer.alloc(len - buf.length)]);
    };

    // Build the XDR operation to call KryonEscrow::submit_zk_factoring
    const { Contract, TransactionBuilder, Networks, xdr, rpc } = StellarSdk;
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    const sorobanServer = new rpc.Server(rpcUrl);
    const account = await server.loadAccount(publicKey);
    const fee = await server.fetchBaseFee();
    const contract = new Contract(contractId);

    const operation = contract.call(
        'submit_zk_factoring',
        // borrower: Address  caller's address
        StellarSdk.xdr.ScVal.scvAddress(
            StellarSdk.xdr.ScAddress.scAddressTypeAccount(
                StellarSdk.Keypair.fromPublicKey(publicKey).xdrPublicKey()
            )
        ),
        // advance_requested: i128
        StellarSdk.xdr.ScVal.scvI128(new StellarSdk.xdr.Int128Parts({
            hi: new StellarSdk.xdr.Int64(0),
            lo: new StellarSdk.xdr.Uint64(advanceRequested)
        })),
        // invoice_commitment: BytesN<32>
        StellarSdk.xdr.ScVal.scvBytes(padTo(commitmentBuf, 32)),
        // nullifier: BytesN<32>
        StellarSdk.xdr.ScVal.scvBytes(padTo(nullifierBuf, 32)),
        // message_hash: BytesN<32>
        StellarSdk.xdr.ScVal.scvBytes(padTo(msgHashBuf, 32)),
        // oracle_signature: BytesN<64>
        StellarSdk.xdr.ScVal.scvBytes(padTo(sigBuf, 64)),
        // attestation_timestamp: u64
        StellarSdk.xdr.ScVal.scvU64(new StellarSdk.xdr.Uint64(timestamp)),
    );

    // Build the transaction
    let tx = new StellarSdk.TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(operation)
    .setTimeout(60)
    .build();

    // Simulate the transaction first to get the resource fee
    const simResult = await sorobanServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
        throw new Error(`Soroban simulation failed: ${simResult.error}`);
    }

    // Assemble with correct resource limits from simulation
    tx = rpc.assembleTransaction(tx, simResult).build();

    // Sign with Freighter
    const txXdr = tx.toXDR();
    const { signTransaction } = await import('@stellar/freighter-api');
    const signedResp: any = await signTransaction(txXdr, {
        networkPassphrase: StellarSdk.Networks.TESTNET,
    });

    if (signedResp?.error) {
        throw new Error(`Freighter signing failed: ${JSON.stringify(signedResp.error)}`);
    }

    const finalXdr = typeof signedResp === 'string' ? signedResp : signedResp.signedTxXdr;
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(finalXdr, StellarSdk.Networks.TESTNET);

    // Submit to Soroban RPC (not Horizon  Soroban contracts use RPC)
    const sendResult = await sorobanServer.sendTransaction(signedTx);
    if (sendResult.status === 'ERROR') {
        throw new Error(`Soroban submission failed: ${sendResult.errorResult}`);
    }

    // Poll for confirmation
    let getResult = await sorobanServer.getTransaction(sendResult.hash);
    let attempts = 0;
    while (getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND && attempts < 30) {
        await new Promise(r => setTimeout(r, 2000));
        getResult = await sorobanServer.getTransaction(sendResult.hash);
        attempts++;
    }

    if (getResult.status === rpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`Soroban transaction failed: ${JSON.stringify(getResult)}`);
    }

    return sendResult.hash;
};
