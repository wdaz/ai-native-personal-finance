import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  billFigures,
  billSorts,
  markdownTable,
  seedFigures,
  seedOverviewInput,
  idNeverDecides,
  seedTransactions,
  sortExtremes,
  totalText,
  transactionFigures,
  workedExample,
} from "@/scripts/seed-figures";
import { billsTotals } from "@/src/domain/bills";
import { fixedClock } from "@/src/domain/clock";
import { overviewSummary } from "@/src/domain/overview";
import { CATEGORY_BY_NAME, seedRows } from "@/src/server/seed";
import { applyVariant, SEED_VARIANTS } from "@/src/server/variants";
import { COPY } from "@/src/shared/copy";
import { formatDate, formatDueDay } from "@/src/shared/dates";
import { CATEGORIES } from "@/src/shared/enums";
import { formatMoney, formatSignedMoney } from "@/src/shared/money";

const repoRoot = join(import.meta.dirname, "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

/**
 * The cells of the Markdown table that follows the paragraph starting "4.3 Worked example".
 * Throws when there is none, so a renamed or deleted section fails instead of comparing an
 * empty table with nothing.
 */
function workedExampleIn(markdown: string): string[][] {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.startsWith("4.3 Worked example"));
  const table: string[] = [];
  for (const line of start < 0 ? [] : lines.slice(start + 1)) {
    if (line.startsWith("|")) table.push(line);
    else if (table.length > 0) break;
  }
  if (table.length === 0) throw new Error("No worked example table under §4.3");
  return table
    .filter((line) => !/^\|[\s|:-]+\|$/.test(line))
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim()),
    );
}

/** The item names of the rows where two tables disagree. */
const differingRows = (a: string[][], b: string[][]) =>
  a.filter((row, i) => row.join("|") !== b[i]?.join("|")).map((row) => row[0]);

describe("SPEC-overview §4.3 is generated, never typed (build-workflow.md)", () => {
  it("equals the figures scripts/seed-figures.ts computes from prisma/data.json — values and order", () => {
    expect(workedExampleIn(read("docs/03-specs/overview.md"))).toEqual(workedExample());
  });

  it("would report the Gift pot at $40 — a wrong value (violation fixture, DoD v1.1)", () => {
    const table = workedExampleIn(read("tests/fixtures/seed-figures/gift-forty.md.fixture"));
    expect(differingRows(table, workedExample())).toEqual(["First four pots"]);
  });

  it("would report the latest five ordered by day — right values, wrong order (violation fixture)", () => {
    const table = workedExampleIn(read("tests/fixtures/seed-figures/latest-by-day.md.fixture"));
    expect(differingRows(table, workedExample())).toEqual([
      "Latest five (timestamp desc, then name)",
    ]);
  });

  it("would report a spec without the table rather than pass in silence (violation fixture)", () => {
    expect(() =>
      workedExampleIn(read("tests/fixtures/seed-figures/no-worked-example.md.fixture")),
    ).toThrow("No worked example table under §4.3");
  });

  it("prints the same table on `npm run seed:figures`", () => {
    const printed = execFileSync("npm", ["run", "--silent", "seed:figures"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(printed).toBe(`${markdownTable(workedExample())}\n`);
    expect(workedExampleIn(`4.3 Worked example\n\n${printed}`)).toEqual(workedExample());
  });
});

describe("scripts/seed-figures.ts reads the seed as src/server/seed.ts does (T-02)", () => {
  const input = seedOverviewInput();
  const rows = seedRows();

  it("has the same balance, amounts, dates, categories and recurring flags", () => {
    expect(input.balance).toEqual(rows.balance);
    expect(
      input.transactions.map((t) => [
        t.name,
        t.amount,
        t.date.getTime(),
        CATEGORY_BY_NAME.get(t.category),
        t.recurring,
      ]),
    ).toEqual(
      rows.transactions.map((t) => [t.name, t.amount, Date.parse(t.date), t.category, t.recurring]),
    );
  });

  it("has the same budgets and pots, with seq 1…n in file order", () => {
    expect(input.budgets.map((b) => [CATEGORY_BY_NAME.get(b.category), b.maximum])).toEqual(
      rows.budgets.map((b) => [b.category, b.maximum]),
    );
    expect(input.pots.map((p) => [p.name, p.target, p.total])).toEqual(
      rows.pots.map((p) => [p.name, p.target, p.total]),
    );
    expect([...input.budgets, ...input.pots].map((row) => row.seq)).toEqual([
      ...rows.budgets.map((_, i) => i + 1),
      ...rows.pots.map((_, i) => i + 1),
    ]);
  });

  it("computes the Overview on the business day, 19 Aug 2026 — another day gives other bills", () => {
    const figures = seedFigures();
    expect(figures.transactions).toHaveLength(5);
    expect(figures.pots.items.map((p) => p.seq)).toEqual([1, 2, 3, 4]);
    expect(overviewSummary(seedOverviewInput(), fixedClock("2026-09-19")).bills).not.toEqual(
      figures.bills,
    );
  });
});

/** The cells of the Markdown table under the line starting `heading`; throws when none. */
function tableUnder(markdown: string, heading: string): string[][] {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.startsWith(heading));
  const table: string[] = [];
  for (const line of start < 0 ? [] : lines.slice(start + 1)) {
    if (line.startsWith("|")) table.push(line);
    else if (table.length > 0) break;
  }
  if (table.length === 0) throw new Error(`No table under "${heading}"`);
  return table
    .filter((line) => !/^\|[\s|:-]+\|$/.test(line))
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim()),
    );
}

