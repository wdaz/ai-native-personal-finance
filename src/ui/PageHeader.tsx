"use client";

import type { ReactNode, Ref } from "react";
import { useAgentToolsIndicator } from "./agent-tools-indicator";
import { Button } from "./Button";
import { LogoutButton } from "./LogoutButton";
import styles from "./PageHeader.module.css";

/**
 * SPEC-app-shell §2.5: every app page's header — its name as the page's `<h1>` (text preset 1;
 * the page's `metadata.title` is the same name). Below 1024 px the sidebar is gone and its
 * footer actions sit here (§2.4): the agent-tools dot before "Log out" (T-11). `"use client"`:
 * reading the indicator slot needs `useContext` (T-11) — every page still renders this from a
 * Server Component, which Next.js composes with a Client Component the same as any other.
 *
 * SPEC-ui-kit 2.8 (T-22): `primaryAction` — a page's client button ("+ Add New Budget") — comes
 * first in the actions, and stays at 1024 px and up, where the indicator and "Log out" are hidden.
 * When the title and the actions do not fit on one line, the actions wrap to a second line,
 * right-aligned (UI-5, the designer's changelog §21e). A page leaves it out in its error state.
 */
export function PageHeader({ title, primaryAction }: { title: string; primaryAction?: ReactNode }) {
  const indicator = useAgentToolsIndicator();
  return (
    <div className={styles.header}>
      <h1 className={`text-preset-1 ${styles.title}`}>{title}</h1>
      <div className={styles.actions}>
        {primaryAction}
        <div className={styles.compactActions}>
          {indicator?.compact}
          <LogoutButton variant="icon" />
        </div>
      </div>
    </div>
  );
}

/**
 * SPEC-ui-kit 2.8: the header's add button — `Button` fitting its text; the "+" is drawn
 * `aria-hidden`, so the name ("Add New Budget") is the visible label without it (WCAG 2.5.3).
 */
export function HeaderAddButton({
  label,
  onClick,
  buttonRef,
}: {
  label: string;
  onClick: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <Button fit ref={buttonRef} onClick={onClick}>
      <span aria-hidden="true">+&nbsp;</span>
      {label}
    </Button>
  );
}
