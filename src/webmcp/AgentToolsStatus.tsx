"use client";

import type { AriaRole, ReactNode } from "react";
import { COPY } from "@/src/shared/copy";
import { useWebMcpStatus, type WebMcpStatus } from "./status-context";
import { RobotIcon } from "./RobotIcon";
import styles from "./AgentToolsStatus.module.css";

function statusText(status: WebMcpStatus): string {
  if (status.mode === "checking") return COPY.agentToolsChecking;
  if (status.mode === "native") return COPY.agentToolsNative(status.count);
  if (status.mode === "polyfill") return COPY.agentToolsPolyfill(status.count);
  return COPY.agentToolsUnavailable;
}

/**
 * The tooltip the indicator sits in — `src/ui`'s `TruncatedText` with `always`, handed in by
 * `app/(app)/layout.tsx`, the one layer that imports both (ADR-0002: this folder imports only
 * `shared`). Without one (a unit test) the indicator is the same element with no tooltip.
 */
export type IndicatorTip = (props: {
  text: string;
  className?: string;
  always?: boolean;
  role?: AriaRole;
  "aria-label"?: string;
  "aria-live"?: "polite";
  children?: ReactNode;
}) => ReactNode;

/**
 * SPEC-webmcp-tools §2.7, US-41: the four-state indicator, in three shapes (design changelog
 * §37, §38) — `sidebar` (desktop, ≥ 1024 px): the robot icon and the full text in the sidebar
 * footer, above "Minimize Menu"; `rail`: the icon alone while the sidebar is minimised;
 * `compact` (tablet/mobile, the page header): the icon and the tool count, with no count while
 * the state is `checking` or `unavailable`. Each is a focus stop and shows the full text as a
 * tooltip on hover, focus or tap. All are rendered here, in `src/webmcp`, and handed to
 * `src/ui` through `ReactNode` slots so `src/ui` itself never imports this module (plan D1).
 *
 * Every shape sets `aria-label` explicitly rather than relying on visible content: the ARIA
 * `status` role does not compute its accessible name from content (unlike, say, a `button`), so
 * without it the name would silently fall back to the live text's absence — and the compact
 * shape has only a count. The tooltip replaces §2.7's old `title` column (the explanation of each
 * state): the design draws the full text there instead (changelog §37), and a native `title`
 * would stack a second tooltip on it.
 */
export function AgentToolsStatus({
  variant,
  Tip,
}: {
  variant: "sidebar" | "rail" | "compact";
  Tip?: IndicatorTip;
}) {
  const status = useWebMcpStatus();
  const text = statusText(status);
  const showsCount = status.mode === "native" || status.mode === "polyfill";

  const content =
    variant === "compact" ? (
      <span className={styles.compact}>
        <span aria-hidden="true" className={styles.icon}>
          <RobotIcon />
        </span>
        {showsCount ? (
          <span aria-hidden="true" className={styles.count}>
            {status.count}
          </span>
        ) : null}
        {/* A live region announces changed content, not its name: the full text goes with it. */}
        <span className={styles.visuallyHidden}>{text}</span>
      </span>
    ) : (
      <span className={styles.row}>
        <RobotIcon />
        {variant === "sidebar" ? (
          <span aria-hidden="true" className={styles.text}>
            {text}
          </span>
        ) : null}
      </span>
    );
  const rootClass = variant === "compact" ? styles.compactRoot : styles.sidebarRoot;

  if (Tip === undefined) {
    return (
      <span role="status" aria-live="polite" aria-label={text} tabIndex={0} className={rootClass}>
        {content}
      </span>
    );
  }
  return (
    <Tip
      text={text}
      always
      role="status"
      aria-live="polite"
      aria-label={text}
      className={rootClass}
    >
      {content}
    </Tip>
  );
}
