// The figures of docs/03-specs/pots.md §4 (T-15d, S5). Run from the repository root:
//   FORCE_COLOR=0 npx tsx docs/04-process/prompts/2026-10-04-T-15d/pots-figures/figures.ts
// README.md says which parts are the repository's code and which are this spec's rules, written here by hand.
import { seedRows } from "@/src/server/seed";
import { THEMES } from "@/src/shared/enums";
import { formatMoney } from "@/src/shared/money";

type Pot = { name: string; theme: string; target: number; total: number };

const rows = seedRows();
const label = (key: string): string =>
  ({ NavyGrey: "Navy Grey", ArmyGreen: "Army Green" }) [key as "NavyGrey" | "ArmyGreen"] ?? key;
const seedPots: Pot[] = rows.pots.map((p) => ({ name: p.name, theme: label(p.theme), target: p.target, total: p.total }));
const seedBalance = rows.balance.current;
const H = (title: string) => console.log("\n=== " + title + " ===");
const at = <T>(list: readonly T[], index: number): T => {
  const item = list[index];
  if (item === undefined) throw new Error(`no item ${index}`);
  return item;
};
const find = (pots: readonly Pot[], name: string): Pot => {
  const pot = pots.find((p) => p.name === name);
  if (!pot) throw new Error(`no pot ${name}`);
  return pot;
};

// ---------------------------------------------------------------------------------------
// The spec's rules (pots.md 2.3, 2.6), written by hand: no repository code implements them yet.

/** US-21 AC1, R-08: total / target × 100, two decimals, round half up — in basis points (1 bp = 0.01 %), integers only. */
function percentBp(total: number, target: number): number {
  const t = BigInt(total), g = BigInt(target);
  return Number((2n * t * 10_000n + g) / (2n * g));
}
const pctText = (bp: number): string => `${Math.floor(bp / 100)}.${String(bp % 100).padStart(2, "0")}%`;
/** The card's bar: capped at 100 % (US-21 AC1, US-23 AC2, US-25 AC3). */
const fillBp = (total: number, target: number): number => Math.min(10_000, percentBp(total, target));
/** The design's text, for the departure row of 2.14: `pct.toFixed(pct >= 10 ? 1 : 2) + '%'` on a float. */
const designPct = (total: number, target: number): string => {
  const pct = (total / target) * 100;
  return pct.toFixed(pct >= 10 ? 1 : 2) + "%";
};
/** The design's target text, `fmtShort`: no decimals. */
const designShort = (cents: number): string => "$" + Math.round(cents / 100).toLocaleString("en-US");

/**
 * The money modals' preview (pots.md 2.6): the amount is clamped to the limit as the design clamps it
 * (`Math.min(amt, s.balance)`, `Math.min(amt, pot.total)`); base is the part that stays, delta the part that moves.
 */
function preview(pot: Pot, kind: "add" | "withdraw", amount: number, balance: number) {
  const moved = kind === "add" ? Math.min(amount, balance) : Math.min(amount, pot.total);
  const newTotal = kind === "add" ? pot.total + moved : pot.total - moved;
  const base = Math.min(pot.total, newTotal);
  const baseBp = fillBp(base, pot.target);
  const deltaBp = Math.min(10_000 - baseBp, Math.min(10_000, percentBp(moved, pot.target)));
  return { moved, newTotal, baseBp, deltaBp, percent: percentBp(newTotal, pot.target) };
}
const showPreview = (pot: Pot, kind: "add" | "withdraw", amount: number, balance: number) => {
  const p = preview(pot, kind, amount, balance);
  return `New Amount ${formatMoney(p.newTotal)}, ${pctText(p.percent)} (${kind === "add" ? "green" : "red"}), Target of ${formatMoney(pot.target)}; bar: base ${pctText(p.baseBp)} + ${kind === "add" ? "green" : "red"} ${pctText(p.deltaBp)}${p.moved !== amount ? ` (typed ${formatMoney(amount)}, clamped to ${formatMoney(p.moved)})` : ""}`;
};

// The amount grammar is ui-kit.md 2.5's (its figures record holds the examples); the codes the money modals add:
function checkMove(kind: "add" | "withdraw", amount: number, pot: Pot, balance: number): string {
  if (kind === "add") return amount > balance ? "exceeds_balance" : "ok";
  return amount > pot.total ? "exceeds_total" : "ok";
}

