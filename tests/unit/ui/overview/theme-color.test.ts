import { describe, expect, it } from "vitest";
import { THEMES } from "@/src/shared/enums";
import { themeVar } from "@/src/ui/overview/theme-color";

describe("themeVar (T-10 plan D2 — reuses the token rule tests/unit/shared/enums.test.ts already pins)", () => {
  it.each(THEMES)("%s becomes var(--color-<kebab>)", (theme) => {
    expect(themeVar(theme)).toBe(`var(--color-${theme.toLowerCase().replaceAll(" ", "-")})`);
  });
});
