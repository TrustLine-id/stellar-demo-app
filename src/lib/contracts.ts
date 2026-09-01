import { Client as FirewallClient } from "@bindings/firewall";
import { Client as PaymentForwarderClient } from "@bindings/payment-forwarder";
import { Client as VeClient, ValidationMode } from "@bindings/ve";
import { Client as CounterClient } from "@bindings/counter";
import { signTransaction } from "./wallet";

export type AppConfig = {
  rpcUrl: string;
  networkPassphrase: string;
  registryId: string;
  veId: string;
  firewallId: string;
  counterId: string;
  paymentForwarderId: string;
  nativeTokenId: string;
  backendApiUrl: string;
  backendChainId: string;
};

export function loadConfig(): AppConfig {
  return {
    rpcUrl: import.meta.env.VITE_RPC_URL || "https://soroban-testnet.stellar.org",
    networkPassphrase:
      import.meta.env.VITE_NETWORK_PASSPHRASE ||
      "Test SDF Network ; September 2015",
    registryId: import.meta.env.VITE_REGISTRY_CONTRACT_ID || "",
    veId: import.meta.env.VITE_VE_CONTRACT_ID || "",
    firewallId: import.meta.env.VITE_FIREWALL_CONTRACT_ID || "",
    counterId: import.meta.env.VITE_COUNTER_CONTRACT_ID || "",
    paymentForwarderId:
      import.meta.env.VITE_PAYMENT_FORWARDER_CONTRACT_ID || "",
    nativeTokenId: import.meta.env.VITE_NATIVE_TOKEN_ID || "",
    backendApiUrl:
      import.meta.env.VITE_BACKEND_API_URL ||
      "https://api.trustline.id/api/v0",
    backendChainId: import.meta.env.VITE_BACKEND_CHAIN_ID || "123",
  };
}

function clientOpts(config: AppConfig, publicKey: string) {
  return {
    contractId: "",
    networkPassphrase: config.networkPassphrase,
    rpcUrl: config.rpcUrl,
    publicKey,
    signTransaction,
  };
}

export function veClient(config: AppConfig, publicKey: string) {
  return new VeClient({
    ...clientOpts(config, publicKey),
    contractId: config.veId,
  });
}

export function firewallClient(config: AppConfig, publicKey: string) {
  return new FirewallClient({
    ...clientOpts(config, publicKey),
    contractId: config.firewallId,
  });
}

export function counterClient(config: AppConfig, publicKey: string) {
  return new CounterClient({
    ...clientOpts(config, publicKey),
    contractId: config.counterId,
  });
}

export function paymentForwarderClient(config: AppConfig, publicKey: string) {
  return new PaymentForwarderClient({
    ...clientOpts(config, publicKey),
    contractId: config.paymentForwarderId,
  });
}

export { ValidationMode };
