const { Keypair, Horizon, TransactionBuilder, Networks, Operation } = require('@stellar/stellar-sdk');

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const TARGET_XLM = 2200000;
const BATCH_SIZE = 10;

async function fund() {
    const secret = "SDQBJQDFQXB23JJIY6NT4NZ4ZUVN3KSZX7L2KOGIX5JCIS7EMMBCIBMS"; // fixed master
    const master = Keypair.fromSecret(secret);
    require('fs').writeFileSync('master.txt', master.secret());
    console.log("Master Account:", master.publicKey());
    
    // Check balance
    let currentBalance = 0;
    try {
        const acc = await server.loadAccount(master.publicKey());
        currentBalance = parseFloat(acc.balances.find(b => b.asset_type === 'native').balance);
    } catch (e) {
        await fetch(`https://friendbot.stellar.org?addr=${master.publicKey()}`);
        currentBalance = 10000;
    }
    
    while(currentBalance < TARGET_XLM) {
        console.log(`Current Balance: ${currentBalance} / ${TARGET_XLM}`);
        
        const promises = [];
        for (let i=0; i<BATCH_SIZE; i++) {
            promises.push((async () => {
                try {
                    const kp = Keypair.random();
                    const fb = await fetch(`https://friendbot.stellar.org?addr=${kp.publicKey()}`);
                    if (!fb.ok) return 0;
                    
                    const acc = await server.loadAccount(kp.publicKey());
                    const tx = new TransactionBuilder(acc, {
                        fee: '1000',
                        networkPassphrase: Networks.TESTNET
                    })
                    .addOperation(Operation.payment({
                        destination: master.publicKey(),
                        asset: require('@stellar/stellar-sdk').Asset.native(),
                        amount: '9995'
                    }))
                    .setTimeout(30)
                    .build();
                    
                    tx.sign(kp);
                    await server.submitTransaction(tx);
                    return 9995;
                } catch (e) {
                    console.log("Err");
                    return 0;
                }
            })());
        }
        
        const results = await Promise.all(promises);
        const sum = results.reduce((a,b)=>a+b,0);
        currentBalance += sum;
    }
    
    console.log("Master funded with", currentBalance);
    require('fs').writeFileSync('master.txt', master.secret());
    console.log("Done. Secret saved to master.txt");
}

fund().catch(e => {
    console.error("FATAL SCRIPT ERROR:", e);
});
