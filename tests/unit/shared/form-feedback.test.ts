import { describe, expect, it } from "vitest";
import { COPY } from "@/src/shared/copy";
import {
  fieldErrors,
  loginFailureMessage,
  signupFieldErrors,
  signupIssueMessage,
} from "@/src/shared/form-feedback";
import { LoginSchema, SignupSchema, toErrorIssues } from "@/src/shared/schemas";

describe("fieldErrors (US-31: one message per field)", () => {
  it("is empty for valid input", () => {
    expect(fieldErrors(LoginSchema, { email: "demo@example.com", password: "x" })).toEqual({});
  });

  it("gives each empty login field 'Can't be empty' (US-01 AC2)", () => {
    expect(fieldErrors(LoginSchema, { email: "", password: "" })).toEqual({
      email: COPY.required,
      password: COPY.required,
    });
  });

  it("reads a whitespace-only email as empty — the schema trims it (SPEC-auth §4)", () => {
    expect(fieldErrors(LoginSchema, { email: "   ", password: "x" })).toEqual({
      email: COPY.required,
    });
  });

  it("never trims a password: three spaces are a password", () => {
    expect(fieldErrors(LoginSchema, { email: "demo@example.com", password: "   " })).toEqual({});
  });

  it("gives each sign-up field its own first message (US-02 AC1)", () => {
    expect(fieldErrors(SignupSchema, { name: "", email: "a@", password: "short" })).toEqual({
      name: COPY.required,
      email: COPY.emailInvalid,
      password: COPY.passwordTooShort,
    });
  });
});

describe("loginFailureMessage (SPEC-auth §2.4)", () => {
  it("401 → 'Email or password is incorrect'", () => {
    expect(loginFailureMessage(401, { error: "invalid_credentials" })).toBe(COPY.loginIncorrect);
  });

  it("429 → minutes from retryAfter, rounded up (§4: N = max(1, ceil(retryAfter / 60)))", () => {
    const body = { error: "rate_limited", message: "Too many attempts", retryAfter: 899 };
    expect(loginFailureMessage(429, body)).toBe("Too many attempts. Try again in 15 minutes");
  });

  it("429 with under a minute left → '1 minute', singular", () => {
    const body = { error: "rate_limited", message: "Too many attempts", retryAfter: 30 };
    expect(loginFailureMessage(429, body)).toBe("Too many attempts. Try again in 1 minute");
  });

  it("429 without a retryAfter → the generic message, never an invented N (plan D8)", () => {
    expect(loginFailureMessage(429, { error: "rate_limited", message: "Too many attempts" })).toBe(
      COPY.loginFailed,
    );
    expect(loginFailureMessage(429, null)).toBe(COPY.loginFailed);
  });

  it.each([400, 403, 404, 500, 502, 503])("%i → 'Something went wrong. Try again'", (status) => {
    expect(loginFailureMessage(status, null)).toBe(COPY.loginFailed);
  });
});

describe("signupIssueMessage (SPEC-auth §2.10: the client owns the words)", () => {
  const failing: Record<string, unknown>[] = [
    {},
    { name: "", email: "a@b.co", password: "long-enough" },
    { name: "x".repeat(61), email: "a@b.co", password: "long-enough" },
    { name: "Alex", email: "", password: "long-enough" },
    { name: "Alex", email: "not-an-email", password: "long-enough" },
    { name: "Alex", email: `${"a".repeat(250)}@b.co`, password: "long-enough" },
    { name: "Alex", email: "a@b.co", password: "" },
    { name: "Alex", email: "a@b.co", password: "short" },
    { name: "Alex", email: "a@b.co", password: "p".repeat(129) },
  ];

  // The server's 400 carries codes; mapped back, they read exactly as the client-side schema's
  // own message for the same input — whichever side catches a failure, the user sees one text.
  it.each(failing)("reads as the schema's own message for %j", (input) => {
    const result = SignupSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toErrorIssues(result.error).map(signupIssueMessage)).toEqual(
      result.error.issues.map((issue) => issue.message),
    );
  });

  it("has no message for a field sign-up does not have", () => {
    expect(signupIssueMessage({ path: ["amount"], code: "too_long" })).toBeUndefined();
  });

  it("has no message for a code the field never produces", () => {
    expect(signupIssueMessage({ path: ["name"], code: "invalid_format" })).toBeUndefined();
  });
});

describe("signupFieldErrors", () => {
  it("maps a validation envelope to one message per field", () => {
    const body = {
      error: "validation",
      issues: [
        { path: ["email"], code: "invalid_format" },
        { path: ["password"], code: "too_short" },
        { path: ["password"], code: "too_long" },
      ],
    };
    expect(signupFieldErrors(body)).toEqual({
      email: COPY.emailInvalid,
      password: COPY.passwordTooShort,
    });
  });

  it.each([null, "oops", { error: "server_error", message: "Boom" }, { error: "validation" }])(
    "is empty for a body that is not a usable validation envelope: %j",
    (body) => {
      expect(signupFieldErrors(body)).toEqual({});
    },
  );
});
