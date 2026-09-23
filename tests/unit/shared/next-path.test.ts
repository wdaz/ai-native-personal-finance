import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "@/src/shared/next-path";

describe("sanitizeNextPath", () => {
  it.each([
    ["/overview", "/overview"],
    ["/transactions?foo=bar", "/transactions?foo=bar"],
    ["/budgets", "/budgets"],
    ["/pots", "/pots"],
    ["/recurring-bills", "/recurring-bills"],
  ])("keeps an allowed path %s", (input, expected) => {
    expect(sanitizeNextPath(input)).toBe(expected);
  });

  it.each<[string | null]>([
    ["//evil.com"], // an attempted protocol-relative redirect
    ["/api/x"], // an API path
    ["/login"], // the login page itself
    ["/overview#frag"], // a fragment, which the pattern excludes
    [null], // no next param at all
  ])("falls back to /overview for %s", (input) => {
    expect(sanitizeNextPath(input)).toBe("/overview");
  });
});
