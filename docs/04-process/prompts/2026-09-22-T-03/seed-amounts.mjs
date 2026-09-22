// Controller tool (not committed): every seed amount in cents, absolute — prisma/data.json's
// balance, transaction amounts, budget maxima, pot targets and totals — plus every `$…` figure
// in SPEC-overview §4.3. Plan D12: hand-built test amounts never equal one of these.
// Usage: node .superpowers/sdd/2026-09-22-T-03/seed-amounts.mjs [cents ...]
//   no arguments → prints the set; with arguments → prints which of them collide.
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync("prisma/data.json", "utf8"));
const cents = (dollars) => Math.round(Math.abs(dollars) * 100);
const seed = new Set([
  ...Object.values(data.balance).map(cents),
  ...data.transactions.map((t) => cents(t.amount)),
  ...data.budgets.map((b) => cents(b.maximum)),
  ...data.pots.flatMap((p) => [cents(p.target), cents(p.total)]),
]);
const spec = readFileSync("docs/03-specs/overview.md", "utf8");
const table = spec.slice(spec.indexOf("4.3 Worked example"), spec.indexOf("\n4.4"));
// With or without `$`: v1.0 of §4.3 writes the per-budget amounts bare ("Personal Care 40.00").
for (const m of table.matchAll(/\$?(\d[\d,]*\.\d{2})\b/g)) {
  seed.add(Math.round(Number(m[1].replaceAll(",", "")) * 100));
}
const asked = process.argv.slice(2).map((a) => Math.abs(Number(a.replaceAll("_", ""))));
if (asked.length === 0) {
  console.log([...seed].sort((a, b) => a - b).join(" "));
} else {
  const hits = asked.filter((a) => seed.has(a));
  console.log(hits.length ? `COLLIDE: ${hits.join(" ")}` : "no collisions");
  process.exitCode = hits.length ? 1 : 0;
}
