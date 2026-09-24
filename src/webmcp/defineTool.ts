import type { z } from "zod";
import { toolInputJsonSchema } from "@/src/shared/tool-schema";
import type { ToolAnnotations, ToolDefinition, ToolResult } from "./types";

/** SPEC-webmcp-tools §2.4: the WebMCP draft's tool-name charset. */
const TOOL_NAME_PATTERN = /^[A-Za-z0-9_.-]{1,128}$/;
const DESCRIPTION_MAX = 200;

export interface ToolExecuteArgs<TInput> {
  input: TInput;
  /**
   * Plan Q2: the installed runtime (`@mcp-b/webmcp-polyfill@5.1.0`) never hands a tool's
   * `execute` a real `AbortSignal` — only the registration signal and the caller's own
   * `options.signal` exist, and neither reaches this callback. Always `undefined` today;
   * typed optional so a future runtime that does forward one needs no signature change here.
   */
  signal: AbortSignal | undefined;
}

export interface DefineToolOptions<TInput> {
  name: string;
  title?: string;
  description: string;
  input: z.ZodType<TInput>;
  annotations: ToolAnnotations;
  execute(args: ToolExecuteArgs<TInput>): Promise<ToolResult>;
}

function toolError(code: string, message: string): ToolResult {
  return { isError: true, code, message, content: [{ type: "text", text: message }] };
}

/** Never throws (ADR-0004) — every issue, however unusual, becomes one readable line. */
function validationMessage(error: z.ZodError): string {
  const lines = error.issues.map(
    (issue) => `${issue.path.length > 0 ? issue.path.join(".") : "(root)"}: ${issue.message}`,
  );
  return lines.length > 0 ? lines.join("; ") : "Invalid input";
}

/**
 * Builds a registrable `ToolDefinition` from a Zod input schema and a friendlier
 * `execute({ input, signal })` (SPEC §2.4–2.5). Throws at definition time — when
 * `tools/<page>.ts` builds its registry array, not when a page registers or an agent calls it
 * — on a bad name, an over-length description, missing annotations, or an input schema
 * `toolInputJsonSchema` (T-04) rejects (empty object, or any string without `maxLength`).
 */
export function defineTool<TInput>(options: DefineToolOptions<TInput>): ToolDefinition {
  const { name, title, description, input, annotations, execute } = options;

  if (!TOOL_NAME_PATTERN.test(name)) {
    throw new Error(
      `Tool "${name}": name must be 1–128 characters, matching ${TOOL_NAME_PATTERN} (SPEC-webmcp-tools §2.4)`,
    );
  }
  if (description.length > DESCRIPTION_MAX) {
    throw new Error(
      `Tool "${name}": description is ${description.length} characters, over the ${DESCRIPTION_MAX}-character limit (SPEC-webmcp-tools §2.4)`,
    );
  }
  if (typeof annotations !== "object" || annotations === null) {
    throw new Error(`Tool "${name}": annotations are required (SPEC-webmcp-tools §2.4)`);
  }

  const inputSchema = toolInputJsonSchema(input);

  return {
    name,
    ...(title === undefined ? {} : { title }),
    description,
    inputSchema: inputSchema as ToolDefinition["inputSchema"],
    annotations,
    async execute(rawInput: unknown): Promise<ToolResult> {
      const parsed = input.safeParse(rawInput);
      if (!parsed.success) return toolError("validation", validationMessage(parsed.error));
      try {
        return await execute({ input: parsed.data, signal: undefined });
      } catch (error) {
        // A safety net, not the primary path: each tool's own execute maps its own HTTP
        // response codes (SPEC §2.5) — this only catches a tool author's own bug, so the
        // "execute ... never throws" contract (ADR-0004, NFR-W6) holds even then.
        console.error(`[webmcp] tool "${name}" execute threw`, error);
        return toolError("server_error", "Something went wrong");
      }
    },
  };
}
