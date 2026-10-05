// The figures of docs/03-specs/budgets.md §4 (T-15d, S4). Run from the repository root:
//   FORCE_COLOR=0 npx tsx docs/04-process/prompts/2026-10-04-T-15d/budgets-figures/figures.ts
// README.md beside this file says which parts are the repository's code and which are this
// script's reading of the spec.
import { budgetSpent } from "@/src/domain/budgets";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { sumCents } from "@/src/domain/money";
import { overviewSummary } from "@/src/domain/overview";
import { latestTransactions } from "@/src/domain/transactions";
import { CATEGORY_LABEL, THEME_LABEL } from "@/src/server/overview";
import { seedRows } from "@/src/server/seed";
import { applyVariant, type SeedVariant } from "@/src/server/variants";
import { formatDate } from "@/src/shared/dates";
import { CATEGORIES, THEMES, type Category, type Theme } from "@/src/shared/enums";
import { formatMoney, formatSignedMoney } from "@/src/shared/money";
import { DONUT_RADIUS, donutSegments } from "@/src/ui/overview/donut-geometry";

type Tx = {
  name: string;
  avatar: string;
  category: Category;
  date: Date;
  iso: string;
  amount: number;
  recurring: boolean;
};
type Budget = { seq: number; category: Category; maximum: number; theme: Theme };
type Input = { balance: { current: number; income: number; expenses: number }; transactions: Tx[]; budgets: Budget[]; pots: { seq: number; total: number }[] };

const clock = fixedClock(BUSINESS_TODAY);

function label<T>(map: ReadonlyMap<string, T>, key: string): T {
  const value = map.get(key);
  if (value === undefined) throw new Error(`no label for ${key}`);
  return value;
}

/** The repository's seed rows, through the repository's own variant function. */
function input(variant: SeedVariant): Input {
  const rows = applyVariant(seedRows(), variant);
  return {
    balance: rows.balance,
    transactions: rows.transactions.map((t) => ({
      name: t.name,
      avatar: t.avatar,
      category: label(CATEGORY_LABEL, t.category),
      date: new Date(t.date),
      iso: t.date,
      amount: t.amount,
      recurring: t.recurring,
    })),
    budgets: rows.budgets.map((b, i) => ({
      seq: i + 1,
      category: label(CATEGORY_LABEL, b.category),
      maximum: b.maximum,
      theme: label(THEME_LABEL, b.theme),
    })),
    pots: rows.pots.map((p, i) => ({ seq: i + 1, total: p.total })),
  };
}

const H = (s: string) => console.log("\n=== " + s + " ===");

// budgets.md 2.4: Remaining never below $0.00; the bar's fill is spent / maximum, capped at 100 %,
// written with two decimals (round half up). These two lines are the spec's rule, not repository code.
const remaining = (b: Budget, spent: number) => Math.max(0, b.maximum - spent);
const fillPercent = (b: Budget, spent: number) => {
  const raw = (spent / b.maximum) * 100;
  return Math.min(100, Math.round(raw * 100) / 100);
};
const rawPercent = (b: Budget, spent: number) => ((spent / b.maximum) * 100).toFixed(4);

/** budgets.md 2.5: the three most recent transactions of a category, any month, any sign. */
const latestSpending = (category: Category, txs: readonly Tx[]) =>
  latestTransactions(
    txs.filter((t) => t.category === category),
    3,
  );

const txLine = (t: Tx) =>
  `${t.name} | ${formatDate(t.date)} (${t.iso}) | ${t.amount} cents | ${formatSignedMoney(t.amount)}${t.amount > 0 ? " | INCOME" : ""}`;

function budgetsReport(variant: SeedVariant) {
  const data = input(variant);
  H(`BUDGETS — variant "${variant}" (creation order, seq)`);
  console.log("budgets:", data.budgets.length, "| transactions:", data.transactions.length);
  if (data.budgets.length === 0) console.log("(no budgets: the empty state of US-14 AC3, US-20 AC2)");
  for (const b of data.budgets) {
    const spent = budgetSpent(b.category, data.transactions, clock);
    console.log(
      `${b.seq}. ${b.category} | theme ${b.theme} | maximum ${b.maximum} (${formatMoney(b.maximum)}) | spent ${spent} (${formatMoney(spent)}) | remaining ${remaining(b, spent)} (${formatMoney(remaining(b, spent))}) | spent/maximum ${rawPercent(b, spent)} % | bar fill ${fillPercent(b, spent)} %`,
    );
    console.log(`   card: "Maximum of ${formatMoney(b.maximum)}" · summary row: "${formatMoney(spent)}" "of ${formatMoney(b.maximum)}"`);
    const latest = latestSpending(b.category, data.transactions);
    if (latest.length === 0) console.log("   latest spending: none (the empty message)");
    latest.forEach((t, i) => console.log(`   latest ${i + 1}: ${txLine(t)}`));
  }
  const spentTotal = sumCents(data.budgets.map((b) => budgetSpent(b.category, data.transactions, clock)));
  const limit = sumCents(data.budgets.map((b) => b.maximum));
  console.log(`totals: spent ${spentTotal} (${formatMoney(spentTotal)}) | limit ${limit} (${formatMoney(limit)})`);
  console.log(`donut aria-label: "Spent ${formatMoney(spentTotal)} of ${formatMoney(limit)} limit" | centre: "${formatMoney(spentTotal)}" / "of ${formatMoney(limit)} limit"`);
  const overview = overviewSummary(data, clock);
  console.log(
    `overviewSummary (repository) agrees: spent ${overview.budgets.spent === spentTotal}, limit ${overview.budgets.limit === limit}`,
  );
  return data;
}

