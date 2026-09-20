## Task 7: Playwright on Chromium, Firefox and WebKit

**Files:**

- Create: `playwright.config.ts`, `tests/e2e/scaffold.spec.ts`
- Modify: `package.json` (scripts `test:api`, `test:e2e`, `test:e2e:ui`, `test:all`),
  `.gitignore` (already covers `playwright-report/` and `test-results/`)

**Interfaces:**

- Consumes: `npm run build`/`npm run start` from Task 1, the scaffold route's `<h1>`.
- Produces: Playwright projects named `api`, `chromium`, `firefox`, `webkit`;
  `npm run test:e2e` running all three browsers against `next build && next start`;
  `npm run test:api` passing with no tests until T-05.

- [ ] **Step 1: Install Playwright and its browsers**

```bash
npm install -D @playwright/test@^1.63.0
npx playwright install --with-deps chromium firefox webkit
```

(On macOS `--with-deps` is a no-op; CI installs the same way from T-06.)

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
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
```

- [ ] **Step 3: Write the E2E smoke test**

`tests/e2e/scaffold.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

/**
 * T-01 smoke test. It carries no story id because it verifies the scaffold, not a story;
 * the traceability script (T-13) checks that every release story HAS a test, not that
 * every test has a story. T-05 replaces `/` with the middleware redirect and this test
 * moves with it.
 */
test("scaffold: the application boots and serves the root route", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Personal Finance — scaffold");
});
```

- [ ] **Step 4: Add the scripts to `package.json`**

```json
"test:api": "playwright test --project=api --pass-with-no-tests",
"test:e2e": "playwright test --project=chromium --project=firefox --project=webkit",
"test:e2e:ui": "playwright test --ui",
"test:all": "npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:api && npm run test:e2e"
```

- [ ] **Step 5: Run the E2E smoke test on all three engines**

Run: `npm run test:e2e`
Expected: `3 passed` (one per browser). The web server line shows `next build` then
`next start`.

- [ ] **Step 6: Run the API project**

Run: `npm run test:api`
Expected: exit 0 with "no tests found" tolerated by `--pass-with-no-tests`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test(e2e): Playwright on Chromium, Firefox and WebKit per ADR-0003 (T-01)"
```

---
