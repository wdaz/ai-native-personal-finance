import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";
import { potPercent } from "@/src/domain/pots";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { THEME_LABEL } from "@/src/server/overview";
import { seedRows } from "@/src/server/seed";
import { applyVariant, SEED_VARIANTS, type SeedVariant } from "@/src/server/variants";
import { CATEGORIES, THEMES } from "@/src/shared/enums";
import {
  ErrorEnvelopeSchema,
  OverviewDtoSchema,
  PotMoneyMoveDtoSchema,
  PotsDtoSchema,
  PotWriteDtoSchema,
  type PotDto,
  type PotsDto,
} from "@/src/shared/schemas";

/**
 * SPEC-pots 2.12 and §7's API row; SPEC-write-path 7.2's rows on the pot routes (conservation, the
 * races, an id from before a reset, the unique constraint) and US-04 AC2 through `GET /api/overview`
 * (H8) — T-25 plan D6. Every test seeds the database of DATABASE_URL and logs in after it.
 */
let db: Db;
test.beforeAll(() => {
  db = createDb(databaseUrl());
});
test.afterAll(async () => {
  await db.$disconnect();
});

const UNKNOWN_ID = "6f1d3c1e-8a2b-4c3d-9e4f-5a6b7c8d9e0f";
const JSON_TYPE = { "content-type": "application/json" };

async function login(request: APIRequestContext) {
  const response = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  expect(response.status()).toBe(200);
}

async function seedAndLogin(request: APIRequestContext, variant: SeedVariant = "seed") {
  expect((await request.post("/api/test/seed", { data: { variant } })).status()).toBe(200);
  await login(request); // after seeding: the reset invalidates any earlier session
}

/**
 * The independent oracle (the overview.spec.ts rule): the rows `POST /api/test/seed` inserts, through
 * the domain's `potPercent`, with no HTTP and no Prisma round trip — and never scripts/seed-figures.ts.
 * The ids are the database's, so they are compared apart (`expectIdsStored`).
 */
function expected(variant: SeedVariant) {
  const rows = applyVariant(seedRows(), variant);
  return {
    balance: { current: rows.balance.current },
    items: rows.pots.map((p) => ({
      name: p.name,
      theme: THEME_LABEL.get(p.theme),
      target: p.target,
      total: p.total,
      percentBasisPoints: potPercent(p.total, p.target),
    })),
  };
}

const withoutIds = (dto: PotsDto) => ({
  balance: dto.balance,
  items: dto.items.map((pot) => ({
    name: pot.name,
    theme: pot.theme,
    target: pot.target,
    total: pot.total,
    percentBasisPoints: pot.percentBasisPoints,
  })),
});

/** The seed's own sum, `Balance.current + Σ Pot.total` (SPEC-write-path 4.2), from the seed file. */
const SEED = seedRows();
const SEED_SUM = SEED.balance.current + SEED.pots.reduce((sum, p) => sum + p.total, 0);

async function getPots(request: APIRequestContext, search = ""): Promise<PotsDto> {
  const response = await request.get(`/api/pots${search}`);
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  return PotsDtoSchema.parse(await response.json());
}

async function potOf(request: APIRequestContext, name: string): Promise<PotDto> {
  const found = (await getPots(request)).items.find((p) => p.name === name);
  if (!found) throw new Error(`No pot named ${name}`);
  return found;
}

/** `Balance.current + Σ Pot.total` as stored (SPEC-write-path 2.8). */
async function storedSum(): Promise<number> {
  const balance = await db.balance.findFirstOrThrow();
  const pots = await db.pot.findMany({ select: { total: true } });
  return Number(balance.current) + pots.reduce((sum, p) => sum + Number(p.total), 0);
}

