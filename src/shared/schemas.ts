import { z } from "zod";
import { COPY } from "./copy";
import { CATEGORIES, RESET_REASONS, THEMES } from "./enums";
import { WEBMCP_MODES } from "./env";
import { BILL_STATUSES } from "./recurring-bills-query";
import { TRANSACTIONS_PAGE_SIZE } from "./transactions-query";

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
  "forbidden",
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
  // SPEC-write-path 2.7 (auth.md v1.0.10): the write routes' codes.
  "too_small",
  "too_large",
  "exceeds_balance",
  "exceeds_total",
  "taken",
] as const;
export type ValidationIssueCode = (typeof VALIDATION_ISSUE_CODES)[number];

export const ErrorIssueSchema = z.strictObject({
  path: z.array(z.union([z.string(), z.int()])),
  code: z.enum(VALIDATION_ISSUE_CODES),
});
export type ErrorIssue = z.infer<typeof ErrorIssueSchema>;

export const ErrorEnvelopeSchema = z.strictObject({
  error: z.enum(ERROR_CODES),
  /** Present for every code this schema has a fixed banner/notice for (401, 429, …). A 400
   * validation error's `issues` carry the codes the client renders; only a route whose spec says
   * so adds a `message` (SPEC-transactions 2.13: the allowed values, for an agent). */
  message: z.string().min(1).optional(),
  issues: z.array(ErrorIssueSchema).optional(),
  /** Seconds, as in the `Retry-After` header (SPEC-auth §4). */
  retryAfter: z.int().positive().optional(),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

/**
 * The auth family's mapping (SPEC-auth §2.10, unchanged by SPEC-write-path 2.7).
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
    // SPEC-write-path 2.7: a value outside an enum never throws (it answered 500 before).
    case "invalid_value":
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
// Writes — SPEC-write-path 2.7, 4.1, 4.4 (NFR-S3); the page specs build their bodies from these

/** NFR-S3: "cents `1 ≤ x ≤ 99,999,999,999`". */
export const AMOUNT_MAX_CENTS = 99_999_999_999;
export const POT_NAME_MAX = 30;

/** Money in a write body: integer cents (the client converts the typed text first, 2.7). */
export const AmountCentsSchema = z.int().min(1).max(AMOUNT_MAX_CENTS);
/**
 * A pot name: trimmed, 1–30 UTF-16 code units (JS `.length`, what the live counter and the input's
 * `maxLength` count; SPEC-pots 4.6: "an emoji counts 2"). Zod's `.max` counts code points, so 15
 * emoji and a letter pass it; the check after it counts units and reports the same `too_big`, which
 * the mapper reads as `too_long` (T-25). `.max` stays for the tool schemas' `maxLength`.
 */
export const PotNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(POT_NAME_MAX)
  .check((ctx) => {
    if (ctx.value.length > POT_NAME_MAX) {
      ctx.issues.push({
        code: "too_big",
        origin: "string",
        maximum: POT_NAME_MAX,
        inclusive: true,
        input: ctx.value,
      });
    }
  });
/** A record id in a path or a tool input; `.max` gives a tool its `maxLength` (2.7). */
export const RecordIdSchema = z.uuid().max(36);

/** The value at `path` in `input`, or `undefined` when a step of the path is missing. */
function valueAt(input: unknown, path: readonly PropertyKey[]): unknown {
  let value = input;
  for (const key of path) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<PropertyKey, unknown>)[key];
  }
  return value;
}

/**
 * The write family's mapping, exactly SPEC-write-path 2.7's table. Zod's issues carry no input
 * (T-17 plan F2) and a missing enum reports `invalid_value` like a wrong one, so absent or `null`
 * is read from the input itself. The size codes take their kind from `origin`. A body that is
 * not an object is `invalid_format` on `[]` (4.4). Never throws.
 */
function writeIssueCode(issue: z.core.$ZodIssue, input: unknown): ValidationIssueCode {
  if (issue.path.length === 0) return "invalid_format";
  const value = valueAt(input, issue.path);
  if (value === undefined || value === null) return "required";
  if (issue.code === "too_small") return issue.origin === "string" ? "required" : "too_small";
  if (issue.code === "too_big") return issue.origin === "string" ? "too_long" : "too_large";
  return "invalid_format";
}

