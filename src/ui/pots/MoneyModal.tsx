"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { COPY } from "@/src/shared/copy";
import { formatMoney, formatPercent, parseAmountInput } from "@/src/shared/money";
import type { ErrorIssue, PotDto } from "@/src/shared/schemas";
import { AMOUNT_MESSAGES, type WriteAnswer } from "@/src/shared/write-feedback";
import { AmountField } from "../AmountField";
import { FormFooter } from "../FormFooter";
import { Modal } from "../Modal";
import { reloadPage } from "../reload";
import { AmountText } from "./AmountText";
import { barWidth } from "./PotCard";
import styles from "./MoneyModal.module.css";

/** The answers after which the modal is done: the page closes it (a 200) or shows the notice (a 404). */
/** SPEC-pots 2.6: an addition or a withdrawal. */
export type MoneyMoveKind = "add" | "withdraw";

/** What `moneyPreview` (`src/domain/pots.ts`) returns, which the page hands in (ADR-0002). */
export type MoneyPreviewValues = {
  newTotal: number;
  staying: number;
  moving: number;
  percent: number;
};

export type MoneyDone = Extract<WriteAnswer<unknown>, { kind: "ok" | "gone" }>;

export type MoneyModalProps = {
  /** The pot and the move; `null` when closed. */
  move: { kind: MoneyMoveKind; pot: PotDto } | null;
  /** The Current Balance the page last read (2.8). */
  balance: number;
  /** `moneyPreview(pot, kind, amount, balance)`; `amount` is `null` for text that reads as none. */
  preview: (amount: number | null) => MoneyPreviewValues;
  onClose: () => void;
  /** The page's write function: `POST /api/pots/:id/deposit` or `…/withdraw` with the cents. */
  onSubmit: (amount: number) => Promise<WriteAnswer<unknown>>;
  /** A 200 or a 404: the page closes the modal and refreshes (or shows the notice). */
  onDone: (answer: MoneyDone) => void;
  /** A 400 that shows the page's data is old (`exceeds_*`): the page refreshes, the modal stays. */
  onStale: () => void;
  returnFocus?: () => HTMLElement | null;
};

const TEXT = {
  add: {
    title: COPY.addToPotTitle,
    description: COPY.addMoneyDescription,
    label: COPY.amountToAdd,
    submit: COPY.confirmAddition,
  },
  withdraw: {
    title: COPY.withdrawFromPotTitle,
    description: COPY.withdrawDescription,
    label: COPY.amountToWithdraw,
    submit: COPY.confirmWithdrawal,
  },
} as const;

/** The server's codes for `amount` as the field's messages (`write-path.md` 2.7, SPEC-pots 2.6). */
const SERVER_MESSAGES: Record<string, string> = {
  required: COPY.required,
  invalid_format: COPY.amountFormat,
  too_small: COPY.amountNotPositive,
  too_large: COPY.amountTooLarge,
  exceeds_balance: COPY.depositOverBalance,
  exceeds_total: COPY.withdrawalOverTotal,
};

/**
 * SPEC-pots 2.6: the amount field's check — `parseAmountInput`'s four messages first, then the
 * page's rule: an addition above the balance, a withdrawal above the pot's total (PO-Q2 (a): at a
 * $0.00 balance every amount that passes the four is refused with the balance message). An amount
 * equal to the limit is allowed.
 */
export function checkMoveAmount(
  text: string,
  kind: MoneyMoveKind,
  pot: { total: number },
  balance: number,
): { cents: number; message?: undefined } | { cents?: undefined; message: string } {
  const parsed = parseAmountInput(text);
  if (!parsed.ok) return { message: AMOUNT_MESSAGES[parsed.code] };
  if (kind === "add" && parsed.cents > balance) return { message: COPY.depositOverBalance };
  if (kind === "withdraw" && parsed.cents > pot.total) {
    return { message: COPY.withdrawalOverTotal };
  }
  return { cents: parsed.cents };
}

/**
 * SPEC-pots 2.6 (US-25, US-26): "Add to ‘{name}’" and "Withdraw from ‘{name}’" — the preview (New
 * Amount, a two-segment bar, the new percentage and "Target of …"), then the amount field and the
 * submit. The preview follows the typed text (the `input` events that bubble to the form) and
 * clamps as the design clamps; it shows no message and is not a live region. The field is checked
 * on blur and on submit (Release 1's timing, UK-Q9 (a)).
 */
export function MoneyModal({ move, ...props }: MoneyModalProps) {
  return move === null ? null : (
    <MoneyModalOpen key={move.pot.id + move.kind} move={move} {...props} />
  );
}

