# Build stage
FROM debian:bookworm AS builder
RUN apt-get update && apt-get install -y curl build-essential pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.88.0
ENV PATH="/root/.cargo/bin:${PATH}"
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
# Create dummy main to cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release 2>/dev/null || true
# Copy real source and build
COPY src ./src
COPY migrations ./migrations
COPY openapi.json agent.json ai-plugin.json llms.txt ./
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/task-claw .
COPY --from=builder /app/migrations ./migrations
EXPOSE 8000
CMD ["./task-claw"]
