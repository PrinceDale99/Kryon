const crypto = require('crypto');

console.log("=========================================");
console.log("   Shielded Pool Stealth Address Demo    ");
console.log("=========================================");

const seed = process.argv[2] || "kryon_super_secret_seed";
console.log(`[1/2] Deriving stealth address off-chain from seed: ${seed}`);

const stealthKey = crypto.createHash('sha256').update(seed).digest('hex');

console.log(`[2/2] Generated Stealth Pubkey: ${stealthKey}`);
console.log("");
console.log("Next steps:");
console.log("Submit this to the shielded pool via Soroban CLI:");
console.log(`stellar contract invoke --id <CONTRACT> --source admin -- disburse_to_stealth --stealth_pubkey ${stealthKey} --amount 50000 --asset_commitment <commitment>`);
console.log("=========================================");
