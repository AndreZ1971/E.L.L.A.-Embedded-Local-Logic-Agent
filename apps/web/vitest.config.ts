import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    exclude: [
      "**/node_modules/**",
      "src/__tests__/App.boot.test.tsx",
      "src/__tests__/TitleBar.test.tsx",
    ],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
    },
  },
});
