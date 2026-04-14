import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../BACKEND/OfficeMeal.Web/wwwroot",
    emptyOutDir: true
  },
  server: {
    proxy: {
      "/api": {
        target: "https://localhost:64852",
        changeOrigin: true,
        secure: false
      },
      "/orderHub": {
        target: "https://localhost:64852",
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
});
