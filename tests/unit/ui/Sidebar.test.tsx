// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/src/shared/copy";
import { TEST_IDS } from "@/src/shared/test-ids";
import { PAGE_NAMES } from "@/src/ui/nav";
import { Sidebar } from "@/src/ui/Sidebar";
import { SIDEBAR_STORAGE_KEY } from "@/src/ui/sidebar-state";

vi.mock("next/navigation", () => ({ usePathname: () => "/budgets" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe("Sidebar (SPEC-app-shell §2.2–2.3, US-35)", () => {
  it("starts expanded: the toggle is 'Minimize Menu', aria-expanded, nothing stored", () => {
    render(<Sidebar />);
    const toggle = screen.getByRole("button", { name: COPY.minimizeMenu });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(sessionStorage.getItem(SIDEBAR_STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId(TEST_IDS.sidebar).className).not.toMatch(/_collapsed_/);
  });

  it("US-35 AC1 the toggle collapses it: 'Expand Menu', aria-expanded false, pf.sidebar=collapsed", () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByRole("button", { name: COPY.minimizeMenu }));

    const toggle = screen.getByRole("button", { name: COPY.expandMenu });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(sessionStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("collapsed");
    expect(screen.getByTestId(TEST_IDS.sidebar).className).toMatch(/_collapsed_/);
  });

  it("US-35 AC1 and back: the key is removed", () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByRole("button", { name: COPY.minimizeMenu }));
    fireEvent.click(screen.getByRole("button", { name: COPY.expandMenu }));

    expect(
      screen.getByRole("button", { name: COPY.minimizeMenu }).getAttribute("aria-expanded"),
    ).toBe("true");
    expect(sessionStorage.getItem(SIDEBAR_STORAGE_KEY)).toBeNull();
  });

  it("US-35 AC1 restores the stored state without animating it (plan D5)", () => {
    sessionStorage.setItem(SIDEBAR_STORAGE_KEY, "collapsed");
    render(<Sidebar />);

    expect(screen.getByRole("button", { name: COPY.expandMenu })).toBeTruthy();
    expect(screen.getByTestId(TEST_IDS.sidebar).className).not.toMatch(/_animated_/);
  });

  it("animates a toggle the user made", () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByRole("button", { name: COPY.minimizeMenu }));
    expect(screen.getByTestId(TEST_IDS.sidebar).className).toMatch(/_animated_/);
  });

  it("US-35 AC2 collapsed, every page and 'Log out' keep their names", () => {
    sessionStorage.setItem(SIDEBAR_STORAGE_KEY, "collapsed");
    render(<Sidebar />);

    for (const name of Object.values(PAGE_NAMES)) {
      expect(screen.getByRole("link", { name })).toBeTruthy();
    }
    expect(screen.getByRole("button", { name: "Log out" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "finance" })).toBeTruthy();
  });

  it("SPEC-app-shell §2.7 marks the current page from the pathname", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: "Budgets" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Overview" }).getAttribute("aria-current")).toBeNull();
  });

  it("puts 'Log out' before the toggle in its footer (SPEC-app-shell §2.2)", () => {
    render(<Sidebar />);
    const logOut = screen.getByRole("button", { name: "Log out" });
    const toggle = screen.getByRole("button", { name: COPY.minimizeMenu });
    expect(logOut.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
