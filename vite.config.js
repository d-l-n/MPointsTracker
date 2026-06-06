import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The service worker in /public/sw.js is copied as-is by Vite
// (files in public/ are not processed, just copied to dist/)

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: true,
      },
    },
  },
  server: {
    host: true, // expone en red local para testing en dispositivos
  },
});
