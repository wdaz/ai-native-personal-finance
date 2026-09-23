import type { Metadata } from "next";
import { connection } from "next/server";
import { COPY } from "@/src/shared/copy";
import styles from "./not-found.module.css";

// The tab title Next's default not-found page set, kept as it was.
export const metadata: Metadata = { title: `404: ${COPY.notFound}` };

/**
 * The 404 page for every unmatched URL (T-06 plan finding F1).
 *
 * `connection()` makes `/_not-found` render per request instead of at build time. Only a
 * per-request render gets ADR-0006's CSP nonce on Next's own inline scripts and styles; the
 * prerendered default carried none, so the browser blocked all of them on every 404. The
 * markup has no `style` attributes either: a nonce covers elements, never attributes, so the
 * page is styled from a CSS Module with tokens only. tests/api/middleware.spec.ts holds both.
 */
export default async function NotFound() {
  await connection();

  return (
    <main className={styles.page}>
      <p className={styles.status}>404</p>
      <h1 className={styles.message}>{COPY.notFound}</h1>
    </main>
  );
}
