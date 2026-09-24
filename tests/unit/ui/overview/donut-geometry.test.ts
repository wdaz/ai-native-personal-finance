import { describe, expect, it } from "vitest";
import { DONUT_RADIUS, donutSegments } from "@/src/ui/overview/donut-geometry";

const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

describe("donutSegments (SPEC-overview §4.4, T-10 plan Review Focus 1)", () => {
  it("splits proportionally to each item's maximum, over the given total — not the items' own sum", () => {
    const items = [
      { theme: "Yellow", maximum: 5_000 },
      { theme: "Green", maximum: 75_000 },
    ] as const;
    // total is 97,500 (a 5th, unlisted budget's $200 folded in) — not 80,000 (the two shown).
    const segments = donutSegments(items, 97_500);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({
      theme: "Yellow",
      strokeDasharray: `${(5_000 / 97_500) * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
      strokeDashoffset: 0,
    });
    // The second segment starts where the first ends — clockwise, no gap.
    expect(segments[1]).toMatchObject({
      theme: "Green",
      strokeDashoffset: -(5_000 / 97_500) * CIRCUMFERENCE,
    });
  });

  it("an empty item list with total 0 returns no segments", () => {
    expect(donutSegments([], 0)).toEqual([]);
  });
});