const SORT_HEADING = "**4.3 First and last row of each sort**";

describe("SPEC-transactions 4.2–4.7 are generated, never typed (H11 (3))", () => {
  it("US-11 4.3's table equals each sort's first and last row as the domain sorts the seed", () => {
    expect(tableUnder(read("docs/03-specs/transactions.md"), SORT_HEADING)).toEqual(sortExtremes());
  });

  it("would report Lowest's first row when -$100.00 ties are taken oldest first (violation fixture)", () => {
    const table = tableUnder(
      read("tests/fixtures/seed-figures/lowest-oldest-first.md.fixture"),
      SORT_HEADING,
    );
    expect(differingRows(table, sortExtremes())).toEqual(["Lowest"]);
  });

  const spec = read("docs/03-specs/transactions.md");
  const figures = transactionFigures();

  it("US-09 4.2: the counts, the pages and the categories", () => {
    const fullPages = Array.from({ length: figures.pageCount - 1 }, () => 10).join(", ");
    expect(spec).toContain(
      `- ${figures.total} transactions; ${figures.pageCount} pages: ${fullPages} and ${figures.lastPageSize} rows. ${figures.distinctNames} distinct names; ${figures.income.length} positive amounts (sum ${figures.income.reduce((sum, t) => sum + t.amount, 0).toLocaleString("en-US")} cents, the balance's income) and ${figures.spending.length} negative; ${figures.recurring} \`recurring\``,
    );
    expect(spec).toContain(
      `Dates from ${formatDate(figures.dates.first)} (${figures.dates.first.toISOString().slice(11, 19)}Z) to ${formatDate(figures.dates.last)} (${figures.dates.last.toISOString().slice(11, 19)}Z); ${figures.dates.distinct} distinct timestamps.`,
    );
    expect(spec).toContain(
      `**General: ${figures.generalPages === 2 ? "two" : figures.generalPages} pages** (page 2 has ${figures.generalLastPage === 1 ? "one row" : `${figures.generalLastPage} rows`})`,
    );
    expect(spec).toContain(
      `By category: ${CATEGORIES.map((c) => `${c} ${figures.byCategory[c]!.length}`).join(", ")} (sum ${figures.total}).`,
    );
  });

  it("US-09 4.2: the default view's first page and the last page's ends", () => {
    const row = (t: (typeof figures.defaultPage)[number]) =>
      `${t.name}, ${t.category}, ${formatDate(t.date)}, ${formatSignedMoney(t.amount)}`;
    expect(spec.replace(/\n\s*/g, " ")).toContain(figures.defaultPage.map(row).join(" · "));
    const [firstOfLast, lastOfAll] = [figures.lastPage[0]!, figures.lastPage.at(-1)!];
    expect(spec).toContain(
      `Page ${figures.pageCount} runs from ${firstOfLast.name}, ${formatDate(firstOfLast.date)}, ${formatSignedMoney(firstOfLast.amount)} (number ${figures.total - figures.lastPageSize + 1}) to ${lastOfAll.name}, ${formatDate(lastOfAll.date)}, ${formatSignedMoney(lastOfAll.amount)} (number ${figures.total}).`,
    );
  });

  it("US-10 US-12 4.5: the search and filter examples", () => {
    const { search } = figures;
    expect(spec).toContain(
      `\`a\` → ${search.a} results, ${figures.aPages} pages (${figures.aLastPage} rows on the last; only ${figures.withoutA.join(" and ")} have no \`a\`)`,
    );
    expect(spec).toContain(
      `\`co\` → ${search.co.length}: ${search.co.map((t) => `${t.name} (${formatDate(t.date)})`).join(", ")}`,
    );
    expect(spec).toContain(`\`EMMA\` → ${search.emma}`);
    expect(spec).toContain(`\`bill\` → ${search.bill} and \`xyz\` → ${search.xyz}`);
    expect(spec.replace(/\n/g, " ")).toContain(
      `one space → ${figures.untrimmedSpace} untrimmed, so **trimmed it is empty and filters nothing (${search.space})**`,
    );
    expect(spec).toContain(`\`a\` with Dining Out → ${search.aDiningOut}`);
    expect(spec).toContain(`\`co\` with Entertainment → ${search.coEntertainment}`);
  });

  it("4.6: the rows the Budgets links open", () => {
    const cells = (rows: typeof figures.diningOut) =>
      rows.map((t) => `${t.name} ${formatDate(t.date)} ${formatSignedMoney(t.amount)}`).join("; ");
    expect(spec.replace(/\n/g, " ")).toContain(
      `shows ${figures.diningOut.length} rows on one page, Latest: ${cells(figures.diningOut)}.`,
    );
    expect(spec).toContain(
      `shows ${figures.entertainment.length}: ${cells(figures.entertainment)}.`,
    );
  });

  it("US-11 4.4: the repeated keys, and the final id never decides, for every seed variant", () => {
    const { ties } = figures;
    expect(ties.timestamps).toEqual([]);
    expect(spec).toContain(
      `${ties.names.length} names appear twice (${ties.names.flat().length} rows)`,
    );
    expect(ties.names.every((group) => group.length === 2)).toBe(true);
    expect(spec).toContain(
      `${ties.amounts.length} amounts repeat (${ties.amounts.flat().length} rows)`,
    );
    expect(idNeverDecides(seedTransactions())).toBe(true);
    for (const variant of SEED_VARIANTS) {
      const rows = applyVariant(seedRows(), variant).transactions.map((t, index) => ({
        ...t,
        id: String(index),
        date: new Date(t.date),
      }));
      expect(idNeverDecides(rows), variant).toBe(true);
    }
  });

  it("would report a full tie, where only the id decides (violation fixture)", () => {
    const [first] = seedTransactions();
    expect(idNeverDecides([first!, { ...first!, id: "zz" }])).toBe(false);
  });

  it("4.7: the page clamp, the longest name and the widest amount", () => {
    expect(figures.view({ page: 99 }).page).toBe(figures.pageCount);
    expect(spec).toContain(
      `The longest name is ${figures.longestName.length} characters ("${figures.longestName}")`,
    );
    expect(spec).toContain(
      `the widest amount is \`${formatSignedMoney(figures.widestAmount.amount)}\` (${figures.widestAmount.name})`,
    );
  });
});

