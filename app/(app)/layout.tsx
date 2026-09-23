import { connection } from "next/server";
import type { ReactNode } from "react";
import { webmcpOriginTrialToken } from "@/src/server/env";
import { OriginTrialMeta } from "@/src/ui/OriginTrialMeta";
import { Shell } from "@/src/ui/Shell";

/**
 * SPEC-app-shell §2.1: the authenticated pages' layout (the middleware has checked the
 * session). Every response must render per request (ADR-0006): Next then puts its CSP nonce
 * on the inline scripts and styles — a prerendered page carries none and the shell never
 * hydrates. In Next 16.3.5 `app/not-found.tsx`'s own `connection()` (T-06 F1) already makes
 * every route dynamic; this call keeps the app pages per-request without depending on that
 * file, and tests/api/app-pages.spec.ts fails only when both calls are gone. T-08 adds
 * `getMeta(db)` and the reset banner; T-11 the WebMCP provider (T-07 plan D1).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await connection();
  return (
    <>
      <OriginTrialMeta token={webmcpOriginTrialToken()} />
      <Shell>{children}</Shell>
    </>
  );
}
