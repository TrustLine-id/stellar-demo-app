# Trustline Stellar — integration demo

> Built on [Stellar](https://stellar.org) with support from the [Stellar Community Fund](https://communityfund.stellar.org) — **SCF #44**.

This repository is a **minimal demo frontend** allowing to test the Trustline Stellar stack end-to-end. It is not a production dapp template: it wires [Freighter](https://www.freighter.app/) to Soroban testnet contracts and to [`@trustline.id/websdk`](https://www.npmjs.com/package/@trustline.id/websdk) so you can walk through the full flow in a few clicks — WebSDK **pre-validation** (`trustline.validate`) followed by an on-chain call that only succeeds when a proof was published.

The UI highlights the **two contract integration patterns** supported by [`trustline-sdk`](https://github.com/TrustLine-id/stellar-sdk): embed Trustline checks directly in your contract (Payment Forwarder tab), or gate a third-party contract through a firewall without Trustline calls in the target (Trustline Firewall tab). Both tabs share the same Validation Engine instance and the same WebSDK pre-validation step.

One React + Freighter UI with **two tabs**:

| Tab | Pattern | Contract |
|-----|---------|----------|
| **Simple Counter** | Trustline Firewall integration pattern — target has no Trustline call; operate via `forward` (`public_forward` in demo) | `trustline-firewall` + `protected-counter` |
| **Payment Forwarder** | Direct SDK integration pattern — contract embeds `require_trustline_addrs` | `payment-forwarder` |

Shared Validation Engine for both.

## Quick start (try the demo)

You only need **this repository**. Contract IDs are already deployed on Soroban testnet — no Rust checkout required.

```bash
git clone https://github.com/TrustLine-id/stellar-demo-app.git
cd stellar-demo-app

cp .env.demo .env
npm install
npm run dev
```

Open http://localhost:5173. Connect **Freighter** on **Testnet** with a funded account (for signing txs — not necessarily the original deployer).

The app reads contract addresses and `VITE_TRUSTLINE_CLIENT_ID` from `.env`, then calls `trustline.validate` from `@trustline.id/websdk` before each on-chain action.

**WebSDK:** [`@trustline.id/websdk`](https://www.npmjs.com/package/@trustline.id/websdk) ≥ 1.2.0 (Stellar support). Low-level JSON-RPC details: [BACKEND_PREVALIDATION_API.md](BACKEND_PREVALIDATION_API.md).

## How the demo is configured, and why

This stack is deliberately **open to any visitor**. That is a design choice made so
anyone can test this demo without contacting us, and it is worth understanding before
you read anything into it.

**The policy is a pass-through.** The Trustline backend approves every well-formed request.
Nothing here screens senders, amounts or destinations. What the demo proves is the
*enforcement* half: the on-chain gate rejects any protected call that is not backed by a
fresh, matching proof. Press **Bump only** or **pay_native only** to see it refuse.

**The firewall runs with `public_forward = true`.** The Trustline Firewall normally restricts
`forward` to its owner and to registered operators. In this demo that restriction is off, so
any funded Testnet account can drive the Simple Counter tab. Without it you would need a key
we hold, and the demo would not be self-service.

**What that combination means.** `forward` relays whatever function name it is given to the
target contract, with the firewall acting as that contract's admin. In production the policy
engine is what decides which calls are acceptable. Here the policy approves everything and
`forward` is open to everyone, so a visitor can reach any entrypoint on the counter,
including `set_admin`. Someone who does that will move the counter's admin away from the
firewall and the Simple Counter tab will stop working until we redeploy.

We have accepted that trade. These are throwaway Testnet contracts holding nothing of value,
and a self-service demo is worth more than an intact counter. If the counter tab is broken
when you try it, that is what happened, and the Payment Forwarder tab will still work. Tell
us and we will redeploy.

**None of this is how a real deployment looks.** In production the policy engine is
configured per integrator, `public_forward` is false, `forward` is restricted to known
operators, and the contracts are not funded by a faucet. The security model, key custody,
replay protection and known limitations are documented in
[SECURITY.md](https://github.com/TrustLine-id/stellar-validation-engine/blob/master/SECURITY.md).

## Redeploy the full stack (optional)

Use this when you want **your own** testnet client contracts (VE instance, firewall, counter, payment forwarder).

That builds WASM from **stellar-sdk** (sibling). The VE WASM itself comes from Trustline’s published
[`deployments.json`](https://github.com/TrustLine-id/stellar-validation-engine/blob/master/deployments.json)
(`ve_uploads[].wasm_hash` + `registry_contract_id` for your network) — **no VE checkout**. **Only this path needs the monorepo layout** — the UI alone works with `.env.demo`.

> **After deploy.** Register your new contract ids (firewall + payment forwarder) on
> [onboarding.trustline.id](https://onboarding.trustline.id) for chain id `2` (testnet),
> put the resulting client id in `VITE_TRUSTLINE_CLIENT_ID`, then map the tab entrypoints.
> Until then `validate` refuses the address (`Contract address C... is not registered on
> chain 2`) and both tabs fail with `NotApproved`. The shared stack in `.env.demo` is
> already registered — use it if you only want the UI.

### 1. Clone repositories

Pick a parent directory (example: `~/trustline-stellar`) and clone **siblings**:

```bash
mkdir -p ~/trustline-stellar && cd ~/trustline-stellar

git clone https://github.com/TrustLine-id/stellar-demo-app.git
git clone https://github.com/TrustLine-id/stellar-sdk.git
# Optional — only for ./scripts/deploy-testnet.sh (full stack):
git clone https://github.com/TrustLine-id/stellar-validation-engine.git
```

Expected layout:

```text
trustline-stellar/
├── stellar-demo-app/              ← this UI + client / full-stack deploy scripts
├── stellar-sdk/                   ← payment-forwarder, trustline-firewall, protected-counter
└── stellar-validation-engine/     ← registry + TrustlineOracleVE (+ scripts/deploy-testnet.sh)
```

### 2. Prerequisites

- [Rust](https://rustup.rs/) + target `wasm32v1-none`
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) (`stellar`)
- A funded **testnet** Stellar identity in the CLI (example: `alice`)

```bash
rustup target add wasm32v1-none
stellar keys fund alice --network testnet   # if needed
```

### 3. Deploy

**Client only** — from published [`deployments.json`](https://github.com/TrustLine-id/stellar-validation-engine/blob/master/deployments.json):

```bash
export STELLAR_ACCOUNT=alice
export VE_WASM_HASH=…          # testnet → ve_uploads[].wasm_hash
export REGISTRY_ID=C…          # ve_uploads[].registry_contract_id
./scripts/deploy-client-testnet.sh
```

**Full stack** (fresh core + client; needs sibling `stellar-validation-engine` — reads `deployments.json` after step 1):

```bash
export STELLAR_ACCOUNT=alice
./scripts/deploy-testnet.sh
```

`deploy-client-testnet.sh` writes a new `.env` with your deployed contract IDs. Import the same secret as `STELLAR_ACCOUNT` into Freighter (Testnet), then register the contracts as above.

## Environment files

| File | Purpose |
|------|---------|
| `.env.demo` | **Ready-to-run** testnet IDs (shared demo stack). Copy to `.env`. |
| `.env.example` | Empty template — documents all variables. |
| `.env` | Local config (gitignored). Created by `cp .env.demo .env` or by `deploy-client-testnet.sh`. |

```bash
cp .env.demo .env   # try the pre-deployed demo
```

## Related repositories

| Repo | Role |
|------|------|
| [stellar-demo-app](https://github.com/TrustLine-id/stellar-demo-app) | This repo — React UI |
| [stellar-sdk](https://github.com/TrustLine-id/stellar-sdk) | Example contracts (client deploy) |
| [stellar-validation-engine](https://github.com/TrustLine-id/stellar-validation-engine) | Published VE WASM hashes (`deployments.json`) |

## Flows

Each tab calls `trustline.validate` via `@trustline.id/websdk` (with `VITE_TRUSTLINE_CLIENT_ID` + `VITE_BACKEND_CHAIN_ID`), then executes the on-chain protocol call from Freighter. See [BACKEND_PREVALIDATION_API.md](BACKEND_PREVALIDATION_API.md) for the underlying JSON-RPC / cURL samples.

**Simple Counter tab:** WebSDK pre-validation → `forward(initiator, "bump")` (demo: `public_forward=true`, any Freighter account)
**Payment Forwarder:** WebSDK pre-validation → `pay_native(sender, sac, destination, amount)`

## License

Copyright (c) 2026 [Trustline Digital Asset Ltd.](https://www.trustline.id). All rights reserved. MIT — see [LICENSE](LICENSE).
