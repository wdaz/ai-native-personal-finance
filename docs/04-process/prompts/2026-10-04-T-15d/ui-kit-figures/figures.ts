// The figures of docs/03-specs/ui-kit.md §4 (T-15d, S1b). Run from the repository root:
//   FORCE_COLOR=0 npx tsx docs/04-process/prompts/2026-10-04-T-15d/ui-kit-figures/figures.ts
// figures.py prints the same lines from prisma/data.json without node_modules (README.md).
import { seedRows } from "@/src/server/seed";
import { CATEGORIES, THEMES } from "@/src/shared/enums";
import { formatMoney } from "@/src/shared/money";

const rows: any = seedRows();
// seedRows() returns Prisma's keys; the spec speaks the documented names (src/shared/enums.ts).
const label = (key: string) =>
  ({ DiningOut: "Dining Out", PersonalCare: "Personal Care", NavyGrey: "Navy Grey", ArmyGreen: "Army Green" } as Record<string, string>)[key] ?? key;
const H = (s: string) => console.log("\n=== " + s + " ===");

H("SEED RECORDS");
console.log("budgets:", rows.budgets.length, "|", rows.budgets.map((b: any) => label(b.category) + " " + label(b.theme) + " " + b.maximum).join(", "));
console.log("pots:", rows.pots.length, "|", rows.pots.map((p: any) => p.name + " " + label(p.theme) + " target " + p.target + " total " + p.total).join(", "));

H("ALREADY USED (add forms)");
const usedCats = rows.budgets.map((b: any) => label(b.category));
const budgetThemes = rows.budgets.map((b: any) => label(b.theme));
const potThemes = rows.pots.map((p: any) => label(p.theme));
const free = (all: readonly string[], used: string[]) => all.filter((x) => !used.includes(x));
console.log("categories used:", usedCats.length, usedCats.join(", "));
console.log("categories free:", free(CATEGORIES, usedCats).length, free(CATEGORIES, usedCats).join(", "));
console.log("budget themes used:", budgetThemes.length, budgetThemes.join(", "));
console.log("budget themes free:", free(THEMES, budgetThemes).length, "first free:", free(THEMES, budgetThemes)[0]);
console.log("pot themes used:", potThemes.length, potThemes.join(", "));
console.log("pot themes free:", free(THEMES, potThemes).length, "first free:", free(THEMES, potThemes)[0]);
console.log("first free category:", free(CATEGORIES, usedCats)[0]);

H("ALREADY USED (edit forms: the record's own value stays selectable)");
rows.budgets.forEach((b: any) => {
  const others = rows.budgets.filter((x: any) => x !== b);
  console.log("edit budget " + label(b.category) + ": disabled categories " + others.length + " (" + others.map((x: any) => label(x.category)).join(", ") + "), disabled themes " + others.length + " (" + others.map((x: any) => label(x.theme)).join(", ") + ")");
});
rows.pots.forEach((p: any) => {
  const others = rows.pots.filter((x: any) => x !== p);
  console.log("edit pot " + p.name + ": disabled themes " + others.length + " (" + others.map((x: any) => label(x.theme)).join(", ") + ")");
});

H("DELETE DIALOG TITLES (the design's pattern, curly quotes U+2018 U+2019)");
console.log(rows.budgets.map((b: any) => "Delete ‘" + label(b.category) + "’?").join(" | "));
console.log(rows.pots.map((p: any) => "Delete ‘" + p.name + "’?").join(" | "));
console.log("longest seed pot name:", Math.max(...rows.pots.map((p: any) => p.name.length)), "characters; pot name limit 30");