const BILLS_HEADING = "**4.3 Each sort, all ";

describe("SPEC-recurring-bills 4.2–4.5 are generated, never typed (H14 (2))", () => {
  const spec = read("docs/03-specs/recurring-bills.md");
  const flat = spec.replace(/\n\s*/g, " ");
  const figures = billFigures();
  const { totals } = figures;

  it("US-30 AC1 4.3's table equals each sort's full order as the domain sorts the seed's bills", () => {
    expect(spec).toContain(`${BILLS_HEADING}${figures.bills.length} rows**`);
    expect(tableUnder(spec, BILLS_HEADING)).toEqual(billSorts());
  });

  it("would report Highest with Spark before Aqua, the design's old tie order (violation fixture)", () => {
    const table = tableUnder(
      read("tests/fixtures/seed-figures/bills-highest-spark-first.md.fixture"),
      BILLS_HEADING,
    );
    expect(differingRows(table, billSorts())).toEqual([COPY.transactionSorts.highest]);
  });

  it("US-27 AC3 4.2: the counts and one line per vendor, in the bills' order", () => {
    expect(spec).toContain(
      `- ${figures.transactions} transactions, ${figures.recurring} recurring, **${figures.bills.length} bills** (US-27 AC3).`,
    );
    expect(flat).toContain(
      `Per vendor (day shown · amount · status · the recurring transactions): ${figures.vendorLines.join(" · ")}.`,
    );
  });

  it("US-28 AC1 4.2: the summary, and the rows whose own status is Upcoming", () => {
    const soon = figures.byStatus.dueSoon;
    const upcoming = figures.byStatus.upcoming;
    expect(flat).toContain(
      `Total Bills **${formatMoney(totals.total.amount)}** (${totals.total.amount.toLocaleString("en-US")} cents); Paid Bills **${totalText(totals.paid)}**; Total Upcoming **${totalText(totals.totalUpcoming)}**; Due Soon **${totalText(totals.dueSoon)}** — ${soon.map((b) => `${b.name} (${formatMoney(b.amount)}, ${formatDueDay(b.day).replace("Monthly - ", "")})`).join(" and ")}, as US-27 AC3 says.`,
    );
    expect(flat).toContain(
      `The rows whose own status is Upcoming are ${totalText(billsTotals(upcoming).total)}: ${upcoming.map((b) => b.name).join(" and ")}.`,
    );
  });

  it("US-30 AC1 4.3: the ties — no shared day, one repeated amount, so Lowest is not Highest reversed", () => {
    const { ties } = figures;
    expect(ties.days).toEqual([]);
    expect(ties.caseInsensitive).toEqual([]);
    expect(ties.amounts).toHaveLength(1);
    const [tied] = ties.amounts;
    const amount = figures.bills.find((b) => b.name === tied![0])!.amount;
    expect(flat).toContain(
      `One amount repeats: ${[...tied!].sort().join(" and ")} both cost ${formatMoney(amount)}`,
    );
    expect(figures.lowestIsHighestReversed).toBe(false);
    expect(figures.collatorIsCodeUnit).toBe(true);
    expect(flat).toContain(
      `the collator's A to Z order of the ${figures.bills.length} names equals their code-unit order`,
    );
  });

  it("US-29 AC1 4.5: the search examples and the tool's status examples", () => {
    const names = (q: string) =>
      figures
        .search(q)
        .map((b) => b.name)
        .join(", ");
    expect(flat).toContain(
      `\`a\` → ${figures.search("a").length} (only ${figures.withoutA.map((b) => b.name).join(" and ")} have no \`a\`)`,
    );
    expect(figures.search("e")).toHaveLength(figures.bills.length);
    expect(flat).toContain(`\`e\` → all ${figures.bills.length}`);
    expect(flat).toContain(`\`co\` → ${figures.search("co").length}, ${names("co")}`);
    expect(flat).toContain(`\`data\` → ${names("data")}`);
    expect(flat).toContain(`\`BYTE\` → ${names("BYTE")} (case-insensitive)`);
    expect(names("&")).toBe(names("spa & w"));
    expect(flat).toContain(`\`&\` and \`spa & w\` → ${names("&")} (a literal \`&\`)`);
    expect(flat).toContain(`\`  flow  \` → ${names("  flow  ")} (trimmed)`);
    expect(figures.search(" ")).toHaveLength(figures.bills.length);
    expect(flat).toContain(`one space → trimmed to empty, all ${figures.bills.length}`);
    for (const q of ["bill", "Bills", "xyz"]) expect(figures.search(q)).toEqual([]);
    expect(flat).toContain("`bill`, `Bills` and `xyz` → 0, the no-results state");
    const tool = figures.view({ q: "e", status: "upcoming", sort: "highest" });
    expect(flat).toContain(
      `\`search: "e", status: "upcoming", sort: "highest"\` → ${tool.map((b) => b.name).join(", ")}`,
    );
    const paid = figures.byStatus.paid;
    expect(flat).toContain(
      `\`status: "paid"\` → ${paid.length}, ${formatMoney(billsTotals(paid).total.amount)} in total; \`status: "dueSoon"\` → ${figures.byStatus.dueSoon.length}; \`status: "upcoming"\` → ${figures.byStatus.upcoming.length}.`,
    );
  });

  it("4.6: the longest bill name", () => {
    expect(spec).toContain(
      `The longest bill name is ${figures.longestName.length} characters ("${figures.longestName}")`,
    );
  });
});
