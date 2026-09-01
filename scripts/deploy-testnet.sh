#!/usr/bin/env bash
# Deploy both demo stacks (Trustline Firewall + Payment Forwarder) to testnet.
#
# Flow:
#   1) Deploy TrustlineRegistry
#   2) Patch VALIDATION_REGISTRY into trustline-oracle-ve
#   3) Build & deploy TrustlineOracleVE (registry baked into WASM)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SDK="$ROOT/../stellar-sdk"
VE_DIR="$ROOT/../stellar-validation-engine"
NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE="${STELLAR_ACCOUNT:?Set STELLAR_ACCOUNT to a funded stellar CLI identity}"

REGISTRY_RS="$VE_DIR/contracts/trustline-oracle-ve/src/registry_address.rs"
REGISTRY_PLACEHOLDER='CPLACEHOLDER_TRUSTLINE_REGISTRY_DO_NOT_DEPLOY_THIS_ADDR00'

ADDR="$(stellar keys address "$SOURCE")"
# Backend publisher (add_tx signer).
BACKEND_ORACLE="${BACKEND_ORACLE:-GADELLMHQRWZIYL5YJ264LDTAV3C3I2AQI6TV46WTLUYM3BFG36PDS2Q}"
echo "Deployer / firewall owner: $ADDR"
echo "Backend oracle (set_oracle): $BACKEND_ORACLE"
echo "Network: $NETWORK"

# Strip JSON quotes from stellar contract invoke Bytes / BytesN / Address outputs.
strip_quotes() {
  tr -d '"'
}

patch_registry_const() {
  local id="$1"
  cat > "$REGISTRY_RS" <<EOF
//! Patched by \`stellar-demo-app/scripts/deploy-testnet.sh\` after TrustlineRegistry deploy.
//! Must be a valid contract strkey (C…) before building the production WASM.

pub const VALIDATION_REGISTRY: &str = "$id";
EOF
}

restore_registry_placeholder() {
  patch_registry_const "$REGISTRY_PLACEHOLDER"
}

echo "==> Building TrustlineRegistry (+ sanctions-list)"
(cd "$VE_DIR" && stellar contract build --package trustline-registry >/dev/null)
(cd "$VE_DIR" && stellar contract build --package sanctions-list >/dev/null)

REG_WASM="$VE_DIR/target/wasm32v1-none/release/trustline_registry.wasm"

echo "==> Uploading & deploying TrustlineRegistry"
REG_HASH="$(stellar contract upload --wasm "$REG_WASM" --network "$NETWORK" --source-account "$SOURCE" | strip_quotes)"
REG_ID="$(stellar contract deploy \
  --wasm-hash "$REG_HASH" \
  --network "$NETWORK" \
  --source-account "$SOURCE" \
  -- \
  --admin "$ADDR" | strip_quotes)"
echo "REGISTRY=$REG_ID"

echo "==> Authorizing backend oracle"
stellar contract invoke --id "$REG_ID" --network "$NETWORK" --source-account "$SOURCE" -- \
  set_oracle --oracle "$BACKEND_ORACLE" --approved true

echo "==> Patching TrustlineOracleVE with registry address"
trap restore_registry_placeholder EXIT
patch_registry_const "$REG_ID"

echo "==> Building TrustlineOracleVE + demo contracts"
(cd "$VE_DIR" && stellar contract build --package trustline-oracle-ve >/dev/null)
(cd "$SDK" && stellar contract build >/dev/null)

VE_WASM="$VE_DIR/target/wasm32v1-none/release/trustline_oracle_ve.wasm"
FW_WASM="$SDK/target/wasm32v1-none/release/trustline_firewall.wasm"
CTR_WASM="$SDK/target/wasm32v1-none/release/protected_counter.wasm"
PAY_WASM="$SDK/target/wasm32v1-none/release/payment_forwarder.wasm"