// ---------------------------------------------------------------- the seed
const seed = budgetsReport("seed");

H("DONUT SEGMENTS (seed) — the repository's donutSegments, over all budgets, total = limit");
const limit = sumCents(seed.budgets.map((b) => b.maximum));
const circumference = 2 * Math.PI * DONUT_RADIUS;
const segments = donutSegments(seed.budgets, limit);
let startDegrees = 0;
seed.budgets.forEach((b, i) => {
  const share = b.maximum / limit;
  const segment = segments[i];
  if (!segment) throw new Error("segment missing");
  console.log(
    `${b.category} (${b.theme}): ${b.maximum} / ${limit} = ${(share * 100).toFixed(2)} % | from ${startDegrees.toFixed(2)}° to ${(startDegrees + share * 360).toFixed(2)}° | dasharray "${segment.strokeDasharray}" offset ${segment.strokeDashoffset}`,
  );
  startDegrees += share * 360;
});
console.log(`radius ${DONUT_RADIUS}, circumference ${circumference}`);

H("AUGUST SPENT PER CATEGORY (seed) — the repository's budgetSpent; what a new budget would show (US-15 AC3)");
for (const c of CATEGORIES) {
  const inCat = seed.transactions.filter((t) => t.category === c);
  const aug = inCat.filter((t) => t.date.getUTCFullYear() === 2026 && t.date.getUTCMonth() === 7);
  const spent = budgetSpent(c, seed.transactions, clock);
  const hasBudget = seed.budgets.some((b) => b.category === c);
  console.log(
    `${c}: ${hasBudget ? "has a budget" : "free"} | transactions ${inCat.length} (August ${aug.length}: ${aug.filter((t) => t.amount < 0).length} negative, ${aug.filter((t) => t.amount > 0).length} positive) | August spent ${spent} (${formatMoney(spent)})`,
  );
}

H("LATEST SPENDING PER CATEGORY (seed) — latestTransactions (repository) on the category's rows");
for (const c of CATEGORIES) {
  const latest = latestSpending(c, seed.transactions);
  console.log(`## ${c}: ${latest.length} shown`);
  latest.forEach((t, i) => console.log(`   ${i + 1}. ${txLine(t)}`));
}
const incomeInBudgetLists = seed.budgets.flatMap((b) => latestSpending(b.category, seed.transactions)).filter((t) => t.amount > 0);
console.log("incomes in the seed budgets' latest lists:", incomeInBudgetLists.length);
const incomeAnyCategory = CATEGORIES.flatMap((c) => latestSpending(c, seed.transactions).filter((t) => t.amount > 0).map((t) => `${c}: ${t.name} ${formatSignedMoney(t.amount)}`));
console.log("incomes in any category's latest list:", incomeAnyCategory.join(" ; ") || "none");

H("NAMES in the seed budgets' latest lists");
const names = [...new Set(seed.budgets.flatMap((b) => latestSpending(b.category, seed.transactions)).map((t) => t.name))];
names.sort((a, b) => b.length - a.length);
console.log(names.map((n) => `${n.length} chars: ${n}`).join("\n"));
const allLatestNames = [...new Set(CATEGORIES.flatMap((c) => latestSpending(c, seed.transactions)).map((t) => t.name))].sort((a, b) => b.length - a.length);
console.log("longest name in any category's latest list:", allLatestNames[0], allLatestNames[0]?.length);

H("SEE ALL (US-19 AC1) — URLSearchParams, as transactions.md 2.2 writes the query");
for (const c of CATEGORIES) {
  const query = new URLSearchParams({ category: c, page: "1" }).toString();
  const count = seed.transactions.filter((t) => t.category === c).length;
  console.log(`${c}: /transactions?${query} | rows on Transactions: ${count}`);
}

H("THEMES (seed) — budgets' themes and the first free one");
const usedThemes = seed.budgets.map((b) => b.theme);
console.log("used:", usedThemes.join(", "), "| free:", THEMES.filter((t) => !usedThemes.includes(t)).length, "| first free:", THEMES.find((t) => !usedThemes.includes(t)));
const usedCategories = seed.budgets.map((b) => b.category);
console.log("categories used:", usedCategories.length, "| free:", CATEGORIES.filter((c) => !usedCategories.includes(c)).join(", "), "| first free:", CATEGORIES.find((c) => !usedCategories.includes(c)));
console.log("budgets possible at once:", CATEGORIES.length, "(one per category) | themes:", THEMES.length, "| so a free theme always exists for a new budget:", THEMES.length > CATEGORIES.length - 1);

