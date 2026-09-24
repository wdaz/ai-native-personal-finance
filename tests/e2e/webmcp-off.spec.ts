import { seedFigures } from "@/scripts/seed-figures";
import { COPY } from "@/src/shared/copy";
import { formatMoney } from "@/src/shared/money";
import { PAGE_NAMES } from "@/src/ui/nav";
import { expect, loginViaApi, resetDemoData, test } from "../fixtures/e2e";
import { RUN_MODE } from "../fixtures/webmcp";

/**
 * SPEC-webmcp-tools §7 "E2E (off)": US-38 AC2, US-41; NFR-W2 — the app is unaffected. The app
 * must have been built with WEBMCP_MODE=off (`WEBMCP_MODE=off npx playwright test
 * --project=chromium`; in CI the `off` matrix leg). `WEBMCP_MODE` is inlined at build time, so a
 * server reused from a polyfill build would make every assertion below fail — the guard names it.
 */
const FIGURES = seedFigures();

test.beforeEach(async ({ page, request }) => {
  test.skip(RUN_MODE !== "off", `off-mode spec; this run expects WEBMCP_MODE=${RUN_MODE}`);
  await resetDemoData(request);
  await loginViaApi(page);
});

const AUTHENTICATED_PAGES = [
  { path: "/overview", name: PAGE_NAMES.overview },
  { path: "/transactions", name: PAGE_NAMES.transactions },
  { path: "/budgets", name: PAGE_NAMES.budgets },
  { path: "/pots", name: PAGE_NAMES.pots },
  { path: "/recurring-bills", name: PAGE_NAMES.recurringBills },
] as const;

test("US-38 AC2: the build under test is the off build (guard — a reused polyfill build must fail loudly)", async ({
  page,
}) => {
  await page.goto("/overview");
  // The mode first, then the indicator — against a polyfill build the indicator assertion
  // would only time out as "element not found" (see the polyfill spec's guard).
  await expect
    .poll(() => page.evaluate(() => window.__pf?.webmcp !== undefined), {
      message: "window.__pf.webmcp is missing — was the server built with APP_ENV=test?",
    })
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.__pf?.webmcp?.mode() ?? null), {
      message: "expected a WEBMCP_MODE=off build — is a polyfill build being reused?",
    })
    .toBe("unavailable");
  await expect(page.getByRole("status", { name: COPY.agentToolsUnavailable })).toBeVisible();
});

for (const { path, name } of AUTHENTICATED_PAGES) {
  test(`US-38 AC2 US-41: with WEBMCP_MODE=off ${path} renders, exposes no modelContext and says unavailable`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { name, level: 1, exact: true })).toBeVisible();
    await expect(page.getByRole("status", { name: COPY.agentToolsUnavailable })).toBeVisible();
    expect(await page.evaluate(() => "modelContext" in document)).toBe(false);
    await expect(page.locator("html")).not.toHaveAttribute("data-webmcp", "ready");
    expect(await page.evaluate(() => window.__pf?.webmcp?.tools())).toEqual([]);
  });
}

test("US-38 AC2: with WEBMCP_MODE=off the Overview still shows its figures (NFR-W2 — the app is unaffected)", async ({
  page,
}) => {
  await page.goto("/overview");
  await expect(page.getByText(formatMoney(FIGURES.balance.current))).toBeVisible();
  await expect(page.getByText(formatMoney(FIGURES.pots.total))).toBeVisible();
});

test("US-38 AC2: with WEBMCP_MODE=off the login page installs no modelContext either", async ({
  page,
}) => {
  await page.context().clearCookies();
  await page.goto("/login");
  expect(await page.evaluate(() => "modelContext" in document)).toBe(false);
});
