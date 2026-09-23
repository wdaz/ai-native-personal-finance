import { z } from "zod";
import { COPY } from "./copy";
import { CATEGORIES, RESET_REASONS, THEMES } from "./enums";
import { WEBMCP_MODES } from "./env";

/**
 * The request and response schemas of docs/02-architecture/data-model.md ("Request/response
 * schemas live in src/shared/schemas.ts and are reused by forms and tools", NFR-Q2). Release 1:
 * auth (SPEC-auth §6), the error envelope (§2.10), the Overview DTO (SPEC-overview §6) and
 * meta (SPEC-app-shell §5). Written by hand: ADR-0002 keeps Prisma's types out of src/shared.
 *
 * Request schemas are `z.object` (unknown keys are dropped); response schemas are
 * `z.strictObject`, so an API test fails when a route leaks a field the spec does not list.
 */

// ADR-0006: the forms parse in the browser under a CSP without 'unsafe-eval'. Zod's JIT probes
// `new Function("")` on the first parse — the throw is caught, but the browser still reports a
// CSP violation. `jitless` skips the probe; this module loads before any parse, on both sides.
z.config({ jitless: true });

// ---------------------------------------------------------------------------------------
// Enums

export const CategorySchema = z.enum(CATEGORIES);
export const ThemeSchema = z.enum(THEMES);
export const WebMcpModeSchema = z.enum(WEBMCP_MODES);
export type WebMcpMode = z.infer<typeof WebMcpModeSchema>;

// ---------------------------------------------------------------------------------------
// Auth — SPEC-auth §4, §6; messages from the copy appendix (US-31)

/** SPEC-auth §4: "RFC-5322-lite". */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_MAX = 254;
export const NAME_MAX = 60;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/**
 * A required text field. A missing, non-text or blank value reads "Can't be empty" (appendix,
 * "Any required field"), and the checks stop at the first failure, so a field carries one
 * message — the one US-31 shows under it.
 */
const requiredText = () => z.string({ error: COPY.required });
const stop = (message: string) => ({ message, abort: true });

/** SPEC-auth §4: "Email: trimmed, max 254, RFC-5322-lite regex". */
const email = requiredText()
  .trim()
  .min(1, stop(COPY.required))
  .max(EMAIL_MAX, stop(COPY.emailInvalid))
  .regex(EMAIL_PATTERN, COPY.emailInvalid);

/** SPEC-auth §2.3: "password required"; §4: "login only checks presence". Never trimmed. */
export const LoginSchema = z.object({
  email,
  password: requiredText().min(1, COPY.required),
});
export type LoginInput = z.infer<typeof LoginSchema>;

/** SPEC-auth §6: `SignupSchema { name(1–60), email, password(8–128) }`. */
export const SignupSchema = z.object({
  name: requiredText().trim().min(1, stop(COPY.required)).max(NAME_MAX, COPY.nameTooLong),
  email,
  password: requiredText()
    .min(1, stop(COPY.required))
    .min(PASSWORD_MIN, stop(COPY.passwordTooShort))
    .max(PASSWORD_MAX, COPY.passwordTooLong),
});
export type SignupInput = z.infer<typeof SignupSchema>;

/** SPEC-auth §6, `POST /api/auth/login` → 200. */
export const LoginResponseSchema = z.strictObject({ ok: z.literal(true) });
/** SPEC-auth §2.6, §6, `POST /api/auth/signup` → 200. */
export const SignupResponseSchema = z.strictObject({ code: z.literal("demo_instance") });
/** SPEC-auth §6, `GET /api/auth/session` → 200. */
export const SessionResponseSchema = z.strictObject({ authenticated: z.boolean() });

// ---------------------------------------------------------------------------------------
// Errors — SPEC-auth §2.10

