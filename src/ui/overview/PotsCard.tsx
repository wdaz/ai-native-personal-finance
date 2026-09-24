import { formatMoney } from "@/src/shared/money";
import { COPY } from "@/src/shared/copy";
import type { Theme } from "@/src/shared/enums";
import { JarIcon } from "../icons/JarIcon";
import { CardLink } from "./CardLink";
import { ThemeBar } from "./ThemeBar";
import styles from "./PotsCard.module.css";

export type PotItem = { id: string; name: string; total: number; theme: Theme };

const GRID_CELLS = 4;

/**
 * SPEC-overview §2.3, US-05: the total-saved tile and the first four pots. §2.7: with 1–3
 * pots the grid keeps its four cells and the unused ones stay blank; with none, the grid is
 * replaced by an empty-state message and a link to create one.
 */
export function PotsCard({ total, items }: { total: number; items: readonly PotItem[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className="text-preset-3">Pots</h2>
        <CardLink href="/pots" label="See Details" />
      </div>
      <div className={styles.body}>
        <div className={styles.tile}>
          <JarIcon />
          <p className={`text-preset-2 ${styles.tileValue}`}>{formatMoney(total)}</p>
          <p className={`text-preset-5 ${styles.tileLabel}`}>Total Saved</p>
        </div>
        {items.length > 0 ? (
          <ul className={styles.grid}>
            {Array.from({ length: GRID_CELLS }, (_, index) => items[index]).map((pot, index) =>
              pot ? (
                <li key={pot.id} className={styles.cell}>
                  <ThemeBar theme={pot.theme} />
                  <p className={`text-preset-5 ${styles.name}`}>{pot.name}</p>
                  <p className={`text-preset-4-bold ${styles.value}`}>{formatMoney(pot.total)}</p>
                </li>
              ) : (
                <li key={`empty-${index}`} className={styles.cell} aria-hidden="true" />
              ),
            )}
          </ul>
        ) : (
          <div className={styles.empty}>
            <p className="text-preset-4">{COPY.potsEmpty}</p>
            <a className="text-preset-4-bold" href="/pots">
              {COPY.addPot}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
