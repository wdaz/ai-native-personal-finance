/**
 * Reading ADR-0006's per-request nonce out of a response — shared by the API tests that check
 * a page renders per request (tests/api/auth-pages.spec.ts, app-pages.spec.ts).
 */
const NONCE = /'nonce-([^']+)'/;

/** The nonce of a CSP's `script-src` (the middleware sets the same one on `style-src`). */
export function scriptNonce(csp: string | undefined): string | undefined {
  return NONCE.exec(csp?.match(/script-src[^;]+/)?.[0] ?? "")?.[1];
}

/** Every inline `<script>` (no `src`) and every `<style>` opening tag of the document. */
export function inlineTags(html: string): string[] {
  return [...html.matchAll(/<(?:script(?![^>]*\bsrc=)|style)\b[^>]*>/g)].map((match) => match[0]);
}
