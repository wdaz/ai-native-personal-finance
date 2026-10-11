"use client";

import { WebMcpTools } from "../WebMcpTools";

const loadOverviewTools = () => import("./overview").then((m) => m.overviewTools);

/**
 * SPEC-webmcp-tools §2.3. The Overview tools hold `execute` functions, which a Server Component
 * cannot pass to a Client Component as a prop — so they are loaded here, inside the client
 * module, and the Overview layout renders this component with no props (plan F1). The same
 * shape as T-11's `AgentToolsIndicatorProvider`. The tools are the array `PAGE_TOOLS.overview`
 * holds (`registry.ts`, the one registry `registry.test.ts` checks against NFR-W3), imported from
 * its own module so that they load after hydration (`WebMcpTools`, TD-21).
 */
export function OverviewTools() {
  return <WebMcpTools load={loadOverviewTools} />;
}
