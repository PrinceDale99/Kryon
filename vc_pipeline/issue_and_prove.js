const fs = require('fs');
const path = require('path');

console.log("=========================================");
console.log("   W3C VC Selective Disclosure Demo      ");
console.log("=========================================");

const artifactsDir = path.join(__dirname, 'artifacts');
if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir);
}

// 1. Generate Mock JSON-LD VC
const vc = {
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1"
    ],
    "id": "http://example.edu/credentials/3732",
    "type": ["VerifiableCredential", "BusinessCreditCredential"],
    "issuer": "did:example:76e12ec712ebc6f1c221ebfeb1f",
    "issuanceDate": new Date().toISOString(),
    "credentialSubject": {
        "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
        "business": {
            "name": "Apple Inc.",
            "creditScore": 850,
            "annualRevenue": 1000000
        }
    },
    "proof": {
        "type": "Ed25519Signature2018",
        "created": new Date().toISOString(),
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:example:76e12ec712ebc6f1c221ebfeb1f#keys-1",
        "jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..mock_signature_bytes_here"
    }
};

fs.writeFileSync(path.join(artifactsDir, 'credential.json'), JSON.stringify(vc, null, 2));
console.log("[1/3] Generated signed Verifiable Credential -> artifacts/credential.json");

// 2. Generate Selective Disclosure ZK Proof (Mocked)
// In a real scenario, this would use a Noir circuit to prove `creditScore > 700` without revealing `850`.
const zkProof = {
    "proof_type": "Groth16",
    "public_inputs": [
        "0x0000000000000000000000000000000000000000000000000000000000000001" // Boolean TRUE (creditScore > 700)
    ],
    "proof_bytes": "0x1234abcd5678ef90..." // Mock proof bytes
};

fs.writeFileSync(path.join(artifactsDir, 'selective_disclosure_proof.json'), JSON.stringify(zkProof, null, 2));
console.log("[2/3] Generated ZK Selective Disclosure Proof -> artifacts/selective_disclosure_proof.json");
console.log("      (Proving creditScore > 700 without revealing actual score)");

// 3. Instructions for on-chain submission
console.log("[3/3] On-chain submission instructions:");
console.log("      Run the following to submit to the Soroban verifier:");
console.log("      stellar contract invoke \\");
console.log("         --id <CONTRACT_ID> \\");
console.log("         --source admin_wallet \\");
console.log("         --network testnet \\");
console.log("         -- verify_credential_proof \\");
console.log("         --proof <bytes> --public_inputs <bytes>");
console.log("=========================================");
