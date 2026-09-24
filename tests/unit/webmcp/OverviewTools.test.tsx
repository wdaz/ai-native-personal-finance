// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
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
  it("registers the Overview registry on mount, unregisters on unmount", () => {
    const { unmount } = render(<OverviewTools />);
    expect(adapter.register).toHaveBeenCalledTimes(1);
    expect(adapter.register).toHaveBeenCalledWith(overviewTools);
    expect(adapter.unregisterAll).not.toHaveBeenCalled();
    unmount();
    expect(adapter.unregisterAll).toHaveBeenCalledTimes(1);
  });
});
