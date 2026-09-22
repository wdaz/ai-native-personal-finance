import { describe, expect, it } from "vitest";
import { Prisma } from "@/src/server/generated/prisma/client";
import { RESET_TABLES } from "@/src/server/reset";

/**
 * SPEC-reset-and-test-support §2.1: a reset "truncates all tables". RESET_TABLES is written
 * out by hand, so a model added to prisma/schema.prisma later would survive every reset
 * unless this list grows with it.
 */
describe("RESET_TABLES", () => {
  const models = Object.values(Prisma.ModelName);
  const notReset = (tables: readonly string[]) => models.filter((m) => !tables.includes(m));

  it("names every model of prisma/schema.prisma, and nothing else", () => {
    expect(models.length).toBeGreaterThan(0);
    expect(notReset(RESET_TABLES)).toEqual([]);
    expect([...RESET_TABLES].sort()).toEqual([...models].sort());
  });

  it("would report a model left out (violation fixture, DoD v1.1)", () => {
    expect(notReset(RESET_TABLES.filter((table) => table !== "Pot"))).toEqual(["Pot"]);
  });
});
