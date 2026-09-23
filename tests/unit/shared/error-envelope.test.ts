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
