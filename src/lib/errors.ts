import { Errors as VeErrors } from "@bindings/ve";

/**
 * Soroban has no revert strings: a failed contract call surfaces as
 * `Error(Contract, #N)`. The codes below come from the Validation Engine
 * (`Errors` in the generated bindings) and reach the UI through the firewall
 * or the protected contract, which trap when their VE sub-call fails.
 */
const VE_HINTS: Record<number, string> = {
  1: "The caller is not permitted. For add_tx the publisher must be a registry-approved oracle; for owner-only entrypoints the signer must be the contract owner.",
  2: "A proof existed but its validity window has passed. Re-run pre-validation and send the transaction sooner.",
  3: "The proof timestamp is in the future, beyond the engine's allowed clock skew.",
  4: "A proof for this intent already exists. Proofs are single-use, so re-run pre-validation for a fresh one.",
  5: "No approved Trustline proof for this exact intent. Either pre-validation was skipped, or the proof was published for a different sender, amount or arguments than the call being made.",
  6: "The address is flagged by the sanctions oracle.",
  7: "The proof is not in a pending state, so it cannot be approved or rejected.",
  8: "The sanctions key is not configured in the registry.",
};

const CONTRACT_ERROR = /Error\(Contract,\s*#(\d+)\)/;

/** Maps a Soroban contract error code to `Name: explanation`, if known. */
export function describeContractError(code: number): string | null {
  const name = (VeErrors as Record<number, { message: string }>)[code]?.message;
  if (!name) return null;
  const hint = VE_HINTS[code];
  return hint ? `${name}: ${hint}` : name;
}

/**
 * Turns a thrown value into something a human can act on, expanding
 * `Error(Contract, #N)` into the Validation Engine's error name and meaning.
 */
export function describeError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const match = CONTRACT_ERROR.exec(raw);
  if (!match) return raw;

  const code = Number(match[1]);
  const described = describeContractError(code);
  return described
    ? `Validation Engine error #${code}, ${described}`
    : `Contract error #${code} (no description available)`;
}
