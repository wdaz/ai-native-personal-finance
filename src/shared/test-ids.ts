/**
 * ADR-0003 and NFR-T6: E2E locators use roles and accessible names; a `data-testid` is
 * the fallback where the accessible tree is ambiguous, and every one is listed here. The
 * UI renders the id from this object and the test finds it through the same object —
 * eslint.config.mjs rejects a string literal in `data-testid` or `getByTestId`. T-07 added
 * the first.
 */
export const TEST_IDS = {
  /** SPEC-app-shell §2.3: the desktop sidebar's container — no role of its own; US-35 measures its width. */
  sidebar: "sidebar",
} as const satisfies Readonly<Record<string, string>>;

export type TestId = (typeof TEST_IDS)[keyof typeof TEST_IDS];
