// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as adapter from "@/src/webmcp/adapter";
import { PotsTools, withRefresh } from "@/src/webmcp/tools/PotsTools";
import { potsTools } from "@/src/webmcp/tools/pots";
import type { ToolDefinition, ToolResult } from "@/src/webmcp/types";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => router }));
const router = { refresh };

vi.mock("@/src/webmcp/adapter", () => ({
  register: vi.fn(async () => undefined),
  unregisterAll: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const OK: ToolResult = { content: [{ type: "text", text: "{}" }], structuredContent: {} };
const ERROR: ToolResult = {
  isError: true,
  code: "validation",
  content: [{ type: "text", text: "x" }],
};

const stubbed = (result: ToolResult): ToolDefinition[] =>
  potsTools.map((tool) => ({ ...tool, execute: vi.fn(async () => result) }));

describe("<PotsTools /> (SPEC-pots 2.8, 2.13; US-40 AC3)", () => {
  it.each(["add_pot", "edit_pot", "add_money_to_pot", "withdraw_from_pot"])(
    "a successful %s calls router.refresh() once and returns the result unchanged",
    async (name) => {
      const onRefresh = vi.fn();
      const tool = withRefresh(stubbed(OK), onRefresh).find((t) => t.name === name);
      expect(await tool?.execute({})).toBe(OK);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    },
  );

  it("an isError result does not refresh", async () => {
    const onRefresh = vi.fn();
    for (const tool of withRefresh(stubbed(ERROR), onRefresh)) await tool.execute({});
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("list_pots and delete_pot are passed as they are, and never refresh", async () => {
    const onRefresh = vi.fn();
    const source = stubbed(OK);
    const wrapped = withRefresh(source, onRefresh);
    for (const name of ["list_pots", "delete_pot"]) {
      const tool = wrapped.find((t) => t.name === name);
      expect(tool).toBe(source.find((t) => t.name === name));
      await tool?.execute({});
    }
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("registers the six tools once; a re-render hands WebMcpTools the same array", () => {
    const { rerender, unmount } = render(<PotsTools />);
    rerender(<PotsTools />);
    expect(adapter.register).toHaveBeenCalledTimes(1);
    const registered = vi.mocked(adapter.register).mock.calls[0]?.[0] ?? [];
    expect(registered.map((t) => t.name)).toEqual(potsTools.map((t) => t.name));
    unmount();
    expect(adapter.unregisterAll).toHaveBeenCalledTimes(1);
  });
});
