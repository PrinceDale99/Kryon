import { signTransaction } from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';
import { KRYON_NETWORK_CONFIG } from '../constants';

// Helper to execute a native XLM transaction on Testnet to verify Freighter + Live Network
const executeTestnetTransaction = async (publicKey: string, amount: string, isPaymentToTreasury: boolean = true): Promise<string> => {
  // Keeping this helper around for general legacy usage, but it is no longer the primary way to interact with the treasury.
  try {
    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
    const account = await server.loadAccount(publicKey);
    const fee = await server.fetchBaseFee();

    const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "GBWY47I7ECEDE4Y56J6CBS6P4ZGG7I72CSCS5PXSQS6IBWNQVXWYZKYG";

    let operation;
    if (isPaymentToTreasury) {
      operation = StellarSdk.Operation.payment({
        destination: TREASURY_ADDRESS,
        asset: StellarSdk.Asset.native(),
        amount: amount, 
      });
    } else {
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
    const response = await server.submitTransaction(signedTx);
    return response.hash;
  } catch (err) {
    console.error("Testnet transaction failed:", err);
    throw err;
  }
};

const NATIVE_XLM_CONTRACT = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

export const depositLiquidity = async (amount: number, publicKey: string, isDemo: boolean): Promise<string> => {
    const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
    const contractId = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID;
    if (!contractId) {
        throw new Error('NEXT_PUBLIC_ESCROW_CONTRACT_ID env var is not set');
    }

    const { Contract, TransactionBuilder, Networks, xdr, rpc } = StellarSdk;
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    const sorobanServer = new rpc.Server(rpcUrl);
    const account = await server.loadAccount(publicKey);
    const fee = await server.fetchBaseFee();
    const contract = new Contract(contractId);

    // amount is in standard XLM, convert to stroops (1 XLM = 10,000,000 stroops)
    const stroops = Math.floor(amount * 10000000);

    const operation = contract.call(
        'deposit',
        // from: Address
        StellarSdk.xdr.ScVal.scvAddress(
            StellarSdk.xdr.ScAddress.scAddressTypeAccount(
                StellarSdk.Keypair.fromPublicKey(publicKey).xdrPublicKey()
            )
        ),
        // token: Address (Native XLM)
        StellarSdk.xdr.ScVal.scvAddress(
            StellarSdk.xdr.ScAddress.scAddressTypeContract(
                StellarSdk.StrKey.decodeContract(NATIVE_XLM_CONTRACT) as any
            )
        ),
        // amount: i128
        StellarSdk.xdr.ScVal.scvI128(new StellarSdk.xdr.Int128Parts({
            hi: new StellarSdk.xdr.Int64(0),
            lo: new StellarSdk.xdr.Uint64(stroops)
        }))
    );

    let tx = new StellarSdk.TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(operation)
    .setTimeout(60)
    .build();

    const simResult = await sorobanServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
        throw new Error(`Soroban simulation failed: ${simResult.error}`);
    }

    tx = rpc.assembleTransaction(tx, simResult).build();
    const txXdr = tx.toXDR();
    
    const signedResp: any = await signTransaction(txXdr, {
        networkPassphrase: StellarSdk.Networks.TESTNET,
    });

    if (signedResp?.error) {
        throw new Error(`Freighter signing failed: ${JSON.stringify(signedResp.error)}`);
    }

    const finalXdr = typeof signedResp === 'string' ? signedResp : signedResp.signedTxXdr;
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(finalXdr, StellarSdk.Networks.TESTNET);
    
    const sendResult = await sorobanServer.sendTransaction(signedTx);
    if (sendResult.status === 'ERROR') {
        throw new Error(`Soroban submission failed: ${sendResult.errorResult}`);
    }

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

export const submitFactoringRequest = async (
    invoiceId: string,
    faceValue: number,
    publicKey: string,
    isDemo: boolean,
    invoiceSecret?: string,
    nullifierSecret?: string,
): Promise<string> => {
    // Step 1: Generate inputs
    const secret = invoiceSecret || crypto.randomUUID().replace(/-/g, '');
    const nullSecret = nullifierSecret || crypto.randomUUID().replace(/-/g, '');
    const flooredFaceValue = Math.floor(faceValue);
    
    // Stroops for advanced requested (90% factoring)
    const advanceRequested = Math.floor(flooredFaceValue * 0.9 * 10000000);

    // Step 2: Generate proof + oracle attestation
    const proveResponse = await fetch('/api/zk/prove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'invoice',
            invoiceAmount: flooredFaceValue,
            advanceRequested: Math.floor(flooredFaceValue * 0.9),
            invoiceSecret: secret,
            invoiceCommitment: `0x${secret}`,
            nullifierSecret: nullSecret,
            nullifier: `0x${nullSecret}`,
        }),
    });

    if (!proveResponse.ok) {
        const err = await proveResponse.json();
        throw new Error(`Proof generation failed: ${err.error || JSON.stringify(err)}`);
    }

    const payload = await proveResponse.json();
    const { attestation, publicInputs, proof } = payload;
    const { nullifier } = attestation;
    const realInvoiceCommitment = publicInputs[0] || publicInputs[1] || `0x${secret}`; 

    // Step 3: Build Soroban contract invocation using SorobanRpc
    const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
    const contractId = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID;
    if (!contractId) {
        throw new Error('NEXT_PUBLIC_ESCROW_CONTRACT_ID env var is not set');
    }

    // Convert proof to buffers
    const nullifierBuf = Buffer.from(nullifier.replace('0x', ''), 'hex').slice(0, 32);
    const commitmentBuf = Buffer.from(realInvoiceCommitment.replace('0x', ''), 'hex').slice(0, 32);
    const proofBuf = Buffer.from((proof || '').replace('0x', ''), 'hex');
    const piBuf = Buffer.concat((publicInputs || []).map((pi: string) => {
        const b = Buffer.from(pi.replace('0x', ''), 'hex');
        // Pad each PI to 32 bytes
        if (b.length === 32) return b;
        if (b.length > 32) return b.slice(0, 32);
        return Buffer.concat([b, Buffer.alloc(32 - b.length)]);
    }));

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
        // token: Address (Native XLM)
        StellarSdk.xdr.ScVal.scvAddress(
            StellarSdk.xdr.ScAddress.scAddressTypeContract(
                StellarSdk.StrKey.decodeContract(NATIVE_XLM_CONTRACT) as any
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
        // proof_bytes: Bytes
        StellarSdk.xdr.ScVal.scvBytes(proofBuf),
        // public_inputs_bytes: Bytes
        StellarSdk.xdr.ScVal.scvBytes(piBuf)
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

    // Submit to Soroban RPC
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
