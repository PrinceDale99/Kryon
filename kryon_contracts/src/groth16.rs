//! Pure Rust Groth16 BN254 verifier compiled to wasm32-unknown-unknown.
//! This is Option C: real in-contract ZK proof verification.
//! WARNING: This is computationally expensive. Use only when Soroban budget allows.
//! Protocol 25/26 will replace this with native host functions (Option A).

extern crate alloc;

use ark_bn254::{Bn254, Fr};
use ark_groth16::{Proof, VerifyingKey, prepare_verifying_key, Groth16};
use ark_snark::SNARK;
use ark_serialize::CanonicalDeserialize;
use soroban_sdk::{Bytes, Env};

/// Deserialize and verify a Groth16 proof for BN254.
///
/// # Arguments
/// * `vk_bytes` - Serialized verifying key (ark-serialize compressed format)
/// * `proof_bytes` - Serialized proof (ark-serialize compressed format, 128 bytes)
/// * `public_inputs_bytes` - Concatenated 32-byte little-endian field elements
///
/// # Returns
/// * `true` if proof is valid, panics otherwise
pub fn verify_groth16_bn254(
    _env: &Env,
    vk_bytes: &Bytes,
    proof_bytes: &Bytes,
    public_inputs_bytes: &Bytes,
) -> bool {
    // Convert Soroban Bytes to &[u8] slices via Vec<u8>
    let vk_vec: alloc::vec::Vec<u8> = vk_bytes.to_alloc_vec();
    let proof_vec: alloc::vec::Vec<u8> = proof_bytes.to_alloc_vec();
    let inputs_vec: alloc::vec::Vec<u8> = public_inputs_bytes.to_alloc_vec();

    // Deserialize the verifying key
    let vk = VerifyingKey::<Bn254>::deserialize_compressed(&vk_vec[..])
        .expect("Failed to deserialize verifying key");

    // Deserialize the proof
    let proof = Proof::<Bn254>::deserialize_compressed(&proof_vec[..])
        .expect("Failed to deserialize proof");

    // Deserialize public inputs: each is a 32-byte little-endian Fr element
    if inputs_vec.len() % 32 != 0 {
        panic!("Public inputs must be a multiple of 32 bytes");
    }

    let n_inputs = inputs_vec.len() / 32;
    let mut public_inputs = alloc::vec::Vec::with_capacity(n_inputs);
    for i in 0..n_inputs {
        let chunk = &inputs_vec[i * 32..(i + 1) * 32];
        let fr = Fr::deserialize_compressed(chunk)
            .expect("Failed to deserialize public input field element");
        public_inputs.push(fr);
    }

    // Prepare verifying key (precomputes Miller loop pairings)
    let pvk = prepare_verifying_key(&vk);

    // Execute Groth16 verification (BN254 pairing check)
    Groth16::<Bn254>::verify_proof(&pvk, &proof, &public_inputs)
        .expect("Proof verification computation failed")
}

// Extension trait to convert Soroban Bytes to Vec<u8>
trait ToAllocVec {
    fn to_alloc_vec(&self) -> alloc::vec::Vec<u8>;
}

impl ToAllocVec for Bytes {
    fn to_alloc_vec(&self) -> alloc::vec::Vec<u8> {
        let mut v = alloc::vec![0u8; self.len() as usize];
        self.copy_into_slice(&mut v);
        v
    }
}
