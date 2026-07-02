const { Keypair, Horizon, TransactionBuilder, Networks, Operation, Contract, scValToNative, xdr, rpc } = require('@stellar/stellar-sdk');
const fs = require('fs');

const ESCROW_CONTRACT_ID = "CD66AYN7K3O4EHKPPNETOZQL23UIBTBFYDI2EMNAWHQUC6FPBHQ5EOUG";
const NATIVE_XLM = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

const sorobanServer = new rpc.Server('https://soroban-testnet.stellar.org');
const horizonServer = new Horizon.Server('https://horizon-testnet.stellar.org');

async function deposit() {
    const secret = fs.readFileSync('master.txt', 'utf8').trim();
    const master = Keypair.fromSecret(secret);
    
    console.log("Master Account:", master.publicKey());
    
    // Convert 2,200,000 XLM to stroops
    const amountXlm = 2200000;
    const stroops = BigInt(amountXlm) * BigInt(10000000);
    
    console.log(`Depositing ${amountXlm} XLM (${stroops} stroops)...`);
    
    const acc = await horizonServer.loadAccount(master.publicKey());
    const contract = new Contract(ESCROW_CONTRACT_ID);
    
    let tx = new TransactionBuilder(acc, {
        fee: '10000',
        networkPassphrase: Networks.TESTNET
    })
    .addOperation(contract.call(
        'deposit',
        // from: Address
        xdr.ScVal.scvAddress(
            xdr.ScAddress.scAddressTypeAccount(master.xdrPublicKey())
        ),
        // token: Address
        xdr.ScVal.scvAddress(
            xdr.ScAddress.scAddressTypeContract(
                require('@stellar/stellar-sdk').StrKey.decodeContract(NATIVE_XLM)
            )
        ),
        // amount: i128
        xdr.ScVal.scvI128(
            new xdr.Int128Parts({
                lo: xdr.Uint64.fromString((stroops & BigInt("0xFFFFFFFFFFFFFFFF")).toString()),
                hi: xdr.Int64.fromString((stroops >> BigInt(64)).toString())
            })
        )
    ))
    .setTimeout(60)
    .build();

    console.log("Simulating transaction...");
    const simResult = await sorobanServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
        console.error("Simulation failed:", simResult.error);
        return;
    }
    
    console.log("Assembling transaction...");
    tx = rpc.assembleTransaction(tx, simResult).build();
    tx.sign(master);
    
    console.log("Submitting transaction...");
    const sendResult = await sorobanServer.sendTransaction(tx);
    
    if (sendResult.status === 'ERROR') {
        console.error("Submission failed:", sendResult.errorResult);
        return;
    }
    
    console.log("Transaction sent! Hash:", sendResult.hash);
    console.log("Polling for status...");
    
    let getResult = await sorobanServer.getTransaction(sendResult.hash);
    let attempts = 0;
    while (getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND && attempts < 30) {
        await new Promise(r => setTimeout(r, 2000));
        getResult = await sorobanServer.getTransaction(sendResult.hash);
        attempts++;
    }
    
    if (getResult.status === rpc.Api.GetTransactionStatus.FAILED) {
        console.error("Transaction failed on-chain:", JSON.stringify(getResult, null, 2));
    } else {
        console.log("SUCCESS! Contract has been funded.");
    }
}

deposit().catch(console.error);
