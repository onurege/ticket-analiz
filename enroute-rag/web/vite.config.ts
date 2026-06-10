import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Parent dizindeki postcss.config.mjs'i bu app kullanmıyor — devre dışı bırak
  css: { postcss: { plugins: [] } },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
