import type { ReactNode } from "react";
import { PotsTools } from "@/src/webmcp/tools/PotsTools";

/**
 * SPEC-pots 2.1, SPEC-webmcp-tools §2.3: the Pots segment's own layout, so the six tools are
 * registered on this page only and unregistered when the visitor leaves.
 */
export default function PotsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PotsTools />
    </>
  );
}
