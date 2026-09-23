import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORY_BY_NAME, THEME_BY_HEX } from "@/src/server/seed";
import { CATEGORIES, RESET_REASONS, THEMES } from "@/src/shared/enums";

const repoRoot = join(import.meta.dirname, "..", "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

/**
 * The lists data-model.md writes out: "Enums: `Category` = Entertainment, Bills, … .
 * `Theme` = Green, … ." and `ResetLog`'s "`reason` (`scheduled` \| … )". Throws when either
 * is missing, so a reworded document fails instead of comparing nothing with nothing.
 */
function documentedEnums(markdown: string): Record<string, string[]> {
  const line = markdown.split("\n").find((text) => text.startsWith("Enums:"));
  const reasons = /`reason` \(([^)]*)\)/.exec(markdown)?.[1];
  if (!line || !reasons) throw new Error("No enum lists in data-model.md");
  const lists = [...line.matchAll(/`(\w+)` = ([^.]+)\./g)].map(
    ([, name = "", list = ""]) => [name, list.split(",").map((item) => item.trim())] as const,
  );
  const reset = reasons.split("\\|").map((item) => item.trim().replaceAll("`", ""));
  return { ...Object.fromEntries(lists), ResetReason: reset };
}

const shared = { Category: [...CATEGORIES], Theme: [...THEMES], ResetReason: [...RESET_REASONS] };

describe("src/shared/enums.ts mirrors data-model.md (T-04)", () => {
  it("lists every category, theme and reset reason in the document's order", () => {
    expect(documentedEnums(read("docs/02-architecture/data-model.md"))).toEqual(shared);
  });

  it("would report a theme the document lacks (violation fixture, DoD v1.1)", () => {
    const documented = documentedEnums(read("tests/fixtures/enums/missing-pink.md.fixture"));
    expect(documented.Theme).not.toEqual(shared.Theme);
    expect(shared.Theme.filter((theme) => !documented.Theme?.includes(theme))).toEqual(["Pink"]);
  });

  it("would report a document without the lists rather than pass in silence (violation fixture)", () => {
    expect(() => documentedEnums(read("tests/fixtures/enums/no-enums.md.fixture"))).toThrow(
      "No enum lists in data-model.md",
    );
  });
});

describe("the seed and the theme colours use the same names (T-02, T-01)", () => {
  it("reads every category of data.json under its shared name", () => {
    expect([...CATEGORY_BY_NAME.keys()].sort()).toEqual([...CATEGORIES].sort());
  });

  it("maps each shared name to the Prisma identifier without spaces (T-02 plan D4)", () => {
    const identifier = (name: string) => name.replaceAll(" ", "");
    expect([...CATEGORY_BY_NAME.values()].sort()).toEqual(CATEGORIES.map(identifier).sort());
    expect([...THEME_BY_HEX.values()].sort()).toEqual(THEMES.map(identifier).sort());
  });

  /** `--color-navy-grey` for "Navy Grey": src/ui/tokens.css names each theme colour. */
  const missingThemeColours = (css: string) =>
    THEMES.filter((theme) => {
      const token = `--color-${theme.toLowerCase().replaceAll(" ", "-")}:`;
      return !css.includes(token);
    });

  it("has a colour token in src/ui/tokens.css for every theme", () => {
    expect(missingThemeColours(read("src/ui/tokens.css"))).toEqual([]);
  });

  it("would report a theme without a colour token (violation input)", () => {
    const css = read("src/ui/tokens.css").replace("--color-army-green:", "--color-army:");
    expect(missingThemeColours(css)).toEqual(["Army Green"]);
  });
});
