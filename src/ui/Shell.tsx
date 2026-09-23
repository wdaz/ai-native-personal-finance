"use client";

import { useEffect, type ReactNode } from "react";
import { COPY } from "@/src/shared/copy";
import { BottomNav } from "./BottomNav";
import { recheckSessionOnRestore } from "./session-recheck";
import { Sidebar } from "./Sidebar";
import styles from "./Shell.module.css";

export const MAIN_CONTENT_ID = "main-content";

/**
 * The frame of every authenticated page (SPEC-app-shell §2): "Skip to content" first (§2.8),
 * the desktop sidebar, the page in `<main>`, and the bottom bar below 1024 px — CSS decides
 * which bar shows, so the server renders one tree for every width. T-08 adds the reset banner
 * above the page; T-11 the WebMCP provider around it. It also re-checks the session when the
 * browser restores the page from its back/forward cache.
 */
export function Shell({ children }: { children: ReactNode }) {
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
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
