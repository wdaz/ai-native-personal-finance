import { describe, expect, it } from "vitest";
import { WEBMCP_MODES } from "@/src/shared/env";
import { MetaDtoSchema } from "@/src/shared/schemas";

const meta = {
  lastResetAt: "2026-09-12T03:00:00.000Z",
  resetIntervalDays: 10,
  webmcp: { configuredMode: "polyfill", originTrial: false },
};
const valid = (dto: unknown) => MetaDtoSchema.safeParse(dto).success;

describe("MetaDto (SPEC-app-shell §5)", () => {
  it("accepts the spec's shape", () => {
    expect(MetaDtoSchema.parse(meta)).toEqual(meta);
  });

  it.each(WEBMCP_MODES)("accepts the configured mode %s", (configuredMode) => {
    expect(valid({ ...meta, webmcp: { ...meta.webmcp, configuredMode } })).toBe(true);
  });

  it('refuses "unavailable", which is an indicator state, not a configured mode', () => {
    expect(valid({ ...meta, webmcp: { ...meta.webmcp, configuredMode: "unavailable" } })).toBe(
      false,
    );
  });

  it("requires lastResetAt — always present, the first seed writes a ResetLog row — in UTC", () => {
    expect(valid({ ...meta, lastResetAt: undefined })).toBe(false);
    expect(valid({ ...meta, lastResetAt: "2026-09-12T07:00:00+04:00" })).toBe(false);
  });

  it("requires a whole, positive reset interval", () => {
    for (const resetIntervalDays of [0, -10, 2.5]) {
      expect(valid({ ...meta, resetIntervalDays })).toBe(false);
    }
  });

  it("refuses fields the spec does not list", () => {
    expect(valid({ ...meta, reason: "scheduled" })).toBe(false);
    expect(valid({ ...meta, webmcp: { ...meta.webmcp, tools: 2 } })).toBe(false);
  });
});
