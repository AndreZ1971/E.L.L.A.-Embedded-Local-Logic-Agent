import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "web-chromium",
      testMatch: "web/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "desktop",
      testMatch: "desktop/**/*.spec.ts",
    },
  ],
  webServer: [
    {
      command: "npm run dev --workspace=apps/api",
      port: 3002,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "npm run dev --workspace=apps/web",
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
