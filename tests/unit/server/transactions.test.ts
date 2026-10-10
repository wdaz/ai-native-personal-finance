import { afterEach, describe, expect, it, vi } from "vitest";
import { toTransactionsDto } from "@/src/server/transactions";
import { TransactionsDtoSchema } from "@/src/shared/schemas";

const getDb = vi.hoisted(() => vi.fn());
vi.mock("@/src/server/db", () => ({ getDb }));

const { GET } = await import("@/app/api/transactions/route");

afterEach(() => {
  vi.restoreAllMocks();
  getDb.mockReset();
});

describe("toTransactionsDto (SPEC-transactions 2.13)", () => {
  const row = {
    id: "00000000-0000-4000-9000-000000000001",
    name: "Vendor",
    avatar: "savory-bites-bistro",
    category: "Personal Care" as const,
    date: new Date("2026-08-03T09:15:00Z"),
    amount: -2_311,
    recurring: true,
    seeded: true,
  };

  it("names every field: the display category, the ISO date, integer cents, no recurring or seeded", () => {
    const dto = toTransactionsDto({ items: [row], page: 1, pageCount: 1, total: 1 });
    expect(dto).toEqual({
      items: [
        {
          id: row.id,
          name: "Vendor",
          avatar: "savory-bites-bistro",
          category: "Personal Care",
          date: "2026-08-03T09:15:00.000Z",
          amount: -2_311,
        },
      ],
      page: 1,
      pageSize: 10,
      pageCount: 1,
      total: 1,
    });
    expect(() => TransactionsDtoSchema.parse(dto)).not.toThrow();
  });
});

describe("GET /api/transactions when the database fails (v1.0.17: the 500 is a unit test)", () => {
  it("answers 500 server_error, no-store, and logs the failure", async () => {
    const failure = new Error("connection lost");
    getDb.mockReturnValue({ transaction: { findMany: vi.fn().mockRejectedValue(failure) } });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await GET(new Request("http://localhost/api/transactions"));
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "server_error",
      message: "The transactions are unavailable",
    });
    expect(log).toHaveBeenCalledWith("GET /api/transactions failed", failure);
  });

  it("refuses a bad query with 400 before it reads the database", async () => {
    const response = await GET(new Request("http://localhost/api/transactions?sort=nope"));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(getDb).not.toHaveBeenCalled();
  });
});
