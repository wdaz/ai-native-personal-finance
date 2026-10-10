import type { Ref } from "react";
import { Field } from "./Field";

/** SPEC-ui-kit 2.5: long enough for spaces, a sign and leading zeros; bounds the parse. */
export const AMOUNT_MAX_LENGTH = 32;

/**
 * SPEC-ui-kit 2.5 (US-15 AC2, US-22 AC2, US-25 AC2, US-26 AC2, US-31): `Field` with a leading
 * "$" (`aria-hidden`, the label names the field), `type="text"` with `inputMode="decimal"` (PO-10,
 * the designer's changelog §19j), no autocomplete and `maxLength` 32. Uncontrolled, as `Field`;
 * an edit form's pre-fill is `formatAmountInput(cents)`. The form reads the text through
 * `inputRef` and checks it with `parseAmountInput` on blur and on submit — Release 1's timing
 * (UK-Q9 (a)): typing never shows or clears a message.
 */
export function AmountField({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  error,
  onBlur,
  inputRef,
}: {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <Field
      id={id}
      name={name}
      label={label}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      maxLength={AMOUNT_MAX_LENGTH}
      leading="$"
      placeholder={placeholder}
      defaultValue={defaultValue}
      error={error}
      onBlur={onBlur}
      inputRef={inputRef}
    />
  );
}