// ---------------------------------------------------------------------------------------
H("SEED POTS (creation order = data.json order; seq 1..5)");
seedPots.forEach((p, i) =>
  console.log(
    `${i + 1}. ${p.name} | ${p.theme} | total ${p.total} = ${formatMoney(p.total)} | target ${p.target} = ${formatMoney(p.target)} | ${pctText(percentBp(p.total, p.target))} (${percentBp(p.total, p.target)} bp) | bar ${pctText(fillBp(p.total, p.target))} | design draws "${designPct(p.total, p.target)}", "Target of ${designShort(p.target)}"`,
  ),
);
const potsSum = seedPots.reduce((s, p) => s + p.total, 0);
console.log(`pots total ${potsSum} = ${formatMoney(potsSum)}; balance ${seedBalance} = ${formatMoney(seedBalance)}; balance + pots = ${seedBalance + potsSum} = ${formatMoney(seedBalance + potsSum)}`);
console.log(`income ${formatMoney(rows.balance.income)}, expenses ${formatMoney(rows.balance.expenses)} (never change, US-04 AC3)`);
console.log(`the largest Total Saved any pot can reach (money is conserved, write-path.md 2.8): ${formatMoney(seedBalance + potsSum)}`);
console.log(`longest seed pot name: ${Math.max(...seedPots.map((p) => p.name.length))} characters (${seedPots.reduce((a, p) => (p.name.length > a.length ? p.name : a), "")})`);
console.log("delete titles: " + seedPots.map((p) => `Delete ‘${p.name}’?`).join(" | "));
console.log("money modal titles: " + seedPots.map((p) => `Add to ‘${p.name}’ / Withdraw from ‘${p.name}’`).join(" | "));

// ---------------------------------------------------------------------------------------
H("ROUND HALF UP (US-21 AC1, R-08)");
console.log(`Savings 15900/200000 → ${pctText(percentBp(15900, 200000))} (the story's example: 7.95%)`);
console.log(`Holiday 53100/144000 = 36.875 % exactly → ${pctText(percentBp(53100, 144000))} (half up; the design's one-decimal text: ${designPct(53100, 144000)})`);
// A tie that floating point rounds the wrong way: search small totals against target 20,000 cents.
const floatMisses: string[] = [];
for (let total = 1; total <= 400 && floatMisses.length < 3; total += 1) {
  const exact = percentBp(total, 20000);
  const float = Math.round(((total / 20000) * 100) * 100) / 100;
  const viaToFixed = ((total / 20000) * 100).toFixed(2);
  if (pctText(exact) !== viaToFixed + "%") floatMisses.push(`total ${total}/20000: exact half up ${pctText(exact)}, toFixed(2) ${viaToFixed}%, Math.round ${float.toFixed(2)}%`);
}
console.log("float toFixed(2) disagrees with half up: " + (floatMisses.length ? floatMisses.join(" | ") : "none found"));
console.log(`0/1 → ${pctText(percentBp(0, 1))}; 1/3 → ${pctText(percentBp(1, 3))}; 2/3 → ${pctText(percentBp(2, 3))}; 1/99999999999 → ${pctText(percentBp(1, 99999999999))}`);
console.log(`largest percentage the data allows: total ${seedBalance + potsSum} / target 1 → ${pctText(percentBp(seedBalance + potsSum, 1))}`);
{
  const numerator = 2n * BigInt(seedBalance + potsSum) * 10_000n + 99_999_999_999n;
  console.log(`largest numerator of potPercent: 2 · ${seedBalance + potsSum} · 10000 + 99999999999 = ${numerator}; Number.MAX_SAFE_INTEGER ${Number.MAX_SAFE_INTEGER}; within it: ${numerator <= BigInt(Number.MAX_SAFE_INTEGER)}`);
}

