import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

// Initialize Gemini with the provided key from env for the fallback MVP
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { invoiceData } = await req.json();
    
    // =========================================================================
    // EZKL ZKML Integration Path
    // =========================================================================
    // In production, this route would execute the EZKL PyTorch model we built 
    // in `kryon_zk/zkml_risk_model/run_ezkl.py` to generate a real zk-SNARK.
    // 
    // Example production execution:
    // const { stdout } = await execAsync('python ../../../kryon_zk/zkml_risk_model/run_ezkl.py');
    // const zkProofPayload = parseEZKLProof(stdout);
    
    // For the hackathon MVP, we use Gemini to generate the risk score, 
    // and mock the EZKL zk-SNARK proof buffer that would be sent to Soroban.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      You are an AI Risk Assessor acting as a ZKML (Zero-Knowledge Machine Learning) Oracle for a decentralized invoice factoring protocol.
      Evaluate the risk of this invoice defaulting. 
      Return ONLY a JSON object with:
      - score (number from 0 to 100, where 100 is perfectly safe and 0 is guaranteed default)
      - risk_level (string: "Low", "Medium", "High")
      - reasoning (short string explanation, max 2 sentences)
      
      Invoice Data:
      ${JSON.stringify(invoiceData)}
    `;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from response in case there's markdown formatting
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response from Gemini ZKML Oracle");
    }
    
    const analysis = JSON.parse(jsonMatch[0]);

    // =========================================================================
    // Fetch EZKL ZK Proof from Render Microservice
    // =========================================================================
    let zkProofPayload = null;
    try {
        const RENDER_API_URL = process.env.RENDER_ZKML_API_URL || "https://kryon.onrender.com/generate-proof";
        
        // Normalize the mock invoice data for the EZKL PyTorch model (which expects floats)
        // In a real scenario, you would normalize the exact invoiceData here.
        const proofResponse = await fetch(RENDER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invoice_amount_normalized: 0.5,
                borrower_history_score: analysis.score / 100, // Normalized 0-1
                client_trust_score: 0.9
            })
        });

        if (proofResponse.ok) {
            const proofData = await proofResponse.json();
            zkProofPayload = proofData.proof;
        } else {
            console.warn("Render ZKML API returned an error:", await proofResponse.text());
            zkProofPayload = { error: "Failed to fetch proof from Render", fallback: true };
        }
    } catch (e) {
        console.warn("Could not connect to Render ZKML API, is it deployed? Falling back to mock.");
        zkProofPayload = { error: "Render API not reachable", fallback: true };
    }

    return NextResponse.json({ 
        success: true, 
        data: analysis,
        zk_proof: zkProofPayload 
    });
  } catch (error: any) {
    console.error("ZKML Oracle Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
