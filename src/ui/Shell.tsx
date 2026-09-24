"use client";

import { useEffect, type ReactNode } from "react";
import { COPY } from "@/src/shared/copy";
import type { MetaDto } from "@/src/shared/schemas";
import { BottomNav } from "./BottomNav";
import { ResetBanner } from "./ResetBanner";
import { recheckSessionOnRestore } from "./session-recheck";
import { Sidebar } from "./Sidebar";
import styles from "./Shell.module.css";

export const MAIN_CONTENT_ID = "main-content";

/**
 * The frame of every authenticated page (SPEC-app-shell §2): "Skip to content" first (§2.8),
 * the desktop sidebar, the page in `<main>`, and the bottom bar below 1024 px — CSS decides
 * which bar shows, so the server renders one tree for every width. The reset banner (§2.6)
 * leads the page when there is meta to show — `null` is "meta unavailable" (§3) — and hands
 * focus to `<main>` once dismissed, since the focused button is gone. `app/(app)/layout.tsx`
 * wraps this component in `WebMcpProvider` (T-11) — `Shell` itself stays free of `src/webmcp`
 * imports, per ADR-0002. It also re-checks the session when the browser restores the page
 * from its back/forward cache.
 */
export function Shell({ children, meta }: { children: ReactNode; meta: MetaDto | null }) {
  // SPEC-auth §2.9, US-03 AC1: a page restored from the back/forward cache asks whether its
  // session still exists (plan D9).
  useEffect(() => recheckSessionOnRestore(window, (path) => window.location.replace(path)), []);

  return (
    <div className={styles.shell}>
      <a href={`#${MAIN_CONTENT_ID}`} className={styles.skipLink}>
        {COPY.skipToContent}
      </a>
      <Sidebar />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main}>
        {meta ? (
          <ResetBanner
            lastResetAt={meta.lastResetAt}
            resetIntervalDays={meta.resetIntervalDays}
            onDismissed={() => document.getElementById(MAIN_CONTENT_ID)?.focus()}
          />
        ) : null}
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
