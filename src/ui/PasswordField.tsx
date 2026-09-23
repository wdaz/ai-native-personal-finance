"use client";

import { useState } from "react";
import { Field, type FieldProps } from "./Field";
import { EyeIcon } from "./icons/EyeIcon";
import { EyeSlashIcon } from "./icons/EyeSlashIcon";
import styles from "./PasswordField.module.css";

/**
 * SPEC-auth §6: a Field whose toggle button shows or hides the password — `aria-label` "Show
 * password" / "Hide password" and `aria-pressed` (US-01 AC5).
 */
export function PasswordField(props: Omit<FieldProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          disabled={props.disabled}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeSlashIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
