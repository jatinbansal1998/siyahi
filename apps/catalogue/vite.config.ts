import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The repo's assets folder holds the icon, which is also the favicon.
  publicDir: "../../assets",
});
