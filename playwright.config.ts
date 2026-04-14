import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/global-setup.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  globalSetup: process.env.BYPASS_URL ? "./e2e/global-setup.ts" : undefined,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    video: "on",
    trace: "retain-on-failure",
    storageState: process.env.BYPASS_URL ? "e2e/.auth/vercel-bypass.json" : undefined,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  outputDir: "test-results/",
});
