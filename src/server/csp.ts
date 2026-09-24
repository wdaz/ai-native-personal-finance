/**
 * The Content-Security-Policy `middleware.ts` sets on every response and forwards on the
 * request (ADR-0006, amendment 2026-09-24 (4); TD-6).
 *
 * Production policy — the only one that ships:
 *   `default-src 'self'; script-src 'self' 'nonce-…'; style-src 'self' 'nonce-…'; frame-ancestors 'none'`
 *
 * Under `next dev` only, two sources are added because Next's own development tooling needs
 * them (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`, "Development
 * vs Production Considerations"): React reconstructs server error stacks in the browser with
 * `eval`, and Next's overlay injects `<style>` tags that carry no nonce. Neither exists in a
 * production build.
 *
 * The relaxation is opt-in on the exact string `"development"`: an unset, empty, misspelled or
 * differently cased `NODE_ENV` — and `test` and `production` — all get the production policy.
 * `tests/unit/server/csp.test.ts` pins both policies; `tests/api/middleware.spec.ts` pins the
 * production one on a real response.
 */
export function buildCsp(nonce: string, nodeEnv: string | undefined): string {
  const isDev = nodeEnv === "development";
  // With a nonce in the list, browsers ignore 'unsafe-inline' (CSP3), so in development the
  // nonce is replaced, not joined, by 'unsafe-inline' — as Next's guide does.
  const scriptSrc = `'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`;
  const styleSrc = isDev ? "'self' 'unsafe-inline'" : `'self' 'nonce-${nonce}'`;
  return `default-src 'self'; script-src ${scriptSrc}; style-src ${styleSrc}; frame-ancestors 'none'`;
}
