import { defineConfig, devices } from "@playwright/test";

/**
 * ADR-0003 — E2E on Chromium, Firefox and WebKit against `next build && next start`,
 * never `next dev`. Retries: 1 in CI, 0 locally. API tests use the request context and
 * no browser; they arrive in T-05, so `npm run test:api` passes with no tests until then.
 */
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "api",
      testDir: "tests/api",
      use: { baseURL },
    },
    {
      name: "chromium",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
