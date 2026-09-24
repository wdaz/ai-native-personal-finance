import type { Theme } from "@/src/shared/enums";
import { formatMoney } from "@/src/shared/money";
import { DONUT_RADIUS, DONUT_SIZE, DONUT_STROKE, donutSegments } from "./donut-geometry";
import { themeVar } from "./theme-color";
import styles from "./Donut.module.css";

/** SPEC-overview §4.4: the inner ring sits immediately inside the outer one, 8 px wide. */
const INNER_STROKE = 8;
const INNER_RADIUS = DONUT_RADIUS - DONUT_STROKE / 2 - 4;
const INNER_SCALE = INNER_RADIUS / DONUT_RADIUS;
const CENTRE = DONUT_SIZE / 2;

/**
 * SPEC-overview §4.4: an SVG donut with an inner ring at 25 % opacity repeating the same
 * segments. `total` is the caller's own denominator (Donut-geometry.ts's own docs / T-10 plan
 * D3) — usually `budgets.limit`, all budgets, not just the ones in `items`.
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
        {segments.map((segment) => (
          <circle
            key={`inner-${segment.theme}`}
            className={styles.segment}
            cx={CENTRE}
            cy={CENTRE}
            r={INNER_RADIUS}
            stroke={`color-mix(in srgb, ${themeVar(segment.theme)} 25%, white)`}
            strokeWidth={INNER_STROKE}
            strokeDasharray={segment.strokeDasharray
              .split(" ")
              .map((n) => Number(n) * INNER_SCALE)
              .join(" ")}
            strokeDashoffset={segment.strokeDashoffset * INNER_SCALE}
          />
        ))}
        {segments.map((segment) => (
          <circle
            key={`outer-${segment.theme}`}
            className={styles.segment}
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
