import { afterEach, describe, expect, it, vi } from "vitest";
import { THEMES } from "@/src/shared/enums";
import type { PotDto, PotsDto } from "@/src/shared/schemas";
import { onDeleteRequest } from "@/src/webmcp/bus";
import {
  addMoneyToPot,
  addPot,
  deletePot,
  editPot,
  listPots,
  potsTools,
  withdrawFromPot,
} from "@/src/webmcp/tools/pots";

/** Synthetic DTOs for the mapper, not seed data; seed figures are the E2E suite's. */
const ID = "3f1c2b8e-5a7d-4c1e-9b2a-6d8e0f4a1c3b";
const POT: PotDto = {
  id: ID,
  name: "Pot",
  theme: "Green",
  target: 1000,
  total: 250,
  percentBasisPoints: 2500,
};
const LIST: PotsDto = { balance: { current: 5000 }, items: [POT] };

function stubFetch(response: () => Promise<Response>) {
  const fetchMock = vi.fn(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const answer = (status: number, body: unknown) => () =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe("the six Pots tools (SPEC-pots 2.13, US-38 AC1, US-40 AC1–AC3)", () => {
  it("the descriptors: names, titles and the counted descriptions of 4.8", () => {
    expect(potsTools.map((tool) => [tool.name, tool.title, tool.description.length])).toEqual([
      ["list_pots", "List pots", 171],
      ["add_pot", "Add pot", 152],
      ["edit_pot", "Edit pot", 138],
      ["delete_pot", "Delete pot", 181],
      ["add_money_to_pot", "Add money to pot", 139],
      ["withdraw_from_pot", "Withdraw from pot", 140],
    ]);
  });

  it("the input schemas: the route's shared schema with the id, maxLength and bounds (NFR-W3)", () => {
    expect(addPot.inputSchema).toMatchObject({
      properties: {
        name: { type: "string", maxLength: 30 },
        target: { type: "integer", minimum: 1, maximum: 99_999_999_999 },
        theme: { enum: [...THEMES] },
      },
      required: ["name", "target", "theme"],
    });
    expect(editPot.inputSchema).toMatchObject({
      properties: { id: { type: "string", maxLength: 36 } },
      required: expect.arrayContaining(["id", "name", "target", "theme"]),
    });
    expect(addMoneyToPot.inputSchema).toMatchObject({
      properties: { id: { maxLength: 36 }, amount: { type: "integer", minimum: 1 } },
    });
    expect(deletePot.inputSchema).toMatchObject({ required: ["id"] });
  });

  it("list_pots returns the DTO plus currency and unit, with X-Via (US-39 AC2)", async () => {
    const fetchMock = stubFetch(answer(200, LIST));
    const result = await listPots.execute({});
    expect(result.structuredContent).toEqual({ ...LIST, currency: "USD", unit: "cents" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pots",
      expect.objectContaining({ method: "GET", headers: { "X-Via": "webmcp" } }),
    );
  });

  it("list_pots without a session is `unauthenticated`, with no data (US-39 AC4)", async () => {
    stubFetch(answer(401, { error: "unauthenticated", message: "Log in to continue" }));
    const result = await listPots.execute({});
    expect(result).toMatchObject({ isError: true, code: "unauthenticated" });
    expect(result.structuredContent).toBeUndefined();
  });

  it.each([
    [addPot, { name: "Pot", target: 1000, theme: "Green" }, "POST", "/api/pots", { pot: POT }],
    [
      editPot,
      { id: ID, name: "Pot", target: 1000, theme: "Green" },
      "PATCH",
      `/api/pots/${ID}`,
      { pot: POT },
    ],
    [
      addMoneyToPot,
      { id: ID, amount: 100 },
      "POST",
      `/api/pots/${ID}/deposit`,
      { pot: POT, balance: { current: 4900 } },
    ],
    [
      withdrawFromPot,
      { id: ID, amount: 100 },
      "POST",
      `/api/pots/${ID}/withdraw`,
      { pot: POT, balance: { current: 5100 } },
    ],
  ])(
    "%# a write sends its route with X-Via and the body without the id (US-40 AC3)",
    async (tool, input, method, path, dto) => {
      const fetchMock = stubFetch(
        answer(method === "POST" && path === "/api/pots" ? 201 : 200, dto),
      );
      const result = await tool.execute(input);
      expect(result.isError).toBeUndefined();
      expect(result.structuredContent).toEqual({ ...dto, currency: "USD", unit: "cents" });
      const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect(url).toBe(path);
      expect(init.method).toBe(method);
      expect(init.headers).toMatchObject({ "X-Via": "webmcp" });
      expect(JSON.parse(String(init.body))).not.toHaveProperty("id");
    },
  );

  it("edit_pot with only { id, name } is `validation` naming target and theme; no request (US-40 AC1)", async () => {
    const fetchMock = stubFetch(answer(200, { pot: POT }));
    const result = await editPot.execute({ id: ID, name: "Pot" });
    expect(result).toMatchObject({ isError: true, code: "validation" });
    expect(result.issues?.map((issue) => issue.path[0])).toEqual(["target", "theme"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("a server `exceeds_balance` comes back as `validation` with its issues, never a throw", async () => {
    const issues = [{ path: ["amount"], code: "exceeds_balance" }];
    stubFetch(answer(400, { error: "validation", message: "Invalid", issues }));
    const result = await addMoneyToPot.execute({ id: ID, amount: 999 });
    expect(result).toMatchObject({ isError: true, code: "validation", issues });
  });

  it("a write refused as cross-site (403) is `forbidden`, not `server_error` (write-path 7.6)", async () => {
    stubFetch(answer(403, { error: "forbidden", message: "This request must be same-origin" }));
    const result = await withdrawFromPot.execute({ id: ID, amount: 1 });
    expect(result).toMatchObject({ isError: true, code: "forbidden" });
  });

  it("delete_pot goes through the page's dialog: no page → `cancelled`, no request (ui-kit 2.3)", async () => {
    const fetchMock = stubFetch(answer(204, null));
    expect(await deletePot.execute({ id: ID })).toMatchObject({ isError: true, code: "cancelled" });
    const off = onDeleteRequest("pot", () => Promise.resolve("deleted"));
    expect((await deletePot.execute({ id: ID })).structuredContent).toEqual({ deleted: true });
    off();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
