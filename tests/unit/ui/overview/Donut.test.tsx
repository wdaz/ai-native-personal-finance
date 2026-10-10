// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Donut } from "@/src/ui/overview/Donut";

afterEach(cleanup);

const items = [
  { theme: "Yellow" as const, maximum: 5_000 },
  { theme: "Green" as const, maximum: 75_000 },
  { theme: "Turquoise" as const, maximum: 7_500 },
  { theme: "Purple" as const, maximum: 10_000 },
];

describe("Donut (SPEC-overview §4.4 v1.3)", () => {
  it("role=img with the exact aria-label; centre text", () => {
    render(<Donut items={items} total={97_500} spent={33_800} />);
    expect(screen.getByRole("img", { name: "Spent $338.00 of $975.00 limit" })).toBeTruthy();
    expect(screen.getByText("$338.00")).toBeTruthy();
    expect(screen.getByText("of $975.00 limit")).toBeTruthy();
  });

  it("draws one <circle> per item plus the base ring", () => {
    const { container } = render(<Donut items={items} total={97_500} spent={33_800} />);
    // 1 base ring + 1 inner circle per item + 1 outer circle per item, in that order.
    expect(container.querySelectorAll("circle")).toHaveLength(1 + items.length * 2);
  });

  it("H18 / OV-Q1 (a): the ring and the outer circles at r 96, the inner circles at r 78 — 18 px less — in a 240 px SVG", () => {
    const { container } = render(<Donut items={items} total={97_500} spent={33_800} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("240");
    expect(svg?.getAttribute("height")).toBe("240");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 240 240");
    const circles = [...container.querySelectorAll("circle")];
    const ring = circles[0];
    const inner = circles.slice(1, 1 + items.length);
    const outer = circles.slice(1 + items.length);
    expect(ring?.getAttribute("r")).toBe("96");
    for (const circle of outer) expect(circle.getAttribute("r")).toBe("96");
    for (const circle of inner) {
      expect(circle.getAttribute("r")).toBe("78");
      expect(circle.getAttribute("stroke-width")).toBe("12");
    }
  });

  it("H18 / S45-5 (b): each inner circle's stroke is its theme colour, no color-mix tint", () => {
    const { container } = render(<Donut items={items} total={97_500} spent={33_800} />);
    const inner = [...container.querySelectorAll("circle")].slice(1, 1 + items.length);
    expect(inner.map((circle) => circle.getAttribute("stroke"))).toEqual([
      "var(--color-yellow)",
      "var(--color-green)",
      "var(--color-turquoise)",
      "var(--color-purple)",
    ]);
  });

  it("the inner and outer segments carry different classes (adversarial review finding 1: a single shared class let the outer ring's 24px stroke-width rule silently override the inner ring's own stroke width)", () => {
    const { container } = render(<Donut items={items} total={97_500} spent={33_800} />);
    const inner = container.querySelector('circle[stroke-width="12"]');
    const outer = container.querySelectorAll("circle")[items.length + 1]; // after ring + inners
    expect(inner?.getAttribute("class")).toMatch(/_innerSegment_/);
    expect(inner?.getAttribute("class")).not.toMatch(/_outerSegment_/);
    expect(outer?.getAttribute("class")).toMatch(/_outerSegment_/);
    expect(outer?.getAttribute("class")).not.toMatch(/_innerSegment_/);
    // No stylesheet class may re-declare stroke-width for the outer circles — jsdom applies no
    // CSS, so this only proves the two circle groups are never governed by the same class.
    expect(inner?.getAttribute("class")).not.toBe(outer?.getAttribute("class"));
  });

  it("empty: a single ring (beige-100 in CSS, asserted in E2E), $0.00 centre, still role=img", () => {
    const { container } = render(<Donut items={[]} total={0} spent={0} />);
    expect(screen.getByRole("img", { name: "Spent $0.00 of $0.00 limit" })).toBeTruthy();
    expect(screen.getByText("$0.00")).toBeTruthy();
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });
});
