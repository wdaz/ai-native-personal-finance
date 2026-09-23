import { connection } from "next/server";
import type { ReactNode } from "react";
import { webmcpOriginTrialToken } from "@/src/server/env";
import { OriginTrialMeta } from "@/src/ui/OriginTrialMeta";
import { Shell } from "@/src/ui/Shell";

/**
 * SPEC-app-shell §2.1: the authenticated pages' layout (the middleware has checked the
 * session). `connection()` renders every response per request (ADR-0006): Next then puts this
 * response's CSP nonce on its inline scripts and styles — a prerendered page carries none and
 * the shell never hydrates (tests/api/app-pages.spec.ts). T-08 adds `getMeta(db)` and the
 * reset banner; T-11 the WebMCP provider (T-07 plan D1).
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
