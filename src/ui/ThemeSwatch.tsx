import type { Theme } from "@/src/shared/enums";
import { cx } from "./cx";
import styles from "./ThemeSwatch.module.css";

/**
 * SPEC-ui-kit 2.10: a 16 px circle in a theme's colour, through a `data-theme` selector per theme
 * as `ThemeBar` does — never an inline `style` (ADR-0006). Decorative: the theme's name is always
 * written beside it, so a theme is never told by colour alone (NFR-A7). An "Already used"
 * option's swatch is drawn at `var(--opacity-unavailable)` (2.6).
 */
export function ThemeSwatch({
  theme,
  unavailable = false,
}: {
  theme: Theme;
  unavailable?: boolean;
}) {
  return (
    <span
      className={cx(styles.swatch, unavailable && styles.unavailable)}
      data-theme={theme}
      aria-hidden="true"
    />
  );
}
