import { seedRows } from "@/src/server/seed";
import { applyVariant, SEED_VARIANTS } from "@/src/server/variants";
import { billsSummary, recurringBills, DUE_SOON_DAYS } from "@/src/domain/bills";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { formatDate } from "@/src/shared/dates";
import { formatMoney } from "@/src/shared/money";

// Repository code: seedRows, applyVariant, recurringBills, billsSummary, DUE_SOON_DAYS, fixedClock,
// formatDate, formatMoney. Written here by hand, as recurring-bills.md defines them (no repository
// code implements them yet): the six sorts (2.4), the search (2.4), the status filter (2.12), the
// ordinal ("Monthly - 2nd", 2.9), the summary's "count (amount)" text, the contrast ratios.

const clock = fixedClock(BUSINESS_TODAY);
const names = new Intl.Collator("en");
const byName = (a: any, b: any) => names.compare(a.name, b.name) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
const sorts: Record<string, (a: any, b: any) => number> = {
  latest: (a, b) => a.day - b.day || byName(a, b),
  oldest: (a, b) => b.day - a.day || byName(a, b),
  "a-to-z": (a, b) => byName(a, b),
  "z-to-a": (a, b) => byName(b, a),
  highest: (a, b) => b.amount - a.amount || byName(a, b),
  lowest: (a, b) => a.amount - b.amount || byName(a, b),
};
const ordinal = (n: number) => {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return n + suffix;
};
const monthly = (day: number) => "Monthly - " + ordinal(day);
const search = (bills: any[], q: string) => {
  const needle = q.trim().toLowerCase();
  return needle === "" ? bills : bills.filter((b) => b.name.toLowerCase().includes(needle));
};
const H = (s: string) => console.log("\n=== " + s + " ===");

const toInput = (rows: any) =>
  rows.transactions.map((t: any) => ({ ...t, date: new Date(t.date), iso: t.date }));
const billsOf = (rows: any) => recurringBills(toInput(rows), clock);
const summaryText = (bills: any[]) => {
  const s = billsSummary(bills);
  const count = (keep: (b: any) => boolean) => bills.filter(keep).length;
  const total = s.paid + s.upcoming;
  return {
    totalBills: formatMoney(total) + " (" + total + " cents, " + bills.length + " bills)",
    paid: count((b) => b.status === "paid") + " (" + formatMoney(s.paid) + ") = " + s.paid + " cents",
    totalUpcoming: count((b) => b.status !== "paid") + " (" + formatMoney(s.upcoming) + ") = " + s.upcoming + " cents",
    dueSoon: count((b) => b.status === "dueSoon") + " (" + formatMoney(s.dueSoon) + ") = " + s.dueSoon + " cents",
    rowStatusUpcomingOnly: count((b) => b.status === "upcoming") + " (" + formatMoney(bills.filter((b) => b.status === "upcoming").reduce((x, b) => x + b.amount, 0)) + ")",
  };
};
const line = (b: any) =>
  b.name + " | " + monthly(b.day) + " | " + formatMoney(b.amount) + " (" + b.amount + " cents) | " + b.status + " | avatar " + b.latest.avatar + " | latest " + formatDate(b.latest.iso) + " (" + b.latest.iso + ")";

const rows: any = seedRows();
const tx = toInput(rows);
const bills = billsOf(rows);

H("TOTALS");
console.log("business today:", BUSINESS_TODAY, "| DUE_SOON_DAYS:", DUE_SOON_DAYS, "| transactions:", tx.length, "| recurring:", tx.filter((t: any) => t.recurring).length, "| distinct recurring names (bills):", bills.length);

H("RECURRING TRANSACTIONS per vendor (seed, +2 years)");
const recurring = tx.filter((t: any) => t.recurring);
for (const b of bills) {
  const list = recurring.filter((t: any) => t.name === b.name);
  console.log(b.name + ": " + list.map((t: any) => formatDate(t.iso) + " " + t.amount).join(", "));
}

H("BILLS in recurringBills order (first appearance)");
bills.forEach((b, i) => console.log(i + 1 + ". " + line(b)));

H("SUMMARY (billsSummary + counts)");
console.log(JSON.stringify(summaryText(bills), null, 2));

H("SORTS full order");
for (const [slug, cmp] of Object.entries(sorts)) {
  console.log("## " + slug);
  [...bills].sort(cmp).forEach((b, i) => console.log("  " + (i + 1) + ". " + b.name + " | " + monthly(b.day) + " | " + formatMoney(b.amount) + " | " + b.status));
}

H("TIES");
const groups = (key: (b: any) => string) =>
  [...bills.reduce((m: Map<string, string[]>, b: any) => m.set(key(b), (m.get(key(b)) ?? []).concat(b.name)), new Map()).entries()].filter((e) => e[1].length > 1);
console.log("same day:", JSON.stringify(groups((b) => String(b.day))));
console.log("same amount:", JSON.stringify(groups((b) => String(b.amount))));
console.log("same name ignoring case:", JSON.stringify(groups((b) => b.name.toLowerCase())));
console.log("lowest is the reverse of highest:", JSON.stringify([...bills].sort(sorts.lowest).map((b) => b.name)) === JSON.stringify([...bills].sort(sorts.highest).reverse().map((b) => b.name)));
console.log("A to Z Collator order equals raw code-unit order:", JSON.stringify([...bills].sort(sorts["a-to-z"]).map((b) => b.name)) === JSON.stringify([...bills].map((b) => b.name).sort()));

