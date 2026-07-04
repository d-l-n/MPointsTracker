import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function validateEnvPlugin() {
  return {
    name: "validate-env",
    enforce: "pre",
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), "VITE_");
      const required = ["VITE_SPOTIFY_CLIENT_ID"];
      for (const key of required) {
        if (!env[key]) {
          throw new Error(`Missing required env var: ${key} — check .env.local`);
        }
      }
    },
  };
}

function stripCrossOrigin() {
  return {
    name: "strip-crossorigin",
    enforce: "post",
    transformIndexHtml(html) {
      return html.replace(/ crossorigin(?:=["'][^"']*["'])?/g, "");
    },
  };
}

export default defineConfig({
  plugins: [validateEnvPlugin(), react(), stripCrossOrigin()],
  build: {
    crossOriginLoading: false,
    rolldownOptions: {
      output: {
        codeSplitting: true,
      },
    },
  },
  server: {
    host: true,
    allowedHosts: ["trapeze-manifesto-mustiness.ngrok-free.dev"],
  },
});
