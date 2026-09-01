/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL: string;
  readonly VITE_NETWORK_PASSPHRASE: string;
  readonly VITE_NETWORK: string;
  readonly VITE_REGISTRY_CONTRACT_ID: string;
  readonly VITE_VE_CONTRACT_ID: string;
  readonly VITE_FIREWALL_CONTRACT_ID: string;
  readonly VITE_COUNTER_CONTRACT_ID: string;
  readonly VITE_PAYMENT_FORWARDER_CONTRACT_ID: string;
  readonly VITE_NATIVE_TOKEN_ID: string;
  readonly VITE_BACKEND_API_URL: string;
  readonly VITE_BACKEND_CHAIN_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
