use soroban_sdk::Env;

pub fn test(env: Env) {
    let _ = env.crypto().bn254_verify(); // Just a guess at the name
}
