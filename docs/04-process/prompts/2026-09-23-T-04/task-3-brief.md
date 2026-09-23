### Task 3: Auth schemas and the error envelope

Owner answers 2 and 5, and finding F2.

**Files:**
- Modify: `docs/03-specs/auth.md` (v1.0.1)
- Create: `src/shared/schemas.ts` (auth and errors)
- Modify: `src/server/http.ts`
- Create: `tests/unit/shared/auth-schemas.test.ts`, `tests/unit/shared/error-envelope.test.ts`

**Interfaces:**
- Consumes: `COPY` (Task 2).
- Produces, in `src/shared/schemas.ts`: `EMAIL_PATTERN: RegExp`, `EMAIL_MAX = 254`,
  `NAME_MAX = 60`, `PASSWORD_MIN = 8`, `PASSWORD_MAX = 128`; `LoginSchema`, `SignupSchema` and the
  types `LoginInput`, `SignupInput`; `LoginResponseSchema`, `SignupResponseSchema`,
  `SessionResponseSchema`; `ERROR_CODES` and `ErrorCode`; `ErrorIssueSchema` / `ErrorIssue`;
  `ErrorEnvelopeSchema` / `ErrorEnvelope` (`z.infer`); `toErrorIssues(error: z.ZodError):
  ErrorIssue[]`. `src/server/http.ts` keeps `ApiErrorCode` (now `ErrorEnvelope["error"]`) and
  `errorResponse(status: number, error: ApiErrorCode, message: string): Response`, unchanged.

- [ ] **Step 1: Amend SPEC-auth (v1.0.1, finding F2)**

```diff
--- a/docs/03-specs/auth.md
+++ b/docs/03-specs/auth.md
@@ -1,7 +1,7 @@
 # SPEC-auth — Demo login, sign-up screen, logout, session
 
-Status: **Approved** (v1.0, owner approval 2026-09-20) · Author(s): Agent · Date: 2026-09-20
-Changelog: v0.2 — S-15 blur rule per US-31; S-16 sessions end on reset; S-17 route matrix + error envelope; S-18 rate-limit maths; S-29 back-navigation; S-30 `next` rule.
+Status: **Approved** (v1.0.1 — 2026-09-23: §6 error bodies carry `message`; v1.0, owner approval 2026-09-20) · Author(s): Agent · Date: 2026-09-20
+Changelog: v1.0.1 (2026-09-23, owner decision at the T-04 plan gate, finding F2) — §6's 401 and 429 bodies show the `message` §2.10 requires; §2.10 is unchanged. v0.2 — S-15 blur rule per US-31; S-16 sessions end on reset; S-17 route matrix + error envelope; S-18 rate-limit maths; S-29 back-navigation; S-30 `next` rule.
 Implements: US-01, US-02, US-03, US-31 (for these forms), US-32 (for these screens) · Constrained by: ADR-0006, ADR-0002, NFR-S1/S2/S4/S6, NFR-A · Design: `inputs/design/app-prototype.html` "Auth" screen (illustration panel left, form card right; mobile: form only, illustration hidden)
 
 ## 1. Purpose
@@ -46,7 +46,7 @@
 ### API
 | Method | Path | Body (Zod) | Responses |
 |--------|------|------------|-----------|
-| POST | `/api/auth/login` | `LoginSchema { email, password }` | 200 `{ ok: true }` + Set-Cookie · 400 `{ error: "validation", issues }` · 401 `{ error: "invalid_credentials" }` · 429 `{ error: "rate_limited", retryAfter }` |
+| POST | `/api/auth/login` | `LoginSchema { email, password }` | 200 `{ ok: true }` + Set-Cookie · 400 `{ error: "validation", issues }` · 401 `{ error: "invalid_credentials", message: "Email or password is incorrect" }` · 429 `{ error: "rate_limited", message: "Too many attempts", retryAfter }` |
 | POST | `/api/auth/signup` | `SignupSchema { name(1–60), email, password(8–128) }` | 200 `{ code: "demo_instance" }` · 400 validation |
 | POST | `/api/auth/logout` | — | 204 + cookie cleared |
 | GET | `/api/auth/session` | — | 200 `{ authenticated: boolean }` (used by E2E and the shell) |
```

