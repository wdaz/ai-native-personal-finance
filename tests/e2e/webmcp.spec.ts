import { seedFigures } from "@/scripts/seed-figures";
import { COPY } from "@/src/shared/copy";
import { formatMoney } from "@/src/shared/money";
import {
  OverviewDtoSchema,
  RecurringBillsDtoSchema,
  TransactionsDtoSchema,
} from "@/src/shared/schemas";
import { BILL_STATUSES } from "@/src/shared/recurring-bills-query";
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
      message:
        "expected a WEBMCP_MODE=polyfill build — is an off build being reused? (or was every registration rejected — see data-webmcp-error)",
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
  expect(await log.json()).toEqual({
    requestId,
    via: "webmcp",
    method: "GET",
    route: "/api/overview",
  });
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

  // SPEC-pots 2.13: Pots swaps Overview's two tools for its six, with no reload in between.
  await mainNav(page).getByRole("link", { name: PAGE_NAMES.pots, exact: true }).click();
  await expect(page).toHaveURL(/\/pots$/);
  await expect
    .poll(async () => (await listTools(page)).map((tool) => tool.name))
    .toEqual([
      "add_money_to_pot",
      "add_pot",
      "delete_pot",
      "edit_pot",
      "list_pots",
      "withdraw_from_pot",
    ]);
  await expect(page.getByRole("status", { name: COPY.agentToolsPolyfill(6) })).toBeVisible();
  expect(
    await page.evaluate(() => (window as unknown as { __clientNav?: boolean }).__clientNav),
    "the navigation was a full page load, not a client navigation",
  ).toBe(true);

  // WM-Q3 (a): `data-webmcp` stays "ready" between two built pages, so the list is polled.
  await mainNav(page).getByRole("link", { name: PAGE_NAMES.overview, exact: true }).click();
  await expect
    .poll(async () => (await listTools(page)).map((tool) => tool.name))
    .toEqual(["get_balance", "get_overview_summary"]);
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
  await expect.poll(() => warnings.join("\n")).toContain('could not register tool "get_balance"');
});

/**
 * SPEC-transactions 2.14 and §7's WebMCP row: `list_transactions`, the Transactions page's one
 * tool. What it returns is compared with what `GET /api/transactions` returns for the same
 * query and with what the page shows, never with typed figures.
 */
