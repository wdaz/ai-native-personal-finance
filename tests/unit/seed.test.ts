import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SEED_YEAR_SHIFT, shiftYears } from "@/src/domain/calendar";
import { toCents } from "@/src/domain/money";
import {
  CATEGORY_BY_NAME,
  THEME_BY_HEX,
  avatarKey,
  buildSeedRows,
  categoryFromName,
  seedRows,
  themeFromHex,
  type SeedFile,
} from "@/src/server/seed";

const repoRoot = join(import.meta.dirname, "..", "..");
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");
const seedFile = JSON.parse(read("prisma/data.json")) as SeedFile;

/**
 * SPEC-reset-and-test-support §7, unit row: date shift (+2 y incl. leap-day safety), cents
 * conversion, theme mapping, avatar key — and §5, the checksum of the seed copy. Expected
 * figures come from data.json or the documents, never typed (build-workflow.md).
 */
describe("prisma/data.json (SPEC-reset-and-test-support §5)", () => {
  const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
  const original = readFileSync(join(repoRoot, "docs/00-discovery/inputs/data.json"));

  it("is a byte-for-byte copy of docs/00-discovery/inputs/data.json", () => {
    expect(sha256(readFileSync(join(repoRoot, "prisma/data.json")))).toBe(sha256(original));
  });

  it("would report a copy that differs by one byte (violation fixture, DoD v1.1)", () => {
    expect(sha256(Buffer.concat([original, Buffer.from("\n")]))).not.toBe(sha256(original));
  });
});

describe("shiftYears", () => {
  it("adds whole years and keeps the time of day", () => {
    expect(shiftYears("2024-07-02T09:25:51Z", 2)).toBe("2026-07-02T09:25:51Z");
  });

  it("keeps fractional seconds", () => {
    expect(shiftYears("2024-01-31T23:59:59.999Z", 2)).toBe("2026-01-31T23:59:59.999Z");
  });

  it("moves 29 February to 28 February when the target year has no leap day", () => {
    expect(shiftYears("2024-02-29T12:00:00Z", 2)).toBe("2026-02-28T12:00:00Z");
  });

  it("keeps 29 February when the target year has one", () => {
    expect(shiftYears("2024-02-29T12:00:00Z", 4)).toBe("2028-02-29T12:00:00Z");
  });

  it.each(["2024-08-19 14:23:11", "2024-08-19T14:23:11+04:00", "19 Aug 2024", ""])(
    "refuses %j, which is not a UTC ISO-8601 timestamp",
    (timestamp) => {
      expect(() => shiftYears(timestamp, 2)).toThrow("is not a UTC ISO-8601 timestamp");
    },
  );

  it("shifts every seed date by SEED_YEAR_SHIFT years (NFR-D3: 2024 → 2026)", () => {
    const rows = seedRows();
    expect(SEED_YEAR_SHIFT).toBe(2);
    rows.transactions.forEach((row, i) => {
      const source = seedFile.transactions[i]?.date ?? "";
      expect(Number(row.date.slice(0, 4))).toBe(Number(source.slice(0, 4)) + 2);
      expect(row.date.slice(4)).toBe(source.slice(4));
    });
  });
});

describe("toCents", () => {
  it.each([
    [12.34, 1234],
    [-42.3, -4230],
    [0.07, 7],
    [-0.1, -10],
    [0, 0],
    [999_999_999.99, 99_999_999_999],
  ])("converts %d dollars to %d cents", (dollars, cents) => {
    expect(toCents(dollars)).toBe(cents);
  });

  it.each([1.005, 0.001, Number.NaN, Number.POSITIVE_INFINITY])(
    "refuses %d, which is not a whole number of cents",
    (dollars) => {
      expect(() => toCents(dollars)).toThrow("is not a whole number of cents");
    },
  );

  it("converts every amount in prisma/data.json without loss", () => {
    const amounts = [
      ...Object.values(seedFile.balance),
      ...seedFile.transactions.map((t) => t.amount),
      ...seedFile.budgets.map((b) => b.maximum),
      ...seedFile.pots.flatMap((p) => [p.target, p.total]),
    ];
    for (const dollars of amounts) {
      expect(toCents(dollars) / 100).toBe(dollars);
    }
  });
});

