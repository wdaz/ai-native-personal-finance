import type { ApiOutcome } from "./api-client";
import { COPY } from "./copy";
import type { AmountInputIssue } from "./money";
import type { ErrorIssue } from "./schemas";

/**
 * SPEC-write-path §3, the states a write ends in, as the write UI meets them (SPEC-ui-kit 2.3,
 * 2.7): what the page does next depends on the kind; a failure carries the message the form's
 * error area shows and the code a tool reports when no dialog is left to show it
 * (`write-path.md` 2.11 (4); SPEC-ui-kit 2.3 item 4).
 */
export type WriteFailureCode = "rate_limited" | "forbidden" | "validation" | "server_error";

export type WriteAnswer<T> =
  | { kind: "ok"; data: T }
  /** 400: each issue goes under its field (US-31 AC2). */
  | { kind: "validation"; issues: ErrorIssue[] }
  /** 404: "This budget/pot no longer exists"; the modal closes, the list refreshes. */
  | { kind: "gone" }
  /** 409: "Data was reset — reloading", then a reload. */
  | { kind: "reset" }
  /** 401: a reload; the proxy redirects to the login page. */
  | { kind: "session" }
  /** 429, 403, 415, 500, an unreadable answer, no answer: a message; the modal stays open. */
  | { kind: "failed"; code: WriteFailureCode; message: string };

/** `write-path.md` §3: "Something went wrong. Try again" (existing, the same text as sign-up's). */
const SOMETHING_WENT_WRONG = COPY.signupFailed;
/** `write-path.md` §3: "Can't reach the server. Check your connection and try again" (existing). */
const CANNOT_REACH = COPY.signupUnreachable;

/** A write's outcome (`apiSend`) as what the write UI shows. Pure; never throws. */
export function writeAnswer<T>(outcome: ApiOutcome<T>): WriteAnswer<T> {
  if (outcome.ok) return { kind: "ok", data: outcome.data };
  switch (outcome.kind) {
    case "network":
    case "aborted":
      return { kind: "failed", code: "server_error", message: CANNOT_REACH };
    case "invalid_response":
      return { kind: "failed", code: "server_error", message: SOMETHING_WENT_WRONG };
    case "http":
      break;
  }
  const { status, error } = outcome;
  if (status === 400 && error?.issues !== undefined && error.issues.length > 0) {
    return { kind: "validation", issues: error.issues };
  }
  if (status === 401) return { kind: "session" };
  if (status === 404) return { kind: "gone" };
  if (status === 409) return { kind: "reset" };
  if (status === 429) {
    const message =
      error?.retryAfter === undefined
        ? SOMETHING_WENT_WRONG
        : COPY.writeRateLimited(error.retryAfter);
    return { kind: "failed", code: "rate_limited", message };
  }
  if (status === 403) return { kind: "failed", code: "forbidden", message: SOMETHING_WENT_WRONG };
  if (status === 400 || status === 415) {
    return { kind: "failed", code: "validation", message: SOMETHING_WENT_WRONG };
  }
  return { kind: "failed", code: "server_error", message: SOMETHING_WENT_WRONG };
}

/** `write-path.md` 2.7's table: the message of each amount code (SPEC-ui-kit 2.5). */
export const AMOUNT_MESSAGES: Record<AmountInputIssue, string> = {
  required: COPY.required,
  invalid_format: COPY.amountFormat,
  too_small: COPY.amountNotPositive,
  too_large: COPY.amountTooLarge,
};
