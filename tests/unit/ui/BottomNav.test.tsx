// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BottomNav } from "@/src/ui/BottomNav";

vi.mock("next/navigation", () => ({ usePathname: () => "/pots/7" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

describe("BottomNav (SPEC-app-shell §2.4, §2.7)", () => {
  it("is the 'Main' navigation: five bottom-bar tabs, the current page marked", () => {
    render(<BottomNav />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("aria-label"))).toEqual([
      "Overview",
      "Transactions",
      "Budgets",
      "Pots",
      "Recurring Bills",
    ]);
    for (const link of links) expect(link.className).toMatch(/_bottom_/);
    expect(within(nav).getByRole("link", { name: "Pots" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });
});
