import { describe, expect, it } from "vitest";
import { TEST_IDS } from "@/src/shared/test-ids";

describe("src/shared/test-ids.ts (ADR-0003, NFR-T6)", () => {
  const ids: string[] = Object.values(TEST_IDS);

  it("gives every element its own id", () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("writes ids in kebab case", () => {
    expect(ids.filter((id) => !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id))).toEqual([]);
  });
});
