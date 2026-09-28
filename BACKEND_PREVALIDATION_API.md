# Trustline backend — Stellar pre-validation API

HTTP JSON-RPC API used by this demo (and by integrators) to **pre-validate** a Soroban intent before the user signs the on-chain transaction.

After a successful `validate`, the Trustline backend publishes an oracle proof on the Validation Engine (`add_tx`). The protected contract call then consumes that proof via `require_trustline*`.

The HTTP API fields below must stay aligned with what the Validation Engine and protocol contracts expect on-chain (canonical `data`, `intent_id`, `value`, sender, protocol address).

---

## Base URL and protocol

| Item | Demo default |
|------|----------------|
| Endpoint | `POST {base}/api/v0` |
| Demo `base` | `https://api.trustline.id` (WebSDK default) |
| Content-Type | `application/json` |
| Protocol | JSON-RPC **2.0** |

Every request body:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "<methodName>",
  "params": { }
}
```

This demo calls **`trustline.validate`** from [`@trustline.id/websdk`](https://www.npmjs.com/package/@trustline.id/websdk) (≥ 1.1.0), which wraps `openSession` / `validate` (and OTP UX when the policy requires it). The sections below document the underlying JSON-RPC for debugging, cURL, and non-WebSDK clients.

---

## End-to-end flow

```text
Frontend / integrator                Trustline backend              Soroban
        │                                    │                          │
        │  openSession (intent metadata)     │                          │
        │───────────────────────────────────►│                          │
        │◄───────────────────────────────────│  sessionId               │
        │                                    │                          │
        │  validate (sessionId)              │  policy + add_tx(VE)     │
        │───────────────────────────────────►│─────────────────────────►│
        │◄───────────────────────────────────│  certId + attestation    │
        │                                    │                          │
        │  user signs protected invoke       │                          │
        │──────────────────────────────────────────────────────────────►│
        │                                    │     require_trustline*   │
        │                                    │     consumes proof       │
