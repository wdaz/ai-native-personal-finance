"use client";

import { useEffect, useRef, useState } from "react";
import { COPY } from "@/src/shared/copy";
import type { WriteAnswer } from "@/src/shared/write-feedback";
import { Button } from "./Button";
import { FormError } from "./FormFooter";
import { Modal } from "./Modal";
import { reloadPage } from "./reload";
import styles from "./ConfirmDeleteDialog.module.css";

/** The answers after which the dialog is done (the page closes it, or the page reloads). */
export type DeleteDone = Extract<
  WriteAnswer<unknown>,
  { kind: "ok" | "gone" | "reset" | "session" }
>;

export type ConfirmDeleteDialogProps = {
  open: boolean;
  /** `COPY.deleteTitle(name)` — "Delete ‘Savings’?". */
  title: string;
  /** `COPY.deleteBudgetConfirm` or `COPY.deletePotConfirm`. */
  description: string;
  /** Go Back, Escape, the close button and the backdrop — while no request is pending. */
  onCancel: () => void;
  /** The page's delete (`apiSend("DELETE", …)` through its write function), as `writeAnswer`. */
  onConfirm: () => Promise<WriteAnswer<unknown>>;
  /**
   * A 204 or a 404: the page closes the dialog (naming `<main>` for focus) and removes the
   * record, or shows the notice and refreshes. A 409 or a 401: called before the page reloads.
   */
  onDone: (answer: DeleteDone) => void;
  returnFocus?: () => HTMLElement | null;
};

/**
 * SPEC-ui-kit 2.3 (US-17 AC1, AC3, US-24 AC1, AC2, ADR-0004): the delete confirmation for both
 * pages and both ways in — a person's "Delete" and an agent's `delete_budget` / `delete_pot`. It
 * opens on "No, Go Back" (UK-Q6 (a)). Confirming runs the page's delete: meanwhile the confirm
 * reads "Deleting…", both buttons have `aria-disabled="true"` and do nothing, and the dialog is
 * not dismissible. A 429, 403, 415, 500 or no answer shows its message and both buttons work
 * again; a 409 shows "Data was reset — reloading" and reloads; a 401 reloads.
 */
export function ConfirmDeleteDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  onDone,
  returnFocus,
}: ConfirmDeleteDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const goBackRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);
  const sending = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // A new opening starts clean (state adjusted while rendering, not in an effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setPending(false);
      setError(undefined);
    }
  }

  const cancel = () => {
    if (!sending.current) onCancel();
  };

  const confirm = async () => {
    if (sending.current) return;
    sending.current = true;
    setPending(true);
    setError(undefined);
    const answer = await onConfirm();
    sending.current = false;
    if (answer.kind === "ok" || answer.kind === "gone") {
      onDone(answer);
      return;
    }
    if (answer.kind === "reset") {
      if (mounted.current) setError(COPY.dataWasReset);
      onDone(answer);
      reloadPage();
      return;
    }
    if (answer.kind === "session") {
      onDone(answer);
      reloadPage();
      return;
    }
    if (!mounted.current) return;
    setPending(false);
    setError(answer.kind === "failed" ? answer.message : COPY.signupFailed);
  };

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={cancel}
      dismissible={!pending}
      initialFocus={() => goBackRef.current}
      returnFocus={returnFocus}
    >
      <FormError message={error} />
      <div className={styles.buttons}>
        <Button
          variant="destroy"
          aria-disabled={pending ? true : undefined}
          onClick={() => void confirm()}
        >
          {pending ? COPY.deleting : COPY.confirmDeletion}
        </Button>
        <Button
          ref={goBackRef}
          variant="text"
          aria-disabled={pending ? true : undefined}
          onClick={cancel}
        >
          {COPY.goBack}
        </Button>
      </div>
    </Modal>
  );
}
