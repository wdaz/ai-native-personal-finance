"use client";

import { useId } from "react";
import { COPY } from "@/src/shared/copy";
import { THEMES, type Theme } from "@/src/shared/enums";
import { CheckCircleIcon } from "./icons/CheckCircleIcon";
import { Menu, type MenuOption } from "./Menu";
import styles from "./SelectField.module.css";
import { ThemeSwatch } from "./ThemeSwatch";

export type SelectOption<V extends string> = {
  value: V;
  label: string;
  /** Another record holds it ("Already used"); the record being edited never counts (US-16 AC1). */
  used?: boolean;
};

const isTheme = (value: string): value is Theme => (THEMES as readonly string[]).includes(value);

/**
 * SPEC-ui-kit 2.6 (US-15 AC1, US-16 AC1, US-22 AC1, US-23 AC1, US-32 AC1, NFR-A4): a form field
 * on SPEC-transactions 2.8's `Menu` — Theme, and Budgets' Budget Category. A visible label above
 * the trigger, which is named "{label}: {current}" ("Theme: Green"), or the label alone with no
 * value. A used option is shown, `aria-disabled`, skipped by the arrows, not choosable, with no
 * hover, its swatch at `var(--opacity-unavailable)`, and "Already used" in its text ("Bills,
 * Already used"), so the state is never told by colour alone (NFR-A7). A theme list draws the
 * swatch before each label and a check after the current option.
 *
 * Release 1's timing (UK-Q9 (a)): a choice is not a check. The form checks the field at its blur
 * — focus leaving the trigger and its listbox as a whole (`onBlur`) — and on submit; a message
 * (no value on submit, or a server `taken`) stays until then, and opening or closing the menu
 * neither shows nor clears it.
 */
export function SelectField<V extends string>({
  label,
  options,
  value,
  onChange,
  error,
  onBlur,
  themes = false,
}: {
  label: string;
  options: readonly SelectOption<V>[];
  value: V | undefined;
  onChange: (value: V) => void;
  error?: string;
  onBlur?: () => void;
  /** The options are themes: each gets its swatch, and the current one a check (2.6, 2.10). */
  themes?: boolean;
}) {
  const errorId = `${useId()}-error`;
  const menuOptions: MenuOption<V>[] = options.map((option) => ({
    value: option.value,
    label: option.label,
    disabled: option.used === true,
  }));
  const usedValues = new Set(options.filter((o) => o.used).map((o) => o.value));

  const swatch = (option: MenuOption<V>, unavailable: boolean) =>
    themes && isTheme(option.value) ? (
      <ThemeSwatch theme={option.value} unavailable={unavailable} />
    ) : null;

  return (
    <div className={styles.field}>
      <Menu
        variant="field"
        pointerFocus
        label={label}
        options={menuOptions}
        value={value}
        onChange={onChange}
        invalid={error !== undefined}
        describedBy={error === undefined ? undefined : errorId}
        onFieldBlur={onBlur}
        renderValue={(option) =>
          option === undefined ? null : (
            <span className={styles.value}>
              {swatch(option, false)}
              <span className={styles.label}>{option.label}</span>
            </span>
          )
        }
        renderOption={(option, selected) => {
          const used = usedValues.has(option.value);
          return (
            <span className={styles.option}>
              <span className={styles.value}>
                {swatch(option, used)}
                <span className={styles.label}>{option.label}</span>
              </span>
              {used ? (
                <span className={`text-preset-5 ${styles.used}`}>
                  <span className={styles.visuallyHidden}>, </span>
                  {COPY.alreadyUsed}
                </span>
              ) : null}
              {themes && selected ? (
                <span className={styles.check}>
                  <CheckCircleIcon />
                </span>
              ) : null}
            </span>
          );
        }}
      />
      <p id={errorId} className={`text-preset-5 ${styles.error}`} aria-live="polite">
        {error}
      </p>
    </div>
  );
}
