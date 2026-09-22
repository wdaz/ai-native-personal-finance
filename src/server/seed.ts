import seedFile from "@/prisma/data.json" with { type: "json" };
import type { Category, Theme } from "./generated/prisma/enums";

/**
 * The seed (SPEC-reset-and-test-support §2.1): prisma/data.json, a byte-for-byte copy of
 * docs/00-discovery/inputs/data.json (tests/unit/seed.test.ts), turned into rows — dates +2
 * years, dollars to cents, theme hex to the `Theme` enum, avatar path to its key. Pure: no
 * database and no clock. ADR-0005 keeps `new Date()` out of src/server, and nothing here
 * needs one — dates stay ISO-8601 text, which Prisma accepts as is.
 */

/** The shape of data.json, as the Frontend Mentor challenge ships it. */
export type SeedFile = {
  balance: { current: number; income: number; expenses: number };
  transactions: {
    avatar: string;
    name: string;
    category: string;
    date: string;
    amount: number;
    recurring: boolean;
  }[];
  budgets: { category: string; maximum: number; theme: string }[];
  pots: { name: string; target: number; total: number; theme: string }[];
};

/** Rows as they are inserted: money in integer cents, dates as UTC ISO-8601 text. */
export type SeedRows = {
  balance: { current: number; income: number; expenses: number };
  transactions: {
    name: string;
    avatar: string;
    category: Category;
    date: string;
    amount: number;
    recurring: boolean;
  }[];
  budgets: { category: Category; maximum: number; theme: Theme }[];
  pots: { name: string; target: number; total: number; theme: Theme }[];
};

/** NFR-D3: "all dates shifted +2 years (2024 → 2026) at seed time". */
export const SEED_YEAR_SHIFT = 2;

const UTC_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})(T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)$/;

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * Adds whole calendar years to a UTC timestamp written as text. 29 February lands on
 * 28 February when the target year has no leap day (SPEC-reset-and-test-support §2.1).
 */
export function shiftYears(timestamp: string, years: number): string {
  const [, year, month, day, time] = UTC_TIMESTAMP.exec(timestamp) ?? [];
  if (!year || !month || !day || !time) {
    throw new Error(`Seed date "${timestamp}" is not a UTC ISO-8601 timestamp`);
  }
  const shifted = Number(year) + years;
  const shiftedDay = month === "02" && day === "29" && !isLeapYear(shifted) ? "28" : day;
  return `${String(shifted).padStart(4, "0")}-${month}-${shiftedDay}${time}`;
}

/**
 * Dollars as data.json writes them to integer cents (ADR-0005, NFR-D2). A value finer than
 * a cent is refused rather than rounded away.
 */
export function toCents(dollars: number): number {
  const cents = Math.round(dollars * 100);
  if (!Number.isFinite(dollars) || Math.abs(cents - dollars * 100) > 1e-6) {
    throw new Error(`Seed amount ${dollars} is not a whole number of cents`);
  }
  return cents;
}

/**
 * docs/02-architecture/design-tokens.md, the 15 theme colours: "data.json stores them as
 * hex, the seed maps hex → enum name". tests/unit/seed.test.ts holds this table to the
 * document. The client spells a two-word theme without its space (`NavyGrey`); the
 * database stores the documented name (`@map` in prisma/schema.prisma).
 */
export const THEME_BY_HEX: ReadonlyMap<string, Theme> = new Map([
  ["#277C78", "Green"],
  ["#F2CDAC", "Yellow"],
  ["#82C9D7", "Cyan"],
  ["#626070", "Navy"],
  ["#C94736", "Red"],
  ["#826CB0", "Purple"],
  ["#597C7C", "Turquoise"],
  ["#93674F", "Brown"],
  ["#934F6F", "Magenta"],
  ["#3F82B2", "Blue"],
  ["#97A0AC", "NavyGrey"],
  ["#7F9161", "ArmyGreen"],
  ["#CAB361", "Gold"],
  ["#BE6C49", "Orange"],
  ["#AF81BA", "Pink"],
]);

export function themeFromHex(hex: string): Theme {
  const theme = THEME_BY_HEX.get(hex.toUpperCase());
  if (!theme) {
    throw new Error(`Seed theme ${hex} is not one of the 15 theme colours of design-tokens.md`);
  }
  return theme;
}

/**
 * docs/02-architecture/data-model.md, `Category`: data.json and the database write the
 * documented name ("Dining Out"), the client an identifier without the space.
 */
export const CATEGORY_BY_NAME: ReadonlyMap<string, Category> = new Map([
  ["Entertainment", "Entertainment"],
  ["Bills", "Bills"],
  ["Groceries", "Groceries"],
  ["Dining Out", "DiningOut"],
  ["Transportation", "Transportation"],
  ["Personal Care", "PersonalCare"],
  ["Education", "Education"],
  ["Lifestyle", "Lifestyle"],
  ["Shopping", "Shopping"],
  ["General", "General"],
]);

export function categoryFromName(name: string): Category {
  const category = CATEGORY_BY_NAME.get(name);
  if (!category) {
    throw new Error(`Seed category "${name}" is not one of the 10 categories of data-model.md`);
  }
  return category;
}

/**
 * SPEC-overview §4.5: an avatar is stored as its basename key (`emma-richardson`); the UI
 * resolves it to /avatars/<key>.jpg.
 */
export function avatarKey(path: string): string {
  const key = /(?:^|\/)([a-z0-9-]+)\.jpg$/.exec(path)?.[1];
  if (!key) {
    throw new Error(`Seed avatar "${path}" is not a path to a .jpg file`);
  }
  return key;
}

export function buildSeedRows(file: SeedFile): SeedRows {
  return {
    balance: {
      current: toCents(file.balance.current),
      income: toCents(file.balance.income),
      expenses: toCents(file.balance.expenses),
    },
    transactions: file.transactions.map((transaction) => ({
      name: transaction.name,
      avatar: avatarKey(transaction.avatar),
      category: categoryFromName(transaction.category),
      date: shiftYears(transaction.date, SEED_YEAR_SHIFT),
      amount: toCents(transaction.amount),
      recurring: transaction.recurring,
    })),
    budgets: file.budgets.map((budget) => ({
      category: categoryFromName(budget.category),
      maximum: toCents(budget.maximum),
      theme: themeFromHex(budget.theme),
    })),
    pots: file.pots.map((pot) => ({
      name: pot.name,
      target: toCents(pot.target),
      total: toCents(pot.total),
      theme: themeFromHex(pot.theme),
    })),
  };
}

/** The rows of prisma/data.json. */
export function seedRows(): SeedRows {
  return buildSeedRows(seedFile);
}
