import { afterEach, describe, expect, it, vi } from "vitest";
import { BILL_SORTS, BILL_STATUSES } from "@/src/shared/recurring-bills-query";
import type { RecurringBillsDto } from "@/src/shared/schemas";
import { listRecurringBills, listRecurringBillsPath } from "@/src/webmcp/tools/recurring-bills";

/** A synthetic DTO for the mapper, not seed data; seed figures are the E2E suite's. */
const DTO: RecurringBillsDto = {
  items: [{ name: "Vendor", avatar: "vendor", day: 3, amount: 1500, status: "dueSoon" }],
  summary: {
    total: { count: 2, amount: 2500 },
    paid: { count: 1, amount: 1000 },
    totalUpcoming: { count: 1, amount: 1500 },
    dueSoon: { count: 1, amount: 1500 },
  },
};

function stubFetch(response: () => Promise<Response>) {
  const fetchMock = vi.fn(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const ok = () => Promise.resolve(new Response(JSON.stringify(DTO), { status: 200 }));

afterEach(() => vi.unstubAllGlobals());

describe("list_recurring_bills (SPEC-recurring-bills 2.12, US-38 AC1, US-39 AC2–AC4)", () => {
  it("the descriptor: title, the spec's description of at most 200 characters, the two annotations", () => {
    expect(listRecurringBills).toMatchObject({
      name: "list_recurring_bills",
      title: "List recurring bills",
      annotations: { readOnlyHint: true, untrustedContentHint: true },
    });
    expect(listRecurringBills.description).toHaveLength(192);
    expect(listRecurringBills.annotations).not.toHaveProperty("consequentialHint");
  });

  it("the input schema lists the allowed values, read from BILL_STATUSES and the shared sorts (2.3, §7)", () => {
    expect(listRecurringBills.inputSchema).toMatchObject({
      type: "object",
      properties: {
        search: { type: "string", maxLength: 60 },
        status: { enum: [...BILL_STATUSES] },
        sort: { enum: [...BILL_SORTS] },
      },
    });
  });

  it("builds the API path: q ← search, in the contract's order q, sort, status", () => {
    expect(listRecurringBillsPath({})).toBe("/api/recurring-bills");
    expect(listRecurringBillsPath({ status: "upcoming", sort: "highest", search: "e x" })).toBe(
      "/api/recurring-bills?q=e+x&sort=highest&status=upcoming",
    );
  });

  it("returns the DTO plus currency and unit, and sends X-Via", async () => {
    const fetchMock = stubFetch(ok);
    const result = await listRecurringBills.execute({ status: "dueSoon" });
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({ ...DTO, currency: "USD", unit: "cents" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/recurring-bills?status=dueSoon",
      expect.objectContaining({ method: "GET", headers: { "X-Via": "webmcp" } }),
    );
  });

  it.each([
    ["sort", "newest", '"latest"'],
    ["status", "late", '"dueSoon"'],
  ])(
    "a %s outside the list is a validation error naming the allowed values; no request is sent",
    async (field, value, named) => {
      const fetchMock = stubFetch(ok);
      const result = await listRecurringBills.execute({ [field]: value });
      expect(result).toMatchObject({ isError: true, code: "validation" });
      expect(result.message).toContain(named);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("a 401 is `unauthenticated`, with no data (US-39 AC4)", async () => {
    stubFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "unauthenticated", message: "Log in to continue" }), {
          status: 401,
        }),
      ),
    );
    const result = await listRecurringBills.execute({});
    expect(result).toMatchObject({ isError: true, code: "unauthenticated" });
    expect(result.structuredContent).toBeUndefined();
  });
});
