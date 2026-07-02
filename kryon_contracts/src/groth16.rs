//! Pure Rust Groth16 BN254 verifier compiled to wasm32-unknown-unknown.
//! This is Option C: real in-contract ZK proof verification.
//! WARNING: This is computationally expensive. Use only when Soroban budget allows.
//! Protocol 25/26 will replace this with native host functions (Option A).

extern crate alloc;

use ark_bn254::{Bn254, Fr};
use ark_groth16::{Proof, VerifyingKey, prepare_verifying_key, Groth16};
use ark_snark::SNARK;
use ark_serialize::CanonicalDeserialize;
use soroban_sdk::{Bytes, BytesN, Env, Vec as SorobanVec};
use soroban_sdk::crypto::bn254::{Bn254G1Affine, Bn254G2Affine};
use ark_ff::{PrimeField, BigInteger};
use ark_ec::{CurveGroup, AffineRepr};

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

/// Helpers to convert Arkworks affine points to Soroban native affine wrappers.
fn g1_to_soroban(env: &Env, p: &ark_bn254::G1Affine) -> Bn254G1Affine {
    let mut bytes = [0u8; 64];
    if !p.infinity {
        bytes[0..32].copy_from_slice(&p.x.into_bigint().to_bytes_be());
        bytes[32..64].copy_from_slice(&p.y.into_bigint().to_bytes_be());
    }
    Bn254G1Affine::from_bytes(BytesN::from_array(env, &bytes))
}

fn g2_to_soroban(env: &Env, p: &ark_bn254::G2Affine) -> Bn254G2Affine {
    let mut bytes = [0u8; 128];
    if !p.infinity {
        bytes[0..32].copy_from_slice(&p.x.c1.into_bigint().to_bytes_be());
        bytes[32..64].copy_from_slice(&p.x.c0.into_bigint().to_bytes_be());
        bytes[64..96].copy_from_slice(&p.y.c1.into_bigint().to_bytes_be());
        bytes[96..128].copy_from_slice(&p.y.c0.into_bigint().to_bytes_be());
    }
    Bn254G2Affine::from_bytes(BytesN::from_array(env, &bytes))
}

pub fn verify_groth16_bn254_native(
    env: &Env,
    vk_bytes: &Bytes,
    proof_bytes: &Bytes,
    public_inputs_bytes: &Bytes,
) -> bool {
    // 1. Extract bytes
    let vk_vec: alloc::vec::Vec<u8> = vk_bytes.to_alloc_vec();
    let proof_vec: alloc::vec::Vec<u8> = proof_bytes.to_alloc_vec();
    let inputs_vec: alloc::vec::Vec<u8> = public_inputs_bytes.to_alloc_vec();

    // 2. Deserialize Arkworks structures
    let vk = VerifyingKey::<Bn254>::deserialize_compressed(&vk_vec[..])
        .expect("Failed to deserialize verifying key");
    let proof = Proof::<Bn254>::deserialize_compressed(&proof_vec[..])
        .expect("Failed to deserialize proof");

    if inputs_vec.len() % 32 != 0 {
        panic!("Public inputs must be a multiple of 32 bytes");
    }

    let n_inputs = inputs_vec.len() / 32;
    let mut public_inputs = alloc::vec::Vec::with_capacity(n_inputs);
    for i in 0..n_inputs {
        let chunk = &inputs_vec[i * 32..(i + 1) * 32];
        let fr = Fr::deserialize_compressed(chunk)
            .expect("Failed to deserialize public input");
        public_inputs.push(fr);
    }

    // 3. Compute public inputs MSM: X = vk.ic[0] + sum(public_inputs[i] * vk.ic[i+1])
    let mut g_ic = vk.gamma_abc_g1[0].into_group();
    for (i, b) in public_inputs.iter().zip(vk.gamma_abc_g1.iter().skip(1)) {
        g_ic += b.mul_bigint(i.into_bigint());
    }
    let x_g1 = g_ic.into_affine();

    // 4. Convert Arkworks points to Soroban SDK host format
    let a = g1_to_soroban(env, &proof.a);
    let b = g2_to_soroban(env, &proof.b);
    let c = g1_to_soroban(env, &proof.c);

    let alpha = g1_to_soroban(env, &vk.alpha_g1);
    let mut beta = vk.beta_g2;
    beta.y = -beta.y; // Negate beta for pairing check
    let neg_beta = g2_to_soroban(env, &beta);

    let mut gamma = vk.gamma_g2;
    gamma.y = -gamma.y; // Negate gamma
    let neg_gamma = g2_to_soroban(env, &gamma);

    let mut delta = vk.delta_g2;
    delta.y = -delta.y; // Negate delta
    let neg_delta = g2_to_soroban(env, &delta);

    let x_g1_soroban = g1_to_soroban(env, &x_g1);

    // 5. Construct vectors for pairing check
    // e(A, B) * e(alpha, -beta) * e(X, -gamma) * e(C, -delta) == 1
    let vp1 = SorobanVec::from_array(env, [
        a,
        alpha,
        x_g1_soroban,
        c
    ]);

    let vp2 = SorobanVec::from_array(env, [
        b,
        neg_beta,
        neg_gamma,
        neg_delta
    ]);

    // 6. Execute native pairing check!
    env.crypto().bn254().pairing_check(vp1, vp2)
}
