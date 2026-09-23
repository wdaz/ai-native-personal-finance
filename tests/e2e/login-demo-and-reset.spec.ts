import { COPY } from "@/src/shared/copy";
import { demoCredentials } from "@/src/server/env";
import type { Page } from "@playwright/test";
import { expect, loginViaApi, resetDemoData, test } from "../fixtures/e2e";

const demo = demoCredentials();

/** Replaces navigator.clipboard before the page's scripts run (plan D10). */
async function stubClipboard(page: Page, outcome: "succeeds" | "fails") {
  await page.addInitScript((fails: boolean) => {
    const copied: string[] = [];
    Object.assign(window, { __pfCopied: copied });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          if (fails) throw new DOMException("Clipboard write denied", "NotAllowedError");
          copied.push(text);
        },
      },
    });
  }, outcome === "fails");
}

const demoBox = (page: Page) => page.getByRole("region", { name: "Demo account" });

test.beforeEach(async ({ request }) => {
  await resetDemoData(request);
});

test("US-01 the demo box shows the demo credentials and copies each one (SPEC-auth §2.2)", async ({
  page,
}) => {
  await stubClipboard(page, "succeeds");
  await page.goto("/login");

  await expect(demoBox(page)).toContainText(demo.email);
  await expect(demoBox(page)).toContainText(demo.password);
  await demoBox(page).getByRole("button", { name: "Copy demo email" }).click();
  await demoBox(page).getByRole("button", { name: "Copy demo password" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __pfCopied: string[] }).__pfCopied))
    .toEqual([demo.email, demo.password]);
  await expect(page.getByText(COPY.copyFailed)).toHaveCount(0);
});

test("US-01 a failed copy says 'Copy failed — select the text' next to that button (SPEC-auth §4)", async ({
  page,
}) => {
  await stubClipboard(page, "fails");
  await page.goto("/login");

  await demoBox(page).getByRole("button", { name: "Copy demo email" }).click();
  await expect(page.getByText(COPY.copyFailed)).toHaveAttribute("role", "status");
  await expect(page.getByText(COPY.copyFailed)).toHaveCount(1);
});

test("US-03 AC3 a demo reset ends the session, and the login page says why", async ({
  page,
  request,
  baseURL,
}) => {
  await loginViaApi(page);
  await resetDemoData(request);
  await page.goto("/overview");

  await expect(page).toHaveURL(`${baseURL}/login?reason=reset&next=%2Foverview`);
  await expect(page.getByText(COPY.loginAfterReset)).toHaveAttribute("role", "status");
});

test("US-01 without ?reason=reset the login page shows no reset notice", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1, name: "Login" })).toBeVisible();
  await expect(page.getByText(COPY.loginAfterReset)).toHaveCount(0);
});
