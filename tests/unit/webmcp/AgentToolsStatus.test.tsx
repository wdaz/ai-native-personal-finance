// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { COPY } from "@/src/shared/copy";
import { AgentToolsStatus } from "@/src/webmcp/AgentToolsStatus";
import { WebMcpStatusContext, type WebMcpStatus } from "@/src/webmcp/status-context";

function renderWithStatus(status: WebMcpStatus, variant: "sidebar" | "compact") {
  return render(
    <WebMcpStatusContext value={status}>
      <AgentToolsStatus variant={variant} />
    </WebMcpStatusContext>,
  );
}

afterEach(cleanup);

describe("AgentToolsStatus (SPEC-webmcp-tools §2.7, US-41)", () => {
  it.each<[WebMcpStatus, string]>([
    [{ mode: "checking", count: 0 }, COPY.agentToolsChecking],
    [{ mode: "native", count: 2 }, COPY.agentToolsNative(2)],
    [{ mode: "polyfill", count: 0 }, COPY.agentToolsPolyfill(0)],
    [{ mode: "unavailable", count: 0 }, COPY.agentToolsUnavailable],
  ])("Review Focus 5 — sidebar variant's accessible text tracks each state: %j", (status, text) => {
    renderWithStatus(status, "sidebar");
    expect(screen.getByRole("status", { name: text }).textContent).toBe(text);
  });

  it.each<[WebMcpStatus, string]>([
    [{ mode: "checking", count: 0 }, COPY.agentToolsChecking],
    [{ mode: "polyfill", count: 3 }, COPY.agentToolsPolyfill(3)],
  ])("compact variant carries the same text only as its accessible name: %j", (status, text) => {
    renderWithStatus(status, "compact");
    const dot = screen.getByRole("status", { name: text });
    expect(dot.textContent).toBe("");
  });

  it("every state's title matches SPEC-webmcp-tools §2.7's own table, verbatim", () => {
    const cases: Array<[WebMcpStatus["mode"], string]> = [
      ["checking", "Detecting WebMCP support"],
      ["native", "WebMCP is supported natively by this browser"],
      ["polyfill", "Provided by a polyfill; no built-in agent yet"],
      ["unavailable", "WebMCP is disabled or could not load"],
    ];
    for (const [mode, title] of cases) {
      const { unmount } = renderWithStatus({ mode, count: 0 }, "sidebar");
      expect(screen.getByRole("status").getAttribute("title")).toBe(title);
      unmount();
    }
  });

  it("without a provider, the default context is “checking” — never a crash", () => {
    render(<AgentToolsStatus variant="sidebar" />);
    expect(screen.getByRole("status").textContent).toBe(COPY.agentToolsChecking);
  });
});
