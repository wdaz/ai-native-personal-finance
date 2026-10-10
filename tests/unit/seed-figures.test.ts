import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  barText,
  budgetFigures,
  budgetTable,
  latestText,
  percentSpaced,
  potFigures,
  seedVariantInput,
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
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { overviewSummary } from "@/src/domain/overview";
import { compareLatest } from "@/src/domain/transactions";
import { THEME_LABEL } from "@/src/server/overview";
import { CATEGORY_BY_NAME, seedRows, themeFromHex } from "@/src/server/seed";
import { applyVariant, SEED_VARIANTS } from "@/src/server/variants";
import { COPY } from "@/src/shared/copy";
import { formatDate, ordinalDay } from "@/src/shared/dates";
import { CATEGORIES, THEMES } from "@/src/shared/enums";
import { budgetFillPercent } from "@/src/shared/budgets";
import { AMOUNT_MAX_CENTS } from "@/src/shared/schemas";
import { formatMoney, formatPercent, formatSignedMoney } from "@/src/shared/money";
import { potPercent } from "@/src/domain/pots";

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
      `Total Bills **${formatMoney(totals.total.amount)}** (${totals.total.amount.toLocaleString("en-US")} cents); Paid Bills **${totalText(totals.paid)}**; Total Upcoming **${totalText(totals.totalUpcoming)}**; Due Soon **${totalText(totals.dueSoon)}** — ${soon.map((b) => `${b.name} (${formatMoney(b.amount)}, ${ordinalDay(b.day)})`).join(" and ")}, as US-27 AC3 says.`,
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

const BUDGETS_HEADING = "**4.2 The seed**";

