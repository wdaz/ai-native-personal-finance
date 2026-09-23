import { expect, test } from "../fixtures/e2e";

/**
 * T-01 smoke test, updated by T-05: `/` no longer renders a page — the middleware redirects
 * it (SPEC-auth §2.8). T-06: `/login` now renders, under the fixtures' automatic CSP check. No
 * story id because it verifies the scaffold boots, not a story; the traceability script (T-13)
 * checks that every release story HAS a test, not that every test has a story.
 */
test("scaffold: the root route redirects to /login, which renders under the CSP (middleware boots)", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { level: 1, name: "Login" })).toBeVisible();
});
