const crypto = require('crypto');
const fs = require('fs');

/**
 * WARNING: This script generates purely MOCK DATA for testing internal pipelines.
 * It does not query the real Stellar network.
 */

function generateMockPublicKey() {
    // Stellar public keys start with G and are 56 characters long, base32 encoded.
    // We simulate that structure here.
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let key = 'G';
    for (let i = 0; i < 55; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

function generateMockTxHash() {
    // Transaction hashes are 64 character hex strings.
    return crypto.randomBytes(32).toString('hex');
}

function generateMockData(userCount) {
    // Header clearly labeling this as mock data
    const csvHeader = "STATUS,User_Public_Key,Interaction_TxHash,Timestamp\n";
    let csvContent = csvHeader;

    const now = Date.now();

    for (let i = 0; i < userCount; i++) {
        const pubKey = generateMockPublicKey();
        const txHash = generateMockTxHash();
        // Randomize timestamp over the last 30 days
        const timestamp = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
        
        csvContent += `MOCK_DATA,${pubKey},${txHash},${timestamp}\n`;
    }

    const outputPath = 'mock_mainnet_users.csv';
    fs.writeFileSync(outputPath, csvContent);
    console.log(`Successfully generated mock data for ${userCount} simulated users.`);
    console.log(`Output written to ${outputPath}`);
}

// Generate 55 mock users
generateMockData(55);
