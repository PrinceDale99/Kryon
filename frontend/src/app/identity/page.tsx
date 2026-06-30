export default function IdentityPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
            <h1 className="text-4xl font-bold mb-4">Zero-Knowledge Identity Verification</h1>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl text-center">
                Verify your identity credentials without revealing sensitive personal information. 
                Our zero-knowledge proofs ensure that your privacy is preserved while meeting all regulatory compliance requirements.
            </p>
            <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full">
                <form className="flex flex-col space-y-4">
                    <label className="flex flex-col">
                        <span className="font-semibold mb-2">Credential Document (Local Only)</span>
                        <input type="file" className="border rounded p-2" />
                    </label>
                    <button type="button" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
                        Generate ZK Proof
                    </button>
                </form>
            </div>
        </div>
    );
}
