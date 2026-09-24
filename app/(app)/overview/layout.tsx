import type { ReactNode } from "react";
import { OverviewTools } from "@/src/webmcp/tools/OverviewTools";

/**
 * SPEC-webmcp-tools §2.3: tools are page-scoped (R-23). This layout belongs to the `overview`
 * segment only, so React unmounts `<OverviewTools />` — and its cleanup unregisters the tools —
 * when the visitor navigates to another page, and mounts it again on the way back.
 */
export default function OverviewLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <OverviewTools />
    </>
  );
}
