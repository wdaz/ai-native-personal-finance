import type { Theme } from "@/src/shared/enums";
import styles from "./ThemeBar.module.css";

/** SPEC-overview §2.3, §2.5: the 4 px bar next to a pot or budget. No inline `style` — see the module CSS. */
export function ThemeBar({ theme }: { theme: Theme }) {
  return <span className={styles.bar} data-theme={theme} aria-hidden="true" />;
}
