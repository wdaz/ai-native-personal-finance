/**
 * The suffixes Next appends to a proxy's matcher so that the proxy also covers the transport
 * forms of a path: a Pages-Router data URL (`.json`), an RSC payload (`.rsc`) and a segment
 * prefetch (`.segments/<segment>.segment.rsc`). Copied from `getMiddlewareMatchers` in Next
 * 16.3.5 (`next/dist/build/analysis/get-page-static-info.js`); `tests/unit/server/transport-path.test.ts`
 * compares this list with what the installed `next` appends, so an upgrade that changes it fails there.
 */
export const TRANSPORT_SUFFIXES = "\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc";

// `next start` takes the final `.rsc` off a request's path before the proxy runs, so the segment
// form can also arrive as `.segments/<segment>.segment` (measured 2026-09-26, TD-19).
const TRANSPORT_SUFFIX = new RegExp(`(?:${TRANSPORT_SUFFIXES}|\\.segments\\/.+\\.segment)$`);

/**
 * The route a page request is for, with Next's transport suffix taken off (TD-19). Next hands the
 * proxy `/overview.rsc` already as `/overview` (measured: a redirect to `/login?next=%2Foverview`,
 * on Vercel in TD-14 and on `next start`), but a segment prefetch only half-normalised —
 * `/overview.segments/_tree.segment.rsc` reaches the proxy as `/overview.segments/_tree.segment`
 * on `next start` (measured 2026-09-26), where the route matrix did not know the path and asked
 * for no session. Taking the suffix off here means the answer does not depend on which forms, or
 * how much of them, the host normalises. One suffix only, and only at the end of the path.
 */
export function stripTransportSuffix(pathname: string): string {
  return pathname.replace(TRANSPORT_SUFFIX, "");
}
