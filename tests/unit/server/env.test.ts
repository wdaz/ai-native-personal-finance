import { describe, expect, it } from "vitest";
import { demoCredentials, demoPasswordHash, webmcpOriginTrialToken } from "@/src/server/env";

describe("demoPasswordHash", () => {
  it("returns a well-formed bcrypt hash", () => {
    const hash = "$2b$10$bhzxOh.akrgXdDStGY5q7OZBbpZASLI0ZZZKd7FaugCHNaAhj/3hi";
    expect(demoPasswordHash({ DEMO_PASSWORD_HASH: hash })).toBe(hash);
  });

  it("throws when unset", () => {
    expect(() => demoPasswordHash({})).toThrow(/DEMO_PASSWORD_HASH/);
  });

  it("throws when the value is not a $2[aby]$NN$... bcrypt hash — e.g. a mangled/escaped one", () => {
    expect(() => demoPasswordHash({ DEMO_PASSWORD_HASH: "\\$2b\\$10\\$notreallyahash" })).toThrow(
      /bcrypt/,
    );
  });
});

describe("demoCredentials", () => {
  it("returns the demo email and the displayed password", () => {
    expect(
      demoCredentials({ DEMO_EMAIL: "demo@example.com", DEMO_PASSWORD_DISPLAY: "shown-on-login" }),
    ).toEqual({ email: "demo@example.com", password: "shown-on-login" });
  });

  it.each([
    [{ DEMO_PASSWORD_DISPLAY: "shown-on-login" }],
    [{ DEMO_EMAIL: "demo@example.com" }],
    [{ DEMO_EMAIL: "", DEMO_PASSWORD_DISPLAY: "shown-on-login" }],
  ])("throws when a value is missing: %j", (env) => {
    expect(() => demoCredentials(env)).toThrow(/DEMO_EMAIL and DEMO_PASSWORD_DISPLAY/);
  });
});

describe("webmcpOriginTrialToken (SPEC-app-shell §2.1, ADR-0007)", () => {
  it("is null when WEBMCP_ORIGIN_TRIAL_TOKEN is unset, empty or blank", () => {
    expect(webmcpOriginTrialToken({})).toBeNull();
    expect(webmcpOriginTrialToken({ WEBMCP_ORIGIN_TRIAL_TOKEN: "" })).toBeNull();
    expect(webmcpOriginTrialToken({ WEBMCP_ORIGIN_TRIAL_TOKEN: "   " })).toBeNull();
  });

  it("returns the token, trimmed", () => {
    expect(webmcpOriginTrialToken({ WEBMCP_ORIGIN_TRIAL_TOKEN: " Aq1+/= " })).toBe("Aq1+/=");
  });
});
