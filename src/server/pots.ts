import { isPotNameTaken, potPercent } from "@/src/domain/pots";
import type { Theme } from "@/src/shared/enums";
import type {
  ErrorIssue,
  PotCreateInput,
  PotDto,
  PotMoneyMoveInput,
  PotsDto,
  PotUpdateInput,
} from "@/src/shared/schemas";
import { prismaTheme } from "./budgets";
import type { Db } from "./db";
import { themeLabel } from "./overview";
import type { WriteOutcome, WriteTx } from "./write";

type PotRow = {
  id: string;
  name: string;
  target: bigint;
  total: bigint;
  theme: Parameters<typeof themeLabel>[0];
};

const POT_SELECT = { id: true, name: true, target: true, total: true, theme: true } as const;

/**
 * SPEC-pots 2.12: `PotDtoSchema` is strict. Every field is named, so `seq`, `seeded` and the
 * timestamps never reach the DTO; money leaves `BigInt` here (every value is far below 2⁵³,
 * SPEC-write-path 2.8) and the percentage is `potPercent`'s basis points.
 */
export function toPotDto(row: PotRow): PotDto {
  const target = Number(row.target);
  const total = Number(row.total);
  return {
    id: row.id,
    name: row.name,
    theme: themeLabel(row.theme),
    target,
    total,
    percentBasisPoints: potPercent(total, target),
  };
}

async function readBalance(db: Db | WriteTx): Promise<number> {
  const balance = await db.balance.findFirstOrThrow({ select: { current: true } });
  return Number(balance.current);
}

/**
 * SPEC-pots 2.1, 2.12: the one place the pots are read, for the page (directly) and `GET /api/pots`:
 * the Current Balance and every pot in creation order (`seq`). No sum of the totals (2.12).
 */
export async function getPots(db: Db): Promise<PotsDto> {
  const [current, pots] = await Promise.all([
    readBalance(db),
    db.pot.findMany({ orderBy: { seq: "asc" }, select: POT_SELECT }),
  ]);
  return { balance: { current }, items: pots.map(toPotDto) };
}

/**
 * SPEC-pots 2.12, SPEC-write-path 2.7: a name another pot has (trimmed, case-insensitive) and a theme
 * another pot holds are each `taken`, both reported when both apply; the pot's own values never count
 * against it (US-23 AC1). A budget's theme does not count (SPEC-write-path 4.1). The `citext` and theme
 * unique indexes stay the last line of defence for two requests racing (`guardedWrite` maps them).
 */
async function takenIssues(
  tx: WriteTx,
  input: { name: string; theme: Theme },
  ownId?: string,
): Promise<ErrorIssue[]> {
  const pots = await tx.pot.findMany({ select: { id: true, name: true, theme: true } });
  const issues: ErrorIssue[] = [];
  if (isPotNameTaken(input.name, pots, ownId)) issues.push({ path: ["name"], code: "taken" });
  const theme = prismaTheme(input.theme);
  if (pots.some((pot) => pot.id !== ownId && pot.theme === theme)) {
    issues.push({ path: ["theme"], code: "taken" });
  }
  return issues;
}

/** The pot as the write leaves it, read on the write's own transaction (the state the commit keeps). */
async function potDto(tx: WriteTx, id: string): Promise<PotDto> {
  return toPotDto(await tx.pot.findUniqueOrThrow({ where: { id }, select: POT_SELECT }));
}

/** `POST /api/pots` (2.12, US-22 AC3): 201 `{ pot }` with `total: 0`, listed last (`seq`). */
export async function createPot(
  tx: WriteTx,
  input: PotCreateInput | undefined,
): Promise<WriteOutcome> {
  const body = input!;
  const issues = await takenIssues(tx, body);
  if (issues.length > 0) return { kind: "validation", issues };
  const created = await tx.pot.create({
    data: {
      name: body.name,
      target: BigInt(body.target),
      total: 0n,
      theme: prismaTheme(body.theme),
    },
    select: POT_SELECT,
  });
  return { kind: "ok", status: 201, body: { pot: toPotDto(created) } };
}

/**
 * `PATCH /api/pots/:id` (2.12, US-23): all three fields; the total unchanged (a target below it shows
 * the real percentage, AC2); 404 for no such pot, before any business rule.
 */
