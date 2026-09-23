import { describe, expect, it } from "vitest";
import {
  configuredWebmcpMode,
  cronSecret,
  demoCredentials,
  demoPasswordHash,
  resetBytesThreshold,
  resetIntervalDays,
  resetRowThreshold,
  resetSecret,
  webmcpOriginTrialToken,
} from "@/src/server/env";

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

describe("resetIntervalDays (SPEC-app-shell §5)", () => {
  it("defaults to 10 when unset or empty", () => {
    expect(resetIntervalDays({})).toBe(10);
    expect(resetIntervalDays({ RESET_INTERVAL_DAYS: "" })).toBe(10);
  });

  it("reads a configured value", () => {
    expect(resetIntervalDays({ RESET_INTERVAL_DAYS: "7" })).toBe(7);
  });

  it.each(["ten", "0", "-1", "2.5", "0x10", "1e1", " 10 ", "010", "+5", "99999999999999999"])(
    "throws on an invalid value %j",
    (value) => {
      expect(() => resetIntervalDays({ RESET_INTERVAL_DAYS: value })).toThrow(
        /RESET_INTERVAL_DAYS/,
      );
    },
  );
});

describe("resetRowThreshold / resetBytesThreshold (SPEC-reset-and-test-support §2.4)", () => {
  it("default to 2000 rows and 50 MB", () => {
    expect(resetRowThreshold({})).toBe(2000);
    expect(resetBytesThreshold({})).toBe(52_428_800);
  });

  it("read configured values", () => {
    expect(resetRowThreshold({ RESET_ROW_THRESHOLD: "500" })).toBe(500);
    expect(resetBytesThreshold({ RESET_BYTES_THRESHOLD: "1000" })).toBe(1000);
  });

  it("throw on an invalid value", () => {
    expect(() => resetRowThreshold({ RESET_ROW_THRESHOLD: "lots" })).toThrow(/RESET_ROW_THRESHOLD/);
    expect(() => resetBytesThreshold({ RESET_BYTES_THRESHOLD: "0" })).toThrow(
      /RESET_BYTES_THRESHOLD/,
    );
  });
});

describe("resetSecret (SPEC-reset-and-test-support §2.2)", () => {
  it("returns the configured secret", () => {
    expect(resetSecret({ RESET_SECRET: "s3cret" })).toBe("s3cret");
  });

  it("is null when unset or empty — never an empty string a request could match", () => {
    expect(resetSecret({})).toBeNull();
    expect(resetSecret({ RESET_SECRET: "" })).toBeNull();
  });
});

describe("cronSecret (SPEC-reset-and-test-support §2.3, T-08 plan D7)", () => {
  it("is null when unset or empty — never an empty string a request could match", () => {
    expect(cronSecret({})).toBeNull();
    expect(cronSecret({ CRON_SECRET: "" })).toBeNull();
  });

  it("returns the configured secret", () => {
    expect(cronSecret({ CRON_SECRET: "vercel-sends-this" })).toBe("vercel-sends-this");
  });
});

describe("configuredWebmcpMode (SPEC-app-shell §5)", () => {
  it('defaults to "polyfill" when unset or empty', () => {
    expect(configuredWebmcpMode({})).toBe("polyfill");
    expect(configuredWebmcpMode({ WEBMCP_MODE: "" })).toBe("polyfill");
  });

  it.each(["native", "polyfill", "off"] as const)("reads %s", (mode) => {
    expect(configuredWebmcpMode({ WEBMCP_MODE: mode })).toBe(mode);
  });

  it("throws on an unrecognised value", () => {
    expect(() => configuredWebmcpMode({ WEBMCP_MODE: "invisible" })).toThrow(/WEBMCP_MODE/);
  });
});
