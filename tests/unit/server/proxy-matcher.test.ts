import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { config } from "@/proxy";
import { compileMatcher } from "../../fixtures/proxy-matcher";

const repoRoot = join(import.meta.dirname, "..", "..", "..");

/**
 * TD-19 (T-14 plan 6.5): what `proxy.ts`'s matcher lets through, judged by the expression Next
 * compiles from it (`compileMatcher`). The first matcher excluded every path containing a dot
 * (`.*\..*`) for the sake of static assets, and so swallowed the suffix Next appends as well: on
 * Vercel the proxy never ran for `/overview.segments/*` or `/api/overview.json`, and the responses
 * carried none of its headers.
 *
 * A limit of this model: Next tests the compiled expression against the path without a trailing
 * slash and, failing that, its percent-decoded form (`next-server.js`, the step that runs the
 * proxy), and the final `.rsc` is already off the path by then (measured: on Vercel in TD-14, on
 * `next start` here) — not against the raw path used below. The `.rsc` rows therefore pin the
 * raw-path reading only: `/overview.rsc` did reach the proxy under the first matcher, and
 * `tests/api/proxy.spec.ts` is what proves the requests. The `.segments/*` and `.json` rows are the
 * ones whose gap was real.
 */
const proxyRuns = (matcher: string, path: string): boolean =>
  new RegExp(compileMatcher(matcher)).test(path);

/** Paths whose response must come from behind the proxy: pages, APIs and their transport forms. */
const MUST_RUN = [
  "/",
  "/login",
  "/overview",
  "/overview.rsc",
  "/overview.segments/_tree.segment.rsc",
  // The form `next start` hands the proxy: Next has already taken the final `.rsc` off.
  "/overview.segments/_tree.segment",
  "/overview.segments/_full.segment.rsc",
  "/overview.segments/(app)/overview/__PAGE__.segment.rsc",
  "/transactions.rsc",
  "/api/overview",
  "/api/overview.json",
  "/api/auth/session",
];

/** Static assets: the proxy has nothing to say about them (review finding M6). */
const MUST_SKIP = [
  "/_next/static/chunks/main.js",
  "/_next/image",
  "/favicon.ico",
  "/avatars/bytewise.jpg",
  "/images/logo.svg",
];

const matcherProblems = (matcher: string): string[] => [
  ...MUST_RUN.filter((path) => !proxyRuns(matcher, path)).map((path) => `skips ${path}`),
  ...MUST_SKIP.filter((path) => proxyRuns(matcher, path)).map((path) => `runs for ${path}`),
];

const filesUnder = (directory: string): string[] =>
  readdirSync(join(repoRoot, directory), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? filesUnder(`${directory}/${entry.name}`)
      : [`/${directory}/${entry.name}`.replace(/^\/public/, "")],
  );

describe("proxy.ts's matcher (TD-19)", () => {
  const [matcher, ...rest] = config.matcher;

  it("is one pattern", () => {
    expect(rest).toEqual([]);
    expect(matcher).toEqual(expect.any(String));
  });

  it("runs the proxy for pages, APIs and Next's `.rsc`, `.segments/*` and `.json` forms of them, and skips static assets", () => {
    expect(matcherProblems(matcher as string)).toEqual([]);
  });

  it("skips every file the app serves from public/", () => {
    const served = filesUnder("public");
    expect(served.length).toBeGreaterThan(0);
    expect(served.filter((path) => proxyRuns(matcher as string, path))).toEqual([]);
  });

  it("(fixture) reports the first matcher, whose dotted-path exclusion swallowed Next's suffix", () => {
    expect(matcherProblems("/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)")).toEqual([
      "skips /overview.rsc",
      "skips /overview.segments/_tree.segment.rsc",
      "skips /overview.segments/_tree.segment",
      "skips /overview.segments/_full.segment.rsc",
      "skips /overview.segments/(app)/overview/__PAGE__.segment.rsc",
      "skips /transactions.rsc",
      "skips /api/overview.json",
    ]);
  });

  it("(fixture) reports a matcher that runs for everything", () => {
    expect(matcherProblems("/(.*)")).toEqual(MUST_SKIP.map((path) => `runs for ${path}`));
  });
});