H("SEARCH (case-insensitive substring of the name, trimmed), Latest order");
for (const q of ["a", "e", "s", "co", "data", "BYTE", "&", "bill", "xyz", " ", "  flow  ", "spa & w", "Bills"]) {
  const found = search(bills, q).sort(sorts.latest);
  console.log(JSON.stringify(q) + ": " + found.length + (found.length ? " -> " + found.map((b) => b.name).join(" ; ") : " (no results)"));
}
console.log("names without an a:", bills.filter((b) => !b.name.toLowerCase().includes("a")).map((b) => b.name).join(" ; "));

H("STATUS filter (row status), Latest order");
for (const status of ["paid", "dueSoon", "upcoming"]) {
  const found = bills.filter((b) => b.status === status).sort(sorts.latest);
  console.log(status + ": " + found.length + " -> " + found.map((b) => b.name + " " + formatMoney(b.amount)).join(" ; ") + " | sum " + formatMoney(found.reduce((x, b) => x + b.amount, 0)));
}
console.log("not paid (the summary's Total Upcoming): " + bills.filter((b) => b.status !== "paid").map((b) => b.name).join(" ; "));
console.log("search 'e' + status upcoming, sort highest: " + search(bills, "e").filter((b) => b.status === "upcoming").sort(sorts.highest).map((b) => b.name).join(" ; "));
console.log("search 'e' + status paid, sort a-to-z: " + search(bills, "e").filter((b) => b.status === "paid").sort(sorts["a-to-z"]).map((b) => b.name).join(" ; "));

H("SEED VARIANTS");
for (const variant of SEED_VARIANTS) {
  const v = billsOf(applyVariant(seedRows(), variant));
  console.log(variant + ": " + v.length + " bills; " + JSON.stringify(summaryText(v)));
}

H("BOUNDARIES (hand-built fixtures through recurringBills, today 19 Aug 2026)");
const fixture = (name: string, iso: string, amount = -1000) => ({ name, category: "Bills", date: new Date(iso), iso, amount, recurring: true, avatar: "x" });
const cases: [string, any[]][] = [
  ["day 24, July only", [fixture("Day24", "2026-07-24T10:00:00Z")]],
  ["day 25, July only", [fixture("Day25", "2026-07-25T10:00:00Z")]],
  ["paid today at 23:59:59Z", [fixture("Late", "2026-07-19T10:00:00Z"), fixture("Late", "2026-08-19T23:59:59Z")]],
  ["dated tomorrow, 20 Aug", [fixture("Tomorrow", "2026-08-20T09:00:00Z")]],
  ["day 10, July only (missed this month)", [fixture("Missed", "2026-07-10T12:00:00Z")]],
  ["day 31, July only", [fixture("Day31", "2026-07-31T12:00:00Z")]],
  ["recurring income +$20.00", [fixture("Refund", "2026-07-28T12:00:00Z", 2000)]],
];
for (const [label, list] of cases) {
  const [b] = recurringBills(list, clock);
  console.log(label + " -> " + b!.name + " | " + monthly(b!.day) + " | " + formatMoney(b!.amount) + " | " + b!.status);
}
const tie = recurringBills([fixture("beta", "2026-07-21T10:00:00Z"), fixture("Alpha", "2026-07-21T11:00:00Z"), fixture("alpha", "2026-07-21T12:00:00Z")], clock);
console.log("same day 21, latest order:", [...tie].sort(sorts.latest).map((b) => b.name).join(" ; "), "| oldest order:", [...tie].sort(sorts.oldest).map((b) => b.name).join(" ; "));

H("ORDINALS 1-31");
console.log(Array.from({ length: 31 }, (_, i) => ordinal(i + 1)).join(" "));

H("LENGTHS");
const longest = [...bills].sort((a, b) => b.name.length - a.name.length)[0]!;
console.log("longest bill name:", longest.name, longest.name.length, "chars | widest amount:", [...bills].map((b) => formatMoney(b.amount)).sort((a, b) => b.length - a.length)[0], "| widest due text:", [...bills].map((b) => monthly(b.day)).sort((a, b) => b.length - a.length)[0]);
console.log("names with & or no space:", bills.filter((b) => b.name.includes("&") || !b.name.includes(" ")).map((b) => b.name).join(" ; "));

H("TOOL DESCRIPTION length (at most 200, defineTool)");
const description =
  "Lists the demo account's recurring bills, one per vendor, with status (paid, dueSoon, upcoming) and the totals. Optional name search, status and sort. Money in USD cents. Recurring Bills page.";
console.log(description.length, "chars:", description);

H("CONTRAST on white (WCAG 2.1 relative luminance)");
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return ((x! + 0.05) / (y! + 0.05)).toFixed(2); };
for (const [name, hex] of [["red (due soon amount, Due Soon summary row)", "#C94736"], ["green (paid due text, check icon)", "#277C78"], ["grey-500 (secondary text)", "#696868"], ["grey-900 (text)", "#201F24"]]) {
  console.log(name + " " + hex + " on white: " + ratio(hex!, "#FFFFFF") + ":1");
}
console.log("white on grey-900 (Total Bills card): " + ratio("#FFFFFF", "#201F24") + ":1");
