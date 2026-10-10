import { describe, expect, it, vi } from "vitest";
import {
  FORBIDDEN_BODY,
  UNSUPPORTED_TYPE_BODY,
  WRITE_EXEMPT_PATHS,
  isContentTypeRefused,
  isCrossSite,
  isWriteRequest,
  logRefusal,
} from "@/src/server/write-rules";
import { ErrorEnvelopeSchema } from "@/src/shared/schemas";

const headers = (entries: Record<string, string>) => new Headers(entries);

describe("isWriteRequest — SPEC-write-path §6 'API', 2.3", () => {
  it.each(["POST", "PUT", "PATCH", "DELETE"])("%s under /api/ is a write", (method) => {
    expect(isWriteRequest(method, "/api/budgets")).toBe(true);
  });

  it.each(["post", "Patch", "delete", "pUt"])(
    "matches %s in any letter case (7.1, v1.0.3; Node answers it 400 before the proxy)",
    (method) => {
      expect(isWriteRequest(method, "/api/pots/1")).toBe(true);
    },
  );

  it.each(["GET", "HEAD", "OPTIONS", "get", "options"])("%s never writes", (method) => {
    expect(isWriteRequest(method, "/api/budgets")).toBe(false);
  });

  it("is only under /api/", () => {
    expect(isWriteRequest("POST", "/overview")).toBe(false);
    expect(isWriteRequest("POST", "/apix/budgets")).toBe(false);
  });

  it.each([...WRITE_EXEMPT_PATHS, "/api/test/reset", "/api/test/seed"])(
    "exempts %s (2.3, §9 Q8)",
    (path) => {
      expect(isWriteRequest("POST", path)).toBe(false);
    },
  );

  it("matches the exempt list exactly: /api/auth/login.json and /api/admin/reset/x are writes", () => {
    expect(isWriteRequest("POST", "/api/auth/login.json")).toBe(true);
    expect(isWriteRequest("POST", "/api/admin/reset/x")).toBe(true);
    expect(isWriteRequest("POST", "/api/testing")).toBe(true);
  });

  it("holds the exempt list to the five entries of 2.3", () => {
    expect(WRITE_EXEMPT_PATHS).toEqual([
      "/api/auth/login",
      "/api/auth/signup",
      "/api/auth/logout",
      "/api/admin/reset",
    ]);
  });
});

describe("isCrossSite — 2.3", () => {
  it("refuses exactly cross-site", () => {
    expect(isCrossSite(headers({ "sec-fetch-site": "cross-site" }))).toBe(true);
  });

  it.each(["same-origin", "same-site", "none"])("lets %s pass", (value) => {
    expect(isCrossSite(headers({ "sec-fetch-site": value }))).toBe(false);
  });

  it("lets an absent header pass (an old client is defended by SameSite=Lax)", () => {
    expect(isCrossSite(headers({}))).toBe(false);
  });
});

describe("isContentTypeRefused — 2.4", () => {
  it.each([
    "text/plain",
    "application/x-www-form-urlencoded",
    "multipart/form-data; boundary=x",
    "text/plain; x=application/json",
    "application/jsonx",
    "",
  ])("refuses %j on a POST", (type) => {
    expect(isContentTypeRefused("POST", headers({ "content-type": type }))).toBe(true);
  });

  it.each(["application/json", "Application/JSON", "application/json; charset=utf-8"])(
    "lets %j pass",
    (type) => {
      expect(isContentTypeRefused("PATCH", headers({ "content-type": type }))).toBe(false);
    },
  );

  it.each(["POST", "PUT", "PATCH"])("refuses a %s that declares no type", (method) => {
    expect(isContentTypeRefused(method, headers({}))).toBe(true);
  });

  it("lets a bodiless DELETE pass, and refuses one declaring text/plain", () => {
    expect(isContentTypeRefused("DELETE", headers({}))).toBe(false);
    expect(isContentTypeRefused("DELETE", headers({ "content-type": "text/plain" }))).toBe(true);
    expect(isContentTypeRefused("delete", headers({}))).toBe(false);
  });
});

describe("the refusal bodies — 2.6", () => {
  it("are ErrorEnvelopes: 403 forbidden with its message, 415 validation with [] invalid_format", () => {
    expect(ErrorEnvelopeSchema.parse(FORBIDDEN_BODY)).toEqual({
      error: "forbidden",
      message: "This request must be same-origin",
    });
    expect(ErrorEnvelopeSchema.parse(UNSUPPORTED_TYPE_BODY)).toEqual({
      error: "validation",
      issues: [{ path: [], code: "invalid_format" }],
    });
  });
});

describe("logRefusal — 2.12, tested here (7.1, v1.0.3)", () => {
  it("writes one JSON line, exactly { requestId, status, method, route }", () => {
    const write = vi.fn();
    logRefusal({ requestId: "r-1", status: 415, method: "POST", route: "/api/pots" }, write);
    expect(write).toHaveBeenCalledTimes(1);
    expect(JSON.parse(write.mock.calls[0]![0] as string)).toEqual({
      requestId: "r-1",
      status: 415,
      method: "POST",
      route: "/api/pots",
    });
  });
});
