import { describe, expect, it } from "vitest";
import {
  SESSION_REISSUE_AFTER_SECONDS,
  SESSION_TTL_SECONDS,
  isSessionValid,
  readCookie,
  sessionCookieHeader,
  shouldReissue,
  type SessionPayload,
} from "@/src/server/session";

const iat = Date.UTC(2026, 7, 19, 12, 0, 0);
const session: SessionPayload = { sub: "demo", iat, resetEpoch: iat };

describe("shouldReissue", () => {
  it("does not reissue just under the hour, does reissue just over it", () => {
    const justUnder = new Date(iat + SESSION_REISSUE_AFTER_SECONDS * 1000 - 1);
    const justOver = new Date(iat + SESSION_REISSUE_AFTER_SECONDS * 1000 + 1);
    expect(shouldReissue(session, justUnder)).toBe(false);
    expect(shouldReissue(session, justOver)).toBe(true);
  });
});

describe("isSessionValid", () => {
  it("is valid within the 7-day TTL and with no reset since login", () => {
    const now = new Date(iat + 1000);
    expect(isSessionValid(session, now, null)).toBe(true);
    expect(isSessionValid(session, now, new Date(iat - 1000))).toBe(true);
  });

  it("is invalid past the 7-day TTL", () => {
    const now = new Date(iat + SESSION_TTL_SECONDS * 1000 + 1);
    expect(isSessionValid(session, now, null)).toBe(false);
  });

  it("is invalid once a reset happened after login (resetEpoch stale)", () => {
    const now = new Date(iat + 1000);
    const resetAfterLogin = new Date(iat + 500);
    expect(isSessionValid(session, now, resetAfterLogin)).toBe(false);
  });

  it("is valid when the reset happened before login (resetEpoch current)", () => {
    const now = new Date(iat + 1000);
    const resetBeforeLogin = new Date(iat - 500);
    expect(isSessionValid(session, now, resetBeforeLogin)).toBe(true);
  });
});

describe("sessionCookieHeader", () => {
  it("omits Secure when secure=false (plain HTTP, e.g. localhost/CI)", () => {
    const header = sessionCookieHeader("sealed-value", 3600, false);
    expect(header).not.toContain("Secure");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
  });

  it("includes Secure when secure=true (HTTPS)", () => {
    const header = sessionCookieHeader("sealed-value", 3600, true);
    expect(header).toContain("; Secure");
  });
});

describe("readCookie", () => {
  it("finds the named cookie among several, RFC-6265-standard '; ' separated", () => {
    expect(readCookie("a=1; pf_session=abc; b=2", "pf_session")).toBe("abc");
  });

  it("finds it when it's the only cookie", () => {
    expect(readCookie("pf_session=abc", "pf_session")).toBe("abc");
  });

  it("finds it when separators omit the space — some non-browser clients do (Copilot review, Medium)", () => {
    expect(readCookie("a=1;pf_session=abc;b=2", "pf_session")).toBe("abc");
  });

  it("returns undefined when the header is null or the cookie is absent", () => {
    expect(readCookie(null, "pf_session")).toBeUndefined();
    expect(readCookie("a=1; b=2", "pf_session")).toBeUndefined();
  });
});
