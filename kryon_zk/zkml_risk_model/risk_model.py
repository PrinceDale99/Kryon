import torch
import torch.nn as nn
import json
import os

# 1. Define a simple Risk Assessment Neural Network
# Inputs might be: [invoice_amount_normalized, borrower_history_score, client_trust_score]
class RiskModel(nn.Module):
    def __init__(self):
        super(RiskModel, self).__init__()
        # Very simple MLP for ZKML compatibility
        self.fc1 = nn.Linear(3, 8)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(8, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        x = self.sigmoid(x)
        return x

def export_to_onnx():
    model = RiskModel()
    
    # Put the model in evaluation mode
    model.eval()

    # Create dummy input for tracing (e.g., [invoice_amount: 0.5, history: 0.8, trust: 0.9])
    dummy_input = torch.tensor([[0.5, 0.8, 0.9]], dtype=torch.float32)

    # Output paths
    onnx_path = "network.onnx"
    input_json_path = "input.json"

    # Export the model to ONNX
    torch.onnx.export(
        model,               
        dummy_input,         
        onnx_path,           
        export_params=True,  
        opset_version=10,    
        do_constant_folding=True, 
        input_names = ['input'],   
        output_names = ['output'], 
        dynamic_axes={'input' : {0 : 'batch_size'}, 'output' : {0 : 'batch_size'}}
    )

    print(f"Model successfully exported to {onnx_path}")

    # Generate the input.json required by EZKL
    data = {
        "input_data": [[dummy_input[0].tolist()]]
    }
    with open(input_json_path, "w") as f:
        json.dump(data, f)
    
    print(f"EZKL input data saved to {input_json_path}")

if __name__ == "__main__":
    print("Initializing ZKML Risk Model...")
    export_to_onnx()
    
    print("\n--- Next Steps: Run these EZKL Commands to Generate the ZK Proof ---")
    print("1. ezkl gen-settings -M network.onnx")
    print("2. ezkl calibrate-settings -M network.onnx -D input.json --target resources")
    print("3. ezkl compile-circuit -M network.onnx -S settings.json -C network.compiled")
    print("4. ezkl get-srs -S settings.json")
    print("5. ezkl setup -M network.compiled -S settings.json -V vk.key -P pk.key")
    print("6. ezkl gen-witness -D input.json -M network.compiled -W witness.json")
    print("7. ezkl prove -W witness.json -M network.compiled -P pk.key -O proof.json")
    print("8. ezkl verify -P proof.json -S settings.json -V vk.key")
