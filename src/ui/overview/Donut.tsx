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
}: {
  items: readonly { theme: Theme; maximum: number }[];
  total: number;
  spent: number;
}) {
  const segments = donutSegments(items, total);
  const label = `Spent ${formatMoney(spent)} of ${formatMoney(total)} limit`;

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
          // Keyed by array index, not `segment.theme`: two budgets could in principle share a
          // theme (nothing here enforces US-15 AC1's "used themes disabled" rule), and a theme
          // string is not a stable per-segment identity the way the array's own order is.
          <circle
            key={`inner-${index}`}
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
            key={`outer-${index}`}
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
      <div className={styles.centre}>
        <p className={`text-preset-1 ${styles.spent}`}>{formatMoney(spent)}</p>
        <p className={`text-preset-5 ${styles.limit}`}>of {formatMoney(total)} limit</p>
      </div>
    </div>
  );
}
