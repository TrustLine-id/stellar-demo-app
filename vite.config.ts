import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@bindings/firewall": path.resolve(root, "src/bindings/trustline-firewall/src"),
      "@bindings/payment-forwarder": path.resolve(root, "src/bindings/payment-forwarder/src"),
      "@bindings/ve": path.resolve(root, "src/bindings/validation-engine/src"),
      "@bindings/counter": path.resolve(root, "src/bindings/protected-counter/src"),
      buffer: "buffer/",
    },
  },
  optimizeDeps: {
    include: ["buffer"],
  },
  server: {
    port: 5173,
    // Optional: set VITE_BACKEND_API_URL=/api/v0 to proxy a local backend on :8080
    proxy: {
      "/api/v0": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
