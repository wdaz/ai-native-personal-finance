import type { ComponentPropsWithRef } from "react";
import styles from "./Button.module.css";

/** design-tokens.md "Component states": primary — grey-900, grey-500 on hover. */
export function Button({ className, type = "button", ...props }: ComponentPropsWithRef<"button">) {
  return (
    <button
      type={type}
      className={className ? `${styles.primary} ${className}` : styles.primary}
      {...props}
    />
  );
}
