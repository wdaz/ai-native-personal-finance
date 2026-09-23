// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PageHeader } from "@/src/ui/PageHeader";

afterEach(cleanup);

describe("PageHeader (SPEC-app-shell §2.4–2.5)", () => {
  it("renders the page name as the page's only <h1>", () => {
    render(<PageHeader title="Recurring Bills" />);
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual([
      "Recurring Bills",
    ]);
  });

  it("holds the compact 'Log out' icon button the tablet and phone layouts show (§2.4)", () => {
    render(<PageHeader title="Pots" />);
    expect(screen.getByRole("button", { name: "Log out" })).toBeTruthy();
  });
});
