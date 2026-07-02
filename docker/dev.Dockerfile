FROM rust:1.82-slim-bookworm

# Install basic deps
RUN apt-get update && apt-get install -y curl jq git bash build-essential && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs

# Add wasm32 target
RUN rustup target add wasm32v1-none

# Install stellar-cli
RUN cargo install --locked stellar-cli --features opt

# Install nargo / noir (via noirup)
RUN curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
ENV PATH="/root/.nargo/bin:${PATH}"
RUN noirup

WORKDIR /app
COPY . .

# Warm up the build cache
RUN cd kryon_contracts && stellar contract build --target wasm32v1-none && cargo test
RUN cd kryon_zk/invoice_proof && nargo compile
RUN cd kryon_backend_orchestrator && npm install

CMD ["bash"]