/** What a pot write must never touch (US-04 AC3, H6): income, expenses, budgets, transactions. */
async function untouched() {
  const balance = await db.balance.findFirstOrThrow();
  return {
    income: balance.income,
    expenses: balance.expenses,
    budgets: await db.budget.findMany({ orderBy: { seq: "asc" } }),
    transactions: await db.transaction.findMany({ orderBy: { id: "asc" } }),
  };
}

async function stored() {
  return {
    balance: (await db.balance.findFirstOrThrow()).current,
    pots: await db.pot.findMany({ orderBy: { seq: "asc" } }),
  };
}

const post = (request: APIRequestContext, data: unknown) =>
  request.post("/api/pots", { headers: JSON_TYPE, data: JSON.stringify(data) });
const patch = (request: APIRequestContext, id: string, data: unknown) =>
  request.patch(`/api/pots/${id}`, { headers: JSON_TYPE, data: JSON.stringify(data) });
const move = (
  request: APIRequestContext,
  id: string,
  kind: "deposit" | "withdraw",
  amount: unknown,
) =>
  request.post(`/api/pots/${id}/${kind}`, {
    headers: JSON_TYPE,
    data: JSON.stringify({ amount }),
  });
const remove = (request: APIRequestContext, id: string) => request.delete(`/api/pots/${id}`);

async function issuesOf(response: APIResponse) {
  expect(response.status()).toBe(400);
  expect(response.headers()["cache-control"]).toBe("no-store");
  const body = ErrorEnvelopeSchema.parse(await response.json());
  expect(body.error).toBe("validation");
  return body.issues;
}

async function moved(response: APIResponse) {
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  return PotMoneyMoveDtoSchema.parse(await response.json());
}

async function notFound(response: APIResponse) {
  expect(response.status()).toBe(404);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(ErrorEnvelopeSchema.parse(await response.json())).toEqual({
    error: "not_found",
    message: "Not found",
  });
}

/** The first themes no pot holds, in `THEMES` order (4.5). */
async function freeThemes(request: APIRequestContext) {
  const { items } = await getPots(request);
  return THEMES.filter((t) => !items.some((p) => p.theme === t));
}

// ---------------------------------------------------------------------------------------
// GET /api/pots — 2.12

test("US-39 AC4 SPEC-pots 2.12: without a session the API answers 401 unauthenticated", async ({
  request,
}) => {
  expect((await request.post("/api/test/reset")).status()).toBe(200);
  const response = await request.get("/api/pots");
  expect(response.status()).toBe(401);
  expect(ErrorEnvelopeSchema.parse(await response.json()).error).toBe("unauthenticated");
});

for (const variant of SEED_VARIANTS) {
  test(`US-21 AC1 AC2 US-36 AC2 US-39 AC2: ${variant} — the balance and the pots in creation order, strict DTO, no-store`, async ({
    request,
  }) => {
    await seedAndLogin(request, variant);
    const dto = await getPots(request);
    expect(withoutIds(dto)).toEqual(expected(variant));
    const ids = new Set((await db.pot.findMany({ select: { id: true } })).map((p) => p.id));
    for (const pot of dto.items) expect(ids.has(pot.id), pot.name).toBe(true);
  });
}

test("SPEC-pots 2.12: any query is ignored, and a GET leaves the stored rows unchanged (SPEC-write-path 7.2)", async ({
  request,
}) => {
  await seedAndLogin(request);
  const before = { ...(await stored()), ...(await untouched()) };
  expect(await getPots(request, "?sort=z-to-a&page=9")).toEqual(await getPots(request));
  expect({ ...(await stored()), ...(await untouched()) }).toEqual(before);
});

// ---------------------------------------------------------------------------------------
// POST /api/pots — 2.12