/** A failed write parse's issues, one per path (the first: `2 ** 60` gives two on one field). */
export function toWriteIssues(error: z.ZodError, input: unknown): ErrorIssue[] {
  const seen = new Set<string>();
  const issues: ErrorIssue[] = [];
  for (const issue of error.issues) {
    const path = issue.path.map((key) => (typeof key === "symbol" ? String(key) : key));
    const key = JSON.stringify(path);
    if (seen.has(key)) continue;
    seen.add(key);
    issues.push({ path, code: writeIssueCode(issue, input) });
  }
  return issues;
}

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
// Transactions — SPEC-transactions 2.13

/** One page of the list: the table's fields plus `id` (US-39 AC2) and `avatar`; no `recurring`. */
export const TransactionsDtoSchema = z.strictObject({
  items: z
    .array(
      z.strictObject({
        id: z.uuid(),
        name: z.string().min(1).max(60),
        avatar: z.string().regex(AVATAR_KEY),
        category: CategorySchema,
        date: UtcDateTime,
        amount: Cents,
      }),
    )
    .max(TRANSACTIONS_PAGE_SIZE),
  /** The effective page, after the clamp. */
  page: z.int().min(1),
  pageSize: z.literal(TRANSACTIONS_PAGE_SIZE),
  /** `max(1, ceil(total / 10))`. */
  pageCount: z.int().min(1),
  /** The rows that match the search and the category. */
  total: z.int().nonnegative(),
});
export type TransactionsDto = z.infer<typeof TransactionsDtoSchema>;

// ---------------------------------------------------------------------------------------
// Recurring Bills — SPEC-recurring-bills 2.11

export const BillStatusSchema = z.enum(BILL_STATUSES);

/** One summary row: how many bills and their absolute amounts, in cents. */
const BillsTotal = z.strictObject({ count: z.int().nonnegative(), amount: NonNegativeCents });

/**
 * The bills after the search (and the API's status) and the sort, with the summary over all
 * bills. A bill has no `id` (§9 RB-Q6 (a)): its name is its key. No `max` on `items`: the list
 * is bounded by the number of bills, which the schema cannot know (2.7).
 */
export const RecurringBillsDtoSchema = z.strictObject({
  items: z.array(
    z.strictObject({
      name: z.string().min(1).max(NAME_MAX),
      avatar: z.string().regex(AVATAR_KEY),
      /** The due day, 1–31; the page writes it with `formatDueDay`. */
      day: z.int().min(1).max(31),
      /** Absolute (US-30 AC1). */
      amount: NonNegativeCents,
      status: BillStatusSchema,
    }),
  ),
  summary: z.strictObject({
    total: BillsTotal,
    paid: BillsTotal,
    /** Every bill not paid, due soon included — not the row status `upcoming` (§9 RB-Q4 (a)). */
    totalUpcoming: BillsTotal,
    dueSoon: BillsTotal,
  }),
});
export type RecurringBillsDto = z.infer<typeof RecurringBillsDtoSchema>;

// ---------------------------------------------------------------------------------------
// Budgets — SPEC-budgets 2.10, 2.11

/** SPEC-budgets 2.10: at most ten budgets, one per category. */
export const BUDGETS_MAX = CATEGORIES.length;
/** SPEC-budgets 2.5, US-18 AC1: a card's Latest Spending holds at most three rows. */
export const BUDGET_LATEST_MAX = 3;

/**
 * `POST /api/budgets`: the category (one of the ten), the maximum (integer cents) and the theme
 * (one of the fifteen), all required. Unknown keys are stripped (SPEC-write-path 2.7).
 */
export const BudgetCreateSchema = z.object({
  category: CategorySchema,
  maximum: AmountCentsSchema,
  theme: ThemeSchema,
});
export type BudgetCreateInput = z.infer<typeof BudgetCreateSchema>;

/**
 * `PATCH /api/budgets/:id`: the same three fields, all required, as the edit form sends them
 * (2.10; partial edits are out of scope, §8). Named for `edit_budget` and "Edit Budget".
 */
export const BudgetEditSchema = z.object({
  category: CategorySchema,
  maximum: AmountCentsSchema,
  theme: ThemeSchema,
});
export type BudgetEditInput = z.infer<typeof BudgetEditSchema>;

/**
 * One budget as the card shows it, with its id (US-39 AC2) and the latest rows' avatar keys. No
 * `seq` (the order of `items` is the order) and no bar percentage (the client's, 2.1).
 */
