import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ["recharts"],
          xlsx:     ["xlsx"],
          lucide:   ["lucide-react"],
          vendor:   ["react", "react-dom", "react-router-dom", "@reduxjs/toolkit", "react-redux"],
        },
      },
    },
  },
});
