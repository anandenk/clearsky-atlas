import { defineConfig } from "@playwright/test";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
export default defineConfig({
  testDir: "tests/ui",
  workers: 1,
  use: {
    baseURL,
    storageState: { cookies: [], origins: [{ origin: new URL(baseURL).origin,
      localStorage: [{ name: "atlas-render-diagnostics", value: "1" }],
    }] },
    channel: "chrome",
    headless: true,
  },
  reporter: "list",
});