test.describe("list_transactions on Transactions (US-38 AC1, US-39 AC2–AC4)", () => {
  const apiList = async (page: import("@playwright/test").Page, search: string) =>
    TransactionsDtoSchema.parse(
      await (await page.request.get(`/api/transactions${search}`)).json(),
    );
  const pageNames = (page: import("@playwright/test").Page) =>
    page
      .getByRole("table", { name: PAGE_NAMES.transactions })
      .locator("tbody")
      .getByRole("row")
      .locator("td:first-child");

  test("the page registers exactly list_transactions, read-only and untrusted, its description at most 200 characters; the indicator reads 'polyfill · 1'", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await expectToolsReady(page);
    const tools = await listTools(page);
    expect(tools.map((tool) => tool.name)).toEqual(["list_transactions"]);
    expect(tools[0]!.annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true });
    expect(tools[0]!.description.length).toBeLessThanOrEqual(200);
    await expect(page.getByRole("status", { name: COPY.agentToolsPolyfill(1) })).toBeVisible();
  });

  test("no input returns the first page the person sees and the API returns, with ids", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await expectToolsReady(page);
    const api = await apiList(page, "");

    const result = await callTool(page, "list_transactions");

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({ ...api, currency: "USD", unit: "cents" });
    await expect(pageNames(page)).toHaveText(api.items.map((item) => item.name));
    for (const item of api.items) expect(item.id).toBeTruthy();
  });

  test("search, category, sort and page together, and a page past the end (clamped), equal the API", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await expectToolsReady(page);

    const filtered = await callTool(page, "list_transactions", {
      search: "a",
      category: "General",
      sort: "a-to-z",
      page: 2,
    });
    expect(filtered.structuredContent).toEqual({
      ...(await apiList(page, "?q=a&category=General&sort=a-to-z&page=2")),
      currency: "USD",
      unit: "cents",
    });

    const beyond = await callTool(page, "list_transactions", { page: 99 });
    const last = await apiList(page, "?page=99");
    expect(beyond.structuredContent).toEqual({ ...last, currency: "USD", unit: "cents" });
    expect(last.page).toBe(last.pageCount);
  });

  test("a sort outside the list is a validation error naming the allowed values; page 0 is `required`; the page the person sees is unchanged", async ({
    page,
  }) => {
    await page.goto("/transactions?sort=oldest");
    await expectToolsReady(page);
    const shown = await pageNames(page).allTextContents();

    const badSort = await callTool(page, "list_transactions", { sort: "newest" });
    expect(badSort).toMatchObject({ isError: true, code: "validation" });
    expect(badSort.message).toContain("latest");
    expect(badSort.structuredContent).toBeUndefined();

    const badCategory = await callTool(page, "list_transactions", { category: "Food" });
    expect(badCategory).toMatchObject({ isError: true, code: "validation" });
    expect(badCategory.message).toContain("Dining Out");

    const pageZero = await callTool(page, "list_transactions", { page: 0 });
    expect(pageZero).toMatchObject({ isError: true, code: "validation" });
    expect(pageZero.issues).toEqual([{ path: ["page"], code: "required" }]);

    await expect(page).toHaveURL(/\/transactions\?sort=oldest$/);
    await expect(pageNames(page)).toHaveText(shown);
  });

  test("after the session ends the tool returns unauthenticated and no data", async ({ page }) => {
    await page.goto("/transactions");
    await expectToolsReady(page);
    await page.context().clearCookies();

    const result = await callTool(page, "list_transactions");

    expect(result).toMatchObject({ isError: true, code: "unauthenticated" });
    expect(result.structuredContent).toBeUndefined();
  });

  test("the call carries X-Via: webmcp and is on the server's record", async ({
    page,
    request,
  }) => {
    await page.goto("/transactions");
    await expectToolsReady(page);
    const listResponse = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/api/transactions" &&
        r.request().headers()["x-via"] === "webmcp",
    );

    await callTool(page, "list_transactions", { search: "co" });

    const response = await listResponse;
    const requestId = response.headers()["x-request-id"]!;
    const log = await request.get("/api/test/log", { params: { requestId } });
    expect(await log.json()).toEqual({
      requestId,
      via: "webmcp",
      method: "GET",
      route: "/api/transactions",
    });
  });
});

/**
 * SPEC-recurring-bills 2.12 and §7's WebMCP row: `list_recurring_bills`, the Recurring Bills
 * page's one tool. What it returns is compared with what `GET /api/recurring-bills` returns for
 * the same query and with what the page shows, never with typed figures.
 */
