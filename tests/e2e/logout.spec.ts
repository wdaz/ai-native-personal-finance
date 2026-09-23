import type { Page } from "@playwright/test";
import { SessionResponseSchema } from "@/src/shared/schemas";
import { expect, loginViaApi, resetDemoData, test } from "../fixtures/e2e";

async function isLoggedIn(page: Page): Promise<boolean> {
  const response = await page.request.get("/api/auth/session");
  return SessionResponseSchema.parse(await response.json()).authenticated;
}

const heading = (page: Page, name: string) =>
  page.getByRole("heading", { level: 1, name, exact: true });

test.beforeEach(async ({ page, request }) => {
  await resetDemoData(request);
  await loginViaApi(page);
});

test("US-03 AC1 'Log out' in the sidebar footer ends the session and lands on the login page", async ({
  page,
  baseURL,
}) => {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL(`${baseURL}/login`);
  await expect(heading(page, "Login")).toBeVisible();
  expect(await isLoggedIn(page)).toBe(false);
});

test("US-03 AC1 back navigation after logout does not reveal the app page", async ({ page }) => {
  await page.goto("/overview");
  // A client-side navigation first: Next's router now holds /budgets in memory, which a
  // client-side logout would leave behind for Back to render (Review Focus 1).
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Budgets" })
    .click();
  await expect(heading(page, "Budgets")).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(heading(page, "Login")).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/login(\?|$)/);
  await expect(heading(page, "Login")).toBeVisible();
  await expect(heading(page, "Budgets")).toHaveCount(0);
});

test("US-03 AC1 SPEC-auth §2.9 a page restored from the back/forward cache leaves when its session has ended", async ({
  page,
  context,
  baseURL,
}) => {
  await page.goto("/transactions");
  await expect(heading(page, "Transactions")).toBeVisible();

  // The session ends while the page is kept; the browser then restores it from its cache.
  await context.clearCookies();
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })),
  );

  await expect(page).toHaveURL(`${baseURL}/login`);
});

test("US-03 AC1 SPEC-auth §2.9 … and stays while the session lives", async ({ page, baseURL }) => {
  await page.goto("/transactions");
  await expect(heading(page, "Transactions")).toBeVisible();

  const answered = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/session",
  );
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })),
  );
  expect(SessionResponseSchema.parse(await (await answered).json()).authenticated).toBe(true);

  await expect(heading(page, "Transactions")).toBeVisible();
  await expect(page).toHaveURL(`${baseURL}/transactions`);
});

test("US-03 AC1 on a phone, 'Log out' is the page header's icon button (SPEC-app-shell §2.4)", async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/pots");
  await page.getByRole("main").getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL(`${baseURL}/login`);
  expect(await isLoggedIn(page)).toBe(false);
});

for (const failure of ["no answer", "a server error"] as const) {
  test(`US-03 AC2 logout completes client-side when the request gets ${failure}, and the failure is logged`, async ({
    page,
    baseURL,
  }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.route("**/api/auth/logout", (route) =>
      failure === "no answer" ? route.abort() : route.fulfill({ status: 500 }),
    );

    await page.goto("/transactions");
    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page).toHaveURL(`${baseURL}/login?reason=logout`);
    await expect(heading(page, "Login")).toBeVisible();
    expect(await isLoggedIn(page)).toBe(false);
    expect(errors.filter((text) => text.startsWith("[logout]"))).toHaveLength(1);
  });
}
