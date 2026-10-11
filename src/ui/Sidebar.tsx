"use client";

import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { COPY } from "@/src/shared/copy";
import { TEST_IDS } from "@/src/shared/test-ids";
import { useAgentToolsIndicator } from "./agent-tools-indicator";
import { cx } from "./cx";
import { MinimizeMenuIcon } from "./icons/MinimizeMenuIcon";
import { LogoLarge, LogoSmall } from "./Logo";
import { LogoutButton } from "./LogoutButton";
import { NAV_ITEMS, isActive } from "./nav";
import { NavItem } from "./NavItem";
import { readSidebarCollapsed, subscribeSidebar, writeSidebarCollapsed } from "./sidebar-state";
import styles from "./Sidebar.module.css";
import controls from "./SidebarControl.module.css";

/** SPEC-app-shell §2.2 — spec text, like "Log out" and the navigation labels (T-07 plan D3). */
const SIGNED_IN_AS = "Signed in as";

/** The server cannot read sessionStorage; it renders the sidebar expanded (plan D5). */
const expandedOnTheServer = () => false;

/**
 * The desktop sidebar (SPEC-app-shell §2.2–2.3, ≥ 1024 px): the logo, the five pages, the
 * footer — the agent-tools indicator (T-11), then the "Minimize Menu" toggle — and, below a
 * divider, the account row: "Signed in as" the demo email, and the "Log out" icon button (design
 * changelog §35). Minimised (US-35) it is 88 px wide with icons only; every item keeps its name.
 */
export function Sidebar({ accountEmail }: { accountEmail: string | null }) {
  const pathname = usePathname();
  const indicator = useAgentToolsIndicator();
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    readSidebarCollapsed,
    expandedOnTheServer,
  );
  const [animate, setAnimate] = useState(false);

  function toggle() {
    setAnimate(true);
    writeSidebarCollapsed(!collapsed);
  }

  return (
    <div
      data-testid={TEST_IDS.sidebar}
      className={cx(styles.sidebar, collapsed && styles.collapsed, animate && styles.animated)}
    >
      <div className={styles.logo}>{collapsed ? <LogoSmall /> : <LogoLarge />}</div>
      <nav aria-label="Main" className={styles.nav}>
        <ul className={styles.list}>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavItem
                {...item}
                active={isActive(pathname, item.href)}
                variant="sidebar"
                collapsed={collapsed}
              />
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.footer}>
        {collapsed ? indicator?.rail : indicator?.sidebar}
        <button
          type="button"
          className={controls.control}
          aria-expanded={!collapsed}
          aria-label={collapsed ? COPY.expandMenu : COPY.minimizeMenu}
          title={collapsed ? COPY.expandMenu : undefined}
          onClick={toggle}
        >
          <span className={cx(controls.icon, collapsed && controls.flipped)}>
            <MinimizeMenuIcon />
          </span>
          {collapsed ? null : <span>{COPY.minimizeMenu}</span>}
        </button>
      </div>
      <div className={styles.account}>
        <div role="separator" className={styles.separator} />
        <div className={styles.accountRow}>
          {collapsed ? null : (
            <div className={styles.identity}>
              <span className={styles.signedInAs}>{SIGNED_IN_AS}</span>
              <span className={styles.email} title={accountEmail ?? undefined}>
                {accountEmail}
              </span>
            </div>
          )}
          <LogoutButton variant="account" />
        </div>
      </div>
    </div>
  );
}
