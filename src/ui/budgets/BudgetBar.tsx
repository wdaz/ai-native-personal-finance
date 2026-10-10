import { budgetFillPercent } from "@/src/shared/budgets";
import type { Theme } from "@/src/shared/enums";
import { themeVar } from "../overview/theme-color";
import styles from "./BudgetBar.module.css";

/**
 * SPEC-budgets 2.4 (US-14 AC1, AC2): a beige-100 track with a fill in the theme colour as wide as
 * `budgetFillPercent(spent, maximum)` %, capped at 100. Decorative: Spent and Remaining say it in
 * text. ADR-0006's `style-src` blocks a `style` attribute, so the fill is an inline SVG whose
 * `rect` takes the width as a presentation attribute; SVG 2 makes it a CSS property, so the CSS
 * transition (`--duration-progress`, BU-Q7 (a)) moves it after a write.
 */
export function BudgetBar({
  spent,
  maximum,
  theme,
}: {
  spent: number;
  maximum: number;
  theme: Theme;
}) {
  const percent = budgetFillPercent(spent, maximum);
  return (
    <div className={styles.track} aria-hidden="true">
      <svg className={styles.svg} width="100%" height="24" focusable="false">
        <rect
          className={styles.fill}
          width={`${percent}%`}
          height="24"
          rx="4"
          fill={themeVar(theme)}
        />
      </svg>
    </div>
  );
}
