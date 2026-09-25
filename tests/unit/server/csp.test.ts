import { describe, expect, it } from "vitest";
import { buildCsp } from "@/src/server/csp";

const NONCE = "MTIzNDU2Nzg5";

/**
 * ADR-0006, 2026-09-24 amendment (4) / TD-6: the policy is built in one place and differs by
 * environment only under `next dev`. The production string is pinned byte for byte, so a
 * relaxation can never ship by accident — `tests/api/proxy.spec.ts` pins the same string
 * on the response of a production build.
 */
const PRODUCTION_POLICY = `default-src 'self'; script-src 'self' 'nonce-${NONCE}'; style-src 'self' 'nonce-${NONCE}'; frame-ancestors 'none'`;

describe("buildCsp", () => {
  it("builds the production policy byte for byte", () => {
    expect(buildCsp(NONCE, "production")).toBe(PRODUCTION_POLICY);
  });

  it.each([undefined, "", "test", "Development", "DEVELOPMENT", " development", "prod"])(
    "fails closed to the production policy for NODE_ENV %j",
    (nodeEnv) => {
      expect(buildCsp(NONCE, nodeEnv)).toBe(PRODUCTION_POLICY);
    },
  );

  it("never puts an unsafe-* source in the production policy", () => {
    expect(buildCsp(NONCE, "production")).not.toMatch(/unsafe-/);
  });

  describe("under next dev (NODE_ENV=development)", () => {
    const dev = buildCsp(NONCE, "development");
    const directive = (name: string): string =>
      dev
        .split("; ")
        .find((part) => part.startsWith(`${name} `))
        ?.slice(name.length + 1) ?? "";

    it("lets React's development tooling use eval in script-src, and keeps the nonce", () => {
      expect(directive("script-src")).toBe(`'self' 'nonce-${NONCE}' 'unsafe-eval'`);
    });

    it("allows the overlay's un-nonced <style> tags — 'unsafe-inline' instead of the nonce", () => {
      // A nonce in the list would make browsers ignore 'unsafe-inline' (CSP3), so the nonce is
      // dropped from style-src in development only.
      expect(directive("style-src")).toBe("'self' 'unsafe-inline'");
    });

    it("keeps the directives that do not need relaxing", () => {
      expect(directive("default-src")).toBe("'self'");
      expect(directive("frame-ancestors")).toBe("'none'");
    });
  });
});
