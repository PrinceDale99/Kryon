import os
import json
import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import ezkl
from risk_model import RiskModel

app = FastAPI(title="Kryon ZKML Oracle API")

# Ensure asyncio event loop for ezkl
try:
    asyncio.get_running_loop()
except RuntimeError:
    asyncio.set_event_loop(asyncio.new_event_loop())

class InvoiceData(BaseModel):
    invoice_amount_normalized: float
    borrower_history_score: float
    client_trust_score: float

@app.post("/generate-proof")
def generate_proof(data: InvoiceData):
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())
    
    try:
        # Define paths
        base_dir = os.getcwd()
        model_path = os.path.join(base_dir, "network.onnx")
        settings_path = os.path.join(base_dir, "settings.json")
        data_path = os.path.join(base_dir, "input.json")
        compiled_model_path = os.path.join(base_dir, "network.compiled")
        pk_path = os.path.join(base_dir, "pk.key")
        vk_path = os.path.join(base_dir, "vk.key")
        witness_path = os.path.join(base_dir, "witness.json")
        proof_path = os.path.join(base_dir, "proof.json")

        # 1. Save input.json for EZKL
        input_tensor = [[data.invoice_amount_normalized, data.borrower_history_score, data.client_trust_score]]
        with open(data_path, "w") as f:
            json.dump({"input_data": [input_tensor]}, f)

        # 2. Run the EZKL Pipeline
        # We must ensure the Proving Key (PK) exists before calling .prove()
        if not os.path.exists(pk_path):
            import gc
            print("Optimizing and generating keys for low-RAM environment...")
            ezkl.gen_settings(model_path, settings_path)
            # Force logrows to a smaller size to fit in 512MB RAM
            with open(settings_path, 'r') as f:
                settings = json.load(f)
            settings['run_args']['logrows'] = 12
            with open(settings_path, 'w') as f:
                json.dump(settings, f)
                
            ezkl.compile_circuit(model_path, compiled_model_path, settings_path)
            ezkl.get_srs(settings_path)
            ezkl.setup(compiled_model_path, vk_path, pk_path)
            
            # Force garbage collection to free up memory before the massive prove step
            gc.collect()

        # 3. Generate Witness
        ezkl.gen_witness(data_path, compiled_model_path, witness_path)

        # 4. Generate Proof
        ezkl.prove(witness_path, compiled_model_path, pk_path, proof_path, "single")

        # 5. Read and return the proof
        with open(proof_path, "r") as f:
            proof_data = json.load(f)

        return {
            "success": True,
            "proof": proof_data,
            "message": "ZK Proof generated successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy"}
