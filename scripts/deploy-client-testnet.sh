#!/usr/bin/env bash
# Deploy a client Validation Engine + demo app contracts (testnet).
#
# Prerequisites:
#   - Trustline core already ran (registry + VE WASM upload) via
#     stellar-validation-engine/scripts/deploy-testnet.sh
#   - Pass VE_WASM_HASH + REGISTRY_ID (no VE checkout required)
#
# Env:
#   STELLAR_ACCOUNT   CLI identity (funded) — VE admin / firewall owner (required)
#   VE_WASM_HASH      uploaded TrustlineOracleVE WASM hash (required)
#   REGISTRY_ID       TrustlineRegistry contract id (required for .env)
#   STELLAR_NETWORK   default: testnet
#   SDK               override sibling stellar-sdk path
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SDK="${SDK:-$ROOT/../stellar-sdk}"
NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE="${STELLAR_ACCOUNT:?Set STELLAR_ACCOUNT to a funded stellar CLI identity}"
VE_WASM_HASH="${VE_WASM_HASH:?Set VE_WASM_HASH to the uploaded TrustlineOracleVE WASM hash}"
REGISTRY_ID="${REGISTRY_ID:?Set REGISTRY_ID to the TrustlineRegistry contract id}"

ADDR="$(stellar keys address "$SOURCE")"
echo "Deployer / VE admin / firewall owner: $ADDR"
echo "Network: $NETWORK"
echo "VE_WASM_HASH=$VE_WASM_HASH"
echo "REGISTRY=$REGISTRY_ID"

strip_quotes() {
  tr -d '"'
}

if [[ ! -d "$SDK" ]]; then
  echo "ERROR: expected sibling repo at $SDK" >&2
  echo "Clone stellar-sdk next to stellar-demo-app (or set SDK=…)." >&2
  exit 1
fi

echo "==> Building demo contracts"
(cd "$SDK" && stellar contract build >/dev/null)

FW_WASM="$SDK/target/wasm32v1-none/release/trustline_firewall.wasm"
CTR_WASM="$SDK/target/wasm32v1-none/release/protected_counter.wasm"
PAY_WASM="$SDK/target/wasm32v1-none/release/payment_forwarder.wasm"

echo "==> Uploading WASM"
FW_HASH="$(stellar contract upload --wasm "$FW_WASM" --network "$NETWORK" --source-account "$SOURCE" | strip_quotes)"
CTR_HASH="$(stellar contract upload --wasm "$CTR_WASM" --network "$NETWORK" --source-account "$SOURCE" | strip_quotes)"
PAY_HASH="$(stellar contract upload --wasm "$PAY_WASM" --network "$NETWORK" --source-account "$SOURCE" | strip_quotes)"

echo "==> Deploying TrustlineOracleVE"
VE_ID="$(stellar contract deploy \
  --wasm-hash "$VE_WASM_HASH" \
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
VITE_REGISTRY_CONTRACT_ID=$REGISTRY_ID
VITE_VE_CONTRACT_ID=$VE_ID
VITE_FIREWALL_CONTRACT_ID=$FW_ID
VITE_COUNTER_CONTRACT_ID=$CTR_ID
VITE_PAYMENT_FORWARDER_CONTRACT_ID=$PAY_ID
VITE_NATIVE_TOKEN_ID=$NATIVE_ID
VITE_TRUSTLINE_CLIENT_ID=PLACEHOLDER_TRUSTLINE_CLIENT_ID
VITE_BACKEND_CHAIN_ID=2
EOF

echo ""
echo "Wrote $ROOT/.env"
echo "Import identity '$SOURCE' into Freighter (Testnet), then:"
echo "  cd $ROOT && npm install && npm run dev"
echo "Tabs: Trustline Firewall (ownership) | Payment Forwarder (direct SDK)"
