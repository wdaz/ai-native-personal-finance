import type { Theme } from "@/src/shared/enums";

/** T-10 plan D2: the same rule tests/unit/shared/enums.test.ts already holds tokens.css to. */
export function themeVar(theme: Theme): string {
  return `var(--color-${theme.toLowerCase().replaceAll(" ", "-")})`;
}
