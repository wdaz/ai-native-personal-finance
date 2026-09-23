"use client";

import { useState } from "react";
import { COPY } from "@/src/shared/copy";
import styles from "./DemoBox.module.css";

type Row = { label: string; value: string; copyName: string };

/**
 * SPEC-auth §2.2, §4: the demo account from env, with a Copy button per value. A failed copy
 * (no Clipboard API, permission denied) says so in a status region next to its button until
 * that button copies successfully (plan D17); the value is selectable in one click.
 */
export function DemoBox({ email, password }: { email: string; password: string }) {
  const rows: Row[] = [
    { label: "Email", value: email, copyName: "Copy demo email" },
    { label: "Password", value: password, copyName: "Copy demo password" },
  ];
  return (
    <section className={styles.box} aria-labelledby="demo-account-title">
      <h2 id="demo-account-title" className={`text-preset-4-bold ${styles.title}`}>
        Demo account
      </h2>
      <dl className={styles.rows}>
        {rows.map((row) => (
          <DemoRow key={row.copyName} {...row} />
        ))}
      </dl>
    </section>
  );
}

function DemoRow({ label, value, copyName }: Row) {
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>
        <span className={styles.text}>{value}</span>
        <button type="button" className={styles.copy} aria-label={copyName} onClick={copy}>
          Copy
        </button>
        <span role="status" className={styles.tooltip}>
          {failed ? COPY.copyFailed : ""}
        </span>
      </dd>
    </div>
  );
}
