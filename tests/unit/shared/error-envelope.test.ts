import { describe, expect, it } from "vitest";
import { z } from "zod";
import { errorResponse } from "@/src/server/http";
import {
  ERROR_CODES,
  ErrorEnvelopeSchema,
  ErrorIssueSchema,
  LoginSchema,
  SignupSchema,
  toErrorIssues,
  VALIDATION_ISSUE_CODES,
} from "@/src/shared/schemas";

const valid = (body: unknown) => ErrorEnvelopeSchema.safeParse(body).success;
const issuesOf = (schema: z.ZodType, input: unknown) => {
  const result = schema.safeParse(input);
  if (result.success) throw new Error("expected a failed parse");
  return toErrorIssues(result.error);
};

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

  it("accepts a 400 validation body with no message — owner decision, T-04 plan gate finding 3", () => {
    // SignupSchema, not LoginSchema: login never sends this body at all (§2.10, security
    // decision below) — signup is the schema that actually ships a validation/issues 400.
    const body = JSON.parse(
      JSON.stringify({
        error: "validation",
        issues: issuesOf(SignupSchema, { name: "", email: "", password: "" }),
      }),
    );
    expect(body.message).toBeUndefined();
    expect(ErrorEnvelopeSchema.parse(body)).toEqual({
      error: "validation",
      issues: [
        { path: ["name"], code: "required" },
        { path: ["email"], code: "required" },
        { path: ["password"], code: "required" },
      ],
    });
  });

  it("POST /api/auth/login never sends 400 — a LoginSchema failure is 401 invalid_credentials, not validation (owner decision, security)", () => {
    // The endpoint gives no oracle for which field, or which kind of failure, a request hit:
    // a malformed body and a genuinely wrong email/password read identically.
    expect(valid({ error: "invalid_credentials", message: "Email or password is incorrect" })).toBe(
      true,
    );
    // LoginSchema itself still runs (T-06 uses it for on-page validation before ever sending a
    // request); this only says the route never turns its failure into a 400 issues body.
    expect(issuesOf(LoginSchema, { email: "", password: "" }).length).toBeGreaterThan(0);
  });

  it("accepts rate_limited with a whole, positive number of seconds", () => {
    expect(valid({ error: "rate_limited", message: "Too many", retryAfter: 1 })).toBe(true);
    for (const retryAfter of [0, -60, 1.5, "60"]) {
      expect(valid({ error: "rate_limited", message: "Too many", retryAfter })).toBe(false);
    }
  });

  it("takes message as optional — present for 401/429, absent for 400", () => {
    expect(valid({ error: "not_found" })).toBe(true);
    expect(valid({ error: "invalid_credentials", message: "Email or password is incorrect" })).toBe(
      true,
    );
  });

  it("refuses an unknown code, an empty message, and unlisted fields", () => {
    expect(valid({ error: "forbidden", message: "No" })).toBe(false);
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

describe("ErrorIssueSchema — path and code only (owner decision, T-04 plan gate finding 3)", () => {
  it(`is exactly one of the four codes: ${VALIDATION_ISSUE_CODES.join(", ")}`, () => {
    expect(VALIDATION_ISSUE_CODES).toEqual(["required", "invalid_format", "too_short", "too_long"]);
  });

  it("refuses a message or any other field — no Zod strings, no echoed values", () => {
    expect(ErrorIssueSchema.safeParse({ path: ["email"], code: "required" }).success).toBe(true);
    expect(
      ErrorIssueSchema.safeParse({ path: ["email"], code: "required", message: "Can't be empty" })
        .success,
    ).toBe(false);
    expect(
      ErrorIssueSchema.safeParse({ path: ["password"], code: "required", input: "short1" }).success,
    ).toBe(false);
  });

  it("refuses a code outside the four", () => {
    expect(ErrorIssueSchema.safeParse({ path: ["email"], code: "invalid_type" }).success).toBe(
      false,
    );
  });
});

describe("toErrorIssues — every case SignupSchema can produce (measured, T-04 plan gate finding 3); a generic ZodError-to-issues mapper, not auth-specific — LoginSchema uses it too (its own test above), even though POST /api/auth/login never ships the result", () => {
  it("a missing or wrong-typed field is required", () => {
    expect(issuesOf(SignupSchema, { email: "a@b.co", password: "p".repeat(10) })).toEqual([
      { path: ["name"], code: "required" },
    ]);
    expect(issuesOf(SignupSchema, { name: 5, email: "a@b.co", password: "p".repeat(10) })).toEqual([
      { path: ["name"], code: "required" },
    ]);
  });

  it("a malformed email is invalid_format", () => {
    expect(
      issuesOf(SignupSchema, { name: "n", email: "not-an-email", password: "p".repeat(10) }),
    ).toEqual([{ path: ["email"], code: "invalid_format" }]);
  });

  it("an email over 254 characters is too_long — the client maps it to the same copy as invalid_format", () => {
    expect(
      issuesOf(SignupSchema, {
        name: "n",
        email: "a".repeat(250) + "@b.co",
        password: "p".repeat(10),
      }),
    ).toEqual([{ path: ["email"], code: "too_long" }]);
  });

  it("a name over 60 or a password over 128 characters is too_long", () => {
    expect(
      issuesOf(SignupSchema, { name: "n".repeat(61), email: "a@b.co", password: "p".repeat(10) }),
    ).toEqual([{ path: ["name"], code: "too_long" }]);
    expect(
      issuesOf(SignupSchema, { name: "n", email: "a@b.co", password: "p".repeat(129) }),
    ).toEqual([{ path: ["password"], code: "too_long" }]);
  });

  it("a password under 8 characters (but present) is too_short, not required", () => {
    expect(issuesOf(SignupSchema, { name: "n", email: "a@b.co", password: "p" })).toEqual([
      { path: ["password"], code: "too_short" },
    ]);
  });

  it("keeps array indices as numbers and writes symbol keys as text", () => {
    const key = Symbol("hidden");
    const schema = z.object({ rows: z.array(z.string()), [key]: z.string() });
    expect(issuesOf(schema, { rows: ["a", 1], [key]: 2 }).map((issue) => issue.path)).toEqual([
      ["rows", 1],
      ["Symbol(hidden)"],
    ]);
  });

  it("throws on a Zod issue code it has no mapping for, rather than mis-report it", () => {
    const schema = z.object({ kind: z.enum(["a", "b"]) });
    expect(() => issuesOf(schema, { kind: "c" })).toThrow(
      'No validation code mapped for Zod issue code "invalid_value"',
    );
  });
});
