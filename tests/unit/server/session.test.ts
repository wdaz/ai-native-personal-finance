import { describe, expect, it } from "vitest";
import {
  SESSION_REISSUE_AFTER_SECONDS,
  SESSION_TTL_SECONDS,
  isSessionValid,
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