test("US-22 AC3: POST creates a pot, 201 with total 0 and a trimmed name, listed last; the balance unchanged", async ({
  request,
}) => {
  await seedAndLogin(request);
  const before = { ...(await untouched()), balance: (await stored()).balance };
  const [theme] = await freeThemes(request);
  const response = await post(request, { name: "  Rainy Days  ", target: 200_000, theme });
  expect(response.status()).toBe(201);
  expect(response.headers()["cache-control"]).toBe("no-store");
  const { pot } = PotWriteDtoSchema.parse(await response.json());
  expect(pot).toMatchObject({ name: "Rainy Days", theme, target: 200_000, total: 0 });
  expect(pot.percentBasisPoints).toBe(0);
  const list = await getPots(request);
  expect(list.items.at(-1)).toEqual(pot);
  expect(list.items).toHaveLength(SEED.pots.length + 1);
  expect({ ...(await untouched()), balance: (await stored()).balance }).toEqual(before);
});

test("US-22 AC2: a used name (trimmed, any case) and a used theme are both taken, in one answer, and nothing is written", async ({
  request,
}) => {
  await seedAndLogin(request);
  const [first, second] = (await getPots(request)).items;
  const before = await stored();
  const name = `  ${first!.name.toLowerCase()}  `;
  expect(await issuesOf(await post(request, { name, target: 100, theme: second!.theme }))).toEqual([
    { path: ["name"], code: "taken" },
    { path: ["theme"], code: "taken" },
  ]);
  expect(
    await issuesOf(
      await post(request, { name: first!.name.toUpperCase(), target: 100, theme: "Pink" }),
    ),
  ).toEqual([{ path: ["name"], code: "taken" }]);
  expect(await stored()).toEqual(before);
});

test("SPEC-write-path 4.1: a theme a budget holds is accepted (a pot's theme is unique among pots only)", async ({
  request,
}) => {
  await seedAndLogin(request);
  const [theme] = await freeThemes(request);
  const budgets = await (await request.get("/api/budgets")).json();
  const category = CATEGORIES.find(
    (c) => !budgets.items.some((b: { category: string }) => b.category === c),
  );
  const budget = await request.post("/api/budgets", {
    headers: JSON_TYPE,
    data: JSON.stringify({ category, maximum: 100, theme }),
  });
  expect(budget.status()).toBe(201);
  expect((await post(request, { name: "Shares a theme", target: 100, theme })).status()).toBe(201);
});

test("US-22 AC1 AC2 US-31: the name's, the target's and the theme's codes of SPEC-write-path 2.7; a total is dropped", async ({
  request,
}) => {
  await seedAndLogin(request);
  const [theme] = await freeThemes(request);
  const body = { name: "Rainy Days", target: 100, theme };
  for (const [field, value, code] of [
    ["name", "   ", "required"],
    ["name", null, "required"],
    ["name", 3, "invalid_format"],
    ["name", "A".repeat(31), "too_long"],
    ["name", `${"🎉".repeat(15)}A`, "too_long"],
    ["target", 0, "too_small"],
    ["target", 1.5, "invalid_format"],
    ["target", "100", "invalid_format"],
    ["target", 100_000_000_000, "too_large"],
    ["theme", "Teal", "invalid_format"],
    ["theme", null, "required"],
  ] as const) {
    expect(
      await issuesOf(await post(request, { ...body, [field]: value })),
      `${field} ${JSON.stringify(value)}`,
    ).toEqual([{ path: [field], code }]);
  }
  const thirty = await post(request, { ...body, name: "A".repeat(30), total: 99_999, seq: 1 });
  expect(thirty.status()).toBe(201);
  const { pot } = PotWriteDtoSchema.parse(await thirty.json());
  expect(pot.name).toHaveLength(30);
  expect(pot.total).toBe(0);
  const [next] = await freeThemes(request);
  const emoji = await post(request, { ...body, name: "🎉".repeat(15), theme: next });
  expect(emoji.status()).toBe(201);
});

