import { describe, expect, it } from "vitest";
import type { ApiOutcome } from "@/src/shared/api-client";
import { COPY } from "@/src/shared/copy";
import { AMOUNT_MESSAGES, writeAnswer } from "@/src/shared/write-feedback";

const http = (status: number, error: Record<string, unknown> | null = null): ApiOutcome<never> =>
  ({ ok: false, kind: "http", status, error }) as ApiOutcome<never>;

describe("writeAnswer — SPEC-write-path §3 as the write UI meets it (SPEC-ui-kit 2.3, 2.7; US-31 AC3)", () => {
  it("a success keeps its data, a 204's null included", () => {
    expect(writeAnswer({ ok: true, data: null })).toEqual({ kind: "ok", data: null });
    expect(writeAnswer({ ok: true, data: { id: "a" } })).toEqual({ kind: "ok", data: { id: "a" } });
  });

  it("a 400 with issues puts them under their fields (US-31 AC2)", () => {
    const issues = [{ path: ["amount"], code: "too_small" }];
    expect(writeAnswer(http(400, { error: "validation", issues }))).toEqual({
      kind: "validation",
      issues,
    });
  });

  it("404, 409 and 401 are the record gone, the data reset and the session ended", () => {
    expect(writeAnswer(http(404, { error: "not_found" }))).toEqual({ kind: "gone" });
    expect(writeAnswer(http(409, { error: "conflict" }))).toEqual({ kind: "reset" });
    expect(writeAnswer(http(401, { error: "unauthenticated" }))).toEqual({ kind: "session" });
  });

  it("a 429 says when to try again, from retryAfter ('1 second' for one)", () => {
    expect(writeAnswer(http(429, { error: "rate_limited", retryAfter: 1 }))).toEqual({
      kind: "failed",
      code: "rate_limited",
      message: "Too many changes. Try again in 1 second",
    });
    expect(writeAnswer(http(429, { error: "rate_limited", retryAfter: 30 }))).toMatchObject({
      message: COPY.writeRateLimited(30),
    });
  });

  it.each([
    [403, "forbidden"],
    [415, "validation"],
    [500, "server_error"],
    [503, "server_error"],
  ] as const)("a %i is %s with 'Something went wrong. Try again'", (status, code) => {
    expect(writeAnswer(http(status))).toEqual({
      kind: "failed",
      code,
      message: "Something went wrong. Try again",
    });
  });

  it("no answer says the server cannot be reached; an unreadable answer is a server error", () => {
    expect(writeAnswer({ ok: false, kind: "network" })).toEqual({
      kind: "failed",
      code: "server_error",
      message: "Can't reach the server. Check your connection and try again",
    });
    expect(writeAnswer({ ok: false, kind: "invalid_response", status: 200 })).toMatchObject({
      kind: "failed",
      code: "server_error",
      message: "Something went wrong. Try again",
    });
  });

  it("the amount codes read as write-path 2.7's messages, in the appendix's words (US-15 AC2)", () => {
    expect(AMOUNT_MESSAGES).toEqual({
      required: "Can't be empty",
      invalid_format: "Enter an amount with up to two decimals",
      too_small: "Amount must be greater than 0",
      too_large: "Amount is too large",
    });
  });
});
