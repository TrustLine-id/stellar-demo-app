import { useCallback, useMemo, useState } from "react";
import {
  counterClient,
  firewallClient,
  loadConfig,
  paymentForwarderClient,
  type AppConfig,
} from "./lib/contracts";
import { prevalidateViaBackend } from "./lib/backendApi";
import { connectFreighter, type WalletState } from "./lib/wallet";
import { describeError } from "./lib/errors";
import "./App.css";

type Tab = "ownership" | "direct";
type LogLevel = "info" | "ok" | "err";
type LogLine = { id: number; level: LogLevel; text: string };

export default function App() {
  const config = useMemo(() => loadConfig(), []);
  const [tab, setTab] = useState<Tab>("ownership");
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);

  const pushLog = useCallback((level: LogLevel, text: string) => {
    setLogs((prev) =>
      [{ id: Date.now() + Math.random(), level, text }, ...prev].slice(0, 50),
    );
  }, []);

  const onConnect = async () => {
    setBusy(true);
    try {
      const w = await connectFreighter();
      setWallet(w);
      pushLog(
        "ok",
        `Connected ${w.address.slice(0, 4)}…${w.address.slice(-4)} on ${w.network}`,
      );
    } catch (e) {
      pushLog("err", describeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-header-brand">
            <div className="site-header-partners" aria-label="Stellar ecosystem">
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noreferrer"
                title="Stellar"
              >
                <img
                  src="/branding/stellar-mark.svg"
                  alt="Stellar"
                  className="partner-logo partner-logo-stellar"
                />
              </a>
              <a
                href="https://communityfund.stellar.org"
                target="_blank"
                rel="noreferrer"
                title="Stellar Community Fund — SCF #44"
              >
                <ScfBadge variant="dark" />
              </a>
            </div>
            <h1>trustline — Stellar demo</h1>
          </div>
          <button
            type="button"
            className={wallet ? "wallet-btn connected" : "wallet-btn"}
            disabled={busy}
            onClick={onConnect}
          >
            {wallet ? short(wallet.address) : "Connect Freighter"}
          </button>
        </div>
      </header>

      <section className="demo-intro" aria-label="About this demo">
        <div className="demo-partners">
          <span className="demo-partners-label">Developed with support from</span>
          <div className="demo-partners-logos">
            <a href="https://stellar.org" target="_blank" rel="noreferrer">
              <img
                src="/branding/stellar-mark-dark.svg"
                alt="Stellar"
                className="partner-logo partner-logo-stellar"
              />
            </a>
            <a
              href="https://communityfund.stellar.org"
              target="_blank"
              rel="noreferrer"
            >
              <ScfBadge variant="light" />
            </a>
          </div>
          <p className="demo-partners-text">
            This demo is part of{" "}
            <a
              href="https://communityfund.stellar.org"
              target="_blank"
              rel="noreferrer"
            >
              Stellar Community Fund
            </a>{" "}
            award <strong>SCF #44</strong>.
          </p>
        </div>
        <p>
          This page is a <strong>test UI</strong> demonstrating the integration
          of <strong>Trustline</strong> with Stellar. It shows that a call
          to functionality protected by Trustline can succeed only after an
          off-chain pre-validation step: the Trustline backend publishes a temporary
          proof (<code>add_tx</code>) according to a <strong>configurable policy</strong>.
          In this demo, that policy is a pass-through which means it does not perform any
          real checks, but the on-chain gate still applies: without a valid proof,
          the protected call is rejected.
        </p>
        <p>
          Trustline supports two integration styles, illustrated in the tabs below:{" "}
          <strong>Trustline Firewall</strong>: a gateway contract that is{" "}
          <strong>admin of the contract to protect</strong>, validates callers via
          owner / operators / <code>public_forward</code>, and forwards calls
          after validation; and <strong>Direct SDK integration</strong>: the
          protected contract embeds <code>require_trustline*</code> itself (here,
          the Payment Forwarder). In both cases, prevalidation runs through the
          Trustline backend before you sign the on-chain action with Freighter.
        </p>
      </section>

      <nav className="tabs" aria-label="Demo mode">
        <button
          type="button"
          className={tab === "ownership" ? "tab active" : "tab"}
          onClick={() => setTab("ownership")}
        >
          Simple Counter
          <span>Trustline Firewall + public forward demo</span>
        </button>
        <button
          type="button"
          className={tab === "direct" ? "tab active" : "tab"}
          onClick={() => setTab("direct")}
        >
          Payment Forwarder
          <span>Direct SDK integration</span>
        </button>
      </nav>

      {tab === "ownership" ? (
        <OwnershipTab
          config={config}
          wallet={wallet}
          busy={busy}
          setBusy={setBusy}
          pushLog={pushLog}
        />
      ) : (
        <DirectTab
          config={config}
          wallet={wallet}
          busy={busy}
          setBusy={setBusy}
          pushLog={pushLog}
        />
      )}

      <section className="panel">
        <h2>Activity</h2>
        <ul className="log">
          {logs.length === 0 && <li className="muted">No activity yet.</li>}
          {logs.map((l) => (
            <li key={l.id} className={l.level}>
              {l.text}
            </li>
          ))}
        </ul>
      </section>

      <footer className="site-footer">
        <div className="site-footer-partners" aria-label="Partners">
          <a href="https://stellar.org" target="_blank" rel="noreferrer">
            <img
              src="/branding/stellar-mark-dark.svg"
              alt="Stellar"
              className="partner-logo partner-logo-stellar"
            />
          </a>
          <a
            href="https://communityfund.stellar.org"
            target="_blank"
            rel="noreferrer"
          >
            <ScfBadge variant="light" />
          </a>
        </div>
        <p>
          <a href="https://www.trustline.id" target="_blank" rel="noreferrer">
            trustline.id
          </a>
          {" · "}
          Stellar integration demo ·{" "}
          <a
            href="https://communityfund.stellar.org"
            target="_blank"
            rel="noreferrer"
          >
            SCF #44
          </a>
        </p>
      </footer>
    </div>
  );
}

type TabProps = {
  config: AppConfig;
  wallet: WalletState | null;
  busy: boolean;
  setBusy: (v: boolean) => void;
  pushLog: (level: LogLevel, text: string) => void;
};

function OwnershipTab({ config, wallet, busy, setBusy, pushLog }: TabProps) {
  const [count, setCount] = useState<number | null>(null);
  const configured =
    Boolean(config.veId) &&
    Boolean(config.firewallId) &&
    Boolean(config.counterId);

  const fetchCount = async (address: string) => {
    const counter = counterClient(config, address);
    const tx = await counter.count();
    setCount(Number(tx.result));
    pushLog("info", `Counter = ${tx.result}`);
  };

  const runProtectedBump = async () => {
    if (!wallet) return pushLog("err", "Connect Freighter first");
    if (!configured) return pushLog("err", "Set ownership contract IDs in .env");

    setBusy(true);
    try {
      pushLog("info", "[Firewall] Backend pre-validation…");
      let validation;
      try {
        validation = await prevalidateViaBackend(config.backendApiUrl, {
          chainId: config.backendChainId,
          senderAddress: wallet.address,
          contractAddress: config.firewallId,
          nativeAmount: "0",
          data: {
            functionPrototype: "forward(symbol,vec)",
            args: [
              { type: "symbol", value: "bump" },
              { type: "vec", value: [] },
            ],
          },
        });
      } catch (e) {
        pushLog(
          "err",
          `[Firewall] Backend pre-validation failed — ${describeError(e)}`,
        );
        return;
      }
      pushLog(
        "ok",
        `[Firewall] Backend pre-validation OK — certId=${validation.certId ?? "?"} tx=${validation.publication?.txHash ?? "?"}`,
      );

      pushLog("info", "[Firewall] forward(bump)");
      const fw = firewallClient(config, wallet.address);
      const fwd = await fw.forward({
        initiator: wallet.address,
        fn_name: "bump",
        args: [],
      });
      const sent = await fwd.signAndSend();
      pushLog("ok", `[Firewall] forward OK — ${String(sent.result ?? "ok")}`);
      await fetchCount(wallet.address);
    } catch (e) {
      pushLog("err", describeError(e));
    } finally {
      setBusy(false);
    }
  };

  const runBumpOnly = async () => {
    if (!wallet) return pushLog("err", "Connect Freighter first");
    if (!configured) return pushLog("err", "Set ownership contract IDs in .env");

    setBusy(true);
    try {
      pushLog("info", "[Firewall] bump without add_tx");
      const fw = firewallClient(config, wallet.address);
      const fwd = await fw.forward({
        initiator: wallet.address,
        fn_name: "bump",
        args: [],
      });
      await fwd.signAndSend();
      pushLog("err", "[Firewall] unexpected success — validation should have blocked");
      await fetchCount(wallet.address);
    } catch (e) {
      pushLog("err", `[Firewall] ${describeError(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="hero">
      <h1>Simple Counter</h1>
      <p className="lede">
      Firewall/Ownership integration pattern: the counter contract has <strong>no</strong>{" "}
        <code>require_trustline</code>. You operate it only through the firewall
        (<code>forward</code>), which is the only contract (admin) allowed to bump the counter.
      </p>

      <section className="panel">
        <h2>Contracts</h2>
        <dl className="meta">
          <div>
            <dt>Registry</dt>
            <dd>{config.registryId || "— VITE_REGISTRY_CONTRACT_ID"}</dd>
          </div>
          <div>
            <dt>Validation Engine</dt>
            <dd>{config.veId || "— VITE_VE_CONTRACT_ID"}</dd>
          </div>
          <div>
            <dt>Trustline Firewall</dt>
            <dd>{config.firewallId || "— VITE_FIREWALL_CONTRACT_ID"}</dd>
          </div>
          <div>
            <dt>Protected counter</dt>
            <dd>{config.counterId || "— VITE_COUNTER_CONTRACT_ID"}</dd>
          </div>
        </dl>
      </section>

      <section className="panel actions">
        <div className="stat">
          <span className="stat-label">On-chain count</span>
          <span className="stat-value">{count === null ? "—" : count}</span>
        </div>
        <div className="buttons">
          <button
            type="button"
            className="btn"
            disabled={busy || !wallet || !configured}
            onClick={async () => {
              if (!wallet) return;
              setBusy(true);
              try {
                await fetchCount(wallet.address);
              } catch (e) {
                pushLog("err", describeError(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Refresh count
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={busy || !wallet || !configured}
            onClick={runProtectedBump}
          >
            {busy ? "Working…" : "Prevalidate + bump"}
          </button>
          <button
            type="button"
            className="btn danger"
            disabled={busy || !wallet || !configured}
            onClick={runBumpOnly}
          >
            Bump only
          </button>
        </div>
        <p className="hint">
          Any Freighter account may sign <code>forward</code> (public forward mode).
          Prevalidation runs via the Trustline backend at{" "}
          <code>{config.backendApiUrl}</code>. Use <strong>Bump only</strong>{" "}
          to confirm rejection without a fresh proof.
        </p>
      </section>
    </main>
  );
}

function DirectTab({ config, wallet, busy, setBusy, pushLog }: TabProps) {
  const [destination, setDestination] = useState("");
  const [amountStroops, setAmountStroops] = useState("10000000"); // 1 XLM
  const configured =
    Boolean(config.veId) &&
    Boolean(config.paymentForwarderId) &&
    Boolean(config.nativeTokenId);

  const runPayNative = async () => {
    if (!wallet) return pushLog("err", "Connect Freighter first");
    if (!configured) return pushLog("err", "Set payment forwarder contract IDs in .env");
    const dest = destination.trim() || wallet.address;
    const amount = BigInt(amountStroops || "0");
    if (amount <= 0n) return pushLog("err", "Amount must be > 0 stroops");

    setBusy(true);
    try {
      pushLog("info", "[SDK] Backend pre-validation…");
      let validation;
      try {
        validation = await prevalidateViaBackend(config.backendApiUrl, {
          chainId: config.backendChainId,
          senderAddress: wallet.address,
          contractAddress: config.paymentForwarderId,
          nativeAmount: amount.toString(),
          data: {
            functionPrototype: "pay_native(address,address,i128)",
            args: [
              { type: "address", value: config.nativeTokenId },
              { type: "address", value: dest },
              { type: "i128", value: amount.toString() },
            ],
          },
        });
      } catch (e) {
        pushLog(
          "err",
          `[SDK] Backend pre-validation failed — ${describeError(e)}`,
        );
        return;
      }
      pushLog(
        "ok",
        `[SDK] Backend pre-validation OK — certId=${validation.certId ?? "?"} tx=${validation.publication?.txHash ?? "?"}`,
      );

      pushLog("info", "[SDK] pay_native");
      const pay = paymentForwarderClient(config, wallet.address);
      const payTx = await pay.pay_native({
        sender: wallet.address,
        native_token: config.nativeTokenId,
        destination: dest,
        amount,
      });
      await payTx.signAndSend();
      pushLog("ok", `[SDK] pay_native sent ${amount} stroops → ${short(dest)}`);
    } catch (e) {
      pushLog("err", describeError(e));
    } finally {
      setBusy(false);
    }
  };

  const runPayNativeOnly = async () => {
    if (!wallet) return pushLog("err", "Connect Freighter first");
    if (!configured) return pushLog("err", "Set payment forwarder contract IDs in .env");
    const dest = destination.trim() || wallet.address;
    const amount = BigInt(amountStroops || "0");
    if (amount <= 0n) return pushLog("err", "Amount must be > 0 stroops");

    setBusy(true);
    try {
      pushLog("info", "[SDK] pay_native without add_tx");
      const pay = paymentForwarderClient(config, wallet.address);
      const payTx = await pay.pay_native({
        sender: wallet.address,
        native_token: config.nativeTokenId,
        destination: dest,
        amount,
      });
      await payTx.signAndSend();
      pushLog("err", "[SDK] unexpected success — validation should have blocked");
    } catch (e) {
      pushLog("err", `[SDK] ${describeError(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="hero">
      <h1>Payment Forwarder</h1>
      <p className="lede">
        Direct SDK integration pattern: the payment forwarder contract calls{" "}
        <code>require_trustline_addrs</code> before performing the transfer.
      </p>

      <section className="panel">
        <h2>Contracts</h2>
        <dl className="meta">
          <div>
            <dt>Registry</dt>
            <dd>{config.registryId || "— VITE_REGISTRY_CONTRACT_ID"}</dd>
          </div>
          <div>
            <dt>Validation Engine</dt>
            <dd>{config.veId || "— VITE_VE_CONTRACT_ID"}</dd>
          </div>
          <div>
            <dt>Payment Forwarder</dt>
            <dd>{config.paymentForwarderId || "— VITE_PAYMENT_FORWARDER_CONTRACT_ID"}</dd>
          </div>
          <div>
            <dt>Native SAC</dt>
            <dd>{config.nativeTokenId || "— VITE_NATIVE_TOKEN_ID"}</dd>
          </div>
        </dl>
      </section>

      <section className="panel actions">
        <label className="field">
          <span>Destination (empty = self)</span>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="G… or C…"
            spellCheck={false}
          />
        </label>
        <label className="field">
          <span>Amount (stroops)</span>
          <input
            value={amountStroops}
            onChange={(e) => setAmountStroops(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <div className="buttons">
          <button
            type="button"
            className="btn primary"
            disabled={busy || !wallet || !configured}
            onClick={runPayNative}
          >
            {busy ? "Working…" : "Prevalidate + pay_native"}
          </button>
          <button
            type="button"
            className="btn danger"
            disabled={busy || !wallet || !configured}
            onClick={runPayNativeOnly}
          >
            pay_native only
          </button>
        </div>
        <p className="hint">
          Freighter must be the payment <strong>sender</strong> (funded in the
          native SAC). Prevalidation runs via the Trustline backend at{" "}
          <code>{config.backendApiUrl}</code>. Use <strong>pay_native only</strong>{" "}
          to confirm rejection without a fresh proof.
        </p>
      </section>
    </main>
  );
}

function ScfBadge({ variant = "light" }: { variant?: "dark" | "light" }) {
  return (
    <span
      className={`scf-badge scf-badge--${variant}`}
      aria-label="Stellar Community Fund award SCF number 44"
    >
      <span className="scf-badge__prefix">SCF</span>
      <span className="scf-badge__number">#44</span>
    </span>
  );
}

function short(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
