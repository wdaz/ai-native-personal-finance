import { seedFigures } from "@/scripts/seed-figures";
import { COPY } from "@/src/shared/copy";
import { formatMoney } from "@/src/shared/money";
import { OverviewDtoSchema } from "@/src/shared/schemas";
import { PAGE_NAMES } from "@/src/ui/nav";
import { expect, loginViaApi, resetDemoData, test } from "../fixtures/e2e";
import { RUN_MODE, callTool, expectToolsReady, listTools } from "../fixtures/webmcp";

/**
 * SPEC-webmcp-tools §7 "E2E (polyfill)": US-38 AC1/AC3, US-39 AC1/AC3/AC4, US-41. The app must
 * have been built with WEBMCP_MODE=polyfill (the default); the off-mode build is
 * `webmcp-off.spec.ts`. Figures come from `seedFigures()` and `GET /api/overview`, never typed.
 * The indicator has two variants with the same accessible name, but each is `display: none`
 * outside its breakpoint (`Sidebar.module.css`, `PageHeader.module.css`), so at Desktop Chrome's
 * width a `getByRole("status", { name })` query resolves to the sidebar one only.
 */
const FIGURES = seedFigures();

test.beforeEach(async ({ page, request }) => {
  test.skip(
    RUN_MODE !== "polyfill",
    `polyfill-mode spec; this run expects WEBMCP_MODE=${RUN_MODE}`,
  );
  await resetDemoData(request);
  await loginViaApi(page);
});

const mainNav = (page: import("@playwright/test").Page) =>
  page.getByRole("navigation", { name: "Main" });

test("US-38 AC2: the build under test is the polyfill build (guard — a reused off build must fail loudly)", async ({
  page,
}) => {
  await page.goto("/overview");
  // The mode is asserted first, before anything that would merely time out against the wrong
  // build (`expectToolsReady`, the indicator). `window.__pf` exists only in a build made with
  // APP_ENV=test (NEXT_PUBLIC_APP_ENV is inlined at build time) — a different failure, named apart.
  await expect
    .poll(() => page.evaluate(() => window.__pf?.webmcp !== undefined), {
      message: "window.__pf.webmcp is missing — was the server built with APP_ENV=test?",
    })
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.__pf?.webmcp?.mode() ?? null), {
      message: "expected a WEBMCP_MODE=polyfill build — is an off build being reused?",
    })
    .toBe("polyfill");
  await expectToolsReady(page);
});

test("US-38 AC1 AC3: on Overview, once ready, getTools() lists exactly the two Release 1 tools with their annotations", async ({
  page,
}) => {
  await page.goto("/overview");
  await expectToolsReady(page);
  const tools = await listTools(page);
  expect(tools.map((tool) => tool.name)).toEqual(["get_balance", "get_overview_summary"]);
  for (const tool of tools) {
    expect(tool.title).toBeTruthy();
    expect(tool.description.length).toBeLessThanOrEqual(200);
    expect(tool.inputSchema).toMatchObject({ type: "object", properties: {} });
  }
  // The polyfill's getTools() shows only these two hints (plan F3); the full NFR-W3 rule is
  // asserted over the registry in tests/unit/webmcp/registry.test.ts.
  const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool.annotations]));
  expect(byName.get_balance).toEqual({ readOnlyHint: true, untrustedContentHint: false });
  expect(byName.get_overview_summary).toEqual({ readOnlyHint: true, untrustedContentHint: true });
});

test("US-39 AC1: get_balance returns balance, income and expenses in cents — what the API and the seed say", async ({
  page,
}) => {
  await page.goto("/overview");
  await expectToolsReady(page);
  const api = OverviewDtoSchema.parse(await (await page.request.get("/api/overview")).json());

  const result = await callTool(page, "get_balance");

  expect(result.isError).toBeUndefined();
  expect(result.structuredContent).toEqual({ ...api.balance, currency: "USD", unit: "cents" });
  expect(result.structuredContent).toMatchObject(FIGURES.balance);
  expect(JSON.parse(result.content[0]!.text)).toEqual(result.structuredContent);
});

test("US-39 AC1: get_overview_summary returns what the page shows — the API's DTO plus currency and unit", async ({
  page,
}) => {
  await page.goto("/overview");
  await expectToolsReady(page);
  const api = OverviewDtoSchema.parse(await (await page.request.get("/api/overview")).json());

  const result = await callTool(page, "get_overview_summary");

  expect(result.isError).toBeUndefined();
  expect(result.structuredContent).toEqual({ ...api, currency: "USD", unit: "cents" });
  // Result *and* UI state (ADR-0003): the page shows the figure the tool returned.
  await expect(page.getByText(formatMoney(api.pots.total))).toBeVisible();
});

