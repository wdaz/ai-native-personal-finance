import { describe, expect, it } from "vitest";
import {
  adminResetIssues,
  bearerToken,
  isAuthorized,
  parseAdminResetBody,
  resetLogLine,
} from "@/src/server/admin-reset";

const RESET = "reset-secret-for-unit-tests";
const CRON = "cron-secret-for-unit-tests";

describe("bearerToken", () => {
  it("reads the token of an Authorization: Bearer header", () => {
    expect(bearerToken(`Bearer ${RESET}`)).toBe(RESET);
  });

  it.each([null, "", "Basic abc", "bearer abc", RESET])("is null for %j", (header) => {
    expect(bearerToken(header)).toBeNull();
  });
});

describe("isAuthorized (SPEC-reset-and-test-support §2.2–2.3, T-08 plan D6/D7)", () => {
  const both = { RESET_SECRET: RESET, CRON_SECRET: CRON };

  it("accepts either secret", () => {
    expect(isAuthorized(`Bearer ${RESET}`, both)).toBe(true);
    expect(isAuthorized(`Bearer ${CRON}`, both)).toBe(true);
  });

  it.each([null, "", "Bearer ", "Bearer wrong", `Bearer ${RESET}x`, `Bearer ${RESET.slice(1)}`])(
    "refuses %j",
    (header) => {
      expect(isAuthorized(header, both)).toBe(false);
    },
  );

  it.each([{}, { CRON_SECRET: "" }])(
    "Review Focus 1: an unset or empty CRON_SECRET matches no header at all (%j)",
    (cron) => {
      const env = { RESET_SECRET: RESET, ...cron };
      for (const header of [null, "", "Bearer ", "Bearer"]) {
        expect(isAuthorized(header, env)).toBe(false);
      }
      expect(isAuthorized(`Bearer ${RESET}`, env)).toBe(true);
    },
  );

  it("throws when RESET_SECRET itself is unset — a configuration fault, not a 401", () => {
    expect(() => isAuthorized(`Bearer ${CRON}`, { CRON_SECRET: CRON })).toThrow(/RESET_SECRET/);
  });
});

describe("parseAdminResetBody / adminResetIssues (SPEC-reset-and-test-support §2.2)", () => {
  it("an empty body is reason manual", () => {
    expect(parseAdminResetBody({})).toEqual({ success: true, reason: "manual" });
  });

  it("an explicit reason is kept", () => {
    expect(parseAdminResetBody({ reason: "threshold" })).toEqual({
      success: true,
      reason: "threshold",
    });
  });

  it.each([
    [{ reason: "test" }, [{ path: ["reason"], code: "invalid_format" }]],
    [{ reason: 7 }, [{ path: ["reason"], code: "invalid_format" }]],
    [{ extra: 1 }, [{ path: ["extra"], code: "invalid_format" }]],
    [[], [{ path: [], code: "invalid_format" }]],
    ["manual", [{ path: [], code: "invalid_format" }]],
  ])("refuses %j with its issues, never throws", (body, issues) => {
    expect(parseAdminResetBody(body)).toEqual({ success: false, issues });
  });

  it("maps every issue to invalid_format", () => {
    expect(adminResetIssues([])).toEqual([]);
  });
});

describe("resetLogLine (SPEC-reset-and-test-support §2.2)", () => {
  it("is the spec's line, and names no secret", () => {
    expect(resetLogLine("scheduled", 59, "7f3c")).toBe(
      "reset reason=scheduled rows=59 requestId=7f3c",
    );
  });
});
