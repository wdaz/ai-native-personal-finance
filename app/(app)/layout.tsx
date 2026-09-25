import { headers } from "next/headers";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { getDb } from "@/src/server/db";
import { webmcpOriginTrialToken } from "@/src/server/env";
import { LAST_RESET_AT_HEADER, getMeta, parseForwardedResetAt } from "@/src/server/meta";
import type { MetaDto } from "@/src/shared/schemas";
import { AgentToolsIndicatorProvider } from "@/src/ui/agent-tools-indicator";
import { OriginTrialMeta } from "@/src/ui/OriginTrialMeta";
import { Shell } from "@/src/ui/Shell";
import { AgentToolsStatus } from "@/src/webmcp/AgentToolsStatus";
import { WebMcpProvider } from "@/src/webmcp/WebMcpProvider";

/**
 * SPEC-app-shell §2.1: the authenticated pages' layout (the proxy has checked the
 * session). Every response must render per request (ADR-0006): Next then puts its CSP nonce
 * on the inline scripts and styles — a prerendered page carries none and the shell never
 * hydrates. In Next 16.3.5 `app/not-found.tsx`'s own `connection()` (T-06 F1) already makes
 * every route dynamic; this call keeps the app pages per-request without depending on that
 * file, and tests/api/app-pages.spec.ts fails only when both calls are gone. Meta is read with
 * `getMeta(db)` directly, not over HTTP (§2.1), reusing the reset time the proxy already
 * read (`x-last-reset-at`); a missing or malformed value falls back to the database. When it
 * fails the page renders without the reset banner (§3, "meta unavailable"). T-11: `WebMcpProvider`
 * wraps `Shell`, and `<AgentToolsStatus>` (`src/webmcp`) is passed into `src/ui`'s
 * `AgentToolsIndicatorProvider` as the two indicator slots — this is the one layer allowed to
 * import both `src/ui` and `src/webmcp` (ADR-0002; plan T-11 Decision D1), so it is where the
 * two meet, not inside either layer.
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
      <WebMcpProvider>
        <AgentToolsIndicatorProvider
          sidebar={<AgentToolsStatus variant="sidebar" />}
          compact={<AgentToolsStatus variant="compact" />}
        >
          <Shell meta={meta}>{children}</Shell>
        </AgentToolsIndicatorProvider>
      </WebMcpProvider>
    </>
  );
}
