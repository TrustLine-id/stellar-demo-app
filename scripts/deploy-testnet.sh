#!/usr/bin/env bash
# Deploy the full demo stack on testnet (requires sibling stellar-validation-engine):
#   1) Trustline core — ../stellar-validation-engine/scripts/deploy-testnet.sh
#   2) Client VE + demo apps — ./scripts/deploy-client-testnet.sh
#      (reads latest ve_upload from sibling deployments.json)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VE_DIR="${VE_DIR:-$ROOT/../stellar-validation-engine}"
NETWORK="${STELLAR_NETWORK:-testnet}"

: "${STELLAR_ACCOUNT:?Set STELLAR_ACCOUNT to a funded stellar CLI identity}"

TRUSTLINE="$VE_DIR/scripts/deploy-testnet.sh"
CLIENT="$ROOT/scripts/deploy-client-testnet.sh"
DEPLOYMENTS_JSON="$VE_DIR/deployments.json"

if [[ ! -x "$TRUSTLINE" && -f "$TRUSTLINE" ]]; then
  chmod +x "$TRUSTLINE"
fi
if [[ ! -x "$CLIENT" && -f "$CLIENT" ]]; then
  chmod +x "$CLIENT"
fi

if [[ ! -f "$TRUSTLINE" ]]; then
  echo "ERROR: missing $TRUSTLINE"
  echo "Clone stellar-validation-engine as a sibling, or deploy client only:"
  echo "  export VE_WASM_HASH=… REGISTRY_ID=… && ./scripts/deploy-client-testnet.sh"
  exit 1
fi

read_latest_ve_upload() {
  python3 - "$DEPLOYMENTS_JSON" "$NETWORK" <<'PY'
import json, sys
path, network = sys.argv[1], sys.argv[2]
with open(path, encoding="utf-8") as f:
    data = json.load(f)
uploads = data.get(network, {}).get("ve_uploads", [])
if not uploads:
    raise SystemExit(f"No ve_uploads for {network!r} in {path}")
latest = uploads[-1]
print(latest["wasm_hash"])
print(latest["registry_contract_id"])
PY
}

echo "======== 1/2 Trustline core (registry + VE upload) ========"
"$TRUSTLINE"

mapfile -t _ve_upload < <(read_latest_ve_upload)
export VE_WASM_HASH="${_ve_upload[0]}"
export REGISTRY_ID="${_ve_upload[1]}"
echo "From $DEPLOYMENTS_JSON ($NETWORK): VE_WASM_HASH=$VE_WASM_HASH REGISTRY=$REGISTRY_ID"

echo ""
echo "======== 2/2 Client VE + demo apps ========"
"$CLIENT"
