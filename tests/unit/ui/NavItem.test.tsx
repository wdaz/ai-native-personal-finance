// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NavBudgetsIcon } from "@/src/ui/icons/NavBudgetsIcon";
import { NavItem } from "@/src/ui/NavItem";

// next/link needs Next's router outside a Next build; a plain anchor is what it renders (D16).
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

const budgets = { href: "/budgets", label: "Budgets", Icon: NavBudgetsIcon };

describe("NavItem (SPEC-app-shell §2.2, §2.4, §2.7)", () => {
  it("marks the current page with aria-current and the active class", () => {
    render(<NavItem {...budgets} active variant="sidebar" />);
    const link = screen.getByRole("link", { name: "Budgets" });
    expect(link.getAttribute("href")).toBe("/budgets");
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.className).toMatch(/_active_/);
  });

  it("leaves any other page without aria-current or the active class", () => {
    render(<NavItem {...budgets} active={false} variant="sidebar" />);
    const link = screen.getByRole("link", { name: "Budgets" });
    expect(link.getAttribute("aria-current")).toBeNull();
    expect(link.className).not.toMatch(/_active_/);
  });

  it("keeps its name when collapsed and offers the label as a tooltip (US-35 AC2)", () => {
    render(<NavItem {...budgets} active={false} variant="sidebar" collapsed />);
    const link = screen.getByRole("link", { name: "Budgets" });
    expect(link.getAttribute("title")).toBe("Budgets");
    expect(link.className).toMatch(/_collapsed_/);
  });

  it("has no tooltip while expanded", () => {
    render(<NavItem {...budgets} active={false} variant="sidebar" />);
    expect(screen.getByRole("link", { name: "Budgets" }).getAttribute("title")).toBeNull();
  });

  it("styles itself as a bottom-bar tab in the bottom bar", () => {
    render(<NavItem {...budgets} active={false} variant="bottom" />);
    const link = screen.getByRole("link", { name: "Budgets" });
    expect(link.className).toMatch(/_bottom_/);
    expect(link.className).not.toMatch(/_sidebar_/);
  });

  it("hides its icon from assistive technology — the link carries the name", () => {
    const { container } = render(<NavItem {...budgets} active={false} variant="sidebar" />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});
