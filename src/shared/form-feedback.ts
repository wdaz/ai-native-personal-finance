import type { z } from "zod";
import { COPY, retryAfterMinutes } from "./copy";
import { ErrorEnvelopeSchema, type ErrorIssue, type ValidationIssueCode } from "./schemas";

/**
 * What the auth forms show, derived — never written — here. The schemas' own messages already
 * are the copy appendix (schemas.ts builds them from COPY), and the API carries codes only
 * (SPEC-auth §2.10), so this module only chooses among COPY's entries.
 */

/** US-31: at most one message per field. */
export type FieldErrors<K extends string> = Partial<Record<K, string>>;

/** The first message the schema reports for each field of `values`; `{}` when the values parse. */
export function fieldErrors<K extends string>(
  schema: z.ZodType,
  values: Record<K, string>,
): FieldErrors<K> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors: FieldErrors<K> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && Object.hasOwn(values, field) && !(field in errors)) {
      errors[field as K] = issue.message;
    }
  }
  return errors;
}

/**
 * SPEC-auth §2.4: the banner for a login answer other than 200. The 429's minutes come from
 * the body's `retryAfter` (§4); without one there is no N to write, so the generic message
 * shows (plan D8), as it does for any other status.
 */
export function loginFailureMessage(status: number, body: unknown): string {
  if (status === 401) return COPY.loginIncorrect;
  if (status === 429) {
    const parsed = ErrorEnvelopeSchema.safeParse(body);
    const retryAfter = parsed.success ? parsed.data.retryAfter : undefined;
    if (retryAfter !== undefined) return COPY.loginRateLimited(retryAfterMinutes(retryAfter));
  }
  return COPY.loginFailed;
}

export type SignupField = "name" | "email" | "password";

const SIGNUP_FIELDS: readonly string[] = ["name", "email", "password"] satisfies SignupField[];

const isSignupField = (value: unknown): value is SignupField =>
  typeof value === "string" && SIGNUP_FIELDS.includes(value);

/**
 * Each sign-up field's codes (SignupSchema's checks, via `toErrorIssues`) and the appendix row
 * each one reads as — the same text the client-side schema shows for that failure
 * (tests/unit/shared/form-feedback.test.ts proves it case by case).
 */
const SIGNUP_ISSUE_COPY: Record<SignupField, Partial<Record<ValidationIssueCode, string>>> = {
  name: { required: COPY.required, too_long: COPY.nameTooLong },
  email: {
    required: COPY.required,
    invalid_format: COPY.emailInvalid,
    too_long: COPY.emailInvalid,
  },
  password: {
    required: COPY.required,
    too_short: COPY.passwordTooShort,
    too_long: COPY.passwordTooLong,
  },
};

/** SPEC-auth §2.10: a sign-up 400 issue as the appendix's words; `undefined` when unmapped. */
export function signupIssueMessage(issue: ErrorIssue): string | undefined {
  const field = issue.path[0];
  return isSignupField(field) ? SIGNUP_ISSUE_COPY[field][issue.code] : undefined;
}

/**
 * A sign-up 400 body as one message per field. Anything that is not a validation envelope, or
 * an issue with no mapped message, is left out — the form then shows its generic banner.
 */
export function signupFieldErrors(body: unknown): FieldErrors<SignupField> {
  const parsed = ErrorEnvelopeSchema.safeParse(body);
  if (!parsed.success || parsed.data.error !== "validation") return {};
  const errors: FieldErrors<SignupField> = {};
  for (const issue of parsed.data.issues ?? []) {
    const field = issue.path[0];
    const message = signupIssueMessage(issue);
    if (isSignupField(field) && message !== undefined && !(field in errors)) {
      errors[field] = message;
    }
  }
  return errors;
}
