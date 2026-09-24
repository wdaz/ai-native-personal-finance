// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { COPY } from "@/src/shared/copy";
import { TransactionsCard, type TransactionItem } from "@/src/ui/overview/TransactionsCard";

afterEach(cleanup);

const row = (over: Partial<TransactionItem> = {}): TransactionItem => ({
  id: "1",
  name: "Emma Richardson",
  avatar: "emma-richardson",
  amount: 7_550,
  date: "2026-08-19T12:00:00Z",
  ...over,
});

describe("TransactionsCard (US-06, SPEC-overview §2.4)", () => {
  it("AC1: avatar, name, signed coloured amount, date", () => {
    render(<TransactionsCard items={[row()]} />);
    const avatar = screen.getByRole("img", { name: "Emma Richardson" });
    expect(avatar.getAttribute("src")).toBe("/avatars/emma-richardson.jpg");
    const amount = screen.getByText("+$75.50");
    expect(amount).toBeTruthy();
    expect(amount.className).toMatch(/_positive_/);
    expect(screen.getByText("19 Aug 2026")).toBeTruthy();
  });

  it("a negative amount has no + and no positive class", () => {
    render(<TransactionsCard items={[row({ amount: -5_550, name: "Savory Bites Bistro" })]} />);
    const amount = screen.getByText("-$55.50");
    expect(amount.className).not.toMatch(/_positive_/);
  });

  it("AC3: fewer than five rows — only the given ones render", () => {
    render(<TransactionsCard items={[row(), row({ id: "2", name: "Daniel Carter" })]} />);
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("AC3: none — the empty message, no rows", () => {
    render(<TransactionsCard items={[]} />);
    expect(screen.getByText(COPY.transactionsEmpty)).toBeTruthy();
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("AC2: 'View All' links to /transactions", () => {
    render(<TransactionsCard items={[row()]} />);
    expect(screen.getByRole("link", { name: "View All ›" }).getAttribute("href")).toBe(
      "/transactions",
    );
  });
});
