import { expect, test } from "@playwright/test";

/**
 * T-01 smoke test, updated by T-05: `/` no longer renders a page — the middleware redirects
 * it (SPEC-auth §2.8). No story id because it verifies the scaffold boots, not a story; the
 * traceability script (T-13) checks that every release story HAS a test, not that every test
 * has a story.
 */
test("scaffold: the root route redirects to /login (middleware boots)", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
