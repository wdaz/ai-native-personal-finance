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
