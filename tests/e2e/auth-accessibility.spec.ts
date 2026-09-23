import { COPY } from "@/src/shared/copy";
import { demoCredentials } from "@/src/server/env";
import type { Locator, Page } from "@playwright/test";
import { expect, resetDemoData, seriousA11yViolations, test } from "../fixtures/e2e";

const demo = demoCredentials();

/**
 * The key that moves focus to the next control. WebKit, like Safari with "Press Tab to
 * highlight each item" off (its default), reaches only text fields with Tab and skips buttons
 * and links; Option+Tab reaches every control — Playwright names that key "Alt", so the
 * code sends "Alt+Tab". Measured in T-06 (plan Task 7, Step 3): with plain Tab both
 * walkthroughs failed on WebKit at the first button; Chromium and Firefox reach every control
 * with Tab.
 */
let tabKey = "Tab";
test.beforeEach(({ browserName }) => {
  tabKey = browserName === "webkit" ? "Alt+Tab" : "Tab";
});

/** Presses Tab and asserts where focus landed and that it is visibly indicated (NFR-A2). */
async function tabTo(page: Page, target: Locator) {
  await page.keyboard.press(tabKey);
  await expect(target).toBeFocused();
  await expect(target).toHaveCSS("outline-style", "solid");
}

test.beforeEach(async ({ request }) => {
  await resetDemoData(request);
});

/**
 * US-32 AC3 — the documented keyboard walkthrough of /login (SPEC-auth §6 tab order):
 * Tab → "Copy demo email" → "Copy demo password" → Email → Password → "Show password" →
 * "Login" → "Sign Up". Space on the toggle shows the password. Shift+Tab back to the fields,
 * type the demo credentials, Enter submits.
 */
test.describe("keyboard-only login", () => {
  test("US-32 AC1 AC3 keyboard-only login: tab order, visible focus, Space toggles, Enter submits", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/login");
    const email = page.getByLabel("Email", { exact: true });
    const password = page.getByLabel("Password", { exact: true });

    await tabTo(page, page.getByRole("button", { name: "Copy demo email" }));
    await tabTo(page, page.getByRole("button", { name: "Copy demo password" }));
    await tabTo(page, email);
    await page.keyboard.type(demo.email);
    await tabTo(page, password);
    await page.keyboard.type(demo.password);
    const toggle = page.getByRole("button", { name: "Show password" });
    await tabTo(page, toggle);
    await page.keyboard.press("Space");
    await expect(password).toHaveAttribute("type", "text");
    await tabTo(page, page.getByRole("button", { name: "Login", exact: true }));
    await tabTo(page, page.getByRole("link", { name: "Sign Up", exact: true }));

    await password.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`${baseURL}/overview`);
  });
});

/**
 * US-32 AC3 — the documented keyboard walkthrough of /signup: Tab → Name → Email → "Create
 * Password" → "Show password" → "Create Account" → "Login". Enter on the last field submits;
 * the notice takes focus and Tab reaches "Go to login".
 */
test("US-32 AC1 AC3 keyboard-only sign-up: tab order, visible focus, Enter submits, focus on the notice", async ({
  page,
}) => {
  await page.goto("/signup");
  await tabTo(page, page.getByLabel("Name", { exact: true }));
  await page.keyboard.type("Alex");
  await tabTo(page, page.getByLabel("Email", { exact: true }));
  await page.keyboard.type("alex@example.com");
  await tabTo(page, page.getByLabel("Create Password", { exact: true }));
  await page.keyboard.type("long-enough-password");
  await tabTo(page, page.getByRole("button", { name: "Show password" }));
  await tabTo(page, page.getByRole("button", { name: "Create Account", exact: true }));
  await tabTo(page, page.getByRole("link", { name: "Login", exact: true }));

  await page.getByLabel("Create Password", { exact: true }).focus();
  await page.keyboard.press("Enter");
  const notice = page.getByRole("status").filter({ hasText: COPY.goToLogin });
  await expect(notice).toBeFocused();
  await tabTo(page, notice.getByRole("link", { name: COPY.goToLogin }));
});

test("US-01 NFR-A1 axe: no serious or critical violation on /login — empty, invalid, error, reset notice", async ({
  page,
}) => {
  await page.goto("/login");
  expect(await seriousA11yViolations(page), "empty").toEqual([]);

  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
  expect(await seriousA11yViolations(page), "invalid").toEqual([]);

  await page.getByLabel("Email", { exact: true }).fill(demo.email);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page.getByText(COPY.loginIncorrect)).toBeVisible();
  expect(await seriousA11yViolations(page), "401 banner").toEqual([]);

  await page.goto("/login?reason=reset");
  await expect(page.getByText(COPY.loginAfterReset)).toBeVisible();
  expect(await seriousA11yViolations(page), "reset notice").toEqual([]);
});

test("US-02 NFR-A1 axe: no serious or critical violation on /signup — empty, invalid, notice", async ({
  page,
}) => {
  await page.goto("/signup");
  expect(await seriousA11yViolations(page), "empty").toEqual([]);

  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await expect(page.getByLabel("Name", { exact: true })).toBeFocused();
  expect(await seriousA11yViolations(page), "invalid").toEqual([]);

  await page.getByLabel("Name", { exact: true }).fill("Alex");
  await page.getByLabel("Email", { exact: true }).fill("alex@example.com");
  await page.getByLabel("Create Password", { exact: true }).fill("long-enough-password");
  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await expect(page.getByRole("link", { name: COPY.goToLogin })).toBeVisible();
  expect(await seriousA11yViolations(page), "notice").toEqual([]);
});

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`US-33 AC2 auth pages at ${width} px: no horizontal scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/login", "/signup"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
}

test("US-01 US-02 NFR-A1 every page is titled 'Personal Finance - <page name>' (WCAG 2.4.2, SPEC-app-shell §2.5)", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page).toHaveTitle("Personal Finance - Login");
  await page.goto("/signup");
  await expect(page).toHaveTitle("Personal Finance - Sign Up");
  await page.goto("/no-such-page");
  await expect(page).toHaveTitle(`Personal Finance - ${COPY.notFound}`);
});

test("US-01 auth layout (SPEC-auth §6): illustration panel from 1024 px, logo bar below it", async ({
  page,
}) => {
  const headline = page.getByText("Keep track of your money and save for your future");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await expect(headline).toBeVisible();
  await expect(page.getByRole("banner")).toBeHidden();

  await page.setViewportSize({ width: 1023, height: 900 });
  await expect(headline).toBeHidden();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("banner").getByRole("img", { name: "finance" })).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("US-01 a submit before the form hydrates posts the body — the credentials never reach the URL (plan D5)", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(demo.email);
    await page.getByLabel("Password", { exact: true }).fill(demo.password);
    const submitted = page.waitForRequest(
      (request) => request.isNavigationRequest() && new URL(request.url()).pathname === "/login",
    );
    await page.getByLabel("Password", { exact: true }).press("Enter");
    const request = await submitted;

    expect(request.method()).toBe("POST");
    const url = new URL(request.url());
    expect(url.searchParams.has("email")).toBe(false);
    expect(url.searchParams.has("password")).toBe(false);
    expect(request.url()).not.toContain(encodeURIComponent(demo.password));
  });
});
