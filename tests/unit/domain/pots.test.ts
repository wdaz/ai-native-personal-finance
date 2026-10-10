import { describe, expect, it } from "vitest";
import {
  FULL_BAR,
  firstFreeTheme,
  isPotNameTaken,
  moneyPreview,
  potFill,
  potPercent,
} from "@/src/domain/pots";
import { formatPercent } from "@/src/shared/money";
import { THEMES } from "@/src/shared/enums";
import { AMOUNT_MAX_CENTS } from "@/src/shared/schemas";

/**
 * The function's examples are pure inputs, typed here (the budgets.test.ts pattern): SPEC-pots 4.3's
 * pots and balance. That §4 holds for the real seed is tests/unit/seed-figures.test.ts's job (H16 (2)).
 */
const pots = [
  { id: "pot-1", name: "Savings", total: 15_900, target: 200_000, theme: "Green" },
  { id: "pot-2", name: "Concert Ticket", total: 11_000, target: 15_000, theme: "Navy" },
  { id: "pot-3", name: "Gift", total: 11_000, target: 15_000, theme: "Cyan" },
  { id: "pot-4", name: "New Laptop", total: 1_000, target: 100_000, theme: "Yellow" },
  { id: "pot-5", name: "Holiday", total: 53_100, target: 144_000, theme: "Purple" },
] as const;
const balance = 483_600;
const pot = (name: string) => pots.find((p) => p.name === name)!;
const percent = (total: number, target: number) => formatPercent(potPercent(total, target));

describe("potPercent and potFill (SPEC-pots 2.3, 4.2, 4.4)", () => {
  it("US-21 AC1 4.2's pots' percentages, rounded half up in integers", () => {
    expect(pots.map((p) => percent(p.total, p.target))).toEqual([
      "7.95%",
      "73.33%",
      "73.33%",
      "1.00%",
      "36.88%",
    ]);
  });

  it("US-21 AC1 4.4: the three ties floating point rounds down are rounded half up", () => {
    for (const [total, expected] of [
      [3, "0.02%"],
      [7, "0.04%"],
      [9, "0.05%"],
    ] as const) {
      expect(percent(total, 20_000)).toBe(expected);
      // The float would not do: `toFixed(2)` rounds each of them down.
      expect(`${((total / 20_000) * 100).toFixed(2)}%`).not.toBe(expected);
    }
  });

  it("US-21 AC1 4.4: the edges — 0, thirds, a cent of the largest target, the largest the data allows", () => {
    expect(percent(0, 15_900)).toBe("0.00%");
    expect(percent(1, 3)).toBe("33.33%");
    expect(percent(2, 3)).toBe("66.67%");
    expect(percent(1, AMOUNT_MAX_CENTS)).toBe("0.00%");
    expect(percent(575_600, 1)).toBe("57560000.00%");
  });

  it("US-23 AC2 US-25 AC3: above the target the percentage is real and the bar is full", () => {
    const holiday = pot("Holiday");
    expect(percent(holiday.total, 50_000)).toBe("106.20%");
    expect(potFill(holiday.total, 50_000)).toBe(FULL_BAR);
    expect(potFill(15_900, 200_000)).toBe(795);
    expect(potFill(0, 1)).toBe(0);
  });

  it("refuses a total or a target that is not whole cents, a negative total and a target below 1 cent", () => {
    expect(() => potPercent(1.5, 100)).toThrow("Total 1.5");
    expect(() => potPercent(-1, 100)).toThrow("Total -1");
    expect(() => potPercent(1, 0)).toThrow("Target 0");
    expect(() => potPercent(1, 0.5)).toThrow("Target 0.5");
  });
});