- [ ] **Step 2: Write the failing tests**

`tests/unit/shared/auth-schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { COPY } from "@/src/shared/copy";
import {
  LoginResponseSchema,
  LoginSchema,
  SessionResponseSchema,
  SignupResponseSchema,
  SignupSchema,
} from "@/src/shared/schemas";

/** `[path, message]` for every issue — what US-31 shows under each field, in field order. */
const messages = (schema: z.ZodType, input: unknown) => {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => [i.path.join("."), i.message]);
};

/** An address of exactly `length` characters. */
const emailOf = (length: number) => `${"m".repeat(length - "@example.org".length)}@example.org`;

/**
 * SPEC-auth §4 and §6, typed here rather than imported: a test that read the schema's own
 * constants would pass whatever the constants said.
 */
const EMAIL_MAX = 254;
const NAME_MAX = 60;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

const login = { email: "reader@example.org", password: "hunter22" };
const signup = { name: "Ada Reader", email: "reader@example.org", password: "hunter22" };

describe("LoginSchema (SPEC-auth §2.3, §4; US-31)", () => {
  it("accepts an email and a password, and trims the email", () => {
    expect(LoginSchema.parse({ ...login, email: "  reader@example.org " })).toEqual(login);
  });

  it.each([
    ["empty", ""],
    ["blank", "   "],
    ["missing", undefined],
    ["not text", 42],
  ])('an email that is %s reads "Can\'t be empty", once', (_, email) => {
    expect(messages(LoginSchema, { ...login, email })).toEqual([["email", COPY.required]]);
  });

  it.each(["reader", "reader@example", "rea der@example.org", "@example.org", "reader@.org"])(
    'a malformed email (%s) reads "Enter a valid email address"',
    (email) => {
      expect(messages(LoginSchema, { ...login, email })).toEqual([["email", COPY.emailInvalid]]);
    },
  );

  it(`accepts an email of ${EMAIL_MAX} characters and refuses one of ${EMAIL_MAX + 1}`, () => {
    expect(messages(LoginSchema, { ...login, email: emailOf(EMAIL_MAX) })).toEqual([]);
    expect(messages(LoginSchema, { ...login, email: emailOf(EMAIL_MAX + 1) })).toEqual([
      ["email", COPY.emailInvalid],
    ]);
  });

  it("measures the email after trimming", () => {
    expect(messages(LoginSchema, { ...login, email: `  ${emailOf(EMAIL_MAX)}  ` })).toEqual([]);
  });

  it("only checks that a password is present: blank counts, and it is never trimmed", () => {
    expect(LoginSchema.parse({ ...login, password: "   " }).password).toBe("   ");
    expect(LoginSchema.parse({ ...login, password: " x " }).password).toBe(" x ");
    expect(messages(LoginSchema, { ...login, password: "" })).toEqual([
      ["password", COPY.required],
    ]);
    expect(messages(LoginSchema, { email: login.email })).toEqual([["password", COPY.required]]);
  });

  it("reports both fields, email first — the field that receives focus (US-31 AC2)", () => {
    expect(messages(LoginSchema, {})).toEqual([
      ["email", COPY.required],
      ["password", COPY.required],
    ]);
  });
});

describe("SignupSchema (SPEC-auth §6: name 1–60, email, password 8–128)", () => {
  it("accepts a name, an email and a password, and trims name and email", () => {
    expect(SignupSchema.parse({ ...signup, name: " Ada Reader  " })).toEqual(signup);
  });

  it.each(["", "   "])('a name of %j reads "Can\'t be empty"', (name) => {
    expect(messages(SignupSchema, { ...signup, name })).toEqual([["name", COPY.required]]);
  });

  it(`accepts a name of ${NAME_MAX} characters, measured after trimming, and refuses ${NAME_MAX + 1}`, () => {
    expect(messages(SignupSchema, { ...signup, name: ` ${"n".repeat(NAME_MAX)} ` })).toEqual([]);
    expect(messages(SignupSchema, { ...signup, name: "n".repeat(NAME_MAX + 1) })).toEqual([
      ["name", COPY.nameTooLong],
    ]);
  });

  it('an empty password reads "Can\'t be empty", not the length rule', () => {
    expect(messages(SignupSchema, { ...signup, password: "" })).toEqual([
      ["password", COPY.required],
    ]);
  });

  it(`accepts ${PASSWORD_MIN} and ${PASSWORD_MAX} characters; refuses ${PASSWORD_MIN - 1} and ${PASSWORD_MAX + 1}`, () => {
    const withPassword = (length: number) => ({ ...signup, password: "p".repeat(length) });
    expect(messages(SignupSchema, withPassword(PASSWORD_MIN))).toEqual([]);
    expect(messages(SignupSchema, withPassword(PASSWORD_MAX))).toEqual([]);
    expect(messages(SignupSchema, withPassword(PASSWORD_MIN - 1))).toEqual([
      ["password", COPY.passwordTooShort],
    ]);
    expect(messages(SignupSchema, withPassword(PASSWORD_MAX + 1))).toEqual([
      ["password", COPY.passwordTooLong],
    ]);
  });

  it("uses the same email rule as the login", () => {
    expect(messages(SignupSchema, { ...signup, email: "reader@example" })).toEqual([
      ["email", COPY.emailInvalid],
    ]);
    expect(messages(SignupSchema, { ...signup, email: emailOf(EMAIL_MAX + 1) })).toEqual([
      ["email", COPY.emailInvalid],
    ]);
  });

  it("never echoes the password back in an issue", () => {
    const secret = "short1";
    const result = SignupSchema.safeParse({ ...signup, password: secret });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).not.toContain(secret);
  });
});

describe("the auth response bodies (SPEC-auth §6)", () => {
  it("login answers { ok: true } and nothing else", () => {
    expect(LoginResponseSchema.safeParse({ ok: true }).success).toBe(true);
    expect(LoginResponseSchema.safeParse({ ok: false }).success).toBe(false);
    expect(LoginResponseSchema.safeParse({ ok: true, token: "x" }).success).toBe(false);
  });

  it('sign-up answers { code: "demo_instance" }', () => {
    expect(SignupResponseSchema.safeParse({ code: "demo_instance" }).success).toBe(true);
    expect(SignupResponseSchema.safeParse({ code: "created" }).success).toBe(false);
  });

  it("the session answers { authenticated: boolean }", () => {
    expect(SessionResponseSchema.safeParse({ authenticated: false }).success).toBe(true);
    expect(SessionResponseSchema.safeParse({ authenticated: "yes" }).success).toBe(false);
  });
});
```

