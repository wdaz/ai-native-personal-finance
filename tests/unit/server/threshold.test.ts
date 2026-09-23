import { describe, expect, it } from "vitest";
import { evaluateThreshold } from "@/src/server/threshold";

describe("evaluateThreshold (SPEC-reset-and-test-support §2.4)", () => {
  it("is not exceeded under both thresholds", () => {
    expect(evaluateThreshold(1999, 99, 2000, 100)).toEqual({ exceeded: false, reason: null });
  });

  it("trips on rows, reason rows", () => {
    expect(evaluateThreshold(2001, 1, 2000, 100)).toEqual({ exceeded: true, reason: "rows" });
  });

  it("trips on bytes, reason bytes", () => {
    expect(evaluateThreshold(1, 101, 2000, 100)).toEqual({ exceeded: true, reason: "bytes" });
  });

  it("reports rows when both are exceeded", () => {
    expect(evaluateThreshold(2001, 101, 2000, 100)).toEqual({ exceeded: true, reason: "rows" });
  });

  it("does not trip at the boundary itself — the spec says >, not >=", () => {
    expect(evaluateThreshold(2000, 100, 2000, 100)).toEqual({ exceeded: false, reason: null });
  });
});