export const ERROR_CODES = [
  "validation",
  "invalid_credentials",
  "rate_limited",
  "unauthenticated",
  "not_found",
  "conflict",
  "server_error",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

/**
 * A 400 validation error's own code, not Zod's: `path` and this code are all a validation
 * issue carries — no `message` (Zod's own strings are UI text baked into the schema, not API
 * contract; the appendix already owns the words) and no rejected value (a password is never
 * echoed back). The client maps `path` + `code` to the copy appendix, the same way it maps a
 * 401/429 `error` code to its banner text (owner decision, T-04 plan gate finding 3, 2026-09-23:
 * "API carries codes only; copy lives in the client — consistent with 401/429, avoids leaking
 * input or duplicating UI text").
 */
export const VALIDATION_ISSUE_CODES = [
  "required",
  "invalid_format",
  "too_short",
  "too_long",
] as const;
export type ValidationIssueCode = (typeof VALIDATION_ISSUE_CODES)[number];

export const ErrorIssueSchema = z.strictObject({
  path: z.array(z.union([z.string(), z.int()])),
  code: z.enum(VALIDATION_ISSUE_CODES),
});
export type ErrorIssue = z.infer<typeof ErrorIssueSchema>;

export const ErrorEnvelopeSchema = z.strictObject({
  error: z.enum(ERROR_CODES),
  /** Present for every code this schema has a fixed banner/notice for (401, 429, …); a 400
   * validation error has none — its `issues` carry the codes the client renders instead. */
  message: z.string().min(1).optional(),
  issues: z.array(ErrorIssueSchema).optional(),
  /** Seconds, as in the `Retry-After` header (SPEC-auth §4). */
  retryAfter: z.int().positive().optional(),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

/**
 * Every Zod issue `LoginSchema`/`SignupSchema` can produce, given their fields' checks (each
 * field's chain `stop()`s at its first failure, so one issue per field): a missing or
 * wrong-typed value (`invalid_type`); an empty string (`too_small`, `minimum: 1` — `.min(1)`);
 * a too-short password (`too_small`, `minimum: 8`); a too-long email/name/password (`too_big`);
 * a malformed email (`invalid_format`). Measured against the real schemas (T-04 plan gate
 * finding 3 evidence), not assumed. Any other Zod issue code means a schema added a check this
 * function was not extended for — it throws rather than mis-report a validation error.
 */
function validationIssueCode(issue: z.core.$ZodIssue): ValidationIssueCode {
  switch (issue.code) {
    case "invalid_type":
      return "required";
    case "too_small":
      return issue.minimum === 1 ? "required" : "too_short";
    case "too_big":
      return "too_long";
    case "invalid_format":
      return "invalid_format";
    default:
      throw new Error(`No validation code mapped for Zod issue code "${issue.code}"`);
  }
}

/**
 * A failed parse's issues in the 400 envelope's shape (`path`, `code` — see `ErrorIssueSchema`).
 * Zod types a path segment as any property key; JSON has no symbols, so a symbol key is written
 * as its description.
 */
export const toErrorIssues = (error: z.ZodError): ErrorIssue[] =>
  error.issues.map((issue) => ({
    path: issue.path.map((key) => (typeof key === "symbol" ? String(key) : key)),
    code: validationIssueCode(issue),
  }));

// ---------------------------------------------------------------------------------------
// Overview — SPEC-overview §6 ("cents; dates ISO-8601 UTC")

/** Money: integer cents, within `Number.MAX_SAFE_INTEGER` (`BigInt` is converted by then). */
const Cents = z.int();
const NonNegativeCents = z.int().nonnegative();
/** "ISO-8601 UTC": `Date#toISOString()`; an offset or a time without a zone is refused. */
const UtcDateTime = z.iso.datetime();
/** SPEC-reset-and-test-support §2.1: "avatar path → basename key". */
export const AVATAR_KEY = /^[a-z0-9-]+$/;

/** SPEC-overview §2.3, §2.5: the first four pots and budgets; §2.4: the latest five transactions. */
export const OVERVIEW_LIST_MAX = { pots: 4, budgets: 4, transactions: 5 } as const;

export const OverviewDtoSchema = z.strictObject({
  balance: z.strictObject({ current: Cents, income: Cents, expenses: Cents }),
  pots: z.strictObject({
    total: NonNegativeCents,
    items: z
      .array(
        z.strictObject({
          id: z.uuid(),
          name: z.string().min(1).max(30),
          total: NonNegativeCents,
          theme: ThemeSchema,
        }),
      )
      .max(OVERVIEW_LIST_MAX.pots),
  }),
  transactions: z
    .array(
      z.strictObject({
        id: z.uuid(),
        name: z.string().min(1).max(60),
        avatar: z.string().regex(AVATAR_KEY),
        amount: Cents,
        date: UtcDateTime,
      }),
    )
    .max(OVERVIEW_LIST_MAX.transactions),
  budgets: z.strictObject({
    spent: NonNegativeCents,
    limit: NonNegativeCents,
    items: z
      .array(
        z.strictObject({
          id: z.uuid(),
          category: CategorySchema,
          maximum: z.int().positive(),
          spent: NonNegativeCents,
          theme: ThemeSchema,
        }),
      )
      .max(OVERVIEW_LIST_MAX.budgets),
  }),
  bills: z.strictObject({
    paid: NonNegativeCents,
    upcoming: NonNegativeCents,
    dueSoon: NonNegativeCents,
  }),
});
export type OverviewDto = z.infer<typeof OverviewDtoSchema>;

// ---------------------------------------------------------------------------------------
// Meta — SPEC-app-shell §5

export const MetaDtoSchema = z.strictObject({
  lastResetAt: UtcDateTime,
  resetIntervalDays: z.int().positive(),
  webmcp: z.strictObject({ configuredMode: WebMcpModeSchema, originTrial: z.boolean() }),
});
export type MetaDto = z.infer<typeof MetaDtoSchema>;

// ---------------------------------------------------------------------------------------
// Admin reset — SPEC-reset-and-test-support §2.2

/**
 * The body of `POST /api/admin/reset`: `reason` is "scheduled", "threshold" or "manual"
 * (default "manual"). Built from `RESET_REASONS` without "test", which only
 * `/api/test/reset` writes (T-08 plan D4).
 */
export const AdminResetSchema = z.strictObject({
  reason: z.enum(RESET_REASONS).exclude(["test"]).default("manual"),
});
export type AdminResetBody = z.infer<typeof AdminResetSchema>;