```

1. **`openSession`** — register intent parameters (sender, protocol contract, amount, structured call data).
2. **`validate`** — run off-chain policy; on approval, publish `add_tx` on the configured Validation Engine (when enabled). Client gets `certId` + `attestation`.
3. **On-chain call** — must match the same sender, protocol contract, value, and canonical `data` bytes used to compute the intent id.

---

## On-chain alignment (Validation Engine)

When `validate` succeeds, the backend invokes **`add_tx`** on the configured Validation Engine (VE) contract. The protected protocol contract then calls **`require_trustline*`** (or equivalent) with the same `(sender, protocol, value, data)` tuple.

### Canonical `data` (Bytes)

`data` must be **byte-identical** to what the protected contract passes into `require_trustline*`.

**Preferred:** simulate the protocol contract’s intent helper (read-only):

| Pattern | Helper | Typical args |
|---------|--------|--------------|
| Trustline Firewall `forward` | `forward_intent_data(fn_name, args)` | e.g. `fn_name="bump"`, `args=[]` |
| Firewall `set_target` | `set_target_intent_data(new_target)` | target address |
| Payment Forwarder native | `pay_native_intent_data(native_token, destination, amount)` | SAC id, dest, amount |
| Payment Forwarder tokens | `pay_tokens_intent_data(destination, token, amount)` | dest, token, amount |

**Fallback** (offline only — easy to get wrong):

```text
data = utf8_bytes(fn_name) || args_xdr
```

where `args_xdr` is Soroban `ToXdr` for the argument tuple. Mismatch → different `intent_id` → consume fails.

The JSON `data` object in `openSession` is the backend’s structured input; the backend derives the same canonical bytes as `trustline_sdk::encode_call_data` + argument XDR.

### `intent_id`

Computed on the VE (preferred: simulate `compute_intent_id`):

```text
intent_id = sha256( XDR( network_id, mode_u32, sender, protocol, value, data ) )
```

- `network_id` — ledger network id (testnet / mainnet / …)
- `mode_u32` — `0` for `validationMode: "dapp"` (only supported mode today)
- `value` — i128 native amount (`nativeAmount` as stroops; `"0"` when no XLM attached)
- Encoding is **Soroban XDR**, not a custom hash of strings

### `add_tx` (backend publish)

```text
add_tx(
  oracle,              // registry-approved oracle; must authorize the tx
  id,                  // intent_id (BytesN<32>)
  policy_hash,         // BytesN<32> — policy digest (may be 32 zero bytes)
  timestamp,           // u64 — unix seconds
  approval_required    // false → Approved + temporary proof; true → Pending
)
```

On **`approval_required: false`**, proof state is `Approved`, stored temporarily, and consumable until `valid_until = timestamp + auto_validity_secs`. Each successful consume deletes the proof (one-shot).

### Key VE read methods

| Method | Purpose |
|--------|---------|
| `compute_intent_id(mode, sender, protocol, value, data)` | Derive `intent_id` before publish |
| `get_tx_state(sender, id, addresses)` | Inspect proof state |
| `trustline_oracle_enabled()` | Whether consume requires a proof |
| `registry()` | Oracle registry contract |

---

## Soroban-specific fields

### `chainId`

Logical chain identifier configured for your dapp on the Trustline backend (string). Demo app: `VITE_BACKEND_CHAIN_ID` (default **`"2"`**).

### `contractAddress`

**Protocol contract** that will invoke the Validation Engine (the contract embedding Trustline checks or the firewall), **not** the VE contract id.

Examples:

- Trustline Firewall tab → firewall contract id (`VITE_FIREWALL_CONTRACT_ID`)
- Payment Forwarder tab → payment forwarder id (`VITE_PAYMENT_FORWARDER_CONTRACT_ID`)

### `senderAddress`

Stellar account (G…) that will `require_auth` as the business sender on-chain.

### `nativeAmount`

Amount bound into the intent hash, as a **decimal string** (stroops for native XLM flows).

| Demo action | Typical value |
|-------------|----------------|
| Firewall `forward("bump")` | `"0"` |
| Payment Forwarder `pay_native` | stroops string, e.g. `"10000000"` (1 XLM) |

Must match the `value` passed to `require_trustline*` on-chain.

### `data` — structured intent (critical)

Object describing the protected Soroban invocation. The backend derives canonical **`Bytes`** (same as `trustline_sdk::encode_call_data` + argument XDR) and computes `intent_id` for `add_tx`.

```json
{
  "functionPrototype": "pay_native(address,address,i128)",
  "args": ["C…", "G…", "10000000"]
}
```

| Field | Notes |
|-------|--------|
| `functionPrototype` | Required (alias on input: `functionSelector`) |
| `args` | Optional; default `[]`. **Positional values** — types come from the prototype |

**Rules:**

- `functionPrototype` uses Soroban-style type names (`address`, `i128`, `symbol`, `vec`, …).
- `args` are plain JSON values in order; do **not** wrap them as `{ "type", "value" }`.
- Nested types use parameterized labels (`vec<address>`, `map<symbol,i128>`, `option<u32>`). Values: arrays for `vec`/`tuple`, `[key,value]` pairs (or a JSON object) for `map`, `null` for `option` none. Bare `vec` only allows `[]`.
- Prefer simulating the contract’s `*_intent_data` helper when available (see [On-chain alignment](#on-chain-alignment-validation-engine)).

Firewall bump example:

```json
{
  "functionPrototype": "forward(symbol,vec)",
  "args": ["bump", []]
}
```

### `validationMode`

Optional. Demo uses **`"dapp"`** (only mode supported today). Affects intent hash domain on-chain.

---

## Method: `openSession`

Creates a validation session for one intent.

### Request `params`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chainId` | string | yes | Backend-configured chain id |
| `senderAddress` | string | yes | G-address of the sender |
| `contractAddress` | string | yes | Protocol contract id (C…) |
| `nativeAmount` | string | yes | Intent value (stroops string) |
| `data` | object | yes | Structured intent (see above) |
| `validationMode` | string | no | `"dapp"` |

### Success `result`

```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "authRequired": false
}
```

| Field | Meaning |
|-------|---------|
| `sessionId` | Opaque id for `validate` |
| `authRequired` | If true, additional auth (e.g. OTP) may be required before `validate` in full integrations |

### Failure

```json
{
  "success": false,
  "error": "Human-readable reason"
}
```

Or JSON-RPC `error` object with `message`.

---

## Method: `validate`

Runs policy and, if approved, publishes the oracle proof on-chain (`add_tx`). Bearer auth is optional (required when policy needs executor OTP).

### Request `params`

| Field | Type | Required |
|-------|------|----------|
| `sessionId` | string | yes — from `openSession` |

### Success `result` (approved)

