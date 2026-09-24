import { expect, type Page } from "@playwright/test";
import { WebMcpModeSchema } from "@/src/shared/schemas";
import type { ToolResult } from "@/src/webmcp/types";

/**
 * The mode this Playwright run expects the app under test to have been *built* with.
 * `WEBMCP_MODE` is inlined at build time (`next.config.ts`), so the spec cannot switch it; it
 * can only say which build it expects and check (`webmcp*.spec.ts`, plan D8). Empty or unset is
 * "polyfill", as everywhere else.
 */
export const RUN_MODE = WebMcpModeSchema.catch("polyfill").parse(
  process.env.WEBMCP_MODE || undefined,
);

/** The runtime's calling convention, plan Finding F2 (`document.modelContext`, Chromium extension). */
type RegisteredTool = { name: string } & Record<string, unknown>;
type ChromeModelContext = {
  getTools(): Promise<RegisteredTool[]>;
  executeTool(tool: RegisteredTool, inputJson: string): Promise<string>;
};

export interface ListedTool {
  name: string;
  title: string;
  description: string;
  inputSchema: { type?: string; properties?: Record<string, unknown> } & Record<string, unknown>;
  annotations: Record<string, boolean>;
}

/** Waits for the adapter's readiness signal (US-38 AC3, R-13). */
export async function expectToolsReady(page: Page): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-webmcp", "ready");
}

/**
 * `getTools()` entries carry `window` and `origin`, which cannot be returned across
 * `page.evaluate`, so each is projected to plain data inside the page.
 */
export async function listTools(page: Page): Promise<ListedTool[]> {
  return page.evaluate(async () => {
    const context = document.modelContext as unknown as ChromeModelContext;
    const tools = await context.getTools();
    return tools.map((tool) => ({
      name: tool.name,
      title: tool.title as string,
      description: tool.description as string,
      inputSchema: tool.inputSchema as ListedTool["inputSchema"],
      annotations: (tool.annotations ?? {}) as Record<string, boolean>,
    }));
  });
}

/** Calls a tool the way a consumer does: find it in `getTools()`, pass a JSON string, parse the JSON string back. */
export async function callTool(page: Page, name: string, input: unknown = {}): Promise<ToolResult> {
  const raw = await page.evaluate(
    async ({ name: toolName, json }) => {
      const context = document.modelContext as unknown as ChromeModelContext;
      const tool = (await context.getTools()).find((candidate) => candidate.name === toolName);
      if (!tool) throw new Error(`no registered tool named ${toolName}`);
      return context.executeTool(tool, json);
    },
    { name, json: JSON.stringify(input) },
  );
  return JSON.parse(raw) as ToolResult;
}
