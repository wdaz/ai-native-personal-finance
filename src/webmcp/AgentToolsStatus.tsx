"use client";

import { COPY } from "@/src/shared/copy";
import { useWebMcpStatus, type WebMcpStatus } from "./status-context";
import styles from "./AgentToolsStatus.module.css";

/** SPEC-webmcp-tools §2.7's own `title` column, written verbatim — not a `COPY` addition (the
 * copy appendix's "Agent tools indicator" row already defers them here, plan Global Constraints). */
const TITLE: Record<WebMcpStatus["mode"], string> = {
  checking: "Detecting WebMCP support",
  native: "WebMCP is supported natively by this browser",
  polyfill: "Provided by a polyfill; no built-in agent yet",
  unavailable: "WebMCP is disabled or could not load",
};

function statusText(status: WebMcpStatus): string {
  if (status.mode === "checking") return COPY.agentToolsChecking;
  if (status.mode === "native") return COPY.agentToolsNative(status.count);
  if (status.mode === "polyfill") return COPY.agentToolsPolyfill(status.count);
  return COPY.agentToolsUnavailable;
}

/**
 * SPEC-webmcp-tools §2.7, US-41: the four-state indicator. `sidebar` (desktop, ≥ 1024 px) shows
 * the full text in the sidebar footer, above "Log out" (plan D1 — rendered here, in
 * `src/webmcp`, and handed to `src/ui/Sidebar.tsx` through a `ReactNode` slot so `src/ui`
 * itself never imports this module). `compact` (tablet/mobile, the page header) is a dot whose
 * only state-carrying content is its accessible name — no per-state colour, since neither the
 * spec nor design-tokens.md names one and the design HTML exports this task would otherwise
 * check are gone from the checkout (plan D5, T-16).
 *
 * Both variants set `aria-label` explicitly rather than relying on visible content: the ARIA
 * `status` role does not compute its accessible name from content (unlike, say, a `button`), so
 * without it the name would silently fall back to `title` instead of the live text — caught by
 * this task's own component test, not by the spec text.
 */
export function AgentToolsStatus({ variant }: { variant: "sidebar" | "compact" }) {
  const status = useWebMcpStatus();
  const text = statusText(status);
  const title = TITLE[status.mode];

  if (variant === "compact") {
    return (
      <span
        role="status"
        aria-live="polite"
        aria-label={text}
        title={title}
        className={styles.dot}
      />
    );
  }

  return (
    <div role="status" aria-live="polite" aria-label={text} title={title} className={styles.row}>
      <span aria-hidden="true" className={styles.dot} />
      <span aria-hidden="true" className={styles.text}>
        {text}
      </span>
    </div>
  );
}
