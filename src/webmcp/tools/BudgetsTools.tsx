"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { ToolDefinition } from "../types";
import { WebMcpTools } from "../WebMcpTools";
import { PAGE_TOOLS } from "./registry";

/** The tools that call the API themselves and so refresh the page after a success (2.13). */
const REFRESHING = new Set(["add_budget", "edit_budget"]);

/**
 * SPEC-budgets 2.13 (US-40 AC3: "the same state as a user action"): the page's tools, with the
 * `execute` of `add_budget` and `edit_budget` wrapped so that after a result without `isError`
 * the page reads the database again (`router.refresh()`), and the result is returned unchanged.
 * `list_budgets` and `delete_budget` pass as they are (a confirmed delete is the page's own write,
 * which refreshes). Built once per router, so `WebMcpTools`' effect does not register again on
 * every render; the registry keeps the unwrapped definitions.
 */
export function BudgetsTools() {
  const router = useRouter();
  const tools = useMemo(() => withRefresh(PAGE_TOOLS.budgets, () => router.refresh()), [router]);
  return <WebMcpTools tools={tools} />;
}

export function withRefresh(tools: ToolDefinition[], refresh: () => void): ToolDefinition[] {
  return tools.map((tool) =>
    REFRESHING.has(tool.name)
      ? {
          ...tool,
          async execute(input: unknown) {
            const result = await tool.execute(input);
            if (result.isError !== true) refresh();
            return result;
          },
        }
      : tool,
  );
}
