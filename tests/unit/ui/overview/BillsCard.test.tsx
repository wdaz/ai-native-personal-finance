// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BillsCard } from "@/src/ui/overview/BillsCard";

afterEach(cleanup);

describe("BillsCard (SPEC-overview §2.6, §2.7 — always three rows, never an empty state)", () => {
  it("§4.3 seed figures", () => {
    render(<BillsCard paid={19_000} upcoming={19_498} dueSoon={5_998} />);
    expect(screen.getByText("Paid Bills")).toBeTruthy();
    expect(screen.getByText("$190.00")).toBeTruthy();
    expect(screen.getByText("Total Upcoming")).toBeTruthy();
    expect(screen.getByText("$194.98")).toBeTruthy();
    expect(screen.getByText("Due Soon")).toBeTruthy();
    expect(screen.getByText("$59.98")).toBeTruthy();
  });

  it("no-recurring: all three at $0.00, same three rows", () => {
    render(<BillsCard paid={0} upcoming={0} dueSoon={0} />);
    expect(screen.getAllByText("$0.00")).toHaveLength(3);
  });

  it("'See Details' links to /recurring-bills", () => {
    render(<BillsCard paid={0} upcoming={0} dueSoon={0} />);
    expect(screen.getByRole("link", { name: "See Details ›" }).getAttribute("href")).toBe(
      "/recurring-bills",
    );
  });
});
