"use client";

import { WebMcpTools } from "../WebMcpTools";
import { overviewTools } from "./overview";

/**
 * SPEC-webmcp-tools §2.3. `overviewTools` holds `execute` functions, which a Server Component
 * cannot pass to a Client Component as a prop — so the registry is imported here, inside the
 * client module, and the Overview layout renders this component with no props (plan F1). The
 * same shape as T-11's `AgentToolsIndicatorProvider`.
 */
export function OverviewTools() {
  return <WebMcpTools tools={overviewTools} />;
}
