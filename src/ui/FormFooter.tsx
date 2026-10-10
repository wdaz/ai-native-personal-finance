import type { MouseEvent } from "react";
import { COPY } from "@/src/shared/copy";
import { Button } from "./Button";
import styles from "./FormFooter.module.css";

/**
 * SPEC-ui-kit 2.7 (US-31 AC3): a form's error area — one `role="alert"` paragraph, always in the
 * page, empty and taking no space until a request fails with a message that belongs to no field
 * (`write-path.md` §3: rate limit, server error, network, refused, "Data was reset — reloading").
 */
export function FormError({ message }: { message: string | undefined }) {
  return (
    <p role="alert" className={`text-preset-5 ${styles.error}`}>
      {message}
    </p>
  );
}

/**
 * SPEC-ui-kit 2.7: the end of every form modal — the error area, then the submit button. The
 * button is always enabled (UK-Q2 (a)): the form's submit checks every field and sends nothing
 * while one is invalid. While a request is pending it reads "Saving…" and has
 * `aria-disabled="true"` — it keeps focus, keeps its resting colours, shows no hover, and a
 * click does nothing; the form's own `onSubmit` returns early while pending too, so an Enter in
 * a field sends nothing either (one press, one request).
 */
export function FormFooter({
  label,
  pending,
  error,
}: {
  label: string;
  pending: boolean;
  error: string | undefined;
}) {
  return (
    <>
      <FormError message={error} />
      <Button
        type="submit"
        aria-disabled={pending ? true : undefined}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          if (pending) event.preventDefault();
        }}
      >
        {pending ? COPY.saving : label}
      </Button>
    </>
  );
}
