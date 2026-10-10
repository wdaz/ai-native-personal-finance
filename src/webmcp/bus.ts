import type { WriteAnswer } from "@/src/shared/write-feedback";
import { DEFAULT_TOOL_MESSAGE, toolError } from "./tool-result";
import type { ToolResult } from "./types";

/**
 * SPEC-ui-kit 2.3 (ADR-0004's delete flow; SPEC-webmcp-tools §4): the in-page bus between the
 * delete tools and the page's `ConfirmDeleteDialog`. A tool calls `requestDelete`; the page,
 * subscribed with `onDeleteRequest`, opens the same dialog a person's "Delete" opens, and the
 * tool's result is the dialog's final outcome. Nothing reaches the server before the person
 * confirms (R-16). Imports `src/shared` only; the page (`app/`) joins it to the dialog.
 */
export type DeleteKind = "budget" | "pot";

export type DeleteResult =
  | "deleted"
  | "cancelled"
  | "busy"
  | "not_found"
  | "conflict"
  | "unauthenticated"
  // Only after a confirm whose dialog is no longer there to stay open in (2.3 item 4).
  | "rate_limited"
  | "forbidden"
  | "validation"
  | "server_error";

export type DeleteHandler = (id: string, signal?: AbortSignal) => Promise<DeleteResult>;

/** One handler per kind, in memory; the latest subscription wins (2.3 item 1). */
const handlers = new Map<DeleteKind, DeleteHandler>();

/** The page subscribes on mount; the function it gets back removes only its own handler. */
export function onDeleteRequest(kind: DeleteKind, handler: DeleteHandler): () => void {
  handlers.set(kind, handler);
  return () => {
    if (handlers.get(kind) === handler) handlers.delete(kind);
  };
}

/** Whether a page has subscribed for `kind` — a request without one is `cancelled` at once. */
export const hasDeleteHandler = (kind: DeleteKind): boolean => handlers.has(kind);

/**
 * Called by `delete_budget` / `delete_pot`. A signal already aborted, or no handler, is
 * `cancelled` at once, with nothing shown (2.3 items 1 and 6); otherwise the page's answer.
 */
export async function requestDelete(
  kind: DeleteKind,
  id: string,
  signal?: AbortSignal,
): Promise<DeleteResult> {
  if (signal?.aborted) return "cancelled";
  const handler = handlers.get(kind);
  if (handler === undefined) return "cancelled";
  return handler(id, signal);
}

/** A confirmed delete's answer as the bus reports it (2.3 item 4; `write-path.md` 2.11 (4)). */
export function deleteResultOf(answer: WriteAnswer<unknown>): DeleteResult {
  switch (answer.kind) {
    case "ok":
      return "deleted";
    case "gone":
      return "not_found";
    case "reset":
      return "conflict";
    case "session":
      return "unauthenticated";
    case "validation":
      return "validation";
    case "failed":
      return answer.code;
  }
}

/** Read by agents: why a delete request was `cancelled` before any dialog (2.3 item 1). */
export const NO_DIALOG_MESSAGE = "The page's delete dialog is not available; nothing was deleted";

/**
 * 2.3 item 7: a `DeleteResult` as the tool's answer — `{ deleted: true }` (`write-path.md` §6),
 * or the error code with its agent-read fallback, `busy` included.
 */
export function deleteToolResult(result: DeleteResult, noDialog = false): ToolResult {
  if (result === "deleted") {
    const structured = { deleted: true };
    return {
      content: [{ type: "text", text: JSON.stringify(structured) }],
      structuredContent: structured,
    };
  }
  if (result === "cancelled" && noDialog) return toolError("cancelled", NO_DIALOG_MESSAGE);
  return toolError(result, DEFAULT_TOOL_MESSAGE[result]);
}

/** What `delete_budget` and `delete_pot` run (T-24, T-26): the request and its answer. */
export async function runDeleteTool(
  kind: DeleteKind,
  id: string,
  signal?: AbortSignal,
): Promise<ToolResult> {
  const noDialog = !hasDeleteHandler(kind) && !signal?.aborted;
  return deleteToolResult(await requestDelete(kind, id, signal), noDialog);
}