describe("themeFromHex mirrors docs/02-architecture/design-tokens.md", () => {
  // | `--color-green` | Green | `#277C78` | 39, 124, 120 | positive amounts, paid, theme |
  const documented = new Map<string, string>();
  for (const [, name, hex, use] of read("docs/02-architecture/design-tokens.md").matchAll(
    /^\|\s*`--color-[a-z-]+`\s*\|\s*([^|]+?)\s*\|\s*`(#[0-9A-Fa-f]{6})`\s*\|[^|]*\|([^|]*)\|/gm,
  )) {
    if (name && hex && use && /\btheme\b/.test(use)) documented.set(hex.toUpperCase(), name);
  }
  // The client spells "Navy Grey" as NavyGrey (prisma/schema.prisma maps it back).
  const mismatches = (map: ReadonlyMap<string, string>) =>
    [...documented]
      .filter(([hex, name]) => map.get(hex) !== name.replaceAll(" ", ""))
      .map(([, name]) => name);

  it("finds the 15 theme colours in the document", () => {
    expect(documented.size).toBe(15);
  });

  it("maps each documented hex to its theme, and nothing else", () => {
    expect(mismatches(THEME_BY_HEX)).toEqual([]);
    expect(THEME_BY_HEX.size).toBe(documented.size);
  });

  it("would report a swapped colour (violation fixture, DoD v1.1)", () => {
    expect(mismatches(new Map(THEME_BY_HEX).set("#277C78", "Navy"))).toEqual(["Green"]);
  });

  it("reads the hex case-insensitively and refuses one it does not know", () => {
    expect(themeFromHex("#277c78")).toBe("Green");
    expect(() => themeFromHex("#000000")).toThrow("is not one of the 15 theme colours");
  });
});

describe("categoryFromName mirrors docs/02-architecture/data-model.md", () => {
  // Enums: `Category` = Entertainment, Bills, … General. `Theme` = …
  const line = /`Category` = ([^.]+)\./.exec(read("docs/02-architecture/data-model.md"))?.[1];
  const documented = (line ?? "").split(",").map((name) => name.trim());
  const mismatches = (map: ReadonlyMap<string, string>) =>
    documented.filter((name) => map.get(name) !== name.replaceAll(" ", ""));

  it("finds the 10 categories in the document", () => {
    expect(documented).toHaveLength(10);
  });

  it("maps each documented category, and nothing else", () => {
    expect(mismatches(CATEGORY_BY_NAME)).toEqual([]);
    expect(CATEGORY_BY_NAME.size).toBe(documented.length);
  });

  it("would report a wrong mapping (violation fixture, DoD v1.1)", () => {
    expect(mismatches(new Map(CATEGORY_BY_NAME).set("Dining Out", "General"))).toEqual([
      "Dining Out",
    ]);
  });

  it("refuses a name it does not know, including a near miss", () => {
    expect(() => categoryFromName("Travel")).toThrow("is not one of the 10 categories");
    expect(() => categoryFromName("dining out")).toThrow("is not one of the 10 categories");
    expect(() => categoryFromName("constructor")).toThrow("is not one of the 10 categories");
  });
});

describe("avatarKey (SPEC-overview §4.5)", () => {
  it("keeps the basename without the extension", () => {
    expect(avatarKey("./assets/images/avatars/some-vendor.jpg")).toBe("some-vendor");
  });

  it.each(["./assets/images/avatars/some-vendor.png", "some-vendor", ""])("refuses %j", (path) => {
    expect(() => avatarKey(path)).toThrow("is not a path to a .jpg file");
  });

  it("gives every seed transaction a key that names a file in public/avatars", () => {
    for (const { avatar } of seedRows().transactions) {
      expect(existsSync(join(repoRoot, "public/avatars", `${avatar}.jpg`)), avatar).toBe(true);
    }
  });
});

describe("buildSeedRows", () => {
  const rows = buildSeedRows(seedFile);

  it("keeps every record of data.json, in file order", () => {
    expect(rows.transactions.map((t) => t.name)).toEqual(seedFile.transactions.map((t) => t.name));
    expect(rows.budgets.map((b) => b.category)).toEqual(
      seedFile.budgets.map((b) => categoryFromName(b.category)),
    );
    expect(rows.pots.map((p) => p.name)).toEqual(seedFile.pots.map((p) => p.name));
  });

  it("carries recurring through unchanged", () => {
    expect(rows.transactions.map((t) => t.recurring)).toEqual(
      seedFile.transactions.map((t) => t.recurring),
    );
  });

  it("is what seedRows() returns for prisma/data.json", () => {
    expect(seedRows()).toEqual(rows);
  });
});
