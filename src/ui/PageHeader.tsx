"use client";

import { useAgentToolsIndicator } from "./agent-tools-indicator";
import { LogoutButton } from "./LogoutButton";
import styles from "./PageHeader.module.css";

/**
 * SPEC-app-shell §2.5: every app page's header — its name as the page's `<h1>` (text preset 1;
 * the page's `metadata.title` is the same name). Below 1024 px the sidebar is gone and its
 * footer actions sit here (§2.4): the agent-tools dot before "Log out" (T-11). `primaryAction`
 * arrives with Release 2's first page that has one (plan D21). `"use client"`: reading the
 * indicator slot needs `useContext` (T-11) — every page still renders this from a Server
 * Component, which Next.js composes with a Client Component the same as any other.
 */
export function PageHeader({ title }: { title: string }) {
  const indicator = useAgentToolsIndicator();
  return (
    <div className={styles.header}>
      <h1 className={`text-preset-1 ${styles.title}`}>{title}</h1>
      <div className={styles.compactActions}>
        {indicator?.compact}
        <LogoutButton variant="icon" />
      </div>
    </div>
  );
}
