import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      exclude: [
        "node_modules/**",
        "dist/**",
        "tests/**",
        "contracts/**",
      ],
      include: [
        "src/**/*.test.js",
        "src/**/*.test.jsx",
        "src/**/*.spec.js",
        "src/**/*.spec.jsx",
        "scripts/**/*.test.js",
      ],
      passWithNoTests: true,
      setupFiles: "src/test-setup.js",
    },
  })
);