test("NFR-S7 US-39 AC3: a name that looks like markup is stored and returned unchanged, as text", async ({
  request,
}) => {
  await seedAndLogin(request);
  const [theme] = await freeThemes(request);
  const name = "<script>alert(1)</script>";
  const response = await post(request, { name, target: 100, theme });
  expect(PotWriteDtoSchema.parse(await response.json()).pot.name).toBe(name);
  expect((await getPots(request)).items.at(-1)!.name).toBe(name);
});

test("US-22 4.5: fifteen pots use every theme, and a sixteenth is taken on its theme", async ({
  request,
}) => {
  await seedAndLogin(request);
  const free = await freeThemes(request);
  for (const [index, theme] of free.entries()) {
    expect((await post(request, { name: `Pot ${index}`, target: 100, theme })).status()).toBe(201);
  }
  const { items } = await getPots(request);
  expect(items).toHaveLength(THEMES.length);
  expect(
    await issuesOf(await post(request, { name: "Sixteenth", target: 100, theme: "Red" })),
  ).toEqual([{ path: ["theme"], code: "taken" }]);
});

test("US-36 AC1 SPEC-write-path 2.8 7.2: two concurrent POSTs of one name → one 201, one taken (the citext unique constraint)", async ({
  request,
}) => {
  await seedAndLogin(request);
  const [a, b] = await freeThemes(request);
  const answers = await Promise.all([
    post(request, { name: "Race", target: 100, theme: a }),
    post(request, { name: "RACE", target: 200, theme: b }),
  ]);
  expect(answers.map((r) => r.status()).sort()).toEqual([201, 400]);
  const refused = answers.find((r) => r.status() === 400)!;
  expect(await issuesOf(refused)).toEqual([{ path: ["name"], code: "taken" }]);
  expect(await db.pot.count()).toBe(SEED.pots.length + 1);
});

// ---------------------------------------------------------------------------------------
// PATCH /api/pots/:id — 2.12

test("US-23 AC1 AC2: PATCH keeps the pot's own name and theme, keeps its total and place, and a target below the total shows the real percentage", async ({
  request,
}) => {
  await seedAndLogin(request);
  const before = { ...(await untouched()), balance: (await stored()).balance };
  const order = (await getPots(request)).items.map((p) => p.id);
  const holiday = await potOf(request, "Holiday");
  const target = holiday.total - 3_100;
  const response = await patch(request, holiday.id, {
    name: holiday.name.toLowerCase(),
    target,
    theme: holiday.theme,
    total: 1,
  });
  expect(response.status()).toBe(200);
  const { pot } = PotWriteDtoSchema.parse(await response.json());
  expect(pot).toEqual({
    ...holiday,
    name: holiday.name.toLowerCase(),
    target,
    percentBasisPoints: potPercent(holiday.total, target),
  });
  expect(pot.percentBasisPoints).toBeGreaterThan(10_000);
  expect((await getPots(request)).items.map((p) => p.id)).toEqual(order);
  expect({ ...(await untouched()), balance: (await stored()).balance }).toEqual(before);
});

test("US-23 AC1: PATCH to another pot's name or theme is taken; an unknown id is 404; a non-UUID id is 400", async ({
  request,
}) => {
  await seedAndLogin(request);
  const [first, second] = (await getPots(request)).items;
  const before = await stored();
  const body = { name: first!.name, target: first!.target, theme: first!.theme };
  expect(
    await issuesOf(
      await patch(request, first!.id, { ...body, name: second!.name, theme: second!.theme }),
    ),
  ).toEqual([
    { path: ["name"], code: "taken" },
    { path: ["theme"], code: "taken" },
  ]);
  await notFound(await patch(request, UNKNOWN_ID, body));
  expect(await issuesOf(await patch(request, "not-a-uuid", body))).toEqual([
    { path: ["id"], code: "invalid_format" },
  ]);
  expect(await stored()).toEqual(before);
});

