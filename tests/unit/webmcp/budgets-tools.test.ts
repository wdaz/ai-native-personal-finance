import { afterEach, describe, expect, it, vi } from "vitest";
import type { BudgetItemDto, BudgetsDto } from "@/src/shared/schemas";
import { NO_DIALOG_MESSAGE } from "@/src/webmcp/bus";
import {
  addBudget,
  budgetsTools,
  deleteBudget,
  editBudget,
  listBudgets,
} from "@/src/webmcp/tools/budgets";

const ID = "6f1c2b9e-3a4d-4e5f-8a6b-7c8d9e0f1a2b";
/** A synthetic budget for the mapper, not seed data; seed figures are the E2E suite's. */
const BUDGET: BudgetItemDto = {
  id: ID,
  category: "Dining Out",
  theme: "Yellow",
  maximum: 5_000,
  spent: 1_500,
  remaining: 3_500,
  latest: [],
};
const DTO: BudgetsDto = { items: [BUDGET], spent: 1_500, limit: 5_000 };

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const call = (fetchMock: ReturnType<typeof stubFetch>) => {
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return { url, init, headers: new Headers(init.headers) };
};

afterEach(() => vi.unstubAllGlobals());

describe("the Budgets page's tools (SPEC-budgets 2.13; US-38, US-39, US-40)", () => {
  it("registers exactly the four tools, in the spec's order", () => {
    expect(budgetsTools.map((tool) => tool.name)).toEqual([
      "list_budgets",
      "add_budget",
      "edit_budget",
      "delete_budget",
    ]);
  });

  it("the annotations: list reads untrusted text; the writes are consequential", () => {
    expect(listBudgets.annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true });
    expect(addBudget.annotations).toEqual({ consequentialHint: true, untrustedContentHint: true });
    expect(editBudget.annotations).toEqual({ consequentialHint: true, untrustedContentHint: true });
    expect(deleteBudget.annotations).toEqual({ consequentialHint: true });
  });

  it("every description says it is available on the Budgets page, within 200 characters", () => {
    for (const tool of budgetsTools) {
      expect(tool.description).toMatch(/Available on the Budgets page\.$/);
      expect(tool.description.length).toBeLessThanOrEqual(200);
    }
  });

  it("the input schemas: the create's three fields; the edit's id is a UUID of 36", () => {
    expect(addBudget.inputSchema).toMatchObject({
      type: "object",
      required: ["category", "maximum", "theme"],
    });
    expect(editBudget.inputSchema).toMatchObject({
      type: "object",
      properties: { id: { type: "string", maxLength: 36 } },
    });
    expect(editBudget.inputSchema.required).toEqual(
      expect.arrayContaining(["id", "category", "maximum", "theme"]),
    );
  });

  it("list_budgets GETs /api/budgets with X-Via: webmcp and returns the DTO", async () => {
    const fetchMock = stubFetch(200, DTO);
    const result = await listBudgets.execute({});
    const { url, init, headers } = call(fetchMock);
    expect(url).toBe("/api/budgets");
    expect(init.method ?? "GET").toBe("GET");
    expect(headers.get("X-Via")).toBe("webmcp");
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject(DTO);
  });

  it("add_budget POSTs the three fields; invalid input never reaches the server (US-40 AC1)", async () => {
    const fetchMock = stubFetch(201, { budget: BUDGET });
    const input = { category: "Dining Out", maximum: 5_000, theme: "Yellow" };
    const result = await addBudget.execute(input);
    const { url, init, headers } = call(fetchMock);
    expect(url).toBe("/api/budgets");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(input);
    expect(headers.get("X-Via")).toBe("webmcp");
    expect(result.structuredContent).toMatchObject({ budget: BUDGET });

    fetchMock.mockClear();
    const refused = await addBudget.execute({ ...input, maximum: 0 });
    expect(refused).toMatchObject({ isError: true, code: "validation" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("edit_budget PATCHes /api/budgets/{id} with the three fields, not the id", async () => {
    const fetchMock = stubFetch(200, { budget: BUDGET });
    await editBudget.execute({ id: ID, category: "Dining Out", maximum: 7_500, theme: "Yellow" });
    const { url, init } = call(fetchMock);
    expect(url).toBe(`/api/budgets/${ID}`);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({
      category: "Dining Out",
      maximum: 7_500,
      theme: "Yellow",
    });
  });

  it("edit_budget answers a 404 as not_found", async () => {
    stubFetch(404, { error: { code: "not_found", message: "Not found" } });
    const result = await editBudget.execute({
      id: ID,
      category: "Dining Out",
      maximum: 7_500,
      theme: "Yellow",
    });
    expect(result).toMatchObject({ isError: true, code: "not_found" });
  });

  it("delete_budget goes through the page's dialog: with none, cancelled and no request (R-16)", async () => {
    const fetchMock = stubFetch(204, null);
    const result = await deleteBudget.execute({ id: ID });
    expect(result).toMatchObject({ isError: true, code: "cancelled", message: NO_DIALOG_MESSAGE });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
