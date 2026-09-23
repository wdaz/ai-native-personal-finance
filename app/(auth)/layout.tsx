import { connection } from "next/server";
import type { ReactNode } from "react";
import { LogoLarge } from "@/src/ui/Logo";
import styles from "./layout.module.css";

/**
 * SPEC-auth §6: from 1024 px an illustration panel (logo, headline, body copy) beside the
 * page's card; below 1024 px a logo bar above it. `connection()` renders every response per
 * request (ADR-0006, 2026-09-23 (2)): Next then puts this response's CSP nonce on its inline
 * scripts and styles. A prerendered page carries none, the CSP blocks its scripts, and the
 * forms never hydrate — tests/api/auth-pages.spec.ts pins it.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  await connection();
  return (
    <div className={styles.root}>
      <header className={styles.logoBar}>
        <LogoLarge />
      </header>
      <div className={styles.panelFrame}>
        <aside className={styles.panel}>
          <LogoLarge />
          <div className={styles.panelCopy}>
            <p className={`text-preset-1 ${styles.headline}`}>
              Keep track of your money and save for your future
            </p>
            <p className={`text-preset-4 ${styles.body}`}>
              Personal finance app puts you in control of your spending. Track transactions, set
              budgets, and add to savings pots easily.
            </p>
          </div>
        </aside>
      </div>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
