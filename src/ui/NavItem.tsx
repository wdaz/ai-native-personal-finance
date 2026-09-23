import Link from "next/link";
import { cx } from "./cx";
import type { NavEntry } from "./nav";
import styles from "./NavItem.module.css";

export type NavItemProps = NavEntry & {
  active: boolean;
  /** `sidebar`: a row of the desktop sidebar; `bottom`: a tab of the tablet/mobile bottom bar. */
  variant: "sidebar" | "bottom";
  /** The sidebar is minimised (US-35): the label is hidden; the name and a tooltip stay. */
  collapsed?: boolean;
};

/**
 * One of the five navigation items (SPEC-app-shell §2.2, §2.4, §2.7): a client-side `<Link>`
 * with `aria-current="page"` on the current page. Its accessible name is always the label
 * (T-07 plan D6), so hiding the visible label — a minimised sidebar, a phone-width bottom bar
 * — never takes the name with it.
 */
export function NavItem({ href, label, Icon, active, variant, collapsed = false }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cx(
        styles.item,
        styles[variant],
        active && styles.active,
        collapsed && styles.collapsed,
      )}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      title={collapsed ? label : undefined}
    >
      <span className={styles.icon}>
        <Icon />
      </span>
      <span className={styles.label}>{label}</span>
    </Link>
  );
}
