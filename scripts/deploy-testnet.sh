#!/usr/bin/env bash
# Deploy the full demo stack on testnet:
#   1) Trustline core (registry + oracle allowlist + patch) — stellar-validation-engine
#   2) Client VE + demo apps — this repo
#
# Equivalent to:
#   ../stellar-validation-engine/scripts/deploy-testnet.sh
#   ./scripts/deploy-client-testnet.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VE_DIR="${VE_DIR:-$ROOT/../stellar-validation-engine}"

: "${STELLAR_ACCOUNT:?Set STELLAR_ACCOUNT to a funded stellar CLI identity}"

TRUSTLINE="$VE_DIR/scripts/deploy-testnet.sh"
CLIENT="$ROOT/scripts/deploy-client-testnet.sh"

if [[ ! -x "$TRUSTLINE" && -f "$TRUSTLINE" ]]; then
  chmod +x "$TRUSTLINE"
fi
if [[ ! -x "$CLIENT" && -f "$CLIENT" ]]; then
  chmod +x "$CLIENT"
fi

if [[ ! -f "$TRUSTLINE" ]]; then
  echo "ERROR: missing $TRUSTLINE"
  echo "Clone stellar-validation-engine as a sibling of stellar-demo-app."
  exit 1
fi

echo "======== 1/2 Trustline core (registry) ========"
"$TRUSTLINE"

echo ""
echo "======== 2/2 Client VE + demo apps ========"
"$CLIENT"
