// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StatCard } from "@/src/ui/overview/StatCard";

afterEach(cleanup);

describe("StatCard (SPEC-overview §2.2)", () => {
  it("dark variant: grey-900 background class, the label and the formatted amount", () => {
    render(<StatCard label="Current Balance" cents={483_600} variant="dark" />);
    expect(screen.getByText("Current Balance")).toBeTruthy();
    expect(screen.getByText("$4,836.00")).toBeTruthy();
    expect(screen.getByText("Current Balance").closest("div")?.className).toMatch(/_dark_/);
  });

  it("light variant renders the same shape for Income/Expenses, no dark class", () => {
    render(<StatCard label="Income" cents={381_425} variant="light" />);
    expect(screen.getByText("$3,814.25")).toBeTruthy();
    expect(screen.getByText("Income").closest("div")?.className).not.toMatch(/_dark_/);
  });
});
