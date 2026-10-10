// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as adapter from "@/src/webmcp/adapter";
import { budgetsTools } from "@/src/webmcp/tools/budgets";
import { BudgetsTools, withRefresh } from "@/src/webmcp/tools/BudgetsTools";
import type { ToolDefinition, ToolResult } from "@/src/webmcp/types";

const refresh = vi.fn();
const router = { refresh };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/src/webmcp/adapter", () => ({
  register: vi.fn(async () => undefined),
  unregisterAll: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const tool = (name: string, result: ToolResult): ToolDefinition => ({
  name,
  description: name,
  inputSchema: { type: "object", properties: {} },
  annotations: {},
  execute: vi.fn(() => Promise.resolve(result)),
});
const OK: ToolResult = { content: [{ type: "text", text: "{}" }] };
const ERROR: ToolResult = { content: [{ type: "text", text: "no" }], isError: true };

describe("<BudgetsTools /> (SPEC-budgets 2.13; US-40 AC3)", () => {
  it.each(["add_budget", "edit_budget"])(
    "%s refreshes the page once after a success and returns the result unchanged",
    async (name) => {
      const onRefresh = vi.fn();
      const [wrapped] = withRefresh([tool(name, OK)], onRefresh);
      await expect(wrapped?.execute({})).resolves.toBe(OK);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["add_budget", "edit_budget"])("%s does not refresh after an error", async (name) => {
    const onRefresh = vi.fn();
    const [wrapped] = withRefresh([tool(name, ERROR)], onRefresh);
    await expect(wrapped?.execute({})).resolves.toBe(ERROR);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("list_budgets and delete_budget pass through as they are", () => {
    const list = tool("list_budgets", OK);
    const remove = tool("delete_budget", OK);
    expect(withRefresh([list, remove], vi.fn())).toEqual([list, remove]);
    const [sameList, sameRemove] = withRefresh([list, remove], vi.fn());
    expect(sameList).toBe(list);
    expect(sameRemove).toBe(remove);
  });

  it("registers the four tools once, and not again on a re-render", () => {
    const { rerender, unmount } = render(<BudgetsTools />);
    rerender(<BudgetsTools />);
    expect(adapter.register).toHaveBeenCalledTimes(1);
    const registered = vi.mocked(adapter.register).mock.calls[0]?.[0] as ToolDefinition[];
    expect(registered.map((t) => t.name)).toEqual(budgetsTools.map((t) => t.name));
    unmount();
    expect(adapter.unregisterAll).toHaveBeenCalledTimes(1);
  });
});
