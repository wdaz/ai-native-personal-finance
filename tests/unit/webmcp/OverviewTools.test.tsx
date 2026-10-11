// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as adapter from "@/src/webmcp/adapter";
import { OverviewTools } from "@/src/webmcp/tools/OverviewTools";
import { overviewTools } from "@/src/webmcp/tools/overview";

vi.mock("@/src/webmcp/adapter", () => ({
  register: vi.fn(async () => undefined),
  unregisterAll: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("<OverviewTools /> (plan D1)", () => {
  it("registers the Overview registry on mount, unregisters on unmount", async () => {
    const { unmount } = render(<OverviewTools />);
    await waitFor(() => expect(adapter.register).toHaveBeenCalledTimes(1));
    expect(adapter.register).toHaveBeenCalledWith(overviewTools);
    expect(adapter.unregisterAll).not.toHaveBeenCalled();
    unmount();
    expect(adapter.unregisterAll).toHaveBeenCalledTimes(1);
  });

  it("a page left before its tools have loaded registers none (TD-21: the tools load lazily)", async () => {
    const { unmount } = render(<OverviewTools />);
    unmount();
    expect(adapter.unregisterAll).toHaveBeenCalledTimes(1);
    await import("@/src/webmcp/tools/overview");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(adapter.register).not.toHaveBeenCalled();
  });
});