export const BudgetItemDtoSchema = z.strictObject({
  id: z.uuid(),
  category: CategorySchema,
  theme: ThemeSchema,
  maximum: z.int().positive(),
  /** `budgetSpent`: August 2026, negative rows only (R-11). */
  spent: NonNegativeCents,
  /** `max(0, maximum − spent)`. */
  remaining: NonNegativeCents,
  /** US-11 Latest, any month and any sign. */
  latest: z
    .array(
      z.strictObject({
        id: z.uuid(),
        name: z.string().min(1).max(NAME_MAX),
        avatar: z.string().regex(AVATAR_KEY),
        date: UtcDateTime,
        amount: Cents,
      }),
    )
    .max(BUDGET_LATEST_MAX),
});
export type BudgetItemDto = z.infer<typeof BudgetItemDtoSchema>;

/** `GET /api/budgets`: every budget in creation order, with the totals over all of them. */
export const BudgetsDtoSchema = z.strictObject({
  items: z.array(BudgetItemDtoSchema).max(BUDGETS_MAX),
  /** Σ items.spent, equal to Overview's `budgets.spent` (US-20 AC1). */
  spent: NonNegativeCents,
  /** Σ items.maximum. */
  limit: NonNegativeCents,
});
export type BudgetsDto = z.infer<typeof BudgetsDtoSchema>;

/** The create's and the edit's answer: the record under its noun (2.10, as `pots.md` 2.12). */
export const BudgetWriteDtoSchema = z.strictObject({ budget: BudgetItemDtoSchema });
export type BudgetWriteDto = z.infer<typeof BudgetWriteDtoSchema>;

// ---------------------------------------------------------------------------------------
// Pots — SPEC-pots 2.12

/** SPEC-write-path 4.1: at most fifteen pots, one per theme. */
export const POTS_MAX = THEMES.length;

/**
 * `POST /api/pots`: the name (trimmed, 1–30), the target (integer cents) and the theme (one of the
 * fifteen), all required. Unknown keys are stripped, so a `total` in the body is dropped: a pot's
 * total changes only by a move (2.12).
 */
export const PotCreateSchema = z.object({
  name: PotNameSchema,
  target: AmountCentsSchema,
  theme: ThemeSchema,
});
export type PotCreateInput = z.infer<typeof PotCreateSchema>;

/**
 * `PATCH /api/pots/:id`: the same three fields, all required, as the edit form sends them (2.12;
 * partial edits are out of scope, §8).
 */
export const PotUpdateSchema = z.object({
  name: PotNameSchema,
  target: AmountCentsSchema,
  theme: ThemeSchema,
});
export type PotUpdateInput = z.infer<typeof PotUpdateSchema>;

/** `POST /api/pots/:id/deposit` and `…/withdraw`: the amount in integer cents. */
export const PotMoneyMoveSchema = z.object({ amount: AmountCentsSchema });
export type PotMoneyMoveInput = z.infer<typeof PotMoneyMoveSchema>;

/** One pot as the card shows it, with its id (US-39 AC2). No `seq`: the order of `items` is the order. */
export const PotDtoSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1).max(POT_NAME_MAX),
  theme: ThemeSchema,
  target: AmountCentsSchema,
  /** May exceed the target (data-model.md). */
  total: NonNegativeCents,
  /** `potPercent(total, target)`: 795 means 7.95 % (2.3). */
  percentBasisPoints: z.int().nonnegative(),
});
export type PotDto = z.infer<typeof PotDtoSchema>;

/** Current Balance: what a deposit may not exceed. */
const PotsBalanceSchema = z.strictObject({ current: NonNegativeCents });

/** `GET /api/pots`: the balance and every pot in creation order; no sum of the totals (2.12). */
export const PotsDtoSchema = z.strictObject({
  balance: PotsBalanceSchema,
  items: z.array(PotDtoSchema).max(POTS_MAX),
});
export type PotsDto = z.infer<typeof PotsDtoSchema>;

/** The create's and the edit's answer: the record under its noun (2.12). */
export const PotWriteDtoSchema = z.strictObject({ pot: PotDtoSchema });
export type PotWriteDto = z.infer<typeof PotWriteDtoSchema>;

/** A deposit's and a withdrawal's answer: the pot and the balance the move leaves. */
export const PotMoneyMoveDtoSchema = z.strictObject({
  pot: PotDtoSchema,
  balance: PotsBalanceSchema,
});
export type PotMoneyMoveDto = z.infer<typeof PotMoneyMoveDtoSchema>;

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

/**
 * `GET /api/admin/reset` → 200 when the daily check finds no reset due yet
 * (SPEC-reset-and-test-support §2.3 v1.4): `dueAt` is the earliest check that will reset.
 */
export const ScheduledResetSkippedSchema = z.strictObject({
  reset: z.literal(false),
  dueAt: UtcDateTime,
});
export type ScheduledResetSkipped = z.infer<typeof ScheduledResetSkippedSchema>;
