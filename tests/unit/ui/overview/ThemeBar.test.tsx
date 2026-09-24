// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { THEMES } from "@/src/shared/enums";
import { ThemeBar } from "@/src/ui/overview/ThemeBar";

afterEach(cleanup);

const repoRoot = join(import.meta.dirname, "..", "..", "..", "..");
const moduleCss = readFileSync(join(repoRoot, "src/ui/overview/ThemeBar.module.css"), "utf8");

/**
 * The colour token a `[data-theme="<theme>"]` rule actually sets `background` to — not just
 * whether the selector string exists. Adversarial review finding 2: the first version of this
 * test only checked the selector was present, so a swapped rule (e.g. "Navy" painted with
 * `--color-red`) would have passed every assertion here.
 */
function ruleColour(css: string, theme: string): string | undefined {
  // Every RegExp metacharacter, so a theme name matches only itself (CodeQL
  // js/incomplete-sanitization, alert #2). No THEMES entry has one today.
  const escaped = theme.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(
    `\\.bar\\[data-theme="${escaped}"\\]\\s*\\{\\s*background:\\s*var\\(--color-([a-z-]+)\\)`,
  ).exec(css);
  return match?.[1];
}

describe("ThemeBar (SPEC-overview §2.3, §2.5 — no inline style, ADR-0006)", () => {
  it("renders a data-theme attribute, never a style attribute (ADR-0006)", () => {
    const { container } = render(<ThemeBar theme="Green" />);
    const bar = container.querySelector("[data-theme]");
    expect(bar?.getAttribute("data-theme")).toBe("Green");
    expect(bar?.getAttribute("style")).toBeNull();
  });

  it.each(THEMES)('"%s" paints its own --color-<kebab> token, not a swapped one', (theme) => {
    expect(ruleColour(moduleCss, theme)).toBe(theme.toLowerCase().replaceAll(" ", "-"));
  });

  it("would report a theme missing its rule entirely (violation fixture, DoD v1.1)", () => {
    const withoutPink = moduleCss.replace(
      '.bar[data-theme="Pink"] {\n  background: var(--color-pink);\n}\n',
      "",
    );
    expect(ruleColour(withoutPink, "Pink")).toBeUndefined();
  });

  it("would report two swapped colours (violation fixture, DoD v1.1)", () => {
    const swapped = moduleCss
      .replace("var(--color-navy);", "var(--color-red-PLACEHOLDER);")
      .replace("var(--color-red);", "var(--color-navy);")
      .replace("var(--color-red-PLACEHOLDER);", "var(--color-red);");
    expect(ruleColour(swapped, "Navy")).not.toBe("navy");
    expect(ruleColour(swapped, "Navy")).toBe("red");
  });
});