test.describe("list_recurring_bills on Recurring Bills (US-38 AC1, US-39 AC2–AC4)", () => {
  const apiBills = async (page: import("@playwright/test").Page, search: string) =>
    RecurringBillsDtoSchema.parse(
      await (await page.request.get(`/api/recurring-bills${search}`)).json(),
    );
  const pageNames = (page: import("@playwright/test").Page) =>
    page
      .getByRole("table", { name: PAGE_NAMES.recurringBills })
      .locator("tbody")
      .getByRole("row")
      .locator("td:first-child");
  const withUnits = <T extends object>(dto: T) => ({ ...dto, currency: "USD", unit: "cents" });

  test("the page registers exactly list_recurring_bills, read-only and untrusted, its description at most 200 characters; the indicator reads 'polyfill · 1'", async ({
    page,
  }) => {
    await page.goto("/recurring-bills");
    await expectToolsReady(page);
    const tools = await listTools(page);
    expect(tools.map((tool) => tool.name)).toEqual(["list_recurring_bills"]);
    expect(tools[0]!.annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true });
    expect(tools[0]!.description.length).toBeLessThanOrEqual(200);
    await expect(page.getByRole("status", { name: COPY.agentToolsPolyfill(1) })).toBeVisible();
  });

  test("no input, and a search with a sort, return what the page shows and the API returns", async ({
    page,
  }) => {
    await page.goto("/recurring-bills");
    await expectToolsReady(page);
    const all = await apiBills(page, "");
    expect((await callTool(page, "list_recurring_bills")).structuredContent).toEqual(
      withUnits(all),
    );
    await expect(pageNames(page)).toHaveText(all.items.map((item) => item.name));

    await page.goto("/recurring-bills?q=e&sort=highest");
    await expectToolsReady(page);
    const sorted = await apiBills(page, "?q=e&sort=highest");
    expect(
      (await callTool(page, "list_recurring_bills", { search: "e", sort: "highest" }))
        .structuredContent,
    ).toEqual(withUnits(sorted));
    await expect(pageNames(page)).toHaveText(sorted.items.map((item) => item.name));
  });

  test("each status returns the page's rows of that status, in order, with the summary over all bills", async ({
    page,
  }) => {
    await page.goto("/recurring-bills?sort=highest");
    await expectToolsReady(page);
    const shown = await apiBills(page, "?sort=highest");
    for (const status of BILL_STATUSES) {
      const result = await callTool(page, "list_recurring_bills", { status, sort: "highest" });
      expect(result.structuredContent).toEqual(
        withUnits(await apiBills(page, `?sort=highest&status=${status}`)),
      );
      const dto = RecurringBillsDtoSchema.parse({
        items: (result.structuredContent as { items: unknown }).items,
        summary: (result.structuredContent as { summary: unknown }).summary,
      });
      expect(dto.items).toEqual(shown.items.filter((item) => item.status === status));
      expect(dto.summary).toEqual(shown.summary);
    }
  });

  test("a sort or status outside the list is a validation error naming the allowed values; the page the person sees is unchanged", async ({
    page,
  }) => {
    await page.goto("/recurring-bills?sort=oldest");
    await expectToolsReady(page);
    const shown = await pageNames(page).allTextContents();

    const badSort = await callTool(page, "list_recurring_bills", { sort: "newest" });
    expect(badSort).toMatchObject({ isError: true, code: "validation" });
    expect(badSort.message).toContain("latest");
    expect(badSort.structuredContent).toBeUndefined();

    const badStatus = await callTool(page, "list_recurring_bills", { status: "late" });
    expect(badStatus).toMatchObject({ isError: true, code: "validation" });
    expect(badStatus.message).toContain("dueSoon");

    await expect(page).toHaveURL(/\/recurring-bills\?sort=oldest$/);
    await expect(pageNames(page)).toHaveText(shown);
  });

  test("after the session ends the tool returns unauthenticated and no data", async ({ page }) => {
    await page.goto("/recurring-bills");
    await expectToolsReady(page);
    await page.context().clearCookies();

    const result = await callTool(page, "list_recurring_bills");

    expect(result).toMatchObject({ isError: true, code: "unauthenticated" });
    expect(result.structuredContent).toBeUndefined();
  });

  test("the call carries X-Via: webmcp and is on the server's record", async ({
    page,
    request,
  }) => {
    await page.goto("/recurring-bills");
    await expectToolsReady(page);
    const listResponse = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/api/recurring-bills" &&
        r.request().headers()["x-via"] === "webmcp",
    );

    await callTool(page, "list_recurring_bills", { status: "paid" });

    const response = await listResponse;
    const requestId = response.headers()["x-request-id"]!;
    const log = await request.get("/api/test/log", { params: { requestId } });
    expect(await log.json()).toEqual({
      requestId,
      via: "webmcp",
      method: "GET",
      route: "/api/recurring-bills",
    });
  });

  test("leaving Recurring Bills by client navigation swaps its tool for Overview's two (WM-Q3 (a))", async ({
    page,
  }) => {
    await page.goto("/recurring-bills");
    await expectToolsReady(page);
    await page.evaluate(() => {
      (window as unknown as { __clientNav?: boolean }).__clientNav = true;
    });

    await mainNav(page).getByRole("link", { name: PAGE_NAMES.overview, exact: true }).click();
    await expect(page).toHaveURL(/\/overview$/);
    await expect
      .poll(async () => (await listTools(page)).map((tool) => tool.name))
      .toEqual(["get_balance", "get_overview_summary"]);
    await expect(page.getByRole("status", { name: COPY.agentToolsPolyfill(2) })).toBeVisible();
    expect(
      await page.evaluate(() => (window as unknown as { __clientNav?: boolean }).__clientNav),
      "the navigation was a full page load, not a client navigation",
    ).toBe(true);
  });
});