echo "==> Uploading WASM"
VE_HASH="$(stellar contract upload --wasm "$VE_WASM" --network "$NETWORK" --source-account "$SOURCE" | strip_quotes)"
FW_HASH="$(stellar contract upload --wasm "$FW_WASM" --network "$NETWORK" --source-account "$SOURCE" | strip_quotes)"
CTR_HASH="$(stellar contract upload --wasm "$CTR_WASM" --network "$NETWORK" --source-account "$SOURCE" | strip_quotes)"
PAY_HASH="$(stellar contract upload --wasm "$PAY_WASM" --network "$NETWORK" --source-account "$SOURCE" | strip_quotes)"

echo "==> Deploying TrustlineOracleVE"
VE_ID="$(stellar contract deploy \
  --wasm-hash "$VE_HASH" \
  --network "$NETWORK" \
  --source-account "$SOURCE" \
  -- \
  --admin "$ADDR" \
  --auto-validity-secs "1800" \
  --manual-validity-secs "432000" \
  --max-skew-secs "60" | strip_quotes)"
echo "VE=$VE_ID"

# Counter admin must be the firewall, but firewall target must be the counter.
# Deploy counter with deployer as temporary admin, firewall with target=counter,
# then hand admin to the firewall (no Trustline, no contract-id prediction).
echo "==> Deploying Protected Counter (temporary admin=$ADDR)"
CTR_ID="$(stellar contract deploy \
  --wasm-hash "$CTR_HASH" \
  --network "$NETWORK" \
  --source-account "$SOURCE" \
  -- \
  --admin "$ADDR" | strip_quotes)"
echo "CTR=$CTR_ID"

echo "==> Deploying Trustline Firewall (target=counter, public_forward=true)"
FW_ID="$(stellar contract deploy \
  --wasm-hash "$FW_HASH" \
  --network "$NETWORK" \
  --source-account "$SOURCE" \
  -- \
  --target "$CTR_ID" \
  --validation-engine "$VE_ID" \
  --initial-owner "$ADDR" \
  --initial-operator null \
  --initial-public-forward true | strip_quotes)"
echo "FW=$FW_ID"

echo "==> Handing counter admin to firewall"
stellar contract invoke --id "$CTR_ID" --network "$NETWORK" --source-account "$SOURCE" -- \
  set_admin --new-admin "$FW_ID"

echo "==> Deploying Payment Forwarder (direct SDK demo)"
PAY_ID="$(stellar contract deploy \
  --wasm-hash "$PAY_HASH" \
  --network "$NETWORK" \
  --source-account "$SOURCE" \
  -- \
  --validation-engine "$VE_ID" | strip_quotes)"
echo "PAY=$PAY_ID"

NATIVE_ID="$(stellar contract id asset --asset native --network "$NETWORK" 2>/dev/null | strip_quotes || true)"
if [[ -z "${NATIVE_ID}" ]]; then
  echo "WARN: could not resolve native SAC id; set VITE_NATIVE_TOKEN_ID manually"
  NATIVE_ID=""
fi
echo "NATIVE=$NATIVE_ID"

RPC_URL="https://soroban-testnet.stellar.org"
PASSPHRASE="Test SDF Network ; September 2015"
cat > "$ROOT/.env" <<EOF
VITE_RPC_URL=$RPC_URL
VITE_NETWORK_PASSPHRASE=$PASSPHRASE
VITE_NETWORK=TESTNET
VITE_REGISTRY_CONTRACT_ID=$REG_ID
VITE_VE_CONTRACT_ID=$VE_ID
VITE_FIREWALL_CONTRACT_ID=$FW_ID
VITE_COUNTER_CONTRACT_ID=$CTR_ID
VITE_PAYMENT_FORWARDER_CONTRACT_ID=$PAY_ID
VITE_NATIVE_TOKEN_ID=$NATIVE_ID
EOF

echo ""
echo "Wrote $ROOT/.env"
echo "Import identity '$SOURCE' into Freighter (Testnet), then:"
echo "  cd $ROOT && npm install && npm run dev"
echo "Tabs: Trustline Firewall (ownership) | Payment Forwarder (direct SDK)"
