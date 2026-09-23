import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * ADR-0003 — E2E on Chromium, Firefox and WebKit against `next build && next start`,
 * never `next dev`. Retries: 1 in CI, 0 locally. API tests use the request context and
 * no browser; they share one database, so the `api` project itself pins `workers: 1` and
 * `fullyParallel: false` — resets would otherwise clobber each other under a bare
 * `npx playwright test` or `--project=api`. `npm run test:api` also passes `--workers=1`,
 * which is redundant with the project setting but documents the rule at the call site too.
 *
 * The server runs with APP_ENV=test, so the test-support routes exist (SPEC-reset-and-test-
 * support §2.7). API tests also read the database directly (ADR-0003: "side effects via
 * DB"); locally its URL is in .env.local, which Next.js loads for the server and Playwright
 * does not — so it is loaded here. A variable already in the environment (CI's) wins.
 */
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "tests",
  // T-06 (backlog: "decide in the Playwright config"): one worker for every project, in CI
  // and locally. The API and E2E tests share one server and one database, a reset ends every
  // session (SPEC-reset-and-test-support §2.6) and clears every rate-limit counter, and the
  // chromium/firefox/webkit projects would otherwise run side by side — each resetting the
  // others' state mid-test. One database per worker would need one server per worker (the app
  // reads a single DATABASE_URL); at Release 1's suite size, serial is the cheaper correct
  // answer.
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
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
      // Not just `npm run test:api`'s `--workers=1`: a bare `npx playwright test`,
      // `--project=api` alone or `npm run test:e2e:ui` must also serialise these against
      // the one shared database.
      workers: 1,
      fullyParallel: false,
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
    // T-05: the middleware makes "/" always redirect (SPEC-auth §2.8), which Playwright's
    // readiness probe never treats as ready (it wants a 2xx) — /api/auth/session answers
    // 200 regardless of session state and needs no auth (SPEC-auth §2.10's public list).
    url: `${baseURL}/api/auth/session`,
    env: { APP_ENV: "test" },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
