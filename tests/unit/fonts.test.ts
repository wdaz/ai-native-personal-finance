import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fontProblems } from "../fixtures/fonts";

const repoRoot = join(import.meta.dirname, "..", "..");
const fontsDir = join(repoRoot, "app", "fonts");
const layoutSource = readFileSync(join(repoRoot, "app", "layout.tsx"), "utf8");

/** A throwaway copy of `app/fonts/`, edited by `change`, checked, then removed. */
function withFontsCopy(change: (copy: string) => void): string[] {
  const copy = mkdtempSync(join(tmpdir(), "pf-fonts-"));
  try {
    cpSync(fontsDir, copy, { recursive: true });
    change(copy);
    return fontProblems(copy, layoutSource);
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
}

describe("app/fonts is what its README says (TD-11)", () => {
  it("lists every font with its real hash, uses each in app/layout.tsx, and carries the licence", () => {
    expect(fontProblems(fontsDir, layoutSource)).toEqual([]);
  });

  it("(fixture) reports a font swapped without the README", () => {
    const problems = withFontsCopy((copy) =>
      writeFileSync(join(copy, "public-sans-latin-400-normal.woff2"), "not the font"),
    );
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(
      /public-sans-latin-400-normal\.woff2 has sha256 .* README\.md says/,
    );
  });

  it("(fixture) reports a font nobody listed, a listed font that is gone, and one the layout does not use", () => {
    const problems = withFontsCopy((copy) => {
      writeFileSync(join(copy, "extra.woff2"), "x");
      rmSync(join(copy, "public-sans-latin-700-normal.woff2"));
    });
    expect(problems).toEqual([
      "extra.woff2 is not listed in README.md",
      "README.md lists public-sans-latin-700-normal.woff2, which is not in the directory",
    ]);
    expect(fontProblems(fontsDir, "export const noFonts = true;").sort()).toEqual([
      "public-sans-latin-400-normal.woff2 is not used by app/layout.tsx",
      "public-sans-latin-700-normal.woff2 is not used by app/layout.tsx",
    ]);
  });

  it("(fixture) reports a missing or foreign licence", () => {
    expect(withFontsCopy((copy) => rmSync(join(copy, "OFL.txt")))).toEqual([
      "OFL.txt is missing or is not the SIL Open Font License, Version 1.1",
    ]);
    expect(withFontsCopy((copy) => writeFileSync(join(copy, "OFL.txt"), "MIT"))).toHaveLength(1);
  });
});