describe("moneyPreview (SPEC-pots 2.6, 4.3)", () => {
  const show = (p: ReturnType<typeof moneyPreview>) => ({
    newTotal: p.newTotal,
    percent: formatPercent(p.percent),
    staying: formatPercent(p.staying),
    moving: formatPercent(p.moving),
  });

  it("US-25 AC1 Add to ‘Savings’ $100.00: 7.95 % stays and 5.00 % moves", () => {
    expect(show(moneyPreview(pot("Savings"), "add", 10_000, balance))).toEqual({
      newTotal: 25_900,
      percent: "12.95%",
      staying: "7.95%",
      moving: "5.00%",
    });
  });

  it("US-26 AC1 Withdraw from ‘Concert Ticket’ $30.00: 53.33 % stays and 20.00 % moves", () => {
    expect(show(moneyPreview(pot("Concert Ticket"), "withdraw", 3_000, balance))).toEqual({
      newTotal: 8_000,
      percent: "53.33%",
      staying: "53.33%",
      moving: "20.00%",
    });
  });

  it("US-25 AC3 past the target: the percentage is real and the two segments fill the track, no more", () => {
    const concert = moneyPreview(pot("Concert Ticket"), "add", 5_000, balance);
    expect(show(concert)).toEqual({
      newTotal: 16_000,
      percent: "106.67%",
      staying: "73.33%",
      moving: "26.67%",
    });
    expect(concert.staying + concert.moving).toBe(FULL_BAR);
    const savings = moneyPreview(pot("Savings"), "add", balance, balance);
    expect(show(savings)).toEqual({
      newTotal: 499_500,
      percent: "249.75%",
      staying: "7.95%",
      moving: "92.05%",
    });
  });

  it("US-25 AC1 US-26 AC1: an amount over the limit is clamped to the balance or the pot's total", () => {
    const add = moneyPreview(pot("Savings"), "add", balance + 1, balance);
    expect(add.moved).toBe(balance);
    const holiday = pot("Holiday");
    const withdraw = moneyPreview(holiday, "withdraw", holiday.total + 1, balance);
    expect(withdraw.moved).toBe(holiday.total);
    expect(show(withdraw)).toEqual({
      newTotal: 0,
      percent: "0.00%",
      staying: "0.00%",
      moving: "36.88%",
    });
    expect(moneyPreview(pot("Gift"), "add", 1, 0).moved).toBe(0);
  });

  it("US-25 AC1: text that reads as no amount moves nothing; the preview is the card's", () => {
    const savings = pot("Savings");
    expect(moneyPreview(savings, "add", null, balance)).toEqual({
      moved: 0,
      newTotal: savings.total,
      staying: 795,
      moving: 0,
      percent: 795,
    });
  });

  it("US-25 AC3: the two segments never pass the track, for each pot and amount", () => {
    for (const p of pots) {
      for (const amount of [1, 999, p.target, p.target * 3, balance]) {
        for (const kind of ["add", "withdraw"] as const) {
          const preview = moneyPreview(p, kind, amount, balance);
          expect(preview.staying + preview.moving).toBeLessThanOrEqual(FULL_BAR);
          expect(preview.newTotal).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

describe("isPotNameTaken (SPEC-pots 2.5, 4.6)", () => {
  it("US-22 AC2 a name is taken trimmed and whatever its case; another name is free", () => {
    expect(isPotNameTaken("  savings  ", pots)).toBe(true);
    expect(isPotNameTaken("SAVINGS", pots)).toBe(true);
    expect(isPotNameTaken("Savings 2", pots)).toBe(false);
  });

  it("US-23 AC1 a pot keeps its own name; another pot's is taken", () => {
    expect(isPotNameTaken("savings", pots, pot("Savings").id)).toBe(false);
    expect(isPotNameTaken("Holiday", pots, pot("Gift").id)).toBe(true);
  });
});

describe("firstFreeTheme (SPEC-pots 2.5, 4.5)", () => {
  it("US-22 AC1 the seed's first free theme is Red; with all fifteen used there is none", () => {
    expect(firstFreeTheme(pots.map((p) => p.theme))).toBe("Red");
    expect(firstFreeTheme(THEMES)).toBeNull();
    expect(firstFreeTheme([])).toBe(THEMES[0]);
  });
});