function MoneyModalOpen({
  move: { kind, pot },
  balance,
  preview: previewOf,
  onClose,
  onSubmit,
  onDone,
  onStale,
  returnFocus,
}: MoneyModalProps & { move: NonNullable<MoneyModalProps["move"]> }) {
  const id = useId();
  const clipId = `${id}-inner-edge`;
  const inputRef = useRef<HTMLInputElement>(null);
  const sending = useRef(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const words = TEXT[kind];

  const parsed = parseAmountInput(text);
  const preview = previewOf(parsed.ok ? parsed.cents : null);

  const check = () => checkMoveAmount(inputRef.current?.value ?? "", kind, pot, balance);

  /** True when an issue landed under the amount; any other 400 is the form's (ui-kit.md 2.7). */
  const showIssues = (issues: ErrorIssue[]): boolean => {
    const issue = issues.find((entry) => entry.path[0] === "amount");
    if (issue === undefined) {
      setFormError(COPY.signupFailed);
      return false;
    }
    setError(SERVER_MESSAGES[issue.code] ?? COPY.signupFailed);
    return true;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current) return;
    const result = check();
    if (result.message !== undefined) {
      flushSync(() => setError(result.message));
      inputRef.current?.focus();
      return;
    }
    sending.current = true;
    flushSync(() => {
      setError(undefined);
      setFormError(undefined);
      setPending(true);
    });
    const answer = await onSubmit(result.cents);
    sending.current = false;
    switch (answer.kind) {
      case "ok":
      case "gone":
        onDone(answer);
        return;
      case "reset":
        setFormError(COPY.dataWasReset);
        reloadPage();
        return;
      case "session":
        reloadPage();
        return;
      case "validation":
        setPending(false);
        if (answer.issues.some((i) => i.code === "exceeds_balance" || i.code === "exceeds_total")) {
          onStale();
        }
        if (showIssues(answer.issues)) inputRef.current?.focus();
        return;
      case "failed":
        setPending(false);
        setFormError(answer.message);
        return;
    }
  };

  const delta = kind === "add" ? styles.add : styles.withdraw;
  const staying = barWidth(preview.staying);
  const moving = barWidth(preview.moving);

  return (
    <Modal
      open
      title={words.title(pot.name)}
      description={words.description}
      onClose={() => {
        if (!sending.current) onClose();
      }}
      dismissible={!pending}
      initialFocus={() => inputRef.current}
      returnFocus={returnFocus}
    >
      <div className={styles.preview}>
        <p className={styles.row}>
          <span className={`text-preset-4 ${styles.muted}`}>{COPY.newAmount}</span>
          <span className={`text-preset-1 ${styles.amount}`}>
            <AmountText cents={preview.newTotal} />
          </span>
        </p>
        <div className={styles.barGroup}>
          <div className={styles.track} aria-hidden="true">
            <svg width="100%" height="100%">
              <defs>
                {/* §19e, §25f: the moving segment's left edge, at the gap, is square. */}
                <clipPath id={clipId}>
                  <rect className={styles.innerEdge} x={staying} y="0" width="4" height="100%" />
                </clipPath>
              </defs>
              <rect
                className={styles.staying}
                data-segment="staying"
                x="0"
                y="0"
                height="100%"
                width={staying}
              />
              <rect
                className={`${styles.moving} ${delta}`}
                data-segment="moving"
                x={staying}
                y="0"
                height="100%"
                width={moving}
              />
              <rect
                className={`${styles.moving} ${styles.square} ${delta}`}
                data-segment="moving-edge"
                x={staying}
                y="0"
                height="100%"
                width={moving}
                clipPath={`url(#${clipId})`}
              />
            </svg>
          </div>
          <p className={styles.row}>
            <span className={`text-preset-5-bold ${delta}`}>{formatPercent(preview.percent)}</span>
            <span className={`text-preset-5 ${styles.muted} ${styles.end}`}>
              {COPY.targetOf(formatMoney(pot.target))}
            </span>
          </p>
        </div>
      </div>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => void submit(event)}
        onInput={() => setText(inputRef.current?.value ?? "")}
      >
        <AmountField
          id={`${id}-amount`}
          name="amount"
          label={words.label}
          placeholder={COPY.amountPlaceholder}
          error={error}
          onBlur={() => setError(check().message)}
          inputRef={inputRef}
        />
        <FormFooter label={words.submit} pending={pending} error={formError} />
      </form>
    </Modal>
  );
}
