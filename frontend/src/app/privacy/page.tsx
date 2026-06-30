export default function PrivacyPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
            <h1 className="text-4xl font-bold mb-4">Privacy Architecture</h1>
            <p className="text-lg text-gray-700 mb-8 max-w-3xl text-center">
                Explore how the Kryon Protocol leverages Noir, Barretenberg, and the Stellar network to enable private state transitions on a public ledger.
            </p>
            <div className="bg-white shadow-lg rounded-xl p-8 max-w-2xl w-full">
                <h2 className="text-2xl font-bold mb-4">How it Works</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                    <li><strong>Client-Side Proving:</strong> Proofs are generated locally in your browser using WASM.</li>
                    <li><strong>Zero-Knowledge:</strong> Only cryptographically sound zero-knowledge proofs are transmitted.</li>
                    <li><strong>On-Chain Verification:</strong> Stellar smart contracts act as verifiers ensuring state transitions are correct.</li>
                    <li><strong>No Middlemen:</strong> Direct peer-to-peer logic secured by mathematics.</li>
                </ul>
            </div>
        </div>
    );
}
