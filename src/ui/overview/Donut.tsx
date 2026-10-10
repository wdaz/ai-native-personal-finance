import { donutCentreFit } from "@/src/shared/budgets";
import type { Theme } from "@/src/shared/enums";
import { formatMoney } from "@/src/shared/money";
import { DONUT_RADIUS, DONUT_SIZE, DONUT_STROKE, donutSegments } from "./donut-geometry";
import { themeVar } from "./theme-color";
import styles from "./Donut.module.css";

/**
 * SPEC-overview §4.4 v1.3 (H18): the inner ring sits flush inside the outer one, 12 px wide,
 * at radius 78 (96 - 24/2 - 12/2).
 */
const INNER_STROKE = 12;
const INNER_RADIUS = DONUT_RADIUS - DONUT_STROKE / 2 - INNER_STROKE / 2;
const INNER_SCALE = INNER_RADIUS / DONUT_RADIUS;
const CENTRE = DONUT_SIZE / 2;

/**
 * SPEC-overview §4.4: an SVG donut with an inner ring repeating the same segments in each
 * theme colour at 75 % opacity (v1.3, H18 / S45-5 (b); the opacity lives in the CSS).
 * `total` is the caller's own denominator (`donut-geometry.ts`'s own docs / T-10 plan D3) —
 * usually `budgets.limit`, all budgets, not just the ones in `items`.
 */
export function Donut({
  items,
  total,
  spent,
  fitCentre = false,
}: {
  items: readonly { theme: Theme; maximum: number }[];
  total: number;
  spent: number;
  /**
   * SPEC-budgets 2.3 (BU-11 (A), the designer's changelog §24a, §25d, §31a): the Budgets page's
   * opt-in — the spent total steps down through the presets to fit the hole and the limit line
   * breaks, by `donutCentreFit`'s table, chosen in this render (BU-Q9 (a)). Off on Overview.
   */
  fitCentre?: boolean;
}) {
  const segments = donutSegments(items, total);
  const seen = new Map<string, number>();
  const keys = segments.map(({ theme }) => {
    const occurrence = seen.get(theme) ?? 0;
    seen.set(theme, occurrence + 1);
    return `${theme}-${occurrence}`;
  });
  const spentText = formatMoney(spent);
  const limitText = formatMoney(total);
  const label = `Spent ${spentText} of ${limitText} limit`;
  const fit = fitCentre ? donutCentreFit(spentText, limitText) : null;

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
        width={DONUT_SIZE}
        height={DONUT_SIZE}
        role="img"
        aria-label={label}
      >
        <circle className={styles.ring} cx={CENTRE} cy={CENTRE} r={DONUT_RADIUS} />
        {segments.map((segment, index) => (
          // Keyed by theme (with its occurrence, should two ever share one), so a segment keeps
          // its element when a budget before it goes: its colour never jumps while its arc
          // animates (SPEC-budgets 2.3, BU-Q7 (a); T-24 review finding 4).
          <circle
            key={`inner-${keys[index]}`}
            className={styles.innerSegment}
            cx={CENTRE}
            cy={CENTRE}
            r={INNER_RADIUS}
            stroke={themeVar(segment.theme)}
            strokeWidth={INNER_STROKE}
            strokeDasharray={segment.strokeDasharray
              .split(" ")
              .map((n) => Number(n) * INNER_SCALE)
              .join(" ")}
            strokeDashoffset={segment.strokeDashoffset * INNER_SCALE}
          />
        ))}
        {segments.map((segment, index) => (
          <circle
            key={`outer-${keys[index]}`}
            className={styles.outerSegment}
            cx={CENTRE}
            cy={CENTRE}
            r={DONUT_RADIUS}
            stroke={themeVar(segment.theme)}
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
          />
        ))}
      </svg>
      {fit === null ? (
        <div className={styles.centre}>
          <p className={`text-preset-1 ${styles.spent}`}>{spentText}</p>
          <p className={`text-preset-5 ${styles.limit}`}>of {limitText} limit</p>
        </div>
      ) : (
        <div className={`${styles.centre} ${styles.fit}`} data-limit-lines={fit.limitLines}>
          <p className={`${fit.spentPreset} ${styles.spent} ${styles.whole}`}>{spentText}</p>
          <p className={`text-preset-5 ${styles.limit}`}>
            {fit.limitLines === 1 ? (
              <span className={styles.whole}>of {limitText} limit</span>
            ) : fit.limitLines === 2 ? (
              <>
                <span className={styles.line}>of {limitText}</span>
                <span className={styles.line}>limit</span>
              </>
            ) : (
              <>
                <span className={styles.line}>of</span>
                <span className={styles.line}>{limitText}</span>
                <span className={styles.line}>limit</span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
