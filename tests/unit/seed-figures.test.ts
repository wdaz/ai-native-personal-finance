import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  markdownTable,
  seedFigures,
  seedOverviewInput,
  sortExtremes,
  transactionFigures,
  workedExample,
} from "@/scripts/seed-figures";
import { fixedClock } from "@/src/domain/clock";
import { overviewSummary } from "@/src/domain/overview";
import { CATEGORY_BY_NAME, seedRows } from "@/src/server/seed";
import { formatDate } from "@/src/shared/dates";
import { CATEGORIES } from "@/src/shared/enums";
import { formatSignedMoney } from "@/src/shared/money";

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
    expect(spec).toContain(
      `- ${figures.total} transactions; ${figures.pageCount} pages: 10, 10, 10, 10 and ${figures.lastPageSize} rows. ${figures.distinctNames} distinct names; ${figures.income.length} positive amounts (sum ${figures.income.reduce((sum, t) => sum + t.amount, 0).toLocaleString("en-US")} cents, the balance's income) and ${figures.spending.length} negative; ${figures.recurring} \`recurring\``,
    );
    expect(spec).toContain(
      `By category: ${CATEGORIES.map((c) => `${c} ${figures.byCategory[c]!.length}`).join(", ")} (sum ${figures.total}).`,
    );
  });

  it("US-09 4.2: the default view's first page and the last page's ends", () => {
    const row = (t: (typeof figures.defaultPage)[number]) =>
      `${t.name}, ${t.category}, ${formatDate(t.date)}, ${formatSignedMoney(t.amount)}`;
    expect(spec.replace(/\n\s*/g, " ")).toContain(figures.defaultPage.map(row).join(" · "));
    expect(spec).toContain(
      `Page 5 runs from ${figures.lastPage[0]!.name}, ${formatDate(figures.lastPage[0]!.date)}, ${formatSignedMoney(figures.lastPage[0]!.amount)}`,
    );
  });

  it("US-10 US-12 4.5: the search and filter examples", () => {
    const { search } = figures;
    expect(spec).toContain(`\`a\` → ${search.a} results`);
    expect(spec).toContain(
      `\`co\` → ${search.co.length}: ${search.co.map((t) => `${t.name} (${formatDate(t.date)})`).join(", ")}`,
    );
    expect(spec).toContain(`\`EMMA\` → ${search.emma}`);
    expect(spec).toContain(`\`bill\` → ${search.bill} and \`xyz\` → ${search.xyz}`);
    expect(search.space).toBe(figures.total);
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
