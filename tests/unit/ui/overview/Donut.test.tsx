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

describe("Donut (SPEC-overview §4.4)", () => {
  it("role=img with the exact aria-label; centre text", () => {
    render(<Donut items={items} total={97_500} spent={33_800} />);
    expect(screen.getByRole("img", { name: "Spent $338.00 of $975.00 limit" })).toBeTruthy();
    expect(screen.getByText("$338.00")).toBeTruthy();
    expect(screen.getByText("of $975.00 limit")).toBeTruthy();
  });

  it("draws one <circle> per item plus the base ring", () => {
    const { container } = render(<Donut items={items} total={97_500} spent={33_800} />);
    // 1 base ring + 1 inner (25%) circle per item + 1 outer circle per item.
    expect(container.querySelectorAll("circle")).toHaveLength(1 + items.length * 2);
  });

  it("empty: a single grey-100 ring, $0.00 centre, still role=img", () => {
    const { container } = render(<Donut items={[]} total={0} spent={0} />);
    expect(screen.getByRole("img", { name: "Spent $0.00 of $0.00 limit" })).toBeTruthy();
    expect(screen.getByText("$0.00")).toBeTruthy();
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });
});
