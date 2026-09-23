/**
 * ADR-0003 and NFR-T6: E2E locators use roles and accessible names; a `data-testid` is
 * the fallback where the accessible tree is ambiguous, and every one is listed here. The
 * UI renders the id from this object and the test finds it through the same object —
 * eslint.config.mjs rejects a string literal in `data-testid` or `getByTestId`. No Release 1
 * spec names one yet; the first task that needs an id adds it here.
 */
export const TEST_IDS = {} as const satisfies Readonly<Record<string, string>>;

export type TestId = (typeof TEST_IDS)[keyof typeof TEST_IDS];
