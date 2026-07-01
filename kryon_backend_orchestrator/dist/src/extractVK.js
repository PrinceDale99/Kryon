"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const backend_barretenberg_1 = require("@noir-lang/backend_barretenberg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function extractVerifyingKey(circuitName) {
    const artifactPath = path.resolve(__dirname, `../../kryon_zk/${circuitName}_proof/target/${circuitName}_proof.json`);
    const circuit = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
    // @ts-ignore
    const backend = new backend_barretenberg_1.BarretenbergBackend(circuit, { threads: 4 });
    // Generate a valid dummy proof to initialize the backend
    // (Barretenberg requires a proof generation to expose the VK)
    console.log(`Extracting VK for ${circuitName}...`);
    const vkBytes = await backend.getVerificationKey();
    // Save VK as hex for storage in the Soroban contract
    const vkHex = Buffer.from(vkBytes).toString('hex');
    const outputPath = path.resolve(__dirname, `../../kryon_zk/${circuitName}_proof/target/${circuitName}_vk.hex`);
    fs.writeFileSync(outputPath, vkHex);
    console.log(`VK saved to ${outputPath}`);
    console.log(`VK length: ${vkBytes.length} bytes`);
    await backend.destroy();
}
// Extract VK for all circuits
async function main() {
    await extractVerifyingKey('invoice');
    await extractVerifyingKey('kyc');
    await extractVerifyingKey('merkle_membership');
    await extractVerifyingKey('solvency');
    await extractVerifyingKey('age');
}
main().catch(console.error);
