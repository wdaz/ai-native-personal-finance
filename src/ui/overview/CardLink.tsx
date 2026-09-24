import styles from "./CardLink.module.css";

/**
 * A card's "See Details ›" / "View All ›" link (SPEC-overview §2.3, §2.4, §2.5, §2.6). The
 * caret is literal text, part of the accessible name (T-10 plan D4 — the spec writes the
 * labels with `›` as plain text; no design source ties a card link to a Phosphor icon).
 */
export function CardLink({ href, label }: { href: string; label: string }) {
  return (
    <a className={`text-preset-4-bold ${styles.link}`} href={href}>
      {label} ›
    </a>
  );
}
