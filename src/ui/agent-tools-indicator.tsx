"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * A plain slot for whatever `app/(app)/layout.tsx` puts in it — no WebMCP knowledge here
 * (ADR-0002: `src/ui` may not import `src/webmcp`). `app/(app)/layout.tsx` is the one layer
 * allowed to import both `src/ui` and `src/webmcp` (plan T-11, Decision D1); it renders
 * `<AgentToolsStatus>` (`src/webmcp`) into these two slots, via `AgentToolsIndicatorProvider`
 * below, and `Sidebar`/`PageHeader` place whatever they receive without knowing what it is.
 *
 * The context object itself stays private to this module. A Server Component may render this
 * file's exported *components* (`AgentToolsIndicatorProvider`, and — through `Sidebar`/
 * `PageHeader` — the consumer hook indirectly), but reading a property such as `.Provider` off
 * a context value imported from a `"use client"` module into server code does not cross the
 * boundary the way rendering a component does: it read as `undefined` here (React error #130,
 * caught running this task's own smoke check against a real login → Overview session — not
 * caught by any unit test, since jsdom component tests never cross an RSC boundary). Wrapping
 * the `.Provider` usage in a real component, entirely inside this client module, is the
 * standard fix (the same shape `WebMcpProvider` already uses for its own context).
 */
export interface AgentToolsIndicatorSlots {
  sidebar: ReactNode;
  compact: ReactNode;
}

const AgentToolsIndicatorContext = createContext<AgentToolsIndicatorSlots | null>(null);

export function AgentToolsIndicatorProvider({
  sidebar,
  compact,
  children,
}: AgentToolsIndicatorSlots & { children: ReactNode }) {
  return (
    <AgentToolsIndicatorContext value={{ sidebar, compact }}>{children}</AgentToolsIndicatorContext>
  );
}

export function useAgentToolsIndicator(): AgentToolsIndicatorSlots | null {
  return useContext(AgentToolsIndicatorContext);
}
