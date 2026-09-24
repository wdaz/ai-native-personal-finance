import { formatMoney } from "@/src/shared/money";
import { cx } from "../cx";
import styles from "./StatCard.module.css";

/** SPEC-overview §2.2: "Current Balance" is dark (grey-900/white); Income/Expenses are light. */
export function StatCard({
  label,
  cents,
  variant,
}: {
  label: string;
  cents: number;
  variant: "dark" | "light";
}) {
  return (
    <div className={cx(styles.card, variant === "dark" && styles.dark)}>
      <p className="text-preset-4">{label}</p>
      <p className={`text-preset-2 ${styles.value}`}>{formatMoney(cents)}</p>
    </div>
  );
}
