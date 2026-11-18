import process from "node:process";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// Adds <meta name="google-adsense-account"> (used by AdSense to verify site
// ownership) when VITE_ADSENSE_CLIENT is set. The ad script itself is loaded
// by src/lib/ads.js, never in the embed view.
function adsenseMeta(client) {
  return {
    name: "adsense-meta",
    transformIndexHtml() {
      if (!/^ca-pub-\d{10,20}$/.test(client)) return;
      return [
        {
          tag: "meta",
          attrs: { name: "google-adsense-account", content: client },
          injectTo: "head",
        },
      ];
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [
      react(),
      tailwindcss(),
      adsenseMeta(env.VITE_ADSENSE_CLIENT || ""),
    ],
  };
});
