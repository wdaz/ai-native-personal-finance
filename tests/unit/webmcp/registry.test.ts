import { describe, expect, it } from "vitest";
import { PAGE_TOOLS } from "@/src/webmcp/tools/registry";

const tools = Object.entries(PAGE_TOOLS).flatMap(([page, list]) =>
  list.map((tool) => ({ page, tool })),
);

describe("the tool registry (NFR-W3, SPEC-webmcp-tools §3–§4)", () => {
  it("Overview registers exactly the two Release 1 tools", () => {
    expect(PAGE_TOOLS.overview.map((tool) => tool.name)).toEqual([
      "get_balance",
      "get_overview_summary",
    ]);
  });

  it("Transactions registers exactly list_transactions (SPEC-transactions 2.14)", () => {
    expect(PAGE_TOOLS.transactions.map((tool) => tool.name)).toEqual(["list_transactions"]);
  });

  it("Pots registers exactly its six tools (SPEC-pots 2.13)", () => {
    expect(PAGE_TOOLS.pots.map((tool) => tool.name)).toEqual([
      "list_pots",
      "add_pot",
      "edit_pot",
      "delete_pot",
      "add_money_to_pot",
      "withdraw_from_pot",
    ]);
  });

  it("the five mutating Pots tools carry consequentialHint, and the five that return a name untrustedContentHint (H3)", () => {
    const annotations = Object.fromEntries(PAGE_TOOLS.pots.map((t) => [t.name, t.annotations]));
    for (const name of [
      "add_pot",
      "edit_pot",
      "delete_pot",
      "add_money_to_pot",
      "withdraw_from_pot",
    ]) {
      expect(annotations[name]).toMatchObject({ consequentialHint: true });
    }
    for (const name of [
      "list_pots",
      "add_pot",
      "edit_pot",
      "add_money_to_pot",
      "withdraw_from_pot",
    ]) {
      expect(annotations[name]).toMatchObject({ untrustedContentHint: true });
    }
    expect(annotations.delete_pot).not.toHaveProperty("untrustedContentHint");
    expect(annotations.list_pots).not.toHaveProperty("consequentialHint");
  });

  it("no name is registered on two pages", () => {
    const names = tools.map(({ tool }) => tool.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(tools)(
    "$page/$tool.name declares a valid name, description and annotations",
    ({ tool }) => {
      expect(tool.name).toMatch(/^[A-Za-z0-9_.-]{1,128}$/);
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeLessThanOrEqual(200);
      expect(tool.annotations).toBeDefined();
      expect(tool.inputSchema.type).toBe("object");
    },
  );

  it.each(tools.filter(({ tool }) => /^(get|list)_/.test(tool.name)))(
    "$tool.name is a read tool: readOnlyHint true (US-39 AC3)",
    ({ tool }) => {
      expect(tool.annotations?.readOnlyHint).toBe(true);
    },
  );

  it("a tool that returns user-entered text carries untrustedContentHint (US-39 AC3)", () => {
    expect(
      PAGE_TOOLS.overview.find((t) => t.name === "get_overview_summary")?.annotations,
    ).toMatchObject({ untrustedContentHint: true });
    expect(
      PAGE_TOOLS.transactions.find((t) => t.name === "list_transactions")?.annotations,
    ).toMatchObject({ readOnlyHint: true, untrustedContentHint: true });
    // SPEC-recurring-bills 2.12, §9 RB-Q5 (a): the bill names are transaction names.
    expect(
      PAGE_TOOLS.recurringBills.find((t) => t.name === "list_recurring_bills")?.annotations,
    ).toMatchObject({ readOnlyHint: true, untrustedContentHint: true });
  });
});
