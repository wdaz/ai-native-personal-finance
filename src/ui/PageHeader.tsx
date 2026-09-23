import { LogoutButton } from "./LogoutButton";
import styles from "./PageHeader.module.css";

/**
 * SPEC-app-shell §2.5: every app page's header — its name as the page's `<h1>` (text preset 1;
 * the page's `metadata.title` is the same name). Below 1024 px the sidebar is gone and its
 * footer actions sit here (§2.4): "Log out" as an icon button; T-11 adds the agent-tools dot
 * before it. `primaryAction` arrives with Release 2's first page that has one (plan D21).
 */
export function PageHeader({ title }: { title: string }) {
  return (
    <div className={styles.header}>
      <h1 className={`text-preset-1 ${styles.title}`}>{title}</h1>
      <div className={styles.compactActions}>
        <LogoutButton variant="icon" />
      </div>
    </div>
  );
}
