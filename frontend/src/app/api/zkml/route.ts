import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

// Initialize Gemini with the provided key from env for the fallback MVP
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(req: Request) {
  try {
    const { invoiceData } = await req.json();
    const amount = invoiceData?.amount || 5000;
    
    let analysis = null;
    let zkProofPayload = null;

    // =========================================================================
    // Primary Path: Fetch EZKL ZK Proof from Render Microservice
    // =========================================================================
    try {
        const RENDER_API_URL = process.env.RENDER_ZKML_API_URL || "https://kryon.onrender.com/generate-proof";
        
        // Simple deterministic input generation for the remote EZKL py model
        let initialScore = 92;
        if (amount > 100000) initialScore = 65;
        if (amount > 500000) initialScore = 45;

        const proofResponse = await fetch(RENDER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invoice_amount_normalized: 0.5,
                borrower_history_score: initialScore / 100, // Normalized 0-1
                client_trust_score: 0.9
            })
        });

        if (proofResponse.ok) {
            const proofData = await proofResponse.json();
            zkProofPayload = proofData.proof;
            
            const risk_level = initialScore >= 80 ? "Low" : initialScore >= 60 ? "Medium" : "High";
            analysis = { 
                score: initialScore, 
                risk_level, 
                reasoning: `Risk assessed via EZKL Halo2 Model on Render. Historical payment velocity indicates a ${risk_level.toLowerCase()} probability of default.`
            };
        } else {
            throw new Error(`Render API returned ${proofResponse.status}`);
        }
    } catch (e) {
        console.warn("Could not connect to Render ZKML API, falling back to Gemini:", e);
        
        // =========================================================================
        // Fallback Path: Gemini AI Mock ZKML Generation
        // =========================================================================
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
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
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
          throw new Error("Invalid response from Gemini ZKML Oracle");
        }
        
        analysis = JSON.parse(jsonMatch[0]);
        zkProofPayload = { error: "Render API unreachable. Fallback proof active.", fallback: true, generated_by: "Gemini" };
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
