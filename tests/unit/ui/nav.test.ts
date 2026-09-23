import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "@/src/shared/next-path";
import { NAV_ITEMS, PAGE_NAMES, isActive } from "@/src/ui/nav";

describe("NAV_ITEMS (SPEC-app-shell §2.2)", () => {
  it("lists the five pages in the spec's order, each labelled with its page name", () => {
    expect(NAV_ITEMS.map(({ href, label }) => [href, label])).toEqual([
      ["/overview", "Overview"],
      ["/transactions", "Transactions"],
      ["/budgets", "Budgets"],
      ["/pots", "Pots"],
      ["/recurring-bills", "Recurring Bills"],
    ]);
    expect(Object.values(PAGE_NAMES)).toEqual(NAV_ITEMS.map(({ label }) => label));
  });

  it("links only to routes the middleware protects and login may return to (SPEC-auth §2.4, §2.8)", () => {
    for (const { href } of NAV_ITEMS) expect(sanitizeNextPath(href)).toBe(href);
  });
});

describe("isActive (SPEC-app-shell §2.7: aria-current)", () => {
  it.each([
    ["/budgets", "/budgets", true],
    ["/budgets/7", "/budgets", true],
    ["/budget", "/budgets", false],
    ["/budgets-archive", "/budgets", false],
    ["/overview", "/budgets", false],
    ["/", "/overview", false],
  ])("pathname %s, href %s → %s", (pathname, href, expected) => {
    expect(isActive(pathname, href)).toBe(expected);
  });
});
