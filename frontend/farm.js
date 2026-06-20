const StellarSdk = require('@stellar/stellar-sdk');

const TREASURY = "GCO5RGVLRVNIF42JRQYCOCIC4Z66W2WIBVO3EMEUIM4LYHPOIM5KPGSG";
const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

async function farm() {
  console.log(`Starting XLM farming for Treasury: ${TREASURY}`);
  let totalFarmed = 0;
  
  for(let i = 1; i <= 200; i++) {
    try {
      // 1. Generate a burner wallet
      const burner = StellarSdk.Keypair.random();
      console.log(`[Batch ${i}/200] Funding burner wallet: ${burner.publicKey()}...`);
      
      // 2. Hit Friendbot to load the burner with 10,000 XLM
      const res = await fetch(`https://friendbot.stellar.org/?addr=${burner.publicKey()}`);
      if (!res.ok) throw new Error("Friendbot rejected funding.");
      
      // 3. Load the burner account
      const account = await server.loadAccount(burner.publicKey());
      const fee = await server.fetchBaseFee();
      
      // 4. Send 9998 XLM to the Treasury (leaving 2 XLM behind for gas and base reserve)
      const tx = new StellarSdk.TransactionBuilder(account, { 
        fee: fee.toString(), 
        networkPassphrase: StellarSdk.Networks.TESTNET 
      })
      .addOperation(StellarSdk.Operation.payment({
        destination: TREASURY,
        asset: StellarSdk.Asset.native(),
        amount: "9998.0000000" 
      }))
      .setTimeout(60)
      .build();
        
      tx.sign(burner);
      await server.submitTransaction(tx);
      
      totalFarmed += 9998;
      console.log(`✅ Successfully routed 9998 XLM to Treasury. Total Farmed: ${totalFarmed.toLocaleString()} XLM`);
      
      // Delay to avoid Horizon rate limits
      await new Promise(r => setTimeout(r, 2000));
    } catch(e) {
      console.error(`❌ Batch ${i} failed:`, e.message);
    }
  }
  
  console.log(`\n🎉 Farming Complete! Treasury is now loaded with ${totalFarmed.toLocaleString()} XLM.`);
}

farm();
