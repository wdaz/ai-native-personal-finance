// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { COPY } from "@/src/shared/copy";
import { PotsCard } from "@/src/ui/overview/PotsCard";

afterEach(cleanup);

const pots = [
  { id: "1", name: "Savings", total: 15_900, theme: "Green" as const },
  { id: "2", name: "Concert Ticket", total: 11_000, theme: "Yellow" as const },
  { id: "3", name: "Gift", total: 11_000, theme: "Cyan" as const },
  { id: "4", name: "New Laptop", total: 1_000, theme: "Navy" as const },
];

describe("PotsCard (US-05, SPEC-overview §2.3)", () => {
  it("AC1: total saved and the first four pots", () => {
    render(<PotsCard total={92_000} items={pots} />);
    expect(screen.getByText("Total Saved")).toBeTruthy();
    expect(screen.getByText("$920.00")).toBeTruthy();
    expect(screen.getByText("Savings")).toBeTruthy();
    expect(screen.getByText("$159.00")).toBeTruthy();
    expect(screen.getByText("New Laptop")).toBeTruthy();
  });

  it("AC3: 'See Details' links to /pots", () => {
    render(<PotsCard total={92_000} items={pots} />);
    expect(screen.getByRole("link", { name: "See Details ›" }).getAttribute("href")).toBe("/pots");
  });

  it("AC2: no pots — $0.00 tile, empty text, 'Add a pot' to /pots", () => {
    render(<PotsCard total={0} items={[]} />);
    expect(screen.getByText("$0.00")).toBeTruthy();
    expect(screen.getByText(COPY.potsEmpty)).toBeTruthy();
    expect(screen.getByRole("link", { name: COPY.addPot }).getAttribute("href")).toBe("/pots");
    expect(screen.queryByText("Savings")).toBeNull();
  });

  it("1–3 pots keep the grid's four cells (the rest hidden, not announced); the rest stay blank", () => {
    const { container } = render(<PotsCard total={38_000} items={pots.slice(0, 2)} />);
    expect(container.querySelectorAll("ul > li")).toHaveLength(4);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Savings")).toBeTruthy();
    expect(screen.getByText("Concert Ticket")).toBeTruthy();
  });
});
