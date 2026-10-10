import { afterEach, describe, expect, it, vi } from "vitest";
import { CATEGORIES } from "@/src/shared/enums";
import type { TransactionsDto } from "@/src/shared/schemas";
import { TRANSACTION_SORTS } from "@/src/shared/transactions-query";
import { listTransactions, listTransactionsPath } from "@/src/webmcp/tools/transactions";

/** A synthetic DTO for the mapper, not seed data; seed figures are the E2E suite's. */
const DTO: TransactionsDto = {
  items: [
    {
      id: "0b8a1c9e-0d1a-4a53-9a5e-3f1d4f0d1b11",
      name: "Payer",
      avatar: "payer",
      category: "General",
      date: "2026-01-01T00:00:00.000Z",
      amount: -150,
    },
  ],
  page: 1,
  pageSize: 10,
  pageCount: 1,
  total: 1,
};

function stubFetch(response: () => Promise<Response>) {
  const fetchMock = vi.fn(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const ok = () => Promise.resolve(new Response(JSON.stringify(DTO), { status: 200 }));

afterEach(() => vi.unstubAllGlobals());

describe("list_transactions (SPEC-transactions 2.14, US-38 AC1, US-39 AC2–AC4)", () => {
  it("the descriptor: title, a description of at most 200 characters, the two annotations", () => {
    expect(listTransactions).toMatchObject({
      name: "list_transactions",
      title: "List transactions",
      annotations: { readOnlyHint: true, untrustedContentHint: true },
    });
    expect(listTransactions.description.length).toBeLessThanOrEqual(200);
    expect(listTransactions.annotations).not.toHaveProperty("consequentialHint");
  });

  it("the input schema lists the allowed values, so an agent sees them before its first call (2.3)", () => {
    expect(listTransactions.inputSchema).toMatchObject({
      type: "object",
      properties: {
        search: { type: "string", maxLength: 60 },
        category: { enum: [...CATEGORIES] },
        sort: { enum: [...TRANSACTION_SORTS] },
        page: { type: "integer", minimum: 1 },
      },
    });
  });

  it("builds the API path: q ← search, in the contract's order", () => {
    expect(listTransactionsPath({})).toBe("/api/transactions");
    expect(
      listTransactionsPath({ search: "co ffee", category: "Dining Out", sort: "oldest", page: 2 }),
    ).toBe("/api/transactions?q=co+ffee&category=Dining+Out&sort=oldest&page=2");
  });

  it("returns the DTO with ids plus currency and unit, and sends X-Via", async () => {
    const fetchMock = stubFetch(ok);
    const result = await listTransactions.execute({ search: "pay", page: 1 });
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({ ...DTO, currency: "USD", unit: "cents" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/transactions?q=pay&page=1",
      expect.objectContaining({ method: "GET", headers: { "X-Via": "webmcp" } }),
    );
  });

  it("a sort outside the list is a validation error naming the allowed values; no request is sent", async () => {
    const fetchMock = stubFetch(ok);
    const result = await listTransactions.execute({ sort: "newest" });
    expect(result).toMatchObject({ isError: true, code: "validation" });
    expect(result.message).toContain('"latest"');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("page 0 is a validation error with the code `required` (2.3: Zod's too_small)", async () => {
    stubFetch(ok);
    const result = await listTransactions.execute({ page: 0 });
    expect(result).toMatchObject({ isError: true, code: "validation" });
    expect(result.issues).toEqual([{ path: ["page"], code: "required" }]);
  });

  it("a 401 is `unauthenticated`, with no data (US-39 AC4)", async () => {
    stubFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "unauthenticated", message: "Log in to continue" }), {
          status: 401,
        }),
      ),
    );
    const result = await listTransactions.execute({});
    expect(result).toMatchObject({ isError: true, code: "unauthenticated" });
    expect(result.structuredContent).toBeUndefined();
  });
});
