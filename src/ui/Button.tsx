import type { ComponentPropsWithRef } from "react";
import { cx } from "./cx";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "destroy" | "text";

/**
 * design-tokens.md "Component states": primary — grey-900, grey-500 on hover; destroy — red, its
 * text underlined on hover (SPEC-ui-kit 2.3, UK-Q5 (a)); text — grey-500, grey-900 on hover
 * ("No, Go Back"). Full width unless `fit` (SPEC-ui-kit 2.8: the header button fits its text).
 * A pending button keeps focus with `aria-disabled="true"` and, like a disabled one, shows no
 * hover (SPEC-ui-kit 2.7, US-34 AC2).
 */
export function Button({
  className,
  type = "button",
  variant = "primary",
  fit = false,
  ...props
}: ComponentPropsWithRef<"button"> & { variant?: ButtonVariant; fit?: boolean }) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], fit && styles.fit, className)}
      {...props}
    />
  );
}
