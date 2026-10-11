"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { ToolDefinition } from "../types";
import { WebMcpTools } from "../WebMcpTools";

/**
 * The four tools whose success is followed with `router.refresh()` (2.8). Named here, not
 * imported from `./pots`, so this first-load module does not pull in the tools and their Zod
 * schemas (TD-21); `PotsTools.test.tsx` checks each name against the real tools.
 */
const REFRESHING: ReadonlySet<string> = new Set([
  "add_pot",
  "edit_pot",
  "add_money_to_pot",
  "withdraw_from_pot",
]);

/**
 * SPEC-pots 2.8, 2.13: the Pots page's tools. A tool's `execute` is a module-level function and
 * cannot call a hook, so the refresh after an agent's write is added here, where `useRouter` runs:
 * the four write tools (`add_pot`, `edit_pot`, `add_money_to_pot`, `withdraw_from_pot`) call
 * `router.refresh()` after a result without `isError` and return it unchanged, so the page shows the
 * agent's change with no reload (US-40 AC3). `list_pots` and `delete_pot` pass as they are —
 * the delete refreshes through the page's own dialog. The loader is memoised per router, so
 * `WebMcpTools`' effect does not register again on every render; the registry keeps the unwrapped
 * definitions. The tools are imported from their own module, after hydration (`WebMcpTools`, TD-21).
 */
export function withRefresh(
  tools: readonly ToolDefinition[],
  refresh: () => void,
): ToolDefinition[] {
  return tools.map((tool) =>
    REFRESHING.has(tool.name)
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
  const load = useCallback(
    () => import("./pots").then((m) => withRefresh(m.potsTools, () => router.refresh())),
    [router],
  );
  return <WebMcpTools load={load} />;
}
