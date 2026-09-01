# Trustline Stellar — integration demo

> Built on [Stellar](https://stellar.org) with support from the [Stellar Community Fund](https://communityfund.stellar.org) — **SCF #44**.

This repository is a **minimal demo frontend** allowing to test the Trustline Stellar stack end-to-end. It is not a production dapp template: it wires [Freighter](https://www.freighter.app/) to Soroban testnet contracts and to the Trustline backend so you can walk through the full flow in a few clicks — backend **pre-validation** (`openSession` / `validate`) followed by an on-chain call that only succeeds when a proof was published.

The UI highlights the **two contract integration patterns** supported by [`trustline-sdk`](https://github.com/TrustLine-id/stellar-sdk): embed Trustline checks directly in your contract (Payment Forwarder tab), or gate a third-party contract through a firewall without Trustline calls in the target (Trustline Firewall tab). Both tabs share the same Validation Engine instance and the same backend pre-validation step.

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

The app reads contract addresses from `.env` and calls the Trustline backend (`VITE_BACKEND_API_URL`) before each on-chain action.

**Backend API reference:** [BACKEND_PREVALIDATION_API.md](BACKEND_PREVALIDATION_API.md) — JSON-RPC `openSession` / `validate` for Stellar, with cURL examples matching both demo tabs.

## How the demo is configured, and why

This stack is deliberately **open to any visitor**. That is a design choice made so
anywone can test this demo without contacting us, and it is worth understanding before
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

Use this when you want **your own** testnet contracts (fresh registry, VE, firewall, counter, payment forwarder).

That requires `scripts/deploy-testnet.sh`, which builds WASM from the sibling Rust repos. **Only this path needs the monorepo layout below** — the UI alone works with `.env.demo`.

> **Before you start.** The deploy script gives you your own contracts, but the hosted
> Trustline backend at `api.trustline.id` only pre-validates contracts that have been
> registered with us for a chain id. It will refuse a freshly deployed address with
> `Contract address C... is not registered on chain 123`, so both tabs will fail with
> `NotApproved` until we register them. Use this path to verify the contracts build and
> deploy from source. To exercise the full flow end to end, either use `.env.demo` or
> contact us to have your contracts registered.

### 1. Clone the three repositories

Pick a parent directory (example: `~/trustline-stellar`) and clone **siblings** with these exact folder names:

```bash
mkdir -p ~/trustline-stellar && cd ~/trustline-stellar

git clone https://github.com/TrustLine-id/stellar-demo-app.git
git clone https://github.com/TrustLine-id/stellar-sdk.git
git clone https://github.com/TrustLine-id/stellar-validation-engine.git
```

Expected layout:

```text
trustline-stellar/
├── stellar-demo-app/              ← this UI + scripts/deploy-testnet.sh
├── stellar-sdk/                   ← payment-forwarder, trustline-firewall, protected-counter
└── stellar-validation-engine/     ← registry, TrustlineOracleVE
```

The deploy script resolves:

- `../stellar-sdk` — example client contracts
- `../stellar-validation-engine` — registry + VE WASM

### 2. Prerequisites

- [Rust](https://rustup.rs/) + target `wasm32v1-none`
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) (`stellar`)
- A funded **testnet** Stellar identity in the CLI (example: `alice`)

```bash
rustup target add wasm32v1-none
stellar keys fund alice --network testnet   # if needed
```

If `trustline-sdk` is not yet on crates.io, enable the local patch in the validation-engine repo:

```bash
cp stellar-validation-engine/.cargo/config.toml.example stellar-validation-engine/.cargo/config.toml
```

### 3. Deploy and run

```bash
cd stellar-demo-app

export STELLAR_ACCOUNT=alice   # deployer + firewall owner
# Optional backend oracle for add_tx (default in deploy-testnet.sh):
# export BACKEND_ORACLE=GADELLMHQRWZIYL5YJ264LDTAV3C3I2AQI6TV46WTLUYM3BFG36PDS2Q

./scripts/deploy-testnet.sh

npm install && npm run dev
```

The script writes a new `.env` with your deployed contract IDs. Import the same secret as `STELLAR_ACCOUNT` into Freighter (Testnet).

## Environment files

| File | Purpose |
|------|---------|
| `.env.demo` | **Ready-to-run** testnet IDs (shared demo stack). Copy to `.env`. |
| `.env.example` | Empty template — documents all variables. |
| `.env` | Local config (gitignored). Created by `cp .env.demo .env` or by `deploy-testnet.sh`. |

```bash
cp .env.demo .env   # try the pre-deployed demo
```

## Related repositories

| Repo | Role |
|------|------|
| [stellar-demo-app](https://github.com/TrustLine-id/stellar-demo-app) | This repo — React UI |
| [stellar-sdk](https://github.com/TrustLine-id/stellar-sdk) | Example contracts (deploy script only) |
| [stellar-validation-engine](https://github.com/TrustLine-id/stellar-validation-engine) | Registry + VE (deploy script only) |

## Flows

Each tab calls `openSession` / `validate` on the Trustline backend (`VITE_BACKEND_API_URL`, default `https://api.trustline.id/api/v0`), then executes the on-chain protocol call from Freighter. See [BACKEND_PREVALIDATION_API.md](BACKEND_PREVALIDATION_API.md) for request/response details and cURL samples.

**Simple Counter tab:** backend `add_tx` → `forward(initiator, "bump")` (demo: `public_forward=true`, any Freighter account)
**Payment Forwarder:** backend `add_tx` → `pay_native(sender, sac, destination, amount)`

## License

Copyright (c) 2026 [Trustline Digital Asset Ltd.](https://www.trustline.id). All rights reserved. MIT — see [LICENSE](LICENSE).