test("US-31 SPEC-write-path 4.4: PATCH {} is required on all three fields, as is one absent or null, and the pot is unchanged", async ({
  request,
}) => {
  await seedAndLogin(request);
  const savings = await potOf(request, "Savings");
  const body = { name: savings.name, target: savings.target, theme: savings.theme };
  const before = await stored();
  expect(await issuesOf(await patch(request, savings.id, {}))).toEqual([
    { path: ["name"], code: "required" },
    { path: ["target"], code: "required" },
    { path: ["theme"], code: "required" },
  ]);
  for (const field of ["name", "target", "theme"] as const) {
    const absent: Record<string, unknown> = { ...body };
    delete absent[field];
    expect(await issuesOf(await patch(request, savings.id, absent)), field).toEqual([
      { path: [field], code: "required" },
    ]);
    expect(
      await issuesOf(await patch(request, savings.id, { ...body, [field]: null })),
      `${field} null`,
    ).toEqual([{ path: [field], code: "required" }]);
  }
  expect(await stored()).toEqual(before);
});

// ---------------------------------------------------------------------------------------
// DELETE /api/pots/:id — 2.7, 2.12

test("US-24 AC1 AC2 US-04 AC3: DELETE answers 204 and refunds the total to the balance; then 404; nothing else changes", async ({
  request,
}) => {
  await seedAndLogin(request);
  const before = await untouched();
  const { balance } = await getPots(request);
  const holiday = await potOf(request, "Holiday");
  const deleted = await remove(request, holiday.id);
  expect(deleted.status()).toBe(204);
  expect(await deleted.body()).toHaveLength(0);
  expect(deleted.headers()["cache-control"]).toBe("no-store");
  const list = await getPots(request);
  expect(list.balance.current).toBe(balance.current + holiday.total);
  expect(list.items.map((p) => p.id)).not.toContain(holiday.id);
  expect(list.items).toHaveLength(SEED.pots.length - 1);
  await notFound(await remove(request, holiday.id));
  expect(await untouched()).toEqual(before);
  expect(await storedSum()).toBe(SEED_SUM);
});

// ---------------------------------------------------------------------------------------
// POST /api/pots/:id/deposit and …/withdraw — 2.12

test("US-25 AC2 AC3 US-26 AC3: a deposit and a withdrawal answer { pot, balance }, the balance moves the other way", async ({
  request,
}) => {
  await seedAndLogin(request);
  const before = await untouched();
  const { balance } = await getPots(request);
  const savings = await potOf(request, "Savings");
  const deposit = await moved(await move(request, savings.id, "deposit", 10_000));
  expect(deposit).toEqual({
    pot: {
      ...savings,
      total: savings.total + 10_000,
      percentBasisPoints: potPercent(savings.total + 10_000, savings.target),
    },
    balance: { current: balance.current - 10_000 },
  });
  const withdrawal = await moved(await move(request, savings.id, "withdraw", 2_500));
  expect(withdrawal.pot.total).toBe(savings.total + 7_500);
  expect(withdrawal.balance.current).toBe(balance.current - 7_500);
  expect(await getPots(request)).toMatchObject({ balance: withdrawal.balance });
  expect(await untouched()).toEqual(before);
});

test("US-25 AC2: a deposit over the balance is exceeds_balance and writes nothing; the whole balance is allowed, then any deposit is refused", async ({
  request,
}) => {
  await seedAndLogin(request);
  const { balance } = await getPots(request);
  const savings = await potOf(request, "Savings");
  const before = await stored();
  expect(await issuesOf(await move(request, savings.id, "deposit", balance.current + 1))).toEqual([
    { path: ["amount"], code: "exceeds_balance" },
  ]);
  expect(await stored()).toEqual(before);
  const all = await moved(await move(request, savings.id, "deposit", balance.current));
  expect(all.balance.current).toBe(0);
  expect(all.pot.total).toBe(savings.total + balance.current);
  const gift = await potOf(request, "Gift");
  expect(await issuesOf(await move(request, gift.id, "deposit", 1))).toEqual([
    { path: ["amount"], code: "exceeds_balance" },
  ]);
  // At $0.00 a withdrawal still works (4.5).
  expect((await moved(await move(request, gift.id, "withdraw", 1_000))).balance.current).toBe(
    1_000,
  );
  expect(await storedSum()).toBe(SEED_SUM);
});

