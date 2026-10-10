"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { ToolDefinition } from "../types";
import { WebMcpTools } from "../WebMcpTools";
import { POT_WRITE_TOOL_NAMES } from "./pots";
import { PAGE_TOOLS } from "./registry";

/**
 * SPEC-pots 2.8, 2.13: the Pots page's tools. A tool's `execute` is a module-level function and
 * cannot call a hook, so the refresh after an agent's write is added here, where `useRouter` runs:
 * the four write tools (`add_pot`, `edit_pot`, `add_money_to_pot`, `withdraw_from_pot`) call
 * `router.refresh()` after a result without `isError` and return it unchanged, so the page shows the
 * agent's change with no reload (US-40 AC3). `list_pots` and `delete_pot` pass as they are —
 * the delete refreshes through the page's own dialog. Memoised per router, so `WebMcpTools`'
 * effect does not register again on every render; the registry keeps the unwrapped definitions.
 */
export function withRefresh(
  tools: readonly ToolDefinition[],
  refresh: () => void,
): ToolDefinition[] {
  return tools.map((tool) =>
    POT_WRITE_TOOL_NAMES.has(tool.name)
      ? {
          ...tool,
          async execute(rawInput: unknown) {
            const result = await tool.execute(rawInput);
            if (result.isError !== true) refresh();
            return result;
          },
        }
      : tool,
  );
}

export function PotsTools() {
  const router = useRouter();
  const tools = useMemo(() => withRefresh(PAGE_TOOLS.pots, () => router.refresh()), [router]);
  return <WebMcpTools tools={tools} />;
}
