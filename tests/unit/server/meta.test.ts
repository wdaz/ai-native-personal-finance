import { describe, expect, it } from "vitest";
import type { Db } from "@/src/server/db";
import { getMeta, parseForwardedResetAt } from "@/src/server/meta";

/** A database that fails the test the moment anything reads it. */
const untouchable = new Proxy(
  {},
  {
    get() {
      throw new Error("the database was queried");
    },
  },
) as Db;

const AT = "2026-09-12T03:00:00.000Z";

describe("getMeta (SPEC-app-shell §2.1, §5)", () => {
  it("PR #20 review: with the reset time the middleware forwarded, it reads no database", async () => {
    expect(await getMeta(untouchable, {}, new Date(AT))).toEqual({
      lastResetAt: AT,
      resetIntervalDays: 10,
      webmcp: { configuredMode: "polyfill", originTrial: false },
    });
  });

  it("without one, it reads the database", async () => {
    await expect(getMeta(untouchable, {})).rejects.toThrow(/queried/);
  });
});

describe("parseForwardedResetAt", () => {
  it("accepts the toISOString form", () => {
    expect(parseForwardedResetAt(AT)).toEqual(new Date(AT));
  });

  it.each([
    null,
    "",
    "2026-09-12",
    "2026-09-12T03:00:00Z",
    "2026-09-12T07:00:00.000+04:00",
    "2026-02-30T03:00:00.000Z",
    "yesterday",
  ])("refuses %j — the layout then reads the database", (value) => {
    expect(parseForwardedResetAt(value)).toBeNull();
  });
});
