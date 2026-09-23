import { expect, seriousA11yViolations, test } from "../fixtures/e2e";

/**
 * DoD v1.1: a guard is not verified until it has failed on purpose. Each page below is served
 * by `page.route`, never by the app, and breaks one rule deliberately; the test passes only if
 * the guard reports it. No story id: these verify the test layer, not a story (the scaffold
 * test is the precedent).
 */
test.describe("E2E guards report a deliberate violation", () => {
  test.use({ cspGuard: false });

  test("the CSP guard reports an inline style the page's policy forbids", async ({
    page,
    cspViolations,
  }) => {
    await page.route("**/__guard/csp", (route) =>
      route.fulfill({
        contentType: "text/html",
        headers: { "Content-Security-Policy": "style-src 'self'" },
        body: '<!doctype html><html lang="en"><title>CSP guard fixture</title><p style="color: red">inline style</p></html>',
      }),
    );
    await page.goto("/__guard/csp");
    await expect.poll(() => cspViolations.length).toBeGreaterThan(0);
    expect(cspViolations[0]).toMatch(/^\/__guard\/csp style-src/);
  });

  test("the axe helper reports a serious violation", async ({ page }) => {
    await page.route("**/__guard/axe", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html lang="en"><title>axe guard fixture</title><main><img src="/avatars/bytewise.jpg"></main></html>',
      }),
    );
    await page.goto("/__guard/axe");
    expect(await seriousA11yViolations(page)).toContainEqual(expect.stringMatching(/^image-alt:/));
  });
});
