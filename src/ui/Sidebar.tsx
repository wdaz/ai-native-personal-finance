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

/** The server cannot read sessionStorage; it renders the sidebar expanded (plan D5). */
const expandedOnTheServer = () => false;

/**
 * The desktop sidebar (SPEC-app-shell §2.2–2.3, ≥ 1024 px): the logo, the five pages, and the
 * footer — "Log out", then the "Minimize Menu" toggle (T-11 puts the agent-tools indicator
 * above them). Minimised (US-35) it is 88 px wide with icons only; every item keeps its name.
 */
export function Sidebar() {
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
        {collapsed ? (
          <span className={styles.indicatorCollapsed}>{indicator?.compact}</span>
        ) : (
          indicator?.sidebar
        )}
        <LogoutButton variant="sidebar" collapsed={collapsed} />
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
    </div>
  );
}
