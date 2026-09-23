import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type APIRequestContext, type Page } from "@playwright/test";
import { demoCredentials } from "@/src/server/env";

/**
 * The E2E layer's shared fixtures (ADR-0003; ADR-0002 puts "seed/reset helpers, auth state"
 * in tests/fixtures). Every spec in tests/e2e imports `test` and `expect` from here.
 *
 * `cspViolations` is automatic: an init script listens for `securitypolicyviolation` on every
 * document the page opens and reports it through an exposed function, so violations survive
 * navigations. With `cspGuard` on (the default) the test fails if any was reported — ADR-0006
 * puts a per-request nonce on every inline script and style, and a violation means a page
 * rendered without it (a prerendered page, or a `style` attribute). The browser raises the
 * event itself; the check needs nothing from the page's own scripts, which may be the very
 * thing that was blocked.
 */
type Fixtures = {
  /** Fail the test when a page reports a CSP violation. `test.use({ cspGuard: false })` to opt out. */
  cspGuard: boolean;
  /** Every violation the test's pages reported, as `"<pathname> <directive> <blocked URI|inline>"`. */
  cspViolations: string[];
};

export const test = base.extend<Fixtures>({
  cspGuard: [true, { option: true }],
  cspViolations: [
    async ({ page, cspGuard, javaScriptEnabled }, use) => {
      const violations: string[] = [];
      // With JavaScript off no script runs, so none is blocked and no listener could report one.
      if (javaScriptEnabled === false) {
        await use(violations);
        return;
      }
      await page.exposeFunction("__pfReportCspViolation", (entry: string) => {
        violations.push(entry);
      });
      await page.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (event) => {
          const report = (window as unknown as { __pfReportCspViolation?: (entry: string) => void })
            .__pfReportCspViolation;
          report?.(
            `${location.pathname} ${event.effectiveDirective} ${event.blockedURI || "inline"}`,
          );
        });
      });
      await use(violations);
      if (cspGuard) {
        expect(
          violations,
          "ADR-0006: every inline script and style carries this response's CSP nonce",
        ).toEqual([]);
      }
    },
    { auto: true },
  ],
});

export { expect };

/** SPEC-reset-and-test-support §2.7: back to the seed; clears every session and rate-limit counter. */
export async function resetDemoData(request: APIRequestContext): Promise<void> {
  const response = await request.post("/api/test/reset");
  expect(response.status(), "POST /api/test/reset — is the server running with APP_ENV=test?").toBe(
    200,
  );
}

/**
 * Logs the demo account in through `POST /api/auth/login` from the page's own request context,
 * which shares the browser context's cookies. Call it after the test's reset: a reset ends
 * every session (ADR-0006, 2026-09-20 amendment), so a login saved once per run would not
 * survive the second test (ADR-0003 clarification 2026-09-23).
 */
export async function loginViaApi(page: Page): Promise<void> {
  const { email, password } = demoCredentials();
  const response = await page.request.post("/api/auth/login", { data: { email, password } });
  expect(response.status(), "POST /api/auth/login with the demo credentials").toBe(200);
}

/** NFR-A1: WCAG 2.1 AA, zero serious or critical axe violations. One `"<rule id>: <targets>"` per violation. */
export async function seriousA11yViolations(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
    );
}
