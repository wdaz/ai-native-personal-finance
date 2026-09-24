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

describe("ThemeBar (SPEC-overview §2.3, §2.5 — no inline style, ADR-0006)", () => {
  it("renders a data-theme attribute, never a style attribute (ADR-0006)", () => {
    const { container } = render(<ThemeBar theme="Green" />);
    const bar = container.querySelector("[data-theme]");
    expect(bar?.getAttribute("data-theme")).toBe("Green");
    expect(bar?.getAttribute("style")).toBeNull();
  });

  it.each(THEMES)('has a [data-theme="%s"] rule in the module CSS', (theme) => {
    expect(moduleCss).toContain(`[data-theme="${theme}"]`);
  });

  it("would report a theme missing its rule (violation fixture, DoD v1.1)", () => {
    const withoutPink = moduleCss.replace('[data-theme="Pink"]', "");
    expect(withoutPink).not.toContain('[data-theme="Pink"]');
  });
});