export async function updatePot(
  tx: WriteTx,
  input: PotUpdateInput | undefined,
  id: string | undefined,
): Promise<WriteOutcome> {
  const body = input!;
  const exists = await tx.pot.findUnique({ where: { id: id! }, select: { id: true } });
  if (!exists) return { kind: "not_found" };
  const issues = await takenIssues(tx, body, id);
  if (issues.length > 0) return { kind: "validation", issues };
  // A conditional update (SPEC-write-path 2.8): a delete that commits between the read above and
  // this write leaves no row to touch, which is a 404, not a thrown P2025 (T-23's review finding).
  const { count } = await tx.pot.updateMany({
    where: { id: id! },
    data: { name: body.name, target: BigInt(body.target), theme: prismaTheme(body.theme) },
  });
  if (count === 0) return { kind: "not_found" };
  return { kind: "ok", status: 200, body: { pot: await potDto(tx, id!) } };
}

/**
 * `DELETE /api/pots/:id` (2.7, 2.12, US-24 AC1; SPEC-write-path 2.8): the total is taken from the
 * delete itself (`RETURNING`), never from an earlier read, and exactly that goes back to
 * `Balance.current` in the same transaction — so a deposit that lands just before the delete is
 * refunded too. 204; 404 for no such pot. No budget and nothing else changes.
 */
export async function deletePot(
  tx: WriteTx,
  _input: unknown,
  id: string | undefined,
): Promise<WriteOutcome> {
  const deleted = await tx.$queryRaw<{ total: bigint }[]>`
    DELETE FROM "Pot" WHERE "id" = ${id!}::uuid RETURNING "total"`;
  const row = deleted[0];
  if (row === undefined) return { kind: "not_found" };
  await tx.balance.updateMany({ data: { current: { increment: row.total } } });
  return { kind: "ok", status: 204 };
}

async function moveAnswer(tx: WriteTx, id: string): Promise<WriteOutcome> {
  const [pot, current] = await Promise.all([potDto(tx, id), readBalance(tx)]);
  return { kind: "ok", status: 200, body: { pot, balance: { current } } };
}

/**
 * `POST /api/pots/:id/deposit` (2.12, US-25; SPEC-write-path 2.8): `Pot.total += x`, then
 * `Balance.current −= x WHERE current ≥ x`. The pot goes first, so a missing pot is a 404 before
 * the business rule, and its row lock makes a delete of the same pot wait for this move. A balance
 * row left untouched is `exceeds_balance`, and the rollback undoes the pot's increment.
 */
export async function depositToPot(
  tx: WriteTx,
  input: PotMoneyMoveInput | undefined,
  id: string | undefined,
): Promise<WriteOutcome> {
  const amount = BigInt(input!.amount);
  const pot = await tx.pot.updateMany({
    where: { id: id! },
    data: { total: { increment: amount } },
  });
  if (pot.count === 0) return { kind: "not_found" };
  const balance = await tx.balance.updateMany({
    where: { current: { gte: amount } },
    data: { current: { decrement: amount } },
  });
  if (balance.count === 0) {
    return { kind: "validation", issues: [{ path: ["amount"], code: "exceeds_balance" }] };
  }
  return moveAnswer(tx, id!);
}

/**
 * `POST /api/pots/:id/withdraw` (2.12, US-26; SPEC-write-path 2.8): `Pot.total −= x WHERE total ≥ x`,
 * then `Balance.current += x`. No row touched is re-read: no pot is a 404, a pot holding less is
 * `exceeds_total`.
 */
export async function withdrawFromPot(
  tx: WriteTx,
  input: PotMoneyMoveInput | undefined,
  id: string | undefined,
): Promise<WriteOutcome> {
  const amount = BigInt(input!.amount);
  const pot = await tx.pot.updateMany({
    where: { id: id!, total: { gte: amount } },
    data: { total: { decrement: amount } },
  });
  if (pot.count === 0) {
    const exists = await tx.pot.findUnique({ where: { id: id! }, select: { id: true } });
    if (!exists) return { kind: "not_found" };
    return { kind: "validation", issues: [{ path: ["amount"], code: "exceeds_total" }] };
  }
  await tx.balance.updateMany({ data: { current: { increment: amount } } });
  return moveAnswer(tx, id!);
}