// ---------------------------------------------------------------------------------------
H("THREE WRITES IN A ROW (write-path.md 4.2's sequence), conservation after each");
{
  let balance = seedBalance;
  const pots = seedPots.map((p) => ({ ...p }));
  const sum = () => balance + pots.reduce((s, p) => s + p.total, 0);
  const savings = find(pots, "Savings");
  console.log(`1. preview, Add to ‘Savings’ $100.00: ${showPreview(savings, "add", 10000, balance)}`);
  savings.total += 10000; balance -= 10000;
  console.log(`   after: balance ${formatMoney(balance)}, Savings ${formatMoney(savings.total)} ${pctText(percentBp(savings.total, savings.target))}, pots ${formatMoney(pots.reduce((s, p) => s + p.total, 0))}, sum ${formatMoney(sum())}`);
  const concert = find(pots, "Concert Ticket");
  console.log(`2. preview, Withdraw from ‘Concert Ticket’ $30.00: ${showPreview(concert, "withdraw", 3000, balance)}`);
  concert.total -= 3000; balance += 3000;
  console.log(`   after: balance ${formatMoney(balance)}, Concert Ticket ${formatMoney(concert.total)} ${pctText(percentBp(concert.total, concert.target))}, pots ${formatMoney(pots.reduce((s, p) => s + p.total, 0))}, sum ${formatMoney(sum())}`);
  const laptop = find(pots, "New Laptop");
  balance += laptop.total; pots.splice(pots.indexOf(laptop), 1);
  console.log(`3. delete New Laptop (${formatMoney(laptop.total)} back): balance ${formatMoney(balance)}, pots ${formatMoney(pots.reduce((s, p) => s + p.total, 0))} (${pots.length} pots: ${pots.map((p) => p.name).join(", ")}), sum ${formatMoney(sum())}`);
}

// ---------------------------------------------------------------------------------------
H("ONE MOVE AT A TIME FROM THE SEED (each from a fresh seed)");
{
  const b = seedBalance;
  const savings = find(seedPots, "Savings"), concert = find(seedPots, "Concert Ticket"), gift = find(seedPots, "Gift");
  const holiday = find(seedPots, "Holiday"), laptop = find(seedPots, "New Laptop");
  console.log(`Add to ‘Concert Ticket’ $50.00 (past the target, US-25 AC3): ${showPreview(concert, "add", 5000, b)}; card bar ${pctText(fillBp(concert.total + 5000, concert.target))}`);
  console.log(`Add to ‘Gift’ $40.00 (exactly the target): ${showPreview(gift, "add", 4000, b)}`);
  console.log(`Withdraw from ‘Holiday’ $531.00 (all of it): ${showPreview(holiday, "withdraw", 53100, b)}; balance after ${formatMoney(b + 53100)}`);
  console.log(`Withdraw from ‘Holiday’ $531.01: ${checkMove("withdraw", 53101, holiday, b)}; preview clamps: ${showPreview(holiday, "withdraw", 53101, b)}`);
  console.log(`Add to ‘Savings’ $4,836.01: ${checkMove("add", 483601, savings, b)}; preview clamps: ${showPreview(savings, "add", 483601, b)}`);
  console.log(`Add to ‘Savings’ $4,836.00: ${checkMove("add", 483600, savings, b)}; ${showPreview(savings, "add", 483600, b)}; balance after ${formatMoney(b - 483600)}; card bar ${pctText(fillBp(savings.total + 483600, savings.target))}`);
  console.log(`Delete Holiday: balance ${formatMoney(b)} → ${formatMoney(b + holiday.total)}; delete Savings: → ${formatMoney(b + savings.total)}; delete New Laptop: → ${formatMoney(b + laptop.total)}`);
  console.log(`Edit Holiday's target to $500.00 (below its total, US-23 AC2): ${pctText(percentBp(holiday.total, 50000))}, bar ${pctText(fillBp(holiday.total, 50000))}`);
  console.log(`Edit Savings' target to $159.00 (equal to its total): ${pctText(percentBp(savings.total, 15900))}`);
  console.log(`Overview after Add to ‘Savings’ $100.00 (US-04 AC2): Current Balance ${formatMoney(b - 10000)}, Pots total ${formatMoney(potsSum + 10000)}, Income ${formatMoney(rows.balance.income)}, Expenses ${formatMoney(rows.balance.expenses)}`);
  console.log(`Overview after Withdraw from ‘Holiday’ $31.00: Current Balance ${formatMoney(b + 3100)}, Pots total ${formatMoney(potsSum - 3100)}`);
  console.log(`Overview after deleting Holiday: Current Balance ${formatMoney(b + holiday.total)}, Pots total ${formatMoney(potsSum - holiday.total)}, first four pots unchanged: ${seedPots.filter((p) => p !== holiday).slice(0, 4).map((p) => p.name).join(", ")}`);
  console.log(`Overview after deleting Savings: first four pots ${seedPots.filter((p) => p !== savings).slice(0, 4).map((p) => `${p.name} ${formatMoney(p.total)}`).join(", ")}`);
}

