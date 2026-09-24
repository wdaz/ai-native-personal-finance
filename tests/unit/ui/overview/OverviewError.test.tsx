// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/src/shared/copy";
import { OverviewError } from "@/src/ui/overview/OverviewError";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

afterEach(cleanup);

describe("OverviewError (SPEC-overview §2.8, T-10 plan Review Focus 4)", () => {
  it("shows the message and calls router.refresh() on Retry", () => {
    render(<OverviewError />);
    expect(screen.getByText(COPY.overviewLoadError)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: COPY.retry }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