describe("SPEC-budgets 4.2 and 4.4–4.7 are generated, never typed (H15 (2))", () => {
  const spec = read("docs/03-specs/budgets.md");
  const flat = spec.replace(/\n\s*/g, " ");
  const figures = budgetFigures();
  const { seed } = figures;
  const themeName = (hex: string) => THEME_LABEL.get(themeFromHex(hex))!;
  const total = (s: { spent: number; limit: number }) =>
    `${formatMoney(s.spent)} of ${formatMoney(s.limit)}`;
  const WORDS = [
    "no",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
  ];

  it("US-14 AC1 AC2 AC4 4.2's table equals the seed's budgets as budgetsSummary reads them", () => {
    expect(tableUnder(spec, BUDGETS_HEADING)).toEqual(budgetTable(themeName));
  });

  it("would report Dining Out's Remaining below $0.00 (violation fixture)", () => {
    const table = tableUnder(
      read("tests/fixtures/seed-figures/budgets-remaining-negative.md.fixture"),
      BUDGETS_HEADING,
    );
    expect(differingRows(table, budgetTable(themeName))).toEqual(["Dining Out"]);
  });

  it("US-20 AC1 4.2: the totals, equal to overviewSummary's, the free values and the new budgets' spent", () => {
    const overview = seedFigures().budgets;
    expect({ spent: seed.spent, limit: seed.limit }).toEqual({
      spent: overview.spent,
      limit: overview.limit,
    });
    expect(flat).toContain(`Totals **${total(seed)}** — "Spent ${total(seed)} limit"`);
    const usedThemes = new Set(figures.input.budgets.map((b) => themeName(b.theme)));
    const freeThemes = THEMES.filter((theme) => !usedThemes.has(theme));
    expect(flat).toContain(
      `Free for a new budget: ${WORDS[figures.freeCategories.length]} categories (${figures.freeCategories[0]} first) and ${WORDS[freeThemes.length]} themes (${freeThemes[0]} first)`,
    );
    expect(flat).toContain(
      `What a new budget in a free category would show at once (US-15 AC3; August spent): ${figures.freeCategories
        .map((c) => `${c} ${formatMoney(figures.newSpent[c]!)}`)
        .join(", ")
        .replace(
          `Shopping ${formatMoney(0)}`,
          `Shopping ${formatMoney(0)} (its three transactions are all in July)`,
        )}`,
    );
  });

  it("US-18 AC1 AC2 4.4: each seed budget's latest three, the income rows and the shorter list", () => {
    for (const budget of seed.items) {
      expect(budget.latest).toEqual(figures.latest[budget.category]);
    }
    const line = (category: string) => figures.latest[category]!.map(latestText).join(" · ");
    for (const category of ["Bills", "Dining Out"]) {
      expect(flat).toContain(`- ${category}: ${line(category)}.`);
    }
    const [pixel, james, rina] = figures.latest["Entertainment"]!;
    expect(flat).toContain(
      `- Entertainment: ${latestText(pixel!)} · ${latestText(james!)} · ${latestText(rina!)} (the two of`,
    );
    expect(flat).toContain(`- Personal Care: ${line("Personal Care")} (a month older`);
    for (const category of ["General", "Groceries"]) {
      const [income, ...rest] = figures.latest[category]!;
      expect(income!.amount).toBeGreaterThan(0);
      expect(flat).toContain(
        `**${category}** (${income!.name} ${formatDate(income!.date)} **${formatSignedMoney(income!.amount)}** · ${rest[0]!.name}`,
      );
    }
    expect(seed.items.flatMap((b) => b.latest).every((t) => t.amount < 0)).toBe(true);
    const education = figures.latest["Education"]!;
    expect(education).toHaveLength(2);
    expect(flat).toContain(
      `a budget for **Education** (${education[0]!.name} ${formatDate(education[0]!.date)} and ${formatDate(education[1]!.date)}, ${formatSignedMoney(education[0]!.amount)} each)`,
    );
    expect(flat).toContain(
      `The longest name in the seed budgets' lists is "${figures.longestLatestName}" (${figures.longestLatestName.length} characters)`,
    );
  });

  it("US-14 AC3 US-18 AC2 US-20 AC2 4.5: the variants, through the domain's applyVariant", () => {
    for (const name of SEED_VARIANTS) {
      const summary = figures.variant(name);
      const overview = overviewSummary(seedVariantInput(name), fixedClock(BUSINESS_TODAY)).budgets;
      expect({ spent: summary.spent, limit: summary.limit }, name).toEqual({
        spent: overview.spent,
        limit: overview.limit,
      });
    }
    const empty = figures.variant("empty-budgets");
    expect(figures.variant("empty-all")).toEqual(empty);
    expect(flat).toContain(`no budgets, totals ${total(empty)} ("Spent ${total(empty)} limit"`);
    const few = figures.variant("few-transactions");
    const kept = seedVariantInput("few-transactions").transactions;
    const dining = few.items.find((b) => b.category === "Dining Out")!;
    expect(flat).toContain(
      `\`few-transactions\` (the latest three transactions kept: ${[...kept]
        .sort(compareLatest)
        .map((t) => t.name)
        .join(", ")})`,
    );
    expect(flat).toContain(
      `Dining Out spent ${formatMoney(dining.spent)}, remaining ${formatMoney(dining.remaining)}, bar ${barText(dining.spent, dining.maximum)}, ${WORDS[dining.latest.length]} row (${dining.latest.map((t) => t.name).join(", ")})`,
    );
    const others = few.items.filter((b) => b !== dining);
    expect(others.map((b) => b.category)).toEqual(["Entertainment", "Bills", "Personal Care"]);
    expect(others.every((b) => b.spent === 0 && b.latest.length === 0)).toBe(true);
    expect(flat).toContain(`totals ${total(few)}.`);
  });

  it("US-15 AC3 US-16 AC2 US-17 AC2 4.6: the worked writes", () => {
    const { writes } = figures;
    const last = (s: typeof seed) => s.items.at(-1)!;
    const general = last(writes.addGeneral);
    expect(writes.addGeneral.items).toHaveLength(5);
    expect(flat).toContain(
      `add General ${formatMoney(general.maximum)} Red → listed fifth, spent ${formatMoney(general.spent)}, remaining ${formatMoney(general.remaining)}, bar ${barText(general.spent, general.maximum)}, totals ${total(writes.addGeneral)}.`,
    );
    const groceries = last(writes.addGroceries);
    expect(flat).toContain(
      `Add Groceries ${formatMoney(groceries.maximum)} Red → spent ${formatMoney(groceries.spent)}, remaining ${formatMoney(groceries.remaining)}, bar ${barText(groceries.spent, groceries.maximum)}, totals ${total(writes.addGroceries)}.`,
    );
    const d150 = writes.diningOut150.items.find((b) => b.category === "Dining Out")!;
    const d133 = writes.diningOut133.items.find((b) => b.category === "Dining Out")!;
    expect(writes.diningOut150.items.map((b) => b.category)).toEqual(
      seed.items.map((b) => b.category),
    );
    expect(flat).toContain(
      `Edit Dining Out's maximum to ${formatMoney(d150.maximum)} → remaining ${formatMoney(d150.remaining)}, bar ${barText(d150.spent, d150.maximum)}, limit ${formatMoney(writes.diningOut150.limit)}; to ${formatMoney(d133.maximum)} → remaining ${formatMoney(d133.remaining)}, bar ${barText(d133.spent, d133.maximum)}.`,
    );
    const deleted = writes.deleteEntertainment;
    expect(flat).toContain(
      `Delete Entertainment → ${WORDS[deleted.items.length]} budgets, totals ${total(deleted)}, the balance still ${formatMoney(figures.input.balance.current)}.`,
    );
  });

  it("US-14 AC2 US-20 4.7: the boundaries", () => {
    const { oneCent, largest, tenLargest } = figures.boundaries;
    expect(flat).toContain(
      `A maximum of 1 cent with ${formatMoney(oneCent.spent)} spent: remaining ${formatMoney(oneCent.remaining)}, bar ${budgetFillPercent(oneCent.spent, oneCent.maximum)} %.`,
    );
    expect(largest.maximum).toBe(AMOUNT_MAX_CENTS);
    const amount = formatMoney(largest.maximum);
    expect(flat).toContain(
      `"Maximum of ${amount}" (${amount.length} characters of amount), remaining ${formatMoney(largest.remaining)} with ${formatMoney(largest.spent)} spent, bar ${barText(largest.spent, largest.maximum)};`,
    );
    expect(Number.isSafeInteger(tenLargest.limit)).toBe(true);
    expect(flat).toContain(
      `ten budgets at that maximum make a limit of ${tenLargest.limit.toLocaleString("en-US")} cents`,
    );
    expect(flat).toContain(`give the limit ${formatMoney(tenLargest.limit)}`);
    expect(flat).toContain(
      `the ten categories' August figures of 4.2 summed, ${formatMoney(tenLargest.spent)}`,
    );
    const d133 = figures.writes.diningOut133.items.find((b) => b.category === "Dining Out")!;
    expect(flat).toContain(
      `Spent equal to the maximum (${formatMoney(d133.spent)} of ${formatMoney(d133.maximum)}): remaining ${formatMoney(d133.remaining)}, bar ${barText(d133.spent, d133.maximum)}.`,
    );
  });
});