// ---------------------------------------------------------------- the variants
budgetsReport("empty-budgets");
budgetsReport("few-transactions");
budgetsReport("empty-all");

H("WORKED WRITES (the spec's examples, on the seed)");
const add = (category: Category, maximum: number, theme: Theme) => {
  const spent = budgetSpent(category, seed.transactions, clock);
  const b: Budget = { seq: seed.budgets.length + 1, category, maximum, theme };
  const all = [...seed.budgets, b];
  const s = sumCents(all.map((x) => budgetSpent(x.category, seed.transactions, clock)));
  const l = sumCents(all.map((x) => x.maximum));
  console.log(
    `add ${category} ${formatMoney(maximum)} ${theme}: seq ${b.seq} | spent ${formatMoney(spent)} | remaining ${formatMoney(remaining(b, spent))} | fill ${fillPercent(b, spent)} % | latest ${latestSpending(category, seed.transactions).map((t) => `${t.name} ${formatSignedMoney(t.amount)} ${formatDate(t.date)}`).join(" ; ")} | new totals ${formatMoney(s)} of ${formatMoney(l)}`,
  );
};
add("General", 50000, "Red");
add("Groceries", 20000, "Red");
const edit = (category: Category, maximum: number) => {
  const b = seed.budgets.find((x) => x.category === category);
  if (!b) throw new Error("no budget");
  const spent = budgetSpent(category, seed.transactions, clock);
  const all = seed.budgets.map((x) => (x === b ? { ...x, maximum } : x));
  console.log(
    `edit ${category} maximum ${formatMoney(b.maximum)} -> ${formatMoney(maximum)}: spent ${formatMoney(spent)} | remaining ${formatMoney(remaining({ ...b, maximum }, spent))} | fill ${fillPercent({ ...b, maximum }, spent)} % | new limit ${formatMoney(sumCents(all.map((x) => x.maximum)))}`,
  );
};
edit("Dining Out", 15000);
edit("Dining Out", 13300);
edit("Entertainment", 1);
const del = (category: Category) => {
  const all = seed.budgets.filter((x) => x.category !== category);
  console.log(
    `delete ${category}: ${all.length} budgets | totals ${formatMoney(sumCents(all.map((x) => budgetSpent(x.category, seed.transactions, clock))))} of ${formatMoney(sumCents(all.map((x) => x.maximum)))} | balance unchanged ${formatMoney(seed.balance.current)}`,
  );
};
del("Entertainment");

H("BOUNDARIES");
const one: Budget = { seq: 9, category: "Entertainment", maximum: 1, theme: "Red" };
console.log(`maximum 1 cent, spent ${formatMoney(1500)}: remaining ${formatMoney(remaining(one, 1500))}, fill ${fillPercent(one, 1500)} %`);
const max: Budget = { seq: 9, category: "Entertainment", maximum: 99_999_999_999, theme: "Red" };
console.log(`maximum ${formatMoney(max.maximum)}, spent ${formatMoney(1500)}: remaining ${formatMoney(remaining(max, 1500))}, fill ${fillPercent(max, 1500)} %, raw ${rawPercent(max, 1500)} %`);
const exact: Budget = { seq: 9, category: "Dining Out", maximum: 13300, theme: "Red" };
console.log(`maximum ${formatMoney(13300)}, spent ${formatMoney(13300)}: remaining ${formatMoney(remaining(exact, 13300))}, fill ${fillPercent(exact, 13300)} %`);
const third: Budget = { seq: 9, category: "Dining Out", maximum: 30000, theme: "Red" };
console.log(`maximum ${formatMoney(30000)}, spent ${formatMoney(10000)}: fill ${fillPercent(third, 10000)} % (raw ${rawPercent(third, 10000)})`);
H("TOOL DESCRIPTIONS (budgets.md 2.13) — defineTool allows at most 200 characters");
const descriptions: Record<string, string> = {
  list_budgets:
    "Lists the demo account's budgets in creation order: category, theme, maximum, August spent, remaining, three latest transactions, and totals. Money in USD cents. Budgets page.",
  add_budget:
    "Creates a budget: a category with no budget yet, a maximum in USD cents (1 to 99999999999) and a theme no other budget uses. Returns the budget as the page shows it. Budgets page.",
  edit_budget:
    "Changes a budget by id: any of its category, maximum (USD cents) and theme. A category or theme another budget uses is refused. Returns the budget as the page shows it. Budgets page.",
  delete_budget:
    "Deletes a budget by id, only after the person confirms in the page's dialog; returns cancelled if they decline, busy if a dialog is already open. Budgets page.",
};
for (const [name, text] of Object.entries(descriptions)) console.log(`${name}: ${text.length} characters | ${text}`);

const tenMax = sumCents(CATEGORIES.map(() => 99_999_999_999));
console.log(`ten budgets at the largest maximum: limit ${tenMax} cents, safe integer ${Number.isSafeInteger(tenMax)}`);
console.log(`the widest money text of a maximum: ${formatMoney(99_999_999_999)} (${formatMoney(99_999_999_999).length} characters); "Maximum of ${formatMoney(99_999_999_999)}"`);
