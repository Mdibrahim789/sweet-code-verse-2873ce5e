import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
      },
      manifest: {
        name: "49EveD EEE in UU",
        short_name: "49EveD",
        description: "49th Eveda EEE Department App - University of Uttara",
        theme_color: "#2563eb",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/home",
        icons: [
          { src: "/pwa-icon-48.png", sizes: "48x48", type: "image/png", purpose: "any" },
          { src: "/pwa-icon-72.png", sizes: "72x72", type: "image/png", purpose: "any" },
          { src: "/pwa-icon-96.png", sizes: "96x96", type: "image/png", purpose: "any" },
          { src: "/pwa-icon-128.png", sizes: "128x128", type: "image/png", purpose: "any" },
          { src: "/pwa-icon-144.png", sizes: "144x144", type: "image/png", purpose: "any" },
          { src: "/pwa-icon-152.png", sizes: "152x152", type: "image/png", purpose: "any" },
          { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-icon-384.png", sizes: "384x384", type: "image/png", purpose: "any" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        screenshots: [
          {
            src: "/screenshots/mobile.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
          },
          {
            src: "/screenshots/desktop.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