// ---------------------------------------------------------------------------------------
H("ZERO BALANCE (reached through the API: deposit the whole balance into a pot)");
{
  const savings = find(seedPots, "Savings");
  const zero = 0;
  console.log(`deposit ${formatMoney(seedBalance)} into Savings → balance ${formatMoney(zero)}, Savings ${formatMoney(savings.total + seedBalance)} ${pctText(percentBp(savings.total + seedBalance, savings.target))}`);
  const atZero: [string, string][] = [
    ["(empty)", "required → Can't be empty"],
    ["abc", "invalid_format → Enter an amount with up to two decimals"],
    ["0", "too_small → Amount must be greater than 0"],
    ["-5", "too_small → Amount must be greater than 0"],
    ["1,000,000,000", "too_large → Amount is too large"],
    ["0.01", `${checkMove("add", 1, find(seedPots, "Gift"), zero)} → Amount exceeds your current balance`],
    ["$4,836.00", `${checkMove("add", 483600, find(seedPots, "Gift"), zero)} → Amount exceeds your current balance`],
  ];
  atZero.forEach(([input, outcome]) => console.log(`  at $0.00, Add to ‘Gift’ "${input}": ${outcome}`));
  console.log(`  at $0.00 a withdrawal still works: Withdraw from ‘Gift’ $10.00 → ${checkMove("withdraw", 1000, find(seedPots, "Gift"), zero)}, balance ${formatMoney(1000)}`);
}

// ---------------------------------------------------------------------------------------
H("THEMES");
{
  const used = seedPots.map((p) => p.theme);
  const free = THEMES.filter((t) => !used.includes(t));
  console.log(`used by pots: ${used.length} (${used.join(", ")}); free: ${free.length} (${free.join(", ")}); the add form opens on: ${at(free, 0)}`);
  console.log(`to use all 15 (through the API, one POST per theme): ${free.length} more pots, themes in order ${free.join(", ")}; then 15 pots, 0 free`);
  const budgetThemes = rows.budgets.map((b) => label(b.theme));
  console.log(`budget themes (they do not count against a pot): ${budgetThemes.join(", ")}; shared by a budget and a pot: ${budgetThemes.filter((t) => used.includes(t)).join(", ")}`);
  seedPots.forEach((p) => console.log(`  edit ${p.name}: own theme ${p.theme} selectable; disabled ${used.filter((t) => t !== p.theme).join(", ")}`));
}

// ---------------------------------------------------------------------------------------
H("POT NAME (trimmed; counted in UTF-16 code units, as JS .length and maxLength do)");
{
  const names = seedPots.map((p) => p.name.trim().toLowerCase());
  const taken = (name: string, except?: string) => names.filter((n) => n !== except?.toLowerCase()).includes(name.trim().toLowerCase());
  const left = (raw: string) => {
    const n = Math.max(0, 30 - raw.length);
    return `${n} ${n === 1 ? "character" : "characters"} left`;
  };
  const thirty = "A".repeat(30), thirtyOne = "A".repeat(31);
  console.log(`counter: "" → ${left("")}; "Savings" → ${left("Savings")}; 29 characters → ${left("B".repeat(29))}; 30 → ${left(thirty)}`);
  console.log(`"${thirty}" (30) → accepted; 31 characters → too_long (API and tools only: the input's maxLength is 30)`);
  console.log(`"  savings  " on add → ${taken("  savings  ") ? "taken" : "free"}; "SAVINGS" → ${taken("SAVINGS") ? "taken" : "free"}; "Savings 2" → ${taken("Savings 2") ? "taken" : "free"}; editing Savings to "savings" → ${taken("savings", "Savings") ? "taken" : "free (its own name)"}; editing Gift to "Holiday" → ${taken("Holiday", "Gift") ? "taken" : "free"}`);
  console.log(`"   " (spaces only) → required; "${"Rainy Days"}" → free (the design's placeholder "e.g. Rainy Days")`);
  console.log(`an emoji "🎉" has .length ${"🎉".length}: 15 of them fill the 30`);
}

