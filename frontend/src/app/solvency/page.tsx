export default function SolvencyPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
            <h1 className="text-4xl font-bold mb-4">Proof of Solvency</h1>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl text-center">
                Cryptographically prove that your assets exceed your liabilities without disclosing the exact amounts.
                Ideal for institutional partners and liquidity providers.
            </p>
            <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full">
                <form className="flex flex-col space-y-4">
                    <label className="flex flex-col">
                        <span className="font-semibold mb-2">Asset Commitment Hash</span>
                        <input type="text" placeholder="0x..." className="border rounded p-2" />
                    </label>
                    <label className="flex flex-col">
                        <span className="font-semibold mb-2">Liability Commitment Hash</span>
                        <input type="text" placeholder="0x..." className="border rounded p-2" />
                    </label>
                    <button type="button" className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition">
                        Verify Solvency on Stellar
                    </button>
                </form>
            </div>
        </div>
    );
}
