import type { ApiOutcome } from "@/src/shared/api-client";
import type { ErrorIssue } from "@/src/shared/schemas";
import type { ToolResult } from "./types";

/** ADR-0004 / SPEC-webmcp-tools §2.5: every way a tool call can end short of success. */
export const TOOL_ERROR_CODES = [
  "validation",
  "unauthenticated",
  "not_found",
  "conflict",
  "rate_limited",
  "cancelled",
  // SPEC-ui-kit 2.3 item 2 (ADR-0004, US-40 AC2): a delete tool called while the page is busy.
  "busy",
  // SPEC-write-path 2.11 (4), SPEC-webmcp-tools §2.5 (v1.0.7): a write refused as cross-site.
  "forbidden",
  "server_error",
] as const;
export type ToolErrorCode = (typeof TOOL_ERROR_CODES)[number];

/** Read by agents, not users: the fallback when the API's envelope carries no message. */
export const DEFAULT_TOOL_MESSAGE: Record<ToolErrorCode, string> = {
  validation: "Invalid input",
  unauthenticated: "Log in to continue",
  not_found: "Not found",
  conflict: "The data changed; try again",
  rate_limited: "Too many requests; try again later",
  cancelled: "The request was cancelled",
  // Never an API answer (SPEC-ui-kit 2.3 item 7, hand-off H13 (1)): the page's own state.
  busy: "The page has a dialog open or a change in progress; try again when it is done",
  // The 403 body's own message (SPEC-write-path 2.6), so no new text (SPEC-webmcp-tools §2.5).
  forbidden: "This request must be same-origin",
  server_error: "Something went wrong",
};

/**
 * SPEC-webmcp-tools §2.6: the API DTO unchanged (integer cents) plus `{ currency, unit }` at
 * the top level, mirrored as text so a consumer that reads only `content` still gets it.
 */
export function toolSuccess(data: Record<string, unknown>): ToolResult {
  const structured = { ...data, currency: "USD", unit: "cents" };
  return {
    content: [{ type: "text", text: JSON.stringify(structured) }],
    structuredContent: structured,
  };
}

export function toolError(
  code: ToolErrorCode,
  message: string,
  extra: { issues?: ErrorIssue[] | undefined; retryAfter?: number | undefined } = {},
): ToolResult {
  return {
    isError: true,
    code,
    message,
    content: [{ type: "text", text: message }],
    ...(extra.issues === undefined ? {} : { issues: extra.issues }),
    ...(extra.retryAfter === undefined ? {} : { retryAfter: extra.retryAfter }),
  };
}

function codeForStatus(status: number): ToolErrorCode {
  switch (status) {
    // 415: a refused content type answers `validation` with its `issues` (SPEC-write-path 2.6).
    case 400:
    case 415:
      return "validation";
    case 401:
      return "unauthenticated";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 429:
      return "rate_limited";
    default:
      return "server_error";
  }
}

/** SPEC-webmcp-tools §2.5's mapping; the result is always a value, never a throw. */
export function fromApiOutcome<T>(
  outcome: ApiOutcome<T>,
  onSuccess: (data: T) => ToolResult,
): ToolResult {
  if (outcome.ok) return onSuccess(outcome.data);
  switch (outcome.kind) {
    case "aborted":
      return toolError("cancelled", DEFAULT_TOOL_MESSAGE.cancelled);
    case "network":
    case "invalid_response":
      return toolError("server_error", DEFAULT_TOOL_MESSAGE.server_error);
    case "http": {
      const code = codeForStatus(outcome.status);
      return toolError(code, outcome.error?.message ?? DEFAULT_TOOL_MESSAGE[code], {
        issues: outcome.error?.issues,
        retryAfter: outcome.error?.retryAfter,
      });
    }
  }
}
