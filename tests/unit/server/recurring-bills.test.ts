import { afterEach, describe, expect, it, vi } from "vitest";
import { billsTotals } from "@/src/domain/bills";
import { toRecurringBillsDto } from "@/src/server/recurring-bills";
import { RecurringBillsDtoSchema } from "@/src/shared/schemas";

const getDb = vi.hoisted(() => vi.fn());
vi.mock("@/src/server/db", () => ({ getDb }));

const { GET } = await import("@/app/api/recurring-bills/route");

afterEach(() => {
  vi.restoreAllMocks();
  getDb.mockReset();
});

/** A hand-built bill, with the `latest` transaction `recurringBills` attaches. */
const bill = (name: string, status: "paid" | "dueSoon" | "upcoming", amount: number) => ({
  name,
  day: 7,
  amount,
  status,
  latest: {
    id: "00000000-0000-4000-9000-000000000001",
    name,
    avatar: "spark-electric-solutions",
    category: "Bills",
    date: new Date("2026-08-07T09:15:00Z"),
    amount: -amount,
    recurring: true,
    seeded: true,
  },
});

describe("toRecurringBillsDto (SPEC-recurring-bills 2.11)", () => {
  const paid = bill("Paid Vendor", "paid", 2_311);
  const soon = bill("Soon Vendor", "dueSoon", 1_037);

  it("names every field: the avatar key from the latest transaction, no id, no date, no latest", () => {
    const dto = toRecurringBillsDto([soon], billsTotals([paid, soon]));
    expect(dto.items).toEqual([
      {
        name: "Soon Vendor",
        avatar: "spark-electric-solutions",
        day: 7,
        amount: 1_037,
        status: "dueSoon",
      },
    ]);
    expect(() => RecurringBillsDtoSchema.parse(dto)).not.toThrow();
  });

  it("US-28 AC1: the summary is over every bill while the items are filtered", () => {
    const dto = toRecurringBillsDto([soon], billsTotals([paid, soon]));
    expect(dto.summary).toEqual({
      total: { count: 2, amount: 3_348 },
      paid: { count: 1, amount: 2_311 },
      totalUpcoming: { count: 1, amount: 1_037 },
      dueSoon: { count: 1, amount: 1_037 },
    });
  });
});

describe("GET /api/recurring-bills when the database fails (v0.7.1: the 500 is a unit test)", () => {
  it("answers 500 server_error, no-store, and logs the failure", async () => {
    const failure = new Error("connection lost");
    getDb.mockReturnValue({ transaction: { findMany: vi.fn().mockRejectedValue(failure) } });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await GET(new Request("http://localhost/api/recurring-bills"));
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "server_error",
      message: "The recurring bills are unavailable",
    });
    expect(log).toHaveBeenCalledWith("GET /api/recurring-bills failed", failure);
  });

  it("refuses a bad query with 400 before it reads the database", async () => {
    const response = await GET(new Request("http://localhost/api/recurring-bills?status=late"));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(getDb).not.toHaveBeenCalled();
  });

  it("builds the bills on the business day, 19 Aug 2026 (NFR-D1)", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        name: "Late Vendor",
        avatar: "spark-electric-solutions",
        category: "Bills",
        date: new Date("2026-08-19T23:59:59Z"),
        amount: -1_037n,
        recurring: true,
      },
    ]);
    getDb.mockReturnValue({ transaction: { findMany } });
    const response = await GET(new Request("http://localhost/api/recurring-bills"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const dto = RecurringBillsDtoSchema.parse(await response.json());
    expect(dto.items).toEqual([
      {
        name: "Late Vendor",
        avatar: "spark-electric-solutions",
        day: 19,
        amount: 1_037,
        status: "paid",
      },
    ]);
  });
});