test("US-26 AC2: a withdrawal over the pot's total is exceeds_total and writes nothing; the whole total is allowed", async ({
  request,
}) => {
  await seedAndLogin(request);
  const { balance } = await getPots(request);
  const holiday = await potOf(request, "Holiday");
  const before = await stored();
  expect(await issuesOf(await move(request, holiday.id, "withdraw", holiday.total + 1))).toEqual([
    { path: ["amount"], code: "exceeds_total" },
  ]);
  expect(await stored()).toEqual(before);
  const all = await moved(await move(request, holiday.id, "withdraw", holiday.total));
  expect(all.pot).toMatchObject({ total: 0, percentBasisPoints: 0 });
  expect(all.balance.current).toBe(balance.current + holiday.total);
  expect(await issuesOf(await move(request, holiday.id, "withdraw", 1))).toEqual([
    { path: ["amount"], code: "exceeds_total" },
  ]);
});

test("US-25 US-26 US-31: the amount's codes; an unknown pot is 404 before any rule; a non-UUID id is 400", async ({
  request,
}) => {
  await seedAndLogin(request);
  const savings = await potOf(request, "Savings");
  const before = await stored();
  for (const kind of ["deposit", "withdraw"] as const) {
    for (const [amount, code] of [
      [0, "too_small"],
      [-5, "too_small"],
      [1.5, "invalid_format"],
      ["100", "invalid_format"],
      [null, "required"],
      [100_000_000_000, "too_large"],
    ] as const) {
      expect(
        await issuesOf(await move(request, savings.id, kind, amount)),
        `${kind} ${amount}`,
      ).toEqual([{ path: ["amount"], code }]);
    }
    // 404 even for an amount no balance or pot could cover: the pot is looked up first (2.12).
    await notFound(await move(request, UNKNOWN_ID, kind, 99_999_999_999));
    expect(await issuesOf(await move(request, "not-a-uuid", kind, 1))).toEqual([
      { path: ["id"], code: "invalid_format" },
    ]);
  }
  expect(await stored()).toEqual(before);
});

// ---------------------------------------------------------------------------------------
// SPEC-write-path 7.2 on the pot routes: conservation and the races

test("US-25 US-26 US-24 SPEC-write-path 4.2 7.2: a deposit, a withdrawal and a deletion in a row conserve the sum after each", async ({
  request,
}) => {
  await seedAndLogin(request);
  expect(await storedSum()).toBe(SEED_SUM);
  await moved(await move(request, (await potOf(request, "Savings")).id, "deposit", 10_000));
  expect(await storedSum()).toBe(SEED_SUM);
  await moved(await move(request, (await potOf(request, "Concert Ticket")).id, "withdraw", 3_000));
  expect(await storedSum()).toBe(SEED_SUM);
  expect((await remove(request, (await potOf(request, "New Laptop")).id)).status()).toBe(204);
  expect(await storedSum()).toBe(SEED_SUM);
  const { balance, items } = await getPots(request);
  expect(balance.current + items.reduce((sum, p) => sum + p.total, 0)).toBe(SEED_SUM);
});

test("US-36 SPEC-write-path 2.8 7.2: a deposit and a delete of the same pot at the same time conserve the sum", async ({
  request,
}) => {
  for (let round = 0; round < 5; round += 1) {
    await seedAndLogin(request);
    const savings = await potOf(request, "Savings");
    const [deposit, deletion] = await Promise.all([
      move(request, savings.id, "deposit", 10_000),
      remove(request, savings.id),
    ]);
    expect(deletion.status()).toBe(204);
    expect([200, 404], `round ${round}`).toContain(deposit.status());
    expect(await storedSum(), `round ${round}`).toBe(SEED_SUM);
    expect(await db.pot.count({ where: { id: savings.id } })).toBe(0);
  }
});

