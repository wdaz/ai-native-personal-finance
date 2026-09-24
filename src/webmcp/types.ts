/**
 * Mirrors the WebMCP draft's `ModelContext`/tool-descriptor shape (SPEC-webmcp-tools §6), plus
 * the ambient `Document.modelContext` the DOM lib does not declare yet. Kept minimal and
 * hand-written rather than depending on `@mcp-b/webmcp-types` (ADR-0004 alternative C) — only
 * the members `adapter.ts` actually calls.
 */
import type { ErrorIssue } from "@/src/shared/schemas";

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
  untrustedContentHint?: boolean;
  consequentialHint?: boolean;
}

/** A tool's JSON Schema input, as `toolInputJsonSchema` (T-04) returns it. */
export interface ToolInputSchema {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

/** ADR-0004: a tool's result is structured content, success or error — never thrown. */
export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: unknown;
  isError?: boolean;
  code?: string;
  message?: string;
  /** A `validation` error's machine-readable issues (SPEC-webmcp-tools §2.6, plan Q2). */
  issues?: ErrorIssue[];
  /** Seconds — a `rate_limited` error's `Retry-After` (SPEC-auth §4). */
  retryAfter?: number;
}

/**
 * The descriptor `adapter.ts` registers with `document.modelContext` — the runtime's own
 * calling convention (one positional argument, the parsed input; SPEC-webmcp-tools §2.5,
 * plan Q2). `defineTool` builds this from a Zod schema and an `execute({ input, signal })`
 * function written against the friendlier shape tools are authored with.
 */
export interface ToolDefinition {
  name: string;
  title?: string;
  description: string;
  inputSchema: ToolInputSchema;
  annotations?: ToolAnnotations;
  execute(rawInput: unknown): Promise<ToolResult>;
}

/** The subset of the draft's `ModelContext` interface this adapter calls. */
export interface ModelContext extends EventTarget {
  registerTool(tool: ToolDefinition, options?: { signal?: AbortSignal }): Promise<void>;
  getTools(): Promise<unknown[]>;
}

/**
 * SPEC-webmcp-tools §2.2: `mode()` only ever reports one of these three — "checking" (the
 * indicator's own pre-resolution state, §2.7) is not a real mode, it is `WebMcpProvider`
 * reading `mode()` before detection has settled (plan D4).
 */
export type AdapterMode = "native" | "polyfill" | "unavailable";

declare global {
  interface Document {
    modelContext?: ModelContext;
  }

  interface Window {
    /** SPEC-webmcp-tools §6 — set only when `NEXT_PUBLIC_APP_ENV === "test"` (adapter.ts). */
    __pf?: {
      webmcp?: { mode: () => AdapterMode | null; tools: () => string[] };
      [key: string]: unknown;
    };
  }
}
