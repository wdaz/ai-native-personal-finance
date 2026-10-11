"use client";

import { useEffect } from "react";
import { register, unregisterAll } from "./adapter";
import type { ToolDefinition } from "./types";

/**
 * Loads one page's tools. A page passes a function that `import()`s its `tools/<page>.ts`, so the
 * tool modules — and the Zod schemas they are built from — are a chunk of their own, fetched after
 * hydration rather than in the page's first-load JavaScript (SPEC-webmcp-tools §2.2: nothing of
 * WebMCP blocks first paint; TD-21: Lighthouse counted that chunk against `/transactions`' LCP).
 */
export type LoadTools = () => Promise<ToolDefinition[]>;

/**
 * SPEC-webmcp-tools §2.3: one page's own tool registry, rendered from that page's client
 * layout. Registers on mount, unregisters on unmount — leaving the page (a client navigation
 * away, SPEC §2.3/§7) unmounts this component and drops its tools; a page left before its tools
 * have loaded registers none. `load` should be a stable function (module-level, or memoised per
 * router) rather than a literal built fresh each render, so this effect does not re-run on every
 * re-render of the page around it.
 */
export function WebMcpTools({ load }: { load: LoadTools }) {
  useEffect(() => {
    let mounted = true;
    load().then(
      (tools) => {
        if (mounted) void register(tools);
      },
      (error: unknown) => {
        // A chunk that fails to load (offline, or a stale chunk after a deployment) leaves the page
        // without tools and `data-webmcp` unset until the next navigation mounts this again.
        if (mounted)
          console.warn("[webmcp] the page's tools failed to load; none are registered", error);
      },
    );
    return () => {
      mounted = false;
      unregisterAll();
    };
  }, [load]);

  return null;
}
