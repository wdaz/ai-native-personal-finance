/**
 * The enums of docs/02-architecture/data-model.md, spelled as the document spells them.
 * These are the names the database stores (`@map("Dining Out")`, T-02 plan D4) and the
 * names the API sends. Prisma's client uses identifiers without the space (`DiningOut`,
 * `NavyGrey`), and src/server maps between the two. ADR-0002 keeps Prisma out of
 * src/shared, so the lists are written here by hand; tests/unit/shared/enums.test.ts holds
 * them to data-model.md, to the seed's maps and to the theme colours in src/ui/tokens.css.
 */

export const CATEGORIES = [
  "Entertainment",
  "Bills",
  "Groceries",
  "Dining Out",
  "Transportation",
  "Personal Care",
  "Education",
  "Lifestyle",
  "Shopping",
  "General",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const THEMES = [
  "Green",
  "Yellow",
  "Cyan",
  "Navy",
  "Red",
  "Purple",
  "Turquoise",
  "Brown",
  "Magenta",
  "Blue",
  "Navy Grey",
  "Army Green",
  "Gold",
  "Orange",
  "Pink",
] as const;

export type Theme = (typeof THEMES)[number];

/** data-model.md, `ResetLog.reason`. */
export const RESET_REASONS = ["scheduled", "threshold", "manual", "test"] as const;

export type ResetReason = (typeof RESET_REASONS)[number];