H("AMOUNT GRAMMAR (the spec's reading of US-15 AC2, written here by hand; no repository code yet)");
const MAX = 99_999_999_999n;
// A grouped number starts with 1-9, so "0,500" is refused rather than read as 500 dollars (ui-kit.md 2.5, v0.4).
const SHAPE = /^([0-9]+|[1-9][0-9]{0,2}(?:,[0-9]{3})+)?(\.[0-9]{1,2})?$/;
function parseAmount(text: string): string {
  let t = text.trim();
  if (t === "") return "required";
  const negative = t.startsWith("-");
  if (negative) t = t.slice(1);
  if (t.startsWith("$")) t = t.slice(1);
  const m = SHAPE.exec(t);
  if (!m || !/[0-9]/.test(t)) return "invalid_format";
  const whole = (m[1] ?? "0").replaceAll(",", "");
  const frac = (m[2] ?? ".00").slice(1).padEnd(2, "0");
  const cents = BigInt(whole) * 100n + BigInt(frac);
  if (negative || cents === 0n) return "too_small";
  if (cents > MAX) return "too_large";
  return String(cents) + " cents";
}
const inputs = [
  "", "   ", "0.01", "1", "42", " 42 ", "007", "75.5", "75.50", ".5", "5.", "$1,234.50", "1,234.5", "1234.50",
  "12,345,678", "$999,999,999.99", "999999999.99", "1,000,000,000", "1000000000", "99999999999999999999",
  "0", "0.00", "$0", "-5", "-$5", "-0", "$-5", "1.234", "1,23", "1,2345", "12,34.5", "0,500", "0,123", "01,234", "$ 5", "$$5", "$", "-",
  "1e3", "0x10", "Infinity", "NaN", "5 000", "５", "−5", "USD 5",
];
inputs.forEach((s) => console.log(JSON.stringify(s) + " -> " + parseAmount(s)));

H("PRE-FILL (edit forms: whole dollars as digits, otherwise two decimals; no $ and no separators)");
const prefill = (cents: number) => (cents % 100 === 0 ? String(cents / 100) : Math.floor(cents / 100) + "." + String(cents % 100).padStart(2, "0"));
console.log("budget maximums:", rows.budgets.map((b: any) => prefill(b.maximum)).join(", "));
console.log("pot targets:", rows.pots.map((p: any) => prefill(p.target)).join(", "));
[1, 7550, 123450, 99_999_999_999].forEach((c) => console.log(c + " cents -> " + JSON.stringify(prefill(c)) + " -> parses back to " + parseAmount(prefill(c)) + " | formatMoney " + formatMoney(c)));

H("CONTRAST (WCAG 2.1 relative luminance; opacity composited over white)");
type Rgb = [number, number, number];
const hex = (h: string): Rgb => { const c = (i: number) => parseInt(h.slice(i, i + 2), 16); return [c(1), c(3), c(5)]; };
const lin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (rgb: Rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const ratio = (a: Rgb, b: Rgb) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const over = (fg: Rgb, a: number, bg: Rgb): Rgb => { const mix = (i: 0 | 1 | 2) => Math.round(a * fg[i] + (1 - a) * bg[i]); return [mix(0), mix(1), mix(2)]; };
const W = hex("#FFFFFF"), G900 = hex("#201F24"), G500 = hex("#696868"), G300 = hex("#B3B3B3"), B500 = hex("#98908B"), RED = hex("#C94736");
const pairs: [string, Rgb, Rgb][] = [
  ["grey-300 on white (the … icon at rest, as exported)", G300, W],
  ["grey-500 on white", G500, W],
  ["grey-900 on white", G900, W],
  ["beige-500 on white (the $ prefix, as exported)", B500, W],
  ["red on white (Delete menu item)", RED, W],
  ["red at 70 % on white (Delete menu item, hover, as exported)", over(RED, 0.7, W), W],
  ["white on red (Yes, Confirm Deletion)", W, RED],
  ["white on red at 80 % (Yes, Confirm Deletion, hover)", W, over(RED, 0.8, W)],
  ["white on grey-900 (primary button)", W, G900],
  ["white on grey-500 (primary button, hover)", W, G500],
];
pairs.forEach(([name, a, b]) => console.log(name + ": " + ratio(a, b).toFixed(2) + ":1"));
