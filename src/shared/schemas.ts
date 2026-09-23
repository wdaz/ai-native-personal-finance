import { z } from "zod";
import { COPY } from "./copy";
import { CATEGORIES, THEMES } from "./enums";
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

// ---------------------------------------------------------------------------------------
// Enums

export const CategorySchema = z.enum(CATEGORIES);
export const ThemeSchema = z.enum(THEMES);
export const WebMcpModeSchema = z.enum(WEBMCP_MODES);

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
 * A Zod issue as it arrives in JSON: its `code`, `path` and `message`, plus whatever fields
 * the code carries (`minimum`, `format`, …). Zod adds the rejected value only on request
 * (`reportInput`), so a password never travels back in an envelope.
 */
export const ErrorIssueSchema = z.looseObject({
  code: z.string(),
  path: z.array(z.union([z.string(), z.int()])),
  message: z.string(),
});
export type ErrorIssue = z.infer<typeof ErrorIssueSchema>;

export const ErrorEnvelopeSchema = z.strictObject({
  error: z.enum(ERROR_CODES),
  message: z.string().min(1),
  issues: z.array(ErrorIssueSchema).optional(),
  /** Seconds, as in the `Retry-After` header (SPEC-auth §4). */
  retryAfter: z.int().positive().optional(),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

/**
 * A failed parse's issues in the envelope's shape. Zod types a path segment as any property
 * key; JSON has no symbols, so a symbol key is written as its description.
 */
export const toErrorIssues = (error: z.ZodError): ErrorIssue[] =>
  error.issues.map((issue) => ({
    ...issue,
    path: issue.path.map((key) => (typeof key === "symbol" ? String(key) : key)),
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