`tests/unit/shared/error-envelope.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { errorResponse } from "@/src/server/http";
import { ERROR_CODES, ErrorEnvelopeSchema, LoginSchema, toErrorIssues } from "@/src/shared/schemas";

const valid = (body: unknown) => ErrorEnvelopeSchema.safeParse(body).success;

describe("ErrorEnvelope (SPEC-auth §2.10)", () => {
  it("has exactly the seven codes of §2.10", () => {
    expect(ERROR_CODES).toEqual([
      "validation",
      "invalid_credentials",
      "rate_limited",
      "unauthenticated",
      "not_found",
      "conflict",
      "server_error",
    ]);
  });

  it("accepts a validation error carrying a failed parse's issues, after a JSON round trip", () => {
    const result = LoginSchema.safeParse({ email: "", password: "" });
    if (result.success) throw new Error("expected a failed parse");
    const body = JSON.parse(
      JSON.stringify({
        error: "validation",
        message: "Invalid",
        issues: toErrorIssues(result.error),
      }),
    );
    expect(ErrorEnvelopeSchema.parse(body).issues?.map((issue) => issue.path)).toEqual([
      ["email"],
      ["password"],
    ]);
  });

  it("accepts rate_limited with a whole, positive number of seconds", () => {
    expect(valid({ error: "rate_limited", message: "Too many", retryAfter: 1 })).toBe(true);
    for (const retryAfter of [0, -60, 1.5, "60"]) {
      expect(valid({ error: "rate_limited", message: "Too many", retryAfter })).toBe(false);
    }
  });

  it("refuses an unknown code, a missing or empty message, and unlisted fields", () => {
    expect(valid({ error: "forbidden", message: "No" })).toBe(false);
    expect(valid({ error: "not_found" })).toBe(false);
    expect(valid({ error: "not_found", message: "" })).toBe(false);
    expect(valid({ error: "not_found", message: "Gone", stack: "at …" })).toBe(false);
  });

  it("is what src/server/http.ts writes (T-02)", async () => {
    for (const code of ERROR_CODES) {
      expect(ErrorEnvelopeSchema.parse(await errorResponse(400, code, "Message").json())).toEqual({
        error: code,
        message: "Message",
      });
    }
  });
});

describe("toErrorIssues", () => {
  it("keeps array indices as numbers and writes symbol keys as text", () => {
    const key = Symbol("hidden");
    const schema = z.object({ rows: z.array(z.string()), [key]: z.string() });
    const result = schema.safeParse({ rows: ["a", 1], [key]: 2 });
    if (result.success) throw new Error("expected a failed parse");
    expect(toErrorIssues(result.error).map((issue) => issue.path)).toEqual([
      ["rows", 1],
      ["Symbol(hidden)"],
    ]);
  });
});
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run tests/unit/shared/auth-schemas.test.ts tests/unit/shared/error-envelope.test.ts`
Expected (*measured*, E15): FAIL, both files — "Cannot find package '@/src/shared/schemas'".

