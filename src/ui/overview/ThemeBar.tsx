import type { Theme } from "@/src/shared/enums";
import styles from "./ThemeBar.module.css";

/**
 * SPEC-overview §2.3, §2.5: the 4 px bar next to a pot or budget. No inline `style` — see the
 * module CSS. `stretch` (SPEC-budgets 2.3, 2.4): as tall as its row, where the bar is otherwise
 * `--spacing-200` tall — the Budgets summary rows and the Spent/Remaining blocks.
 */
export function ThemeBar({ theme, stretch = false }: { theme: Theme; stretch?: boolean }) {
  return (
    <span
      className={stretch ? `${styles.bar} ${styles.stretch}` : styles.bar}
      data-theme={theme}
      aria-hidden="true"
    />
  );
}
