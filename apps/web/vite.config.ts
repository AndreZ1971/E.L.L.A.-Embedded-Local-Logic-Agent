import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173,
    host: "127.0.0.1",
    proxy: {
      "/api/events/stream": {
        target: "http://localhost:3002",
        changeOrigin: true,
        // SSE braucht gepufferte Antworten und kein Timeout
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Accept", "text/event-stream");
          });
        },
      },
      "/api": {
        target: "http://localhost:3002",
        changeOrigin: true,
      },
    },
  },
});
