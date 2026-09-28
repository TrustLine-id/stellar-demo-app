import {
  trustline,
  type TrustlineWeb3ValidateParams,
} from "@trustline.id/websdk";

let initialized = false;

export function initTrustline(clientId: string) {
  if (initialized) return;
  if (!clientId.trim()) {
    throw new Error(
      "Missing VITE_TRUSTLINE_CLIENT_ID — set it in .env (Trustline dashboard client id)",
    );
  }
  trustline.init({ clientId: clientId.trim() });
  initialized = true;
}

export type PrevalidateParams = Omit<
  TrustlineWeb3ValidateParams,
  "validationMode"
> & {
  validationMode?: TrustlineWeb3ValidateParams["validationMode"];
};

/**
 * Pre-validate a Stellar intent via `@trustline.id/websdk` (openSession + validate,
 * including OTP UX when the policy requires it).
 */
export async function prevalidateIntent(
  clientId: string,
  params: PrevalidateParams,
): Promise<{ certId: string; policyHash?: string }> {
  initTrustline(clientId);

  const response = await trustline.validate({
    validationMode: "dapp",
    ...params,
  });

  if ("error" in response) {
    throw new Error(response.error.message || "Trustline validation error");
  }

  const { result } = response;
  if (result.status === "rejected") {
    throw new Error(
      `${result.type || "REJECTED"}: ${result.reason || "validation rejected"}`,
    );
  }
  if (result.status === "approval_required") {
    throw new Error(
      "Trustline returned approval_required (auditor flow not supported in this demo)",
    );
  }
  if (result.status !== "approved") {
    throw new Error(`Unexpected validate status: ${String((result as { status: string }).status)}`);
  }

  return {
    certId: result.certId,
    policyHash: result.attestation?.policyHash,
  };
}
