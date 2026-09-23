import { describe, expect, it } from "vitest";
import { AdminResetSchema } from "@/src/shared/schemas";

describe("AdminResetSchema (SPEC-reset-and-test-support §2.2, T-08 plan D4)", () => {
  it("defaults reason to manual", () => {
    expect(AdminResetSchema.parse({})).toEqual({ reason: "manual" });
  });

  it.each(["scheduled", "threshold", "manual"] as const)("accepts %s", (reason) => {
    expect(AdminResetSchema.parse({ reason })).toEqual({ reason });
  });

  it('refuses "test" — /api/test/reset\'s own reason', () => {
    expect(AdminResetSchema.safeParse({ reason: "test" }).success).toBe(false);
  });

  it("refuses an unknown reason and fields the spec does not list", () => {
    expect(AdminResetSchema.safeParse({ reason: "nope" }).success).toBe(false);
    expect(AdminResetSchema.safeParse({ reason: "manual", extra: 1 }).success).toBe(false);
  });
});