test("US-39 AC1: get_overview_summary follows the data — the empty-all variant returns empty lists", async ({
  page,
  request,
}) => {
  const seeded = await request.post("/api/test/seed", { data: { variant: "empty-all" } });
  expect(seeded.status()).toBe(200);
  await loginViaApi(page); // a reset ends every session
  await page.goto("/overview");
  await expectToolsReady(page);
  const api = OverviewDtoSchema.parse(await (await page.request.get("/api/overview")).json());

  const result = await callTool(page, "get_overview_summary");

  expect(result.structuredContent).toEqual({ ...api, currency: "USD", unit: "cents" });
  expect(result.structuredContent).toMatchObject({
    pots: { items: [] },
    transactions: [],
    budgets: { items: [] },
  });
});

test("US-39 AC4: after the session ends a tool returns a structured unauthenticated error and no data", async ({
  page,
}) => {
  await page.goto("/overview");
  await expectToolsReady(page);
  await page.context().clearCookies();

  const result = await callTool(page, "get_balance");

  expect(result).toMatchObject({ isError: true, code: "unauthenticated" });
  expect(result.structuredContent).toBeUndefined();
});

test("US-38 SPEC-webmcp-tools §2.8: the tool's own API request carries X-Via: webmcp and is on the server's record", async ({
  page,
  request,
}) => {
  await page.goto("/overview");
  await expectToolsReady(page);
  const overviewResponse = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/overview" && r.request().headers()["x-via"] === "webmcp",
  );

  await callTool(page, "get_balance");

  const response = await overviewResponse;
  expect(response.request().headers()["x-via"]).toBe("webmcp");
  const requestId = response.headers()["x-request-id"]!;
  expect(requestId).toBeTruthy();
  const log = await request.get("/api/test/log", { params: { requestId } });
  expect(log.status()).toBe(200);
  expect(await log.json()).toEqual({ requestId, via: "webmcp", route: "/api/overview" });
});

test("US-41: the indicator reads 'polyfill · 2' on Overview", async ({ page }) => {
  await page.goto("/overview");
  await expectToolsReady(page);
  await expect(page.getByRole("status", { name: COPY.agentToolsPolyfill(2) })).toBeVisible();
});

test("US-38 AC1 US-41: leaving Overview by client navigation unregisters the tools; coming back registers them again", async ({
  page,
}) => {
  await page.goto("/overview");
  await expectToolsReady(page);
  // A hard load would clear the registry trivially — mark the window to prove a client navigation.
  await page.evaluate(() => {
    (window as unknown as { __clientNav?: boolean }).__clientNav = true;
  });

  await mainNav(page).getByRole("link", { name: PAGE_NAMES.transactions, exact: true }).click();
  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.locator("html")).not.toHaveAttribute("data-webmcp", "ready");
  expect(await listTools(page)).toEqual([]);
  await expect(page.getByRole("status", { name: COPY.agentToolsPolyfill(0) })).toBeVisible();
  expect(
    await page.evaluate(() => (window as unknown as { __clientNav?: boolean }).__clientNav),
    "the navigation was a full page load, not a client navigation",
  ).toBe(true);

  await mainNav(page).getByRole("link", { name: PAGE_NAMES.overview, exact: true }).click();
  await expectToolsReady(page);
  expect((await listTools(page)).map((tool) => tool.name)).toEqual([
    "get_balance",
    "get_overview_summary",
  ]);
  await expect(page.getByRole("status", { name: COPY.agentToolsPolyfill(2) })).toBeVisible();
});

test("US-38 AC1: nothing is registered before login — the login page installs no modelContext", async ({
  page,
}) => {
  await page.context().clearCookies(); // otherwise /login redirects an authenticated visitor to /overview
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Login", level: 1 })).toBeVisible();
  expect(await page.evaluate(() => "modelContext" in document)).toBe(false);
  await expect(page.locator("html")).not.toHaveAttribute("data-webmcp", "ready");
});

test("US-38 US-41: when the runtime refuses every registration the page says so — indicator 'unavailable', data-webmcp-error, a console warning", async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  // The polyfill refuses to work in a document that is not origin-keyed (its
  // validateOriginAgentCluster) — what Firefox and WebKit did before ADR-0006 (5). Forcing it
  // here makes the failure reproducible on every engine, whatever the server sends.
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "originAgentCluster", { value: false, configurable: true });
  });
  await page.goto("/overview");
  await expectToolsReady(page); // "ready" is still written — the other channels are what say more

  await expect(page.getByRole("status", { name: COPY.agentToolsUnavailable })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-webmcp-error",
    /get_balance: SecurityError/,
  );
  expect(warnings.join("\n")).toContain('could not register tool "get_balance"');
});
