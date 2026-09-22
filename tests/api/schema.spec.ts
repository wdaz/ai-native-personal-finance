import { expect, test } from "@playwright/test";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { resetToSeed } from "@/src/server/reset";

/**
 * docs/02-architecture/data-model.md, the rules the database itself enforces: unique
 * budget categories, themes unique among budgets and among pots, pot names unique whatever
 * their case — and NFR-S3's largest amount, 99,999,999,999 cents, fits a money column.
 */
let db: Db;

test.beforeAll(() => {
  db = createDb(databaseUrl());
});

test.afterAll(async () => {
  await db.$disconnect();
});

test.beforeEach(async () => {
  await resetToSeed(db, "test");
});

// Prisma's code for a unique-constraint violation.
const UNIQUE_VIOLATION = { code: "P2002" };

test("a pot name is unique whatever its case", async () => {
  const pot = await db.pot.findFirstOrThrow();
  await expect(
    db.pot.create({
      data: { name: pot.name.toUpperCase(), target: 100, total: 0, theme: "Gold" },
    }),
  ).rejects.toMatchObject(UNIQUE_VIOLATION);
});

test("a budget category is unique, and so is a theme among budgets and among pots", async () => {
  const budget = await db.budget.findFirstOrThrow();
  const pot = await db.pot.findFirstOrThrow();
  await expect(
    db.budget.create({ data: { category: budget.category, maximum: 100, theme: "Gold" } }),
  ).rejects.toMatchObject(UNIQUE_VIOLATION);
  await expect(
    db.budget.create({ data: { category: "Education", maximum: 100, theme: budget.theme } }),
  ).rejects.toMatchObject(UNIQUE_VIOLATION);
  await expect(
    db.pot.create({ data: { name: "Unique name", target: 100, total: 0, theme: pot.theme } }),
  ).rejects.toMatchObject(UNIQUE_VIOLATION);
});

test("a money column holds NFR-S3's largest amount, 99,999,999,999 cents", async () => {
  const largest = 99_999_999_999;
  const budget = await db.budget.create({
    data: { category: "Education", maximum: largest, theme: "Gold" },
  });
  expect(Number((await db.budget.findUniqueOrThrow({ where: { id: budget.id } })).maximum)).toBe(
    largest,
  );
});