// ---------------------------------------------------------------------------------------
H("CARD WIDTHS (content width = window − sidebar − 80 px page padding; below 768 px window − 32 px)");
{
  const cases: [string, number][] = [
    ["1440, sidebar expanded", 1440 - 300 - 80],
    ["1440, sidebar collapsed", 1440 - 88 - 80],
    ["1024, sidebar expanded", 1024 - 300 - 80],
    ["1024, sidebar collapsed", 1024 - 88 - 80],
    ["768 (no sidebar)", 768 - 80],
  ];
  cases.forEach(([name, content]) => {
    const card = (content - 24) / 2, inner = card - 2 * 24, button = (inner - 16) / 2;
    console.log(`${name}: content ${content}, two columns, card ${card}, inside the 24 px padding ${inner}, each money button ${button}`);
  });
  const mobile: [string, number][] = [["767", 767 - 32], ["375", 375 - 32], ["320", 320 - 32]];
  mobile.forEach(([name, content]) => {
    const inner = content - 2 * 20, button = (inner - 16) / 2;
    console.log(`${name}: content ${content}, one column, card ${content}, inside the 24/20 px padding ${inner}, each money button ${button}`);
  });
  // PO-Q7 (a): two columns from a 644 px content width — below a 768 px window that is 676 px and up.
  const threshold = 1024 - 300 - 80;
  const below768: [string, number][] = [["767", 767 - 32], [String(threshold + 32), threshold]];
  below768.forEach(([name, content]) => {
    const card = (content - 24) / 2, inner = card - 2 * 20, button = (inner - 16) / 2;
    console.log(`PO-Q7 (a), ${name}: content ${content} ≥ ${threshold}, two columns, card ${card}, inside the 24/20 px padding ${inner}, each money button ${button}`);
  });
}

// ---------------------------------------------------------------------------------------
H("TOOL DESCRIPTIONS (NFR-W3: at most 200 characters)");
{
  const descriptions: [string, string][] = [
    ["list_pots", "Lists the demo account's pots in creation order: name, theme, total saved, target and percentage, plus the current balance. Money in USD cents. Available on the Pots page."],
    ["add_pot", "Creates a pot from a name (unique, up to 30 characters), a target in USD cents and an unused theme. It starts with $0 saved. Available on the Pots page."],
    ["edit_pot", "Changes a pot by id; send all three: its name, target in USD cents and theme. Its total saved does not change. Available on the Pots page."],
    ["delete_pot", "Asks the person to confirm on screen, then deletes a pot by id; its total goes back to the current balance. Nothing is deleted without that confirmation. Available on the Pots page."],
    ["add_money_to_pot", "Moves an amount in USD cents from the current balance into a pot, by id. It may not exceed the current balance. Available on the Pots page."],
    ["withdraw_from_pot", "Moves an amount in USD cents out of a pot back to the current balance, by id. It may not exceed the pot's total. Available on the Pots page."],
  ];
  descriptions.forEach(([name, text]) => console.log(`${name}: ${text.length} characters`));
}

// ---------------------------------------------------------------------------------------
H("CONTRAST (WCAG 2.1 relative luminance; the colours of design-tokens.md)");
{
  const hex: Record<string, string> = {
    white: "#FFFFFF", "beige-100": "#F8F4F0", "beige-500": "#98908B", "grey-500": "#696868", "grey-900": "#201F24", green: "#277C78", red: "#C94736",
  };
  const lum = (h: string) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * at(c, 0) + 0.7152 * at(c, 1) + 0.0722 * at(c, 2);
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(hex[a] ?? a), lum(hex[b] ?? b)].sort((m, n) => n - m) as [number, number];
    return ((x + 0.05) / (y + 0.05)).toFixed(2);
  };
  const pairs: [string, string, string][] = [
    ["green", "white", "the add preview's percentage (12 px bold) and its green segment"],
    ["red", "white", "the withdraw preview's percentage (12 px bold) and its red segment"],
    ["grey-500", "white", "Total Saved, the card's percentage, Target of …, New Amount, the counter"],
    ["grey-900", "white", "the amounts, the pot name"],
    ["grey-900", "beige-100", "the + Add Money / Withdraw labels at rest"],
    ["grey-900", "white", "the + Add Money / Withdraw labels on hover (white background)"],
    ["beige-500", "white", "the money buttons' hover border (1.4.11 asks 3:1)"],
    ["grey-900", "beige-100", "the preview's dark segment on the beige-100 track"],
  ];
  pairs.forEach(([a, b, use]) => console.log(`${a} on ${b}: ${ratio(a, b)}:1 — ${use}`));
}
