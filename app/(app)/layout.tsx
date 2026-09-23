import { headers } from "next/headers";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { getDb } from "@/src/server/db";
import { webmcpOriginTrialToken } from "@/src/server/env";
import { LAST_RESET_AT_HEADER, getMeta, parseForwardedResetAt } from "@/src/server/meta";
import type { MetaDto } from "@/src/shared/schemas";
import { OriginTrialMeta } from "@/src/ui/OriginTrialMeta";
import { Shell } from "@/src/ui/Shell";

/**
 * SPEC-app-shell §2.1: the authenticated pages' layout (the middleware has checked the
 * session). Every response must render per request (ADR-0006): Next then puts its CSP nonce
 * on the inline scripts and styles — a prerendered page carries none and the shell never
 * hydrates. In Next 16.3.5 `app/not-found.tsx`'s own `connection()` (T-06 F1) already makes
 * every route dynamic; this call keeps the app pages per-request without depending on that
 * file, and tests/api/app-pages.spec.ts fails only when both calls are gone. Meta is read with
 * `getMeta(db)` directly, not over HTTP (§2.1), reusing the reset time the middleware already
 * read (`x-last-reset-at`); a missing or malformed value falls back to the database. When it
 * fails the page renders without the reset banner (§3, "meta unavailable"). T-11 adds the WebMCP
 * provider.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await connection();
  let meta: MetaDto | null = null;
  try {
    const forwarded = parseForwardedResetAt((await headers()).get(LAST_RESET_AT_HEADER));
    meta = await getMeta(getDb(), process.env, forwarded);
  } catch (error) {
    console.error("(app) layout: meta unavailable, rendering without the reset banner", error);
  }
  return (
    <>
      <OriginTrialMeta token={webmcpOriginTrialToken()} />
      <Shell meta={meta}>{children}</Shell>
    </>
  );
}
