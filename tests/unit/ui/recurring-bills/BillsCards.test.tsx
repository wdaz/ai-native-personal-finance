// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { COPY } from "@/src/shared/copy";
import { formatMoney } from "@/src/shared/money";
import type { RecurringBillsDto } from "@/src/shared/schemas";
import { BillsSummaryCard } from "@/src/ui/recurring-bills/BillsSummaryCard";
import { BillsTable } from "@/src/ui/recurring-bills/BillsTable";
import { TotalBillsCard } from "@/src/ui/recurring-bills/TotalBillsCard";

afterEach(cleanup);

/** Synthetic values for the components, not seed data; the seed's figures are the E2E suite's. */
const SUMMARY: RecurringBillsDto["summary"] = {
  total: { count: 3, amount: 123_456_789 },
  paid: { count: 1, amount: 1000 },
  totalUpcoming: { count: 2, amount: 2500 },
  dueSoon: { count: 1, amount: 999 },
};
const ZERO = { count: 0, amount: 0 };
const ITEMS: RecurringBillsDto["items"] = [
  { name: "Paid Vendor", avatar: "paid", day: 2, amount: 1000, status: "paid" },
  { name: "Soon Vendor", avatar: "soon", day: 21, amount: 999, status: "dueSoon" },
  { name: "Later Vendor", avatar: "later", day: 29, amount: 1500, status: "upcoming" },
];

describe("BillsSummaryCard (SPEC-recurring-bills 2.6, US-28 AC1)", () => {
  it("is a description list of the three rows, each '{count} ({amount})', with the Due Soon row red", () => {
    const { container } = render(<BillsSummaryCard summary={SUMMARY} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(COPY.billsSummaryTitle);
    const dl = container.querySelector("dl")!;
    expect([...dl.querySelectorAll("dt")].map((dt) => dt.textContent)).toEqual([
      COPY.billsPaid,
      COPY.billsTotalUpcoming,
      COPY.billsDueSoon,
    ]);
    expect([...dl.querySelectorAll("dd")].map((dd) => dd.textContent)).toEqual([
      COPY.billsCountAmount(1, formatMoney(1000)),
      COPY.billsCountAmount(2, formatMoney(2500)),
      COPY.billsCountAmount(1, formatMoney(999)),
    ]);
    const rows = [...dl.children];
    expect(rows[2]!.className).toMatch(/dueSoon/);
    expect(rows[0]!.className).not.toMatch(/dueSoon/);
  });

  it("with no bills shows '0 ($0.00)' three times (2.6)", () => {
    const { container } = render(
      <BillsSummaryCard
        summary={{ total: ZERO, paid: ZERO, totalUpcoming: ZERO, dueSoon: ZERO }}
      />,
    );
    expect([...container.querySelectorAll("dd")].map((dd) => dd.textContent)).toEqual(
      Array(3).fill(COPY.billsCountAmount(0, formatMoney(0))),
    );
  });
});

describe("TotalBillsCard (SPEC-recurring-bills 2.6, §18e BU-5)", () => {
  it("shows the label and the total, breakable only after a comma", () => {
    const { container } = render(<TotalBillsCard amount={SUMMARY.total.amount} />);
    expect(screen.getByText(COPY.totalBills)).toBeTruthy();
    const total = container.querySelector(".text-preset-1")!;
    expect(total.textContent).toBe(formatMoney(SUMMARY.total.amount));
    expect(total.querySelectorAll("wbr")).toHaveLength(2);
    expect(total.innerHTML).toBe(formatMoney(SUMMARY.total.amount).replaceAll(",", ",<wbr>"));
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("with no bills shows $0.00 (2.6)", () => {
    const { container } = render(<TotalBillsCard amount={0} />);
    expect(container.querySelector(".text-preset-1")!.textContent).toBe(formatMoney(0));
  });
});

describe("BillsTable (SPEC-recurring-bills 2.9, 2.10, US-27 AC2, NFR-A7)", () => {
  it("each row's due cell reads the due text then its status; the icons are decorative", () => {
    render(<BillsTable items={ITEMS} empty={null} />);
    const table = screen.getByRole("table", { name: "Recurring Bills" });
    const rows = within(table).getAllByRole("row").slice(1);
    const dueCells = rows.map((row) => within(row).getAllByRole("cell")[1]!);
    expect(dueCells.map((cell) => cell.textContent)).toEqual([
      "Monthly - 2nd Paid",
      "Monthly - 21st Due soon",
      "Monthly - 29th Upcoming",
    ]);
    expect(dueCells.map((cell) => cell.querySelectorAll("svg").length)).toEqual([1, 1, 0]);
    for (const svg of table.querySelectorAll("svg")) {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    }
    expect(rows.map((row) => within(row).getAllByRole("cell")[2]!.textContent)).toEqual(
      ITEMS.map((bill) => formatMoney(bill.amount)),
    );
    expect(table.querySelectorAll('img[alt=""][width="32"][height="32"]')).toHaveLength(3);
  });

  it("the header row stays and one cell across three columns says why there are no rows", () => {
    const { rerender } = render(<BillsTable items={[]} empty="no-results" />);
    expect(screen.getAllByRole("columnheader").map((th) => th.textContent)).toEqual([
      COPY.columnBillTitle,
      COPY.columnDueDate,
      COPY.columnAmount,
    ]);
    const cell = screen.getByRole("cell");
    expect(cell.textContent).toBe(COPY.billsNoResults);
    expect(cell.getAttribute("colspan")).toBe("3");
    rerender(<BillsTable items={[]} empty="none" />);
    expect(screen.getByRole("cell").textContent).toBe(COPY.billsEmpty);
  });
});
