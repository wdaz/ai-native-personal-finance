"use client";

import { useEffect } from "react";
import { register, unregisterAll } from "./adapter";
import type { ToolDefinition } from "./types";

/**
 * SPEC-webmcp-tools §2.3: one page's own tool registry, rendered from that page's client
 * layout. Registers on mount, unregisters on unmount — leaving the page (a client navigation
 * away, SPEC §2.3/§7) unmounts this component and drops its tools. `tools` should be the
 * stable array `tools/<page>.ts` exports (module-eval time, T-12) rather than a literal built
 * fresh each render, so this effect does not re-run on every re-render of the page around it.
 */
export function WebMcpTools({ tools }: { tools: ToolDefinition[] }) {
  useEffect(() => {
    void register(tools);
    return unregisterAll;
  }, [tools]);

  return null;
}
