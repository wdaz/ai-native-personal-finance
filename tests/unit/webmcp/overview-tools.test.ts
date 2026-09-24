import { afterEach, describe, expect, it, vi } from "vitest";
import type { OverviewDto } from "@/src/shared/schemas";
import { getBalance, getOverviewSummary } from "@/src/webmcp/tools/overview";

/**
 * A synthetic DTO for the mapper — not seed data, so the invented numbers are deliberately
 * obvious. Seed-derived figures are compared in the E2E suite, from `seedFigures()`.
 */
const DTO: OverviewDto = {
  balance: { current: 30, income: 20, expenses: 10 },
  pots: {
    total: 5,
    items: [
      { id: "7c9e6679-7425-40de-944b-e07fc1f90ae7", name: "Pot A", total: 5, theme: "Green" },
    ],
  },
  transactions: [
    {
      id: "0b8a1c9e-0d1a-4a53-9a5e-3f1d4f0d1b11",
      name: "Payer",
      avatar: "payer",
      amount: 1,
      date: "2026-01-01T00:00:00.000Z",
    },
  ],
  budgets: { spent: 1, limit: 2, items: [] },
  bills: { paid: 1, upcoming: 2, dueSoon: 3 },
};

function stubFetch(response: () => Promise<Response>) {
  const fetchMock = vi.fn(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const ok = () => Promise.resolve(new Response(JSON.stringify(DTO), { status: 200 }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("descriptors (SPEC-webmcp-tools §3)", () => {
  it("get_balance", () => {
    expect(getBalance).toMatchObject({
      name: "get_balance",
      title: "Get balance",
      description:
        "Returns the demo account's current balance, income and expenses in USD cents. Available on the Overview page.",
      annotations: { readOnlyHint: true },
    });
    expect(getBalance.inputSchema).toMatchObject({ type: "object", properties: {} });
    expect(getBalance.annotations).not.toHaveProperty("untrustedContentHint");
  });

  it("get_overview_summary", () => {
    expect(getOverviewSummary).toMatchObject({
      name: "get_overview_summary",
      title: "Get overview summary",
      description:
        "Returns what the Overview page shows: totals, first four pots and budgets, latest five transactions, bills summary. Money in USD cents. Available on the Overview page.",
      annotations: { readOnlyHint: true, untrustedContentHint: true },
    });
    expect(getOverviewSummary.inputSchema).toMatchObject({ type: "object", properties: {} });
  });

  it("publishes no additionalProperties: false — a stray key is tolerated (plan Q2)", () => {
    expect(getBalance.inputSchema).not.toHaveProperty("additionalProperties");
  });
});

describe("execute — success (SPEC §2.5–2.6, plan D5)", () => {
  it("get_balance returns the balance flat, plus currency and unit, and sends X-Via", async () => {
    const fetchMock = stubFetch(ok);
    const result = await getBalance.execute({});
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({ ...DTO.balance, currency: "USD", unit: "cents" });
    expect(JSON.parse(result.content[0]!.text)).toEqual(result.structuredContent);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/overview",
      expect.objectContaining({ method: "GET", headers: { "X-Via": "webmcp" } }),
    );
  });

  it("get_overview_summary returns the whole DTO unchanged plus currency and unit", async () => {
    stubFetch(ok);
    const result = await getOverviewSummary.execute({});
    expect(result.structuredContent).toEqual({ ...DTO, currency: "USD", unit: "cents" });
  });

  it("ignores a key it does not declare instead of failing (plan Q2)", async () => {
    const fetchMock = stubFetch(ok);
    const result = await getBalance.execute({ a: 1 });
    expect(result.isError).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("execute — failure is a value, never a rejection (NFR-W6, US-39 AC4)", () => {
  const cases: Array<[string, () => Promise<Response>, string]> = [
    [
      "401 (the session ended)",
      () =>
        Promise.resolve(
          new Response(
            JSON.stringify({ error: "unauthenticated", message: "Log in to continue" }),
            {
              status: 401,
            },
          ),
        ),
      "unauthenticated",
    ],
    [
      "500",
      () =>
        Promise.resolve(
          new Response(
            JSON.stringify({ error: "server_error", message: "The overview is unavailable" }),
            {
              status: 500,
            },
          ),
        ),
      "server_error",
    ],
    [
      "a 200 that is HTML",
      () => Promise.resolve(new Response("<html></html>", { status: 200 })),
      "server_error",
    ],
    [
      "a 200 that is not the DTO",
      () => Promise.resolve(new Response(JSON.stringify({ balance: {} }), { status: 200 })),
      "server_error",
    ],
    ["a network failure", () => Promise.reject(new TypeError("Failed to fetch")), "server_error"],
  ];

  it.each(cases)(
    "%s → a structured %s result with no data, from both tools",
    async (_, response, code) => {
      for (const tool of [getBalance, getOverviewSummary]) {
        stubFetch(response);
        const result = await tool.execute({});
        expect(result).toMatchObject({ isError: true, code });
        expect(result.structuredContent).toBeUndefined();
      }
    },
  );
});

describe("execute — input it does not declare (Review Focus 2)", () => {
  it("answers [] with a validation result carrying issues", async () => {
    stubFetch(ok);
    const result = await getBalance.execute([]);
    expect(result).toMatchObject({ isError: true, code: "validation" });
    expect(result.issues).toEqual([{ path: [], code: "required" }]);
  });

  it.each([null, "x", 42, true])(
    "answers %j with a validation result, without rejecting",
    async (input) => {
      stubFetch(ok);
      await expect(getBalance.execute(input)).resolves.toMatchObject({
        isError: true,
        code: "validation",
      });
    },
  );

  it("does not call the API when the input is invalid", async () => {
    const fetchMock = stubFetch(ok);
    await getBalance.execute([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
