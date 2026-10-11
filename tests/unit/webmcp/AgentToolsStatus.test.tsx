// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { COPY } from "@/src/shared/copy";
import { AgentToolsStatus } from "@/src/webmcp/AgentToolsStatus";
import { WebMcpStatusContext, type WebMcpStatus } from "@/src/webmcp/status-context";

function renderWithStatus(status: WebMcpStatus, variant: "sidebar" | "rail" | "compact") {
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

  it("rail variant (minimised sidebar): the icon alone, the text only as the accessible name", () => {
    renderWithStatus({ mode: "polyfill", count: 3 }, "rail");
    const row = screen.getByRole("status", { name: COPY.agentToolsPolyfill(3) });
    expect(row.textContent).toBe("");
    expect(row.querySelector("svg")).not.toBeNull();
  });

  it.each<[WebMcpStatus, string, string]>([
    [{ mode: "polyfill", count: 3 }, COPY.agentToolsPolyfill(3), "3"],
    [{ mode: "native", count: 0 }, COPY.agentToolsNative(0), "0"],
    [{ mode: "checking", count: 0 }, COPY.agentToolsChecking, ""],
    [{ mode: "unavailable", count: 0 }, COPY.agentToolsUnavailable, ""],
  ])(
    "compact variant (changelog §37): the icon and the tool count — none while checking or unavailable: %j",
    (status, name, count) => {
      renderWithStatus(status, "compact");
      const indicator = screen.getByRole("status", { name });
      expect(indicator.textContent).toBe(count);
      expect(indicator.querySelector("svg")).not.toBeNull();
      expect(indicator.getAttribute("tabindex")).toBe("0");
    },
  );

  it("with a tooltip component, the indicator is handed it with the full text and `always`", () => {
    render(
      <AgentToolsStatus
        variant="compact"
        Tip={({ text, always, children, role }) => (
          <div data-testid="tip" data-text={text} data-always={String(always)} role={role}>
            {children}
          </div>
        )}
      />,
    );
    const tip = screen.getByTestId("tip");
    expect(tip.getAttribute("data-text")).toBe(COPY.agentToolsChecking);
    expect(tip.getAttribute("data-always")).toBe("true");
  });

  it("without a provider, the default context is “checking” — never a crash", () => {
    render(<AgentToolsStatus variant="sidebar" />);
    expect(screen.getByRole("status").textContent).toBe(COPY.agentToolsChecking);
  });
});
