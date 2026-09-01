export type SorobanArg = {
  type: string;
  value: unknown;
};

export type StructuredIntentData = {
  functionPrototype: string;
  args: SorobanArg[];
};

export type OpenSessionParams = {
  chainId: string;
  senderAddress: string;
  contractAddress: string;
  nativeAmount: string;
  data: StructuredIntentData;
  validationMode?: "dapp";
};

type OpenSessionResult = {
  success: boolean;
  sessionId?: string;
  authRequired?: boolean;
  error?: string;
};

export type ValidateResult = {
  status: "approved" | "approval_required" | "rejected";
  certId?: string;
  policyHash?: string;
  timestamp?: number;
  publication?: { status: string; txHash?: string };
  type?: string;
  reason?: string;
};

type JsonRpcEnvelope<T> = {
  jsonrpc?: string;
  id?: number;
  result?: T;
  error?: { message?: string; data?: unknown };
};

async function jsonRpc<T>(
  url: string,
  method: string,
  params: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  if (!res.ok) {
    throw new Error(`Backend HTTP ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as JsonRpcEnvelope<T> & Partial<T>;
  if (body.error) {
    throw new Error(body.error.message || "Backend JSON-RPC error");
  }

  const payload = (body.result ?? body) as T & OpenSessionResult;
  if ("success" in payload && payload.success === false) {
    throw new Error(payload.error || `${method} failed`);
  }

  return payload as T;
}

export async function openSession(
  url: string,
  params: OpenSessionParams,
): Promise<string> {
  const result = await jsonRpc<OpenSessionResult>(url, "openSession", params);
  if (!result.success || !result.sessionId) {
    throw new Error(result.error || "openSession did not return sessionId");
  }
  return result.sessionId;
}

export async function validateSession(
  url: string,
  sessionId: string,
): Promise<ValidateResult> {
  const result = await jsonRpc<ValidateResult>(url, "validate", {
    sessionId,
  });

  if (result.status === "rejected") {
    throw new Error(
      `${result.type || "REJECTED"}: ${result.reason || "validation rejected"}`,
    );
  }
  if (result.status === "approval_required") {
    throw new Error(
      "Backend returned approval_required (auditor flow not supported in this demo)",
    );
  }
  if (result.status !== "approved") {
    throw new Error(`Unexpected validate status: ${String(result.status)}`);
  }
  if (result.publication?.status && result.publication.status !== "success") {
    throw new Error(
      `On-chain publication failed: ${result.publication.status}`,
    );
  }

  return result;
}

/** openSession → validate (waits for backend add_tx). */
export async function prevalidateViaBackend(
  url: string,
  params: OpenSessionParams,
): Promise<ValidateResult> {
  const sessionId = await openSession(url, params);
  return validateSession(url, sessionId);
}
