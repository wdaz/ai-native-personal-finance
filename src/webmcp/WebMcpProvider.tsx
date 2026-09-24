"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getModelContext, onStatus } from "./adapter";
import { INITIAL_WEBMCP_STATUS, WebMcpStatusContext, type WebMcpStatus } from "./status-context";

/**
 * SPEC-webmcp-tools §2.3: mounted once in `app/(app)/layout.tsx`, owns the adapter's lifecycle
 * and the indicator's status. Seeds `"checking"`/0 identically on the server and before
 * hydration (`getModelContext()` only ever runs from this effect, never during render, so SSR
 * output and the first client render match); `onStatus` then drives every later update —
 * detection settling, and each completed `register()`/`unregisterAll()` changing the tool
 * count. Nothing here renders the indicator itself: `app/(app)/layout.tsx` composes
 * `<AgentToolsStatus>` into `src/ui`'s slot context (plan D1) as a sibling concern.
 */
export function WebMcpProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WebMcpStatus>(INITIAL_WEBMCP_STATUS);

  useEffect(() => {
    const unsubscribe = onStatus(({ mode, count }) => {
      setStatus({ mode: mode ?? "checking", count });
    });
    void getModelContext();
    return unsubscribe;
  }, []);

  return <WebMcpStatusContext value={status}>{children}</WebMcpStatusContext>;
}
