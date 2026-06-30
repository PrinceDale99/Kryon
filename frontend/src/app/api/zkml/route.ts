import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with the provided key from env for ZKML Oracle
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { invoiceData } = await req.json();
    
    // For a hackathon MVP, we use Gemini as the ML Oracle for ZKML
    // In production, the model weights and inference would be proven via a ZK circuit (like EZKL).
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
    return NextResponse.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error("ZKML Oracle Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
