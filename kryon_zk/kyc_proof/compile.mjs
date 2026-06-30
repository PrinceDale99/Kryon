import { compile } from '@noir-lang/noir_wasm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("Compiling...");
    // Read the circuit file
    const mainNr = fs.readFileSync(path.join(__dirname, 'src', 'main.nr'), 'utf-8');
    
    // In @noir-lang/noir_wasm, compilation is usually done using the Noir class or directly via compile
    try {
        const result = compile('main.nr', null, {
            get_file_content: (path) => {
                if (path === 'main.nr') return mainNr;
                return '';
            },
            get_file_path: () => 'main.nr'
        });
        fs.writeFileSync(path.join(__dirname, 'kyc_proof.json'), JSON.stringify(result, null, 2));
        console.log("Compilation successful!");
    } catch (e) {
        console.error("Compilation failed:", e);
    }
}
main();
