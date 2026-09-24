import type { ToolDefinition } from "../types";
import { overviewTools } from "./overview";

/**
 * SPEC-webmcp-tools §3–§4: one registry per page (ADR-0004). Release 2 adds a key per page;
 * `tests/unit/webmcp/registry.test.ts` iterates this object, so a new tool is checked
 * against NFR-W3 without being listed anywhere else.
 */
export const PAGE_TOOLS = {
  overview: overviewTools,
} as const satisfies Record<string, ToolDefinition[]>;
