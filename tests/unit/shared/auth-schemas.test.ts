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

describe("Zod's JIT under the CSP (ADR-0006)", () => {
  // The login and sign-up forms parse in the browser, under a CSP without 'unsafe-eval'. Zod's
  // JIT probes `new Function("")` on the first parse; the throw is caught, but the browser still
  // reports a `securitypolicyviolation` (T-06 found it through the E2E CSP guard). `jitless`
  // skips the probe (zod/v4/core/util.js, `allowsEval`).
  it("schemas.ts switches Zod to jitless, so no parse probes eval", () => {
    expect(z.config().jitless).toBe(true);
  });
});

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
