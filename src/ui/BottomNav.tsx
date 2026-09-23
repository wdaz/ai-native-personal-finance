"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./nav";
import { NavItem } from "./NavItem";
import styles from "./BottomNav.module.css";

/**
 * SPEC-app-shell §2.4: below 1024 px the five pages sit in a bar fixed to the bottom — icon and
 * label on a tablet, the icon alone on a phone, the name kept either way (plan D6).
 */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className={styles.bar}>
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => (
          <li key={item.href} className={styles.slot}>
            <NavItem {...item} active={isActive(pathname, item.href)} variant="bottom" />
          </li>
        ))}
      </ul>
    </nav>
  );
}