test("US-36 SPEC-write-path 2.8 7.2: two concurrent deposits that together exceed the balance → one 200, one exceeds_balance", async ({
  request,
}) => {
  await seedAndLogin(request);
  const { balance } = await getPots(request);
  const amount = Math.floor(balance.current / 2) + 1;
  const [savings, gift] = [await potOf(request, "Savings"), await potOf(request, "Gift")];
  const answers = await Promise.all([
    move(request, savings.id, "deposit", amount),
    move(request, gift.id, "deposit", amount),
  ]);
  expect(answers.map((r) => r.status()).sort()).toEqual([200, 400]);
  const refused = answers.find((r) => r.status() === 400)!;
  expect(await issuesOf(refused)).toEqual([{ path: ["amount"], code: "exceeds_balance" }]);
  expect((await getPots(request)).balance.current).toBe(balance.current - amount);
  expect(await storedSum()).toBe(SEED_SUM);
});

test("US-36 SPEC-write-path 7.2: an id from before a reset is 404 on every pot route", async ({
  request,
}) => {
  await seedAndLogin(request);
  const savings = await potOf(request, "Savings");
  await seedAndLogin(request);
  const body = { name: savings.name, target: savings.target, theme: savings.theme };
  await notFound(await patch(request, savings.id, body));
  await notFound(await move(request, savings.id, "deposit", 1));
  await notFound(await move(request, savings.id, "withdraw", 1));
  await notFound(await remove(request, savings.id));
  expect(await storedSum()).toBe(SEED_SUM);
});

// ---------------------------------------------------------------------------------------
// US-04 AC2 (H8): Overview follows every move

test("US-04 AC2 AC3: GET /api/overview's balance and pots total after a deposit, a withdrawal and a deletion; income and expenses unchanged", async ({
  request,
}) => {
  await seedAndLogin(request);
  const overview = async () =>
    OverviewDtoSchema.parse(await (await request.get("/api/overview")).json());
  const start = await overview();
  const pots = async () => {
    const { balance, items } = await getPots(request);
    return { current: balance.current, total: items.reduce((sum, p) => sum + p.total, 0) };
  };
  const check = async () => {
    const now = await overview();
    const expected = await pots();
    expect(now.balance.current).toBe(expected.current);
    expect(now.pots.total).toBe(expected.total);
    expect(now.balance.income).toBe(start.balance.income);
    expect(now.balance.expenses).toBe(start.balance.expenses);
    expect(now.budgets).toEqual(start.budgets);
    return now;
  };
  await moved(await move(request, (await potOf(request, "Savings")).id, "deposit", 10_000));
  expect((await check()).balance.current).toBe(start.balance.current - 10_000);
  await moved(await move(request, (await potOf(request, "Holiday")).id, "withdraw", 3_100));
  expect((await check()).pots.total).toBe(start.pots.total + 10_000 - 3_100);
  const laptop = await potOf(request, "New Laptop");
  expect((await remove(request, laptop.id)).status()).toBe(204);
  expect((await check()).balance.current).toBe(
    start.balance.current - 10_000 + 3_100 + laptop.total,
  );
});

// ---------------------------------------------------------------------------------------
// SPEC-write-path 7.3 on the real routes

test("US-36 SPEC-write-path 7.3: a same-origin write passes the proxy and reaches the pots handler", async ({
  request,
}) => {
  await seedAndLogin(request);
  const response = await request.post("/api/pots", {
    headers: { ...JSON_TYPE, "sec-fetch-site": "same-origin" },
    data: "{}",
  });
  expect(response.status()).toBe(400);
  expect(response.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  expect(await issuesOf(response)).toHaveLength(3);
});
