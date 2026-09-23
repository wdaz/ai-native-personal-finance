import { expect, test } from "@playwright/test";

const NONCE = /'nonce-([^']+)'/;

/** The nonce of the response's `script-src` (T-05's middleware sets the same one on `style-src`). */
function scriptNonce(csp: string | undefined): string | undefined {
  return NONCE.exec(csp?.match(/script-src[^;]+/)?.[0] ?? "")?.[1];
}

/** Every inline `<script>` (no `src`) and every `<style>` opening tag of the document. */
function inlineTags(html: string): string[] {
  return [...html.matchAll(/<(?:script(?![^>]*\bsrc=)|style)\b[^>]*>/g)].map((match) => match[0]);
}

for (const path of ["/login", "/signup"]) {
  test(`ADR-0006, SPEC-auth §6: ${path} renders per request — its inline scripts and styles carry this response's nonce`, async ({
    request,
  }) => {
    const first = await request.get(path);
    expect(first.status()).toBe(200);
    const nonce = scriptNonce(first.headers()["content-security-policy"]);
    expect(nonce).toBeTruthy();
    const html = await first.text();
    const tags = inlineTags(html);
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) expect(tag).toContain(`nonce="${nonce}"`);
    // A `style` attribute is blocked by style-src whatever its nonce (plan D2).
    expect(html).not.toMatch(/\sstyle="/);

    // A prerendered page would repeat the first response's markup; a per-request one carries
    // the second response's own nonce.
    const second = await request.get(path);
    const secondNonce = scriptNonce(second.headers()["content-security-policy"]);
    expect(secondNonce).toBeTruthy();
    expect(secondNonce).not.toBe(nonce);
    expect(await second.text()).toContain(`nonce="${secondNonce}"`);
  });
}
