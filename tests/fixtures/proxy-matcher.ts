import * as nextPageStaticInfo from "next/dist/build/analysis/get-page-static-info";

// The module exports `getMiddlewareMatchers` at runtime (Next 16.3.5, its `module.exports` list)
// but its `.d.ts` does not declare it, so the signature is written out here from the source
// (`get-page-static-info.js`, `getMiddlewareMatchers(matcherOrMatchers, nextConfig)`).
const { getMiddlewareMatchers } = nextPageStaticInfo as unknown as {
  getMiddlewareMatchers: (matchers: string[], nextConfig: object) => { regexp: string }[];
};

/**
 * TD-19: what the server tests a request path against. Next does not use `config.matcher` as
 * written — it appends `(\.json|\.rsc|\.segments/.+\.segment\.rsc)?` and compiles the result to a
 * regular expression — so tests that ask what `proxy.ts` runs for compile it with Next's own
 * function, from the installed `next`, and a Next upgrade that changes the suffix changes the
 * answer.
 */
export function compileMatcher(matcher: string): string {
  const [compiled] = getMiddlewareMatchers([matcher], {});
  if (!compiled) throw new Error("Next compiled no matcher");
  return compiled.regexp;
}