- [ ] **Step 4: Write `src/shared/schemas.ts` (auth and errors)**

```ts
import { z } from "zod";
import { COPY } from "./copy";

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
```

- [ ] **Step 5: Run the auth tests**

Run: `npx vitest run tests/unit/shared/auth-schemas.test.ts`
Expected (*measured*): **25 passed (25)**.

- [ ] **Step 6: `ApiErrorCode` from the envelope (answer 5)**

Replace the whole of `src/server/http.ts` with (the signature and the body it writes are
unchanged; only the union becomes the schema's type):

```ts
import type { ErrorEnvelope } from "@/src/shared/schemas";

/**
 * SPEC-auth §2.10: every API error is an `ErrorEnvelope` (src/shared/schemas.ts). The codes
 * are the schema's own, so this file keeps no list of them.
 */
export type ApiErrorCode = ErrorEnvelope["error"];

export function errorResponse(status: number, error: ApiErrorCode, message: string): Response {
  const body: ErrorEnvelope = { error, message };
  return Response.json(body, { status });
}
```

- [ ] **Step 7: Run the envelope tests**

Run: `npx vitest run tests/unit/shared/error-envelope.test.ts tests/unit/test-support.test.ts`
Expected (*measured*): error-envelope **6 passed (6)** — including the test that parses every
code `errorResponse` can write; `test-support.test.ts` passes unchanged (in the full suite, E15).

- [ ] **Step 8: All unit gates**

Run: `npx prettier --write src/shared src/server/http.ts tests/unit/shared && npm run lint && npm run format:check && npm run typecheck && npm test`
Expected (*measured*, E15): every command exits 0; Vitest **395/395**.

- [ ] **Step 9: Commit (the document, then the code)**

```bash
git add docs/03-specs/auth.md
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "docs(auth): v1.0.1 — §6 error bodies carry the message §2.10 requires (T-04 plan gate, F2)"
git add src/shared/schemas.ts src/server/http.ts tests/unit/shared/auth-schemas.test.ts tests/unit/shared/error-envelope.test.ts
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(shared): LoginSchema, SignupSchema and ErrorEnvelope; ApiErrorCode is the envelope's type (T-04)"
```

---

