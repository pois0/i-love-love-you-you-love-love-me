import pluginReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import pluginTSconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  publicDir: "public",
  plugins: [
    pluginReact(),
    pluginTSconfigPaths(),
  ],
  base: "/i-love-love-you-you-love-love-me/"
});
