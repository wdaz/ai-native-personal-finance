import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import { WEBMCP_MODES } from "@/src/shared/env";

const repoRoot = join(import.meta.dirname, "..", "..");

/**
 * T-01 scaffold smoke test. It asserts this task's own deliverables so that the values
 * cannot drift away from the approved documents without CI noticing.
 */
describe("T-01 scaffold", () => {
  describe("the @/ path alias", () => {
    it("resolves the @/ path alias", () => {
      expect(WEBMCP_MODES).toEqual(["native", "polyfill", "off"]);
    });
  });

  describe("src/ui/tokens.css mirrors docs/02-architecture/design-tokens.md", () => {
    const tokensCss = readFileSync(join(repoRoot, "src/ui/tokens.css"), "utf8");
    const tokensDoc = readFileSync(join(repoRoot, "docs/02-architecture/design-tokens.md"), "utf8");

    const documentedTokens = [...tokensDoc.matchAll(/`(--[a-z0-9-]+)`/g)]
      .map((m) => m[1])
      .filter((token): token is string => token !== undefined);

    it("documents at least the 22 colours, 7 presets, 11 spacings and 8 layout tokens", () => {
      expect(new Set(documentedTokens).size).toBeGreaterThanOrEqual(48);
    });

    it.each([...new Set(documentedTokens)])("declares %s", (token) => {
      expect(tokensCss).toContain(`${token}:`);
    });

    it("declares every hex value exactly as the document spells it", () => {
      const documentedHex = [...tokensDoc.matchAll(/`(#[0-9A-Fa-f]{6})`/g)]
        .map((m) => m[1])
        .filter((hex): hex is string => hex !== undefined)
        .map((hex) => hex.toLowerCase());
      expect(new Set(documentedHex).size).toBe(22);
      for (const hex of new Set(documentedHex)) {
        expect(tokensCss.toLowerCase()).toContain(hex);
      }
    });
  });

  describe("public/avatars covers every seed avatar key (SPEC-overview §4.5)", () => {
    const seed = JSON.parse(
      readFileSync(join(repoRoot, "docs/00-discovery/inputs/data.json"), "utf8"),
    ) as Record<string, unknown>;

    const keys = new Set<string>();
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) {
        node.forEach(walk);
      } else if (node && typeof node === "object") {
        for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
          if (key === "avatar" && typeof value === "string") {
            keys.add(basename(value, ".jpg"));
          } else {
            walk(value);
          }
        }
      }
    };
    walk(seed);

    it("finds 30 distinct avatar keys in the seed", () => {
      expect(keys.size).toBe(30);
    });

    it.each([...keys].sort())("has public/avatars/%s.jpg", (key) => {
      expect(existsSync(join(repoRoot, "public/avatars", `${key}.jpg`))).toBe(true);
    });
  });
});