```json
{
  "status": "approved",
  "certId": "<intentIdHex>",
  "attestation": {
    "timestamp": "2024-03-10T12:00:00Z",
    "policyHash": "…"
  }
}
```

| Field | Meaning |
|-------|---------|
| `status` | `"approved"` \| `"approval_required"` \| `"rejected"` |
| `certId` | Intent / certificate identifier (aligns with on-chain intent id) |
| `attestation.timestamp` | ISO-8601 (unix seconds internally on the engine) |
| `attestation.policyHash` | Policy digest stored in the proof |

### Rejected example

```json
{
  "status": "rejected",
  "type": "POLICY",
  "reason": "…",
  "metadata": { }
}
```

Typical `type` values: `POLICY`, `SESSION_ERROR` / `SESSION_STATUS_INVALID`, `CHAIN_ID_INVALID`, `INVALID_INTENT`, `CLIENT_NOT_REGISTERED`, …

Session rules: open, age ≤ **5 minutes**, status **`AWAIT_VALIDATION`**. On completion the session is closed.

---

## cURL examples

Replace placeholders with your testnet values (see `.env.demo`).

```bash
export API=https://api.trustline.id/api/v0
export CHAIN_ID=2
export SENDER=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
export FIREWALL_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
export FORWARDER_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
export NATIVE_SAC=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
export DESTINATION=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Example 1 — Trustline Firewall (`forward` / bump)

Matches the **Ownership / Firewall** tab (`nativeAmount: "0"`).

**Step 1 — openSession**

```bash
curl -sS "$API" \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "openSession",
    "params": {
      "chainId": "'"$CHAIN_ID"'",
      "senderAddress": "'"$SENDER"'",
      "contractAddress": "'"$FIREWALL_ID"'",
      "nativeAmount": "0",
      "validationMode": "dapp",
      "data": {
        "functionPrototype": "forward(symbol,vec)",
        "args": ["bump", []]
      }
    }
  }'
```

**Step 2 — validate** (use `sessionId` from step 1)

```bash
curl -sS "$API" \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "validate",
    "params": {
      "sessionId": "<SESSION_ID>"
    }
  }'
```

Then sign from Freighter: `forward(initiator=<your G-address>, fn_name="bump", args=[])` on the firewall contract.

### Example 2 — Payment Forwarder (`pay_native`)

Matches the **Direct SDK** tab (1 XLM = `10000000` stroops).

**Step 1 — openSession**

```bash
curl -sS "$API" \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "openSession",
    "params": {
      "chainId": "'"$CHAIN_ID"'",
      "senderAddress": "'"$SENDER"'",
      "contractAddress": "'"$FORWARDER_ID"'",
      "nativeAmount": "10000000",
      "validationMode": "dapp",
      "data": {
        "functionPrototype": "pay_native(address,address,i128)",
        "args": ["'"$NATIVE_SAC"'", "'"$DESTINATION"'", "10000000"]
      }
    }
  }'
```

**Step 2 — validate**

Same as example 1, with the new `sessionId`.

Then sign: `pay_native(sender, native_token, destination, amount)` on the payment forwarder contract.

---

## Positional `args` values

Types come from `functionPrototype`. Common scalars in this demo:

| Prototype type | JSON value |
|----------------|------------|
| `address` | Contract id (`C…`) or account (`G…`) string |
| `i128` | Decimal integer string |
| `symbol` | Short symbol string (e.g. `"bump"`) |
| `vec` | Empty array `[]` only (use `vec<T>` for non-empty) |
| `vec<address>` etc. | JSON array of element values |

Other Soroban scalars / composites (`option`, `map`, `tuple`, …) follow the same positional rules as the TrustLine Backend API Reference.

---

## Client reference in this repo

TypeScript wrapper: [`src/lib/trustline.ts`](src/lib/trustline.ts) (`@trustline.id/websdk`)

Demo usage:

- Counter tab — [`src/App.tsx`](src/App.tsx) (`forward(initiator, symbol, vec)` with `public_forward`)
- Payment tab — [`src/App.tsx`](src/App.tsx) (`pay_native(address,address,i128)`)

---

## Related documentation

| Document | Scope |
|----------|--------|
| [README.md](README.md) | Running this demo UI |
| [stellar-sdk](https://github.com/TrustLine-id/stellar-sdk) | Integrator contract helpers |
| [stellar-validation-engine](https://github.com/TrustLine-id/stellar-validation-engine) | Validation Engine WASM |
