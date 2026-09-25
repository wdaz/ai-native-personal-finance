import { existsSync, readFileSync, readdirSync } from "node:fs";
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

    /**
     * Each token is compared against *its own* documented value. A membership test —
     * "every documented name appears, every documented hex appears somewhere" — passes
     * when two colours are swapped, when 4px becomes 400px and when 2rem becomes 3rem,
     * so it guards the token list but not the design.
     */
    const declaredTokens = new Map<string, string>();
    for (const match of tokensCss
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      const [, token, value] = match;
      if (token && value) declaredTokens.set(token, value.replace(/\s+/g, " ").trim());
    }

    // Every token named in a backticked span anywhere in the document.
    const documentedTokens = new Set(
      [...tokensDoc.matchAll(/`(--[a-z0-9-]+)`/g)]
        .map((m) => m[1])
        .filter((token): token is string => token !== undefined),
    );

    // Colours: | `--color-x` | Name | `#HEX` | r, g, b | use |
    const documentedColours = new Map<string, string>();
    for (const match of tokensDoc.matchAll(
      /^\|\s*`(--[a-z0-9-]+)`\s*\|[^|]*\|\s*`(#[0-9A-Fa-f]{6})`\s*\|/gm,
    )) {
      const [, token, hex] = match;
      if (token && hex) documentedColours.set(token, hex.toLowerCase());
    }

    // Spacing, radii, layout, breakpoints, auth and shell values: | `--token` | 8px | and | `--token` | 8px | use |; v1.2's two durations are written in ms
    const documentedPixels = new Map<string, string>();
    for (const match of tokensDoc.matchAll(/^\|\s*`(--[a-z0-9-]+)`\s*\|\s*(\d+(?:px|ms))\s*\|/gm)) {
      const [, token, value] = match;
      if (token && value) documentedPixels.set(token, value);
    }

    // Typography: | `--text-preset-1` | Text Preset 1 | 700 | 32px | 120% |
    const documentedPresets = new Map<string, { weight: string; px: number; lineHeight: string }>();
    for (const match of tokensDoc.matchAll(
      /^\|\s*`(--text-preset[a-z0-9-]*)`\s*\|[^|]*\|\s*(\d+)\s*\|\s*(\d+)px\s*\|\s*(\d+%)\s*\|/gm,
    )) {
      const [, token, weight, px, lineHeight] = match;
      if (token && weight && px && lineHeight) {
        documentedPresets.set(token, { weight, px: Number(px), lineHeight });
      }
    }

    // `700 2rem / 120% var(--font-family-base)`
    const fontShorthand = /^(\d+) ([\d.]+)rem \/ (\d+%) var\(--font-family-base\)$/;

    it("documents at least the 22 colours, 7 presets, 11 spacings, 8 layout, 7 auth/line and 9 app shell tokens", () => {
      expect(documentedTokens.size).toBeGreaterThanOrEqual(64);
    });

    it("parses a value for every documented token", () => {
      expect(documentedColours.size).toBe(22);
      expect(documentedPresets.size).toBe(7);
      // 11 spacings + 8 radii/layout/breakpoints (v1.0) + 7 auth layout and lines (v1.1)
      // + 9 app shell values, two of them durations (v1.2).
      expect(documentedPixels.size).toBe(35);
      // Nothing documented may escape the three value checks below — a new table in the
      // document has to be given a parser here rather than silently going unchecked.
      const valued = new Set([
        ...documentedColours.keys(),
        ...documentedPixels.keys(),
        ...documentedPresets.keys(),
      ]);
      expect([...documentedTokens].filter((token) => !valued.has(token))).toEqual([]);
    });

    it.each([...documentedColours])("declares %s as %s", (token, hex) => {
      expect(declaredTokens.get(token)?.toLowerCase()).toBe(hex);
    });

    it.each([...documentedPixels])("declares %s as %s", (token, value) => {
      expect(declaredTokens.get(token)).toBe(value);
    });

    // The document states px; tokens.css writes rem at the 16px default so that the text
    // scales with the reader's font-size preference (tokens.css, header). Assert the
    // conversion rather than the literal, or the rem values go unchecked.
    it.each([...documentedPresets])("declares %s as the documented font", (token, documented) => {
      const declared = declaredTokens.get(token);
      const shorthand = fontShorthand.exec(declared ?? "");
      expect(shorthand, `${token} is "${declared}", not a <weight> <size>rem / <lh> font`).not.toBe(
        null,
      );
      const [, weight, rem, lineHeight] = shorthand ?? [];
      expect(weight).toBe(documented.weight);
      expect(Number(rem) * 16).toBe(documented.px);
      expect(lineHeight).toBe(documented.lineHeight);
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

    // The reverse direction: seed ⊆ directory alone lets an unreferenced image sit in
    // public/avatars for ever. The copy from the Frontend Mentor starter is exactly the
    // seed's set, so assert equality.
    it("holds no image the seed does not reference", () => {
      const onDisk = readdirSync(join(repoRoot, "public/avatars"))
        .filter((file) => file.endsWith(".jpg"))
        .map((file) => basename(file, ".jpg"));
      expect(onDisk.filter((key) => !keys.has(key)).sort()).toEqual([]);
      expect(onDisk.length).toBe(keys.size);
    });
  });

  describe(".env.example lists every documented variable", () => {
    const envExample = readFileSync(join(repoRoot, ".env.example"), "utf8");
    const declared = new Set(
      envExample
        .split("\n")
        .map((line) => line.match(/^([A-Z][A-Z0-9_]*)=/)?.[1])
        .filter((name): name is string => Boolean(name)),
    );

    // ADR-0005/0006/0007 (and ADR-0007's T-14 amendment) and SPEC-webmcp-tools §2.1, plus the R1
    // spec variables (D6).
    const required = [
      "DATABASE_URL",
      "DATABASE_URL_UNPOOLED",
      "SESSION_SECRET",
      "DEMO_EMAIL",
      "DEMO_PASSWORD_HASH",
      "DEMO_PASSWORD_DISPLAY",
      "RESET_SECRET",
      "WEBMCP_MODE",
      "WEBMCP_ORIGIN_TRIAL_TOKEN",
      "APP_ENV",
      "CRON_SECRET",
      "RESET_INTERVAL_DAYS",
      "RESET_ROW_THRESHOLD",
      "RESET_BYTES_THRESHOLD",
    ];

    it.each(required)("declares %s", (name) => {
      expect(declared.has(name)).toBe(true);
    });

    // The reverse direction: an undocumented variable added here would otherwise never
    // be noticed, and .env.example is what a contributor copies.
    it("declares nothing the documents do not name", () => {
      expect([...declared].filter((name) => !required.includes(name)).sort()).toEqual([]);
    });

    it("does not declare NEXT_PUBLIC_* directly — next.config derives them (§2.1)", () => {
      expect([...declared].filter((name) => name.startsWith("NEXT_PUBLIC_"))).toEqual([]);
    });
  });
});
