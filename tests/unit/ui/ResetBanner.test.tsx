// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/src/shared/copy";
import { BANNER_STORAGE_KEY } from "@/src/ui/banner-state";
import { ResetBanner } from "@/src/ui/ResetBanner";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

const AT = "2026-09-12T03:00:00.000Z";

describe("ResetBanner (SPEC-app-shell §2.6, US-37 AC2)", () => {
  it("states the interval and the last reset as a status region", () => {
    render(<ResetBanner lastResetAt={AT} resetIntervalDays={10} />);
    expect(screen.getByRole("status").textContent).toContain(
      "Demo data resets every 10 days · last reset 12 Sep 2026",
    );
  });

  it("writes 1 day in the singular", () => {
    render(<ResetBanner lastResetAt={AT} resetIntervalDays={1} />);
    expect(screen.getByRole("status").textContent).toContain("Demo data resets every 1 day ·");
  });

  it("dismiss hides it, stores the dismissal and hands focus on", () => {
    const onDismissed = vi.fn();
    render(<ResetBanner lastResetAt={AT} resetIntervalDays={10} onDismissed={onDismissed} />);
    fireEvent.click(screen.getByRole("button", { name: COPY.dismissNotice }));
    expect(screen.queryByRole("status")).toBeNull();
    expect(sessionStorage.getItem(BANNER_STORAGE_KEY)).toBe("dismissed");
    expect(onDismissed).toHaveBeenCalledTimes(1);
  });

  it("stays hidden when this tab dismissed it before", () => {
    sessionStorage.setItem(BANNER_STORAGE_KEY, "dismissed");
    render(<ResetBanner lastResetAt={AT} resetIntervalDays={10} />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("hides its icon from assistive technology — the button carries the name", () => {
    render(<ResetBanner lastResetAt={AT} resetIntervalDays={10} />);
    const button = screen.getByRole("button", { name: COPY.dismissNotice });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});
