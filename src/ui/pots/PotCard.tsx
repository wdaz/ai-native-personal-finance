"use client";

import { COPY } from "@/src/shared/copy";
import { formatMoney, formatPercent } from "@/src/shared/money";
import type { PotDto } from "@/src/shared/schemas";
import { ActionMenu } from "../ActionMenu";
import { themeVar } from "../overview/theme-color";
import { ThemeSwatch } from "../ThemeSwatch";
import { TruncatedText } from "../TruncatedText";
import { AmountText } from "./AmountText";
import styles from "./PotCard.module.css";

/** A width in basis points as an SVG percentage with two decimals ("7.95%", "0%"). */
export const barWidth = (basisPoints: number): string =>
  basisPoints <= 0 ? "0%" : `${(basisPoints / 100).toFixed(2)}%`;

export type PotCardActions = {
  onEdit: (trigger: HTMLElement) => void;
  onDelete: (trigger: HTMLElement) => void;
  onAddMoney: (trigger: HTMLElement) => void;
  onWithdraw: (trigger: HTMLElement) => void;
};

/**
 * SPEC-pots 2.2 (US-21 AC1): one pot — the swatch and its name (`TruncatedText`, H12) with the
 * "…" menu, "Total Saved", the bar, the percentage and "Target of …", and the two money buttons.
 * The bar is an inline SVG whose `rect` takes `potFill` as a presentation attribute (ADR-0006: no
 * `style` attribute), `aria-hidden` — the text row says the same in words (NFR-A7). The fill is
 * capped at 100 % while the percentage shows the real value (2.3).
 */
export function PotCard({
  pot,
  fill,
  ...actions
}: {
  pot: PotDto;
  /** `potFill(total, target)`: the bar's width in basis points, capped at 100 % (2.3). */
  fill: number;
} & PotCardActions) {
  const titleId = `pot-${pot.id}-title`;
  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <div className={styles.header}>
        <div className={styles.title}>
          <ThemeSwatch theme={pot.theme} />
          <h2 id={titleId} className={`text-preset-2 ${styles.name}`}>
            <TruncatedText text={pot.name} />
          </h2>
        </div>
        <ActionMenu
          label={COPY.potOptions}
          name={pot.name}
          items={[
            { label: COPY.editPot, onSelect: actions.onEdit },
            { label: COPY.deletePot, onSelect: actions.onDelete, destructive: true },
          ]}
        />
      </div>
      <div className={styles.progress}>
        <p className={styles.row}>
          <span className={`text-preset-4 ${styles.muted}`}>{COPY.totalSaved}</span>
          <span className={`text-preset-1 ${styles.amount}`}>
            <AmountText cents={pot.total} />
          </span>
        </p>
        <div className={styles.barGroup}>
          <div className={styles.track} aria-hidden="true">
            <svg width="100%" height="100%">
              <rect
                className={styles.fill}
                x="0"
                y="0"
                height="100%"
                width={barWidth(fill)}
                fill={themeVar(pot.theme)}
              />
            </svg>
          </div>
          <p className={styles.row}>
            <span className={`text-preset-5-bold ${styles.muted}`}>
              {formatPercent(pot.percentBasisPoints)}
            </span>
            <span className={`text-preset-5 ${styles.muted} ${styles.end}`}>
              {COPY.targetOf(formatMoney(pot.target))}
            </span>
          </p>
        </div>
      </div>
      <div className={styles.buttons}>
        <button
          type="button"
          className={`text-preset-4-bold ${styles.money}`}
          aria-label={COPY.addMoneyTo(pot.name)}
          onClick={(event) => actions.onAddMoney(event.currentTarget)}
        >
          <span aria-hidden="true">+ </span>
          {COPY.addMoney}
        </button>
        <button
          type="button"
          className={`text-preset-4-bold ${styles.money}`}
          aria-label={COPY.withdrawFrom(pot.name)}
          onClick={(event) => actions.onWithdraw(event.currentTarget)}
        >
          {COPY.withdraw}
        </button>
      </div>
    </section>
  );
}
