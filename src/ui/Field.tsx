import type { ReactNode, Ref } from "react";
import { cx } from "./cx";
import styles from "./Field.module.css";

export type FieldProps = {
  id: string;
  name: string;
  label: string;
  onBlur?: () => void;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  maxLength?: number;
  /** Always shown under the input (SPEC-auth §2.5's password helper). */
  helper?: string;
  /** US-31: the field's one message; `undefined` when valid. */
  error?: string;
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  /** A control inside the input's end edge — PasswordField's toggle. */
  trailing?: ReactNode;
  /** SPEC-ui-kit 2.5: a decorative mark inside the start edge — `AmountField`'s "$". */
  leading?: ReactNode;
  placeholder?: string;
  inputMode?: "text" | "decimal";
  /** An edit form's pre-fill; the input stays uncontrolled (SPEC-ui-kit 2.5). */
  defaultValue?: string;
};

/**
 * SPEC-auth §6: label, input, helper, error. US-31 AC2 / NFR-A5: the error is linked through
 * `aria-describedby` (first, then the helper) and sits in a polite live region that is always
 * rendered, so a message that appears on blur is announced.
 *
 * The input is uncontrolled: its value lives in the DOM and the form reads it through
 * `inputRef` on blur and on submit. A controlled input starts at "" in React state, and the
 * first re-render after hydration wrote that "" over anything typed or autofilled before the
 * scripts ran (T-06 final review, I1).
 */
export function Field({
  id,
  name,
  label,
  onBlur,
  type = "text",
  autoComplete,
  maxLength,
  helper,
  error,
  disabled,
  inputRef,
  trailing,
  leading,
  placeholder,
  inputMode,
  defaultValue,
}: FieldProps) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const describedBy =
    [error ? errorId : null, helper ? helperId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={`text-preset-5-bold ${styles.label}`}>
        {label}
      </label>
      <div className={styles.control}>
        {leading ? (
          <span className={`text-preset-4 ${styles.leading}`} aria-hidden="true">
            {leading}
          </span>
        ) : null}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={type}
          className={cx(
            styles.input,
            trailing ? styles.withTrailing : null,
            leading ? styles.withLeading : null,
          )}
          autoComplete={autoComplete}
          maxLength={maxLength}
          placeholder={placeholder}
          inputMode={inputMode}
          defaultValue={defaultValue}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onBlur={onBlur}
        />
        {trailing}
      </div>
      {helper ? (
        <p id={helperId} className={`text-preset-5 ${styles.helper}`}>
          {helper}
        </p>
      ) : null}
      <p id={errorId} className={`text-preset-5 ${styles.error}`} aria-live="polite">
        {error}
      </p>
    </div>
  );
}
