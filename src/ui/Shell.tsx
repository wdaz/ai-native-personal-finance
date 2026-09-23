"use client";

import type { ReactNode } from "react";
import { COPY } from "@/src/shared/copy";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import styles from "./Shell.module.css";

export const MAIN_CONTENT_ID = "main-content";

/**
 * The frame of every authenticated page (SPEC-app-shell §2): "Skip to content" first (§2.8),
 * the desktop sidebar, the page in `<main>`, and the bottom bar below 1024 px — CSS decides
 * which bar shows, so the server renders one tree for every width. T-08 adds the reset banner
 * above the page; T-11 the WebMCP provider around it.
 */
export function Shell({ children }: { children: ReactNode }) {
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
