import { describe, expect, it } from "vitest";
import { stripTransportSuffix, TRANSPORT_SUFFIXES } from "@/src/server/transport-path";
import { compileMatcher } from "../../fixtures/proxy-matcher";

/**
 * TD-19: `next start` takes the final `.rsc` off before the proxy runs, so a request for
 * `/overview.segments/_tree.segment.rsc` arrives as `/overview.segments/_tree.segment` — which is
 * not `/overview` to the route matrix unless the suffix is taken off first. The matcher lets the
 * request in (tests/unit/server/proxy-matcher.test.ts); this is what lets the session check
 * recognise it.
 */
describe("stripTransportSuffix", () => {
  it.each([
    ["/overview", "/overview"],
    ["/overview.rsc", "/overview"],
    ["/overview.json", "/overview"],
    ["/overview.segments/_tree.segment.rsc", "/overview"],
    ["/overview.segments/(app)/overview/__PAGE__.segment.rsc", "/overview"],
    ["/recurring-bills.segments/recurring-bills/__PAGE__.segment.rsc", "/recurring-bills"],
    // `next start` takes the final `.rsc` off before the proxy runs (measured, 2026-09-26: the
    // proxy's `pathname` for a request to `/overview.segments/_tree.segment.rsc` was
    // `/overview.segments/_tree.segment`), so the segment form arrives without it.
    ["/overview.segments/_tree.segment", "/overview"],
    ["/overview.segments/(app)/overview/__PAGE__.segment", "/overview"],
    ["/login.rsc", "/login"],
    ["/", "/"],
  ])("%s → %s", (pathname, route) => {
    expect(stripTransportSuffix(pathname)).toBe(route);
  });

  it.each([
    "/avatars/bytewise.jpg",
    "/overview.segments/_tree",
    "/overview.rsc/extra",
    "/overview.segments/_tree.segment.rsc.map",
    "/overview.jsonp",
    "/overview.rscx",
  ])("leaves %s alone: the suffix has to end the path", (pathname) => {
    expect(stripTransportSuffix(pathname)).toBe(pathname);
  });

  it("takes off one suffix, not every dotted ending", () => {
    expect(stripTransportSuffix("/overview.json.rsc")).toBe("/overview.json");
  });
});

/**
 * The suffixes are Next's, copied. If Next appends a different set, a form of a protected page
 * would reach the proxy under a name the route matrix does not know — so the list is compared
 * with what Next appends to a compiled matcher, from the installed `next`.
 */
const appendsOurSuffixes = (compiledRegexp: string): boolean =>
  compiledRegexp.includes(`(${TRANSPORT_SUFFIXES})`);

describe("TRANSPORT_SUFFIXES", () => {
  it("is the set Next appends to a proxy matcher", () => {
    expect(appendsOurSuffixes(compileMatcher("/(.*)"))).toBe(true);
  });

  it("(fixture) reports a compiled matcher without them", () => {
    expect(appendsOurSuffixes("^\\/((?!_next).*)[\\/#\\?]?$")).toBe(false);
    expect(appendsOurSuffixes("^\\/(.*)(\\.json)?$")).toBe(false);
  });
});
