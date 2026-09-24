// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WebMcpProvider } from "@/src/webmcp/WebMcpProvider";
import { useWebMcpStatus } from "@/src/webmcp/status-context";

type Listener = (status: { mode: string | null; count: number }) => void;
let listeners: Set<Listener>;
const getModelContext = vi.fn(async () => null);

vi.mock("@/src/webmcp/adapter", () => ({
  getModelContext: (...args: unknown[]) => getModelContext(...(args as [])),
  onStatus: (listener: Listener) => {
    listeners.add(listener);
    listener({ mode: null, count: 0 });
    return () => listeners.delete(listener);
  },
}));

function emit(status: { mode: string | null; count: number }) {
  for (const listener of listeners) listener(status);
}

function Probe() {
  const status = useWebMcpStatus();
  return <output>{`${status.mode}:${status.count}`}</output>;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WebMcpProvider (SPEC-webmcp-tools §2.3)", () => {
  it('seeds "checking" (null mode, 0 tools) before detection settles', () => {
    listeners = new Set();
    render(
      <WebMcpProvider>
        <Probe />
      </WebMcpProvider>,
    );
    expect(screen.getByRole("status").textContent).toBe("checking:0");
    expect(getModelContext).toHaveBeenCalledTimes(1);
  });

  it("forwards every onStatus update to its context value", () => {
    listeners = new Set();
    render(
      <WebMcpProvider>
        <Probe />
      </WebMcpProvider>,
    );

    act(() => emit({ mode: "polyfill", count: 2 }));
    expect(screen.getByRole("status").textContent).toBe("polyfill:2");

    act(() => emit({ mode: "unavailable", count: 0 }));
    expect(screen.getByRole("status").textContent).toBe("unavailable:0");
  });

  it("unsubscribes on unmount — a later status change no longer reaches a re-mounted probe", () => {
    listeners = new Set();
    const { unmount } = render(
      <WebMcpProvider>
        <Probe />
      </WebMcpProvider>,
    );
    unmount();

    expect(listeners.size).toBe(0);
  });
});
