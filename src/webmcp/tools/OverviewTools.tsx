"use client";

import { WebMcpTools } from "../WebMcpTools";
import { PAGE_TOOLS } from "./registry";

/**
 * SPEC-webmcp-tools §2.3. The Overview tools hold `execute` functions, which a Server Component
 * cannot pass to a Client Component as a prop — so the registry is imported here, inside the
 * client module, and the Overview layout renders this component with no props (plan F1). The
 * same shape as T-11's `AgentToolsIndicatorProvider`. The tools come from `PAGE_TOOLS`, the one
 * registry `registry.test.ts` checks against NFR-W3.
 */
export function OverviewTools() {
  return <WebMcpTools tools={PAGE_TOOLS.overview} />;
}