describe("SPEC-pots 4.2–4.6 are generated, never typed (H16 (2))", () => {
  const flat = read("docs/03-specs/pots.md").replace(/\n\s*/g, " ");
  const figures = potFigures((hex) => THEME_LABEL.get(themeFromHex(hex))!);
  const { seed } = figures;
  const $ = formatMoney;
  const pct = formatPercent;
  const sp = percentSpaced;
  const totalOf = (pots: readonly { total: number }[]) => pots.reduce((s, p) => s + p.total, 0);
  const potOf = (pots: readonly { name: string; total: number; target: number }[], name: string) =>
    pots.find((p) => p.name === name)!;

  it("US-21 AC1 4.2: each seed pot, the sums and the longest name", () => {
    for (const [index, p] of seed.pots.entries()) {
      expect(flat).toContain(
        `${p.name}, ${THEME_LABEL.get(themeFromHex(p.theme))}, ${$(p.total)} of ${$(p.target)}, **${pct(potPercent(p.total, p.target))}**`,
      );
      expect(p.seq).toBe(index + 1);
    }
    expect(flat).toContain(`Pots total ${$(figures.potsTotal)} (Overview's "Total Saved"`);
    expect(flat).toContain(`Current Balance ${$(seed.balance)};`);
    expect(flat).toContain(
      `**balance + pots = ${$(figures.sum)} (${figures.sum.toLocaleString("en-US")} cents)**`,
    );
    expect(flat).toContain(`no pot's Total Saved can ever exceed ${$(figures.sum)}`);
    expect(flat).toContain(
      `The longest seed name has ${figures.longestName.length} characters (${figures.longestName})`,
    );
    expect(flat).toContain(
      `(the largest numerator, 2 · ${figures.sum.toLocaleString("en-US")} · 10,000 + 99,999,999,999, is ${figures.largestNumerator.toLocaleString("en-US")}`,
    );
    expect(Number.isSafeInteger(figures.largestNumerator)).toBe(true);
  });

  it("US-25 US-26 US-24 4.3: the chain conserves the sum, step by step", () => {
    const { deposit, withdrawal, deletion } = figures.chain;
    const after = (state: { balance: number; pots: { total: number }[] }) =>
      `the balance ${$(state.balance)}, pots ${$(totalOf(state.pots))}`;
    expect(flat).toContain(
      `Add to ‘Savings’ $100.00 — preview New Amount ${$(deposit.preview.newTotal)}, ${sp(deposit.preview.percent)} in green, the bar ${sp(deposit.preview.staying)} dark + ${sp(deposit.preview.moving)} green; after it ${after(deposit.after)}, sum ${$(figures.sum)}.`,
    );
    expect(flat).toContain(
      `Withdraw from ‘Concert Ticket’ $30.00 — preview ${$(withdrawal.preview.newTotal)}, ${sp(withdrawal.preview.percent)} in red, the bar ${sp(withdrawal.preview.staying)} dark + ${sp(withdrawal.preview.moving)} red; after it ${after(withdrawal.after)}, sum ${$(figures.sum)}.`,
    );
    expect(flat).toContain(
      `delete New Laptop — ${$(deletion.refund)} back, ${after(deletion.after)} (${deletion.after.pots.map((p) => p.name).join(", ")}), sum ${$(figures.sum)}.`,
    );
    for (const state of [deposit.after, withdrawal.after, deletion.after]) {
      expect(state.balance + totalOf(state.pots)).toBe(figures.sum);
    }
  });

  it("US-25 AC1 AC3 US-26 AC1 US-23 AC2 4.3: past the target, all of a pot, the whole balance, deletions, edits", () => {
    const { concert, concertBar, gift } = figures.pastTarget;
    expect(flat).toContain(
      `Add to ‘Concert Ticket’ $50.00 → New Amount ${$(concert.newTotal)}, **${pct(concert.percent)}**, the bar ${sp(concert.staying)} + ${sp(concert.moving)} (full); the card's bar afterwards ${concertBar / 100} %. Add to ‘Gift’ $40.00 → ${$(gift.newTotal)}, ${pct(gift.percent)}.`,
    );
    const holiday = figures.allOfHoliday;
    expect(flat).toContain(
      `Withdraw from ‘Holiday’ ${$(holiday.preview.moved)} → ${$(holiday.preview.newTotal)}, ${pct(holiday.preview.percent)}, the bar ${holiday.preview.staying / 100} % + ${sp(holiday.preview.moving)} red; the balance ${$(holiday.after.balance)}. ${$(holiday.preview.moved + 1)} → \`exceeds_total\`; the preview clamps to ${$(holiday.clamped.moved)}.`,
    );
    const whole = figures.wholeBalance;
    expect(flat).toContain(
      `Add to ‘Savings’ ${$(seed.balance)} → allowed; ${$(whole.preview.newTotal)}, **${pct(whole.preview.percent)}**, the bar ${sp(whole.preview.staying)} + ${sp(whole.preview.moving)} (full); the balance **${$(whole.after.balance)}**. ${$(seed.balance + 1)} → \`exceeds_balance\`; the preview clamps to ${$(whole.clamped.moved)}.`,
    );
    const d = figures.deletions;
    expect(flat).toContain(
      `Holiday → the balance ${$(d.Holiday.balance)} and the pots total ${$(totalOf(d.Holiday.pots))}; Savings → ${$(d.Savings.balance)}; New Laptop → ${$(d["New Laptop"].balance)}.`,
    );
    expect(flat).toContain(
      `After deleting Savings, Overview's first four pots are ${d.Savings.pots
        .slice(0, 4)
        .map((p) => `${p.name} ${$(p.total)}`)
        .join(", ")}.`,
    );
    const holidayTotal = potOf(seed.pots, "Holiday").total;
    const savingsTotal = potOf(seed.pots, "Savings").total;
    expect(figures.edits.holidayFill).toBe(10_000);
    expect(flat).toContain(
      `Holiday's target to $500.00 (below its ${$(holidayTotal)}) → **${pct(figures.edits.holiday500)}**, the bar full (US-23 AC2); Savings' target to ${$(savingsTotal)} → ${pct(figures.edits.savingsAtTotal)}.`,
    );
  });

  it("US-04 AC2 AC3 4.3: Overview after a deposit and a withdrawal; income and expenses unchanged", () => {
    const { afterSavings100, afterHoliday31 } = figures.overview;
    const { income, expenses } = figures.input.balance;
    expect(flat).toContain(
      `after Add to ‘Savings’ $100.00 — Current Balance ${$(afterSavings100.balance)}, Pots ${$(totalOf(afterSavings100.pots))}, Income ${$(income)} and Expenses ${$(expenses)} unchanged; after Withdraw from ‘Holiday’ $31.00 — ${$(afterHoliday31.balance)} and ${$(totalOf(afterHoliday31.pots))}.`,
    );
  });

  it("US-21 AC1 4.4: the edges and the three float ties", () => {
    expect(flat).toContain(
      `0 / any target → ${pct(potPercent(0, 1))}; 1/3 → ${pct(potPercent(1, 3))}; 2/3 → ${pct(potPercent(2, 3))}; 1 cent of ${$(AMOUNT_MAX_CENTS)} → ${pct(potPercent(1, AMOUNT_MAX_CENTS))}; the largest the data allows, ${$(figures.sum)} of a 1-cent target → ${pct(potPercent(figures.sum, 1))}`,
    );
    const ties = [3, 7, 9];
    const target = 20_000;
    expect(flat).toContain(
      `half up gives ${ties.map((t) => pct(potPercent(t, target))).join(", ")}, while \`toFixed(2)\` on the float gives ${ties.map((t) => `${((t / target) * 100).toFixed(2)}%`).join(", ")}`,
    );
    expect(flat).toContain(`cents of a ${$(target)} target`);
  });

  it("US-25 AC2 US-22 4.5: the zero balance and the fifteen pots", () => {
    const { afterDeposit, giftWithdrawal } = figures.zeroBalance;
    expect(flat).toContain(
      `\`POST /api/pots/<Savings>/deposit { amount: ${seed.balance} }\` → the balance ${$(afterDeposit.balance)} (Savings ${$(potOf(afterDeposit.pots, "Savings").total)})`,
    );
    expect(flat).toContain(
      `(Withdraw from ‘Gift’ $10.00 → the balance ${$(giftWithdrawal.balance)})`,
    );
    expect(flat).toContain(
      `the seed uses ${figures.usedThemes.slice(0, -1).join(", ")} and ${figures.usedThemes.at(-1)}; the add form opens on **${figures.firstFree}**`,
    );
    expect(figures.freeThemes).toHaveLength(THEMES.length - seed.pots.length);
    expect(flat).toContain(
      `ten \`POST /api/pots\`, one per free theme in \`THEMES\` order (${figures.freeThemes.join(", ")}), make 15 pots`,
    );
    expect(figures.budgetThemes.every((t) => figures.usedThemes.includes(t))).toBe(true);
    expect(flat).toContain(
      `The seed's four budget themes (${figures.budgetThemes.join(", ")}) are all also pot themes`,
    );
  });

  it("US-22 AC2 US-23 AC1 4.6: the taken names", () => {
    const { names } = figures;
    expect([
      names.paddedLower,
      names.upper,
      names.savings2,
      names.ownName,
      names.giftToHoliday,
    ]).toEqual([true, true, false, false, true]);
    expect(flat).toContain(
      `"  savings  " and "SAVINGS" are taken (Savings); "Savings 2" is free; editing Savings to "savings" is allowed (its own name); editing Gift to "Holiday" is taken.`,
    );
  });
});
