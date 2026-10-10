import { afterEach, describe, expect, it, vi } from "vitest";
import { toPotDto } from "@/src/server/pots";
import { PotDtoSchema } from "@/src/shared/schemas";

const getDb = vi.hoisted(() => vi.fn());
vi.mock("@/src/server/db", () => ({ getDb }));

const { GET } = await import("@/app/api/pots/route");

afterEach(() => {
  vi.restoreAllMocks();
  getDb.mockReset();
});

const ID = "00000000-0000-4000-9000-000000000001";

describe("toPotDto (SPEC-pots 2.12, §6 API)", () => {
  it("US-21 AC1 US-39 AC2 names every field: BigInt to Number, the theme's name, the basis points", () => {
    const dto = toPotDto({
      id: ID,
      name: "Rainy Days",
      target: 200_000n,
      total: 15_900n,
      theme: "NavyGrey",
    });
    expect(dto).toEqual({
      id: ID,
      name: "Rainy Days",
      theme: "Navy Grey",
      target: 200_000,
      total: 15_900,
      percentBasisPoints: 795,
    });
    expect(PotDtoSchema.parse(dto)).toEqual(dto);
  });

  it("leaves out whatever else the row carries (seq, seeded, timestamps)", () => {
    const row = {
      id: ID,
      name: "Gift",
      target: 1n,
      total: 0n,
      theme: "ArmyGreen" as const,
      seq: 3,
      seeded: true,
      createdAt: new Date(0),
    };
    expect(Object.keys(toPotDto(row)).sort()).toEqual(
      ["id", "name", "percentBasisPoints", "target", "theme", "total"].sort(),
    );
  });
});

describe("GET /api/pots when the database fails (2.12; the 500 is a unit test, T-18/T-20 Q2 (a))", () => {
  it("answers 500 server_error, no-store, and logs the failure", async () => {
    const failure = new Error("connection lost");
    getDb.mockReturnValue({
      balance: { findFirstOrThrow: vi.fn().mockRejectedValue(failure) },
      pot: { findMany: vi.fn().mockResolvedValue([]) },
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await GET();
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "server_error",
      message: "The pots are unavailable",
    });
    expect(log).toHaveBeenCalledWith("GET /api/pots failed", failure);
  });
});
