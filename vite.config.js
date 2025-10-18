import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vercel の静的ホスティングで 404 を避けるために相対配信
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist"
  },
  server: {
    host: true,
    port: 5173
  }
});
