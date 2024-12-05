import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // Use relative paths for Electron
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
        control: "./control.html",
      },
    },
  },
});