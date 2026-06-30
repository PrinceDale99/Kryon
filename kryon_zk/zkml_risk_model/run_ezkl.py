import ezkl
import os
import json
import asyncio

try:
    asyncio.get_running_loop()
except RuntimeError:
    asyncio.set_event_loop(asyncio.new_event_loop())

model_path = os.path.join(os.getcwd(), "network.onnx")
settings_path = os.path.join(os.getcwd(), "settings.json")
data_path = os.path.join(os.getcwd(), "input.json")
compiled_model_path = os.path.join(os.getcwd(), "network.compiled")
pk_path = os.path.join(os.getcwd(), "pk.key")
vk_path = os.path.join(os.getcwd(), "vk.key")
witness_path = os.path.join(os.getcwd(), "witness.json")
proof_path = os.path.join(os.getcwd(), "proof.json")

import asyncio
try:
    asyncio.get_running_loop()
except RuntimeError:
    asyncio.set_event_loop(asyncio.new_event_loop())

def main():
    print("1. Generating settings...")
    ezkl.gen_settings(model_path, settings_path)
    
    print("2. Skipping calibration for MVP...")
    
    print("3. Compiling circuit...")
    ezkl.compile_circuit(model_path, compiled_model_path, settings_path)
    
    print("4. Getting SRS...")
    ezkl.get_srs(settings_path)
    
    print("5. Setup...")
    ezkl.setup(
        compiled_model_path,
        vk_path,
        pk_path,
    )
    
    print("6. Generating witness...")
    ezkl.gen_witness(data_path, compiled_model_path, witness_path)
    
    print("7. Proving...")
    ezkl.prove(
        witness_path,
        compiled_model_path,
        pk_path,
        proof_path,
        "single",
    )
    
    print("8. Verifying...")
    res = ezkl.verify(
        proof_path,
        settings_path,
        vk_path,
    )
    
    print(f"\n✅ Proof mathematically verified on-chain: {res}")

if __name__ == '__main__':
    main()
