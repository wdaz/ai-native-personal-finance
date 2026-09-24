import { A11Y_ROUTES, NOT_FOUND_PATH } from "../fixtures/a11y-routes";
import { expect, loginViaApi, resetDemoData, seriousA11yViolations, test } from "../fixtures/e2e";

/**
 * T-13's axe gate: every route in the list has at least one scan on each engine CI runs.
 * The per-page tests (auth-accessibility, app-shell, overview) scan the states — errors, the
 * collapsed menu, a phone width; this file scans the routes, and the unit test keeps the list
 * complete. All eight pages, including the 404 page no other test scans, have one `<h1>`.
 */
for (const { path, authenticated } of A11Y_ROUTES) {
  test(`US-01 US-02 US-33 NFR-A1 axe gate: ${path} has no serious or critical violation`, async ({
    page,
    request,
  }) => {
    await resetDemoData(request);
    if (authenticated) await loginViaApi(page);
    // Pin the page scanned: a listed route that 404s or redirects to /login would scan a
    // different page and still pass.
    const response = await page.goto(path);
    expect(response?.status()).toBe(path === NOT_FOUND_PATH ? 404 : 200);
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect.poll(() => seriousA11yViolations(page), { message: path }).toEqual([]);
  });
}
