// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/src/shared/copy";
import { ActionMenu } from "@/src/ui/ActionMenu";

afterEach(cleanup);

function setup() {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <>
      <ActionMenu
        label={COPY.potOptions}
        name="Savings"
        items={[
          { label: COPY.editPot, onSelect: onEdit },
          { label: COPY.deletePot, onSelect: onDelete, destructive: true },
        ]}
      />
      <button type="button">outside</button>
    </>,
  );
  const trigger = screen.getByRole("button", { name: "Pot options: Savings" });
  return { trigger, onEdit, onDelete };
}

const items = () => screen.getAllByRole("menuitem");

describe("ActionMenu (SPEC-ui-kit 2.4; US-15 AC1, US-17 AC1, US-22 AC1, US-24 AC1)", () => {
  it("is a menu button named '{label}: {name}', collapsed, with no menu in the page", () => {
    const { trigger } = setup();
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBeNull();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("a click opens it on the first item; the menu is labelled by the trigger and controlled by it", () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    const menu = screen.getByRole("menu", { name: "Pot options: Savings" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(menu.id);
    expect(items().map((i) => i.textContent)).toEqual(["Edit Pot", "Delete Pot"]);
    expect(document.activeElement).toBe(items()[0]);
  });

  it.each([
    ["Enter", 0],
    [" ", 0],
    ["ArrowDown", 0],
    ["ArrowUp", 1],
  ])("%j on the trigger opens it on item %i", (key, index) => {
    const { trigger } = setup();
    fireEvent.keyDown(trigger, { key });
    expect(document.activeElement).toBe(items()[index]);
  });

  it("the arrows move without wrapping; Home and End jump", () => {
    const { trigger } = setup();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = screen.getByRole("menu");
    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(document.activeElement).toBe(items()[0]);
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(items()[1]);
    fireEvent.keyDown(menu, { key: "Home" });
    expect(document.activeElement).toBe(items()[0]);
    fireEvent.keyDown(menu, { key: "End" });
    expect(document.activeElement).toBe(items()[1]);
  });

  it("Enter chooses the item: the menu closes, focus is on the trigger, and the item gets it", () => {
    const { trigger, onDelete } = setup();
    fireEvent.keyDown(trigger, { key: "ArrowUp" });
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Enter" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(onDelete).toHaveBeenCalledWith(trigger);
  });

  it("a click on an item chooses it", () => {
    const { trigger, onEdit } = setup();
    fireEvent.click(trigger);
    fireEvent.click(items()[0] as HTMLElement);
    expect(onEdit).toHaveBeenCalledWith(trigger);
  });

  it("Escape closes to the trigger and does not reach an outer handler (a modal's Escape)", () => {
    const outer = vi.fn();
    document.addEventListener("keydown", outer);
    const { trigger, onEdit } = setup();
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    document.removeEventListener("keydown", outer);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(outer).not.toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("Tab closes to the trigger; a click outside closes it", () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Tab" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("a second click on the trigger closes it", () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opening one menu closes another on the page", () => {
    render(
      <>
        <ActionMenu
          label={COPY.budgetOptions}
          name="Bills"
          items={[{ label: "A", onSelect: () => {} }]}
        />
        <ActionMenu
          label={COPY.budgetOptions}
          name="Dining Out"
          items={[{ label: "B", onSelect: () => {} }]}
        />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Budget options: Bills" }));
    fireEvent.click(screen.getByRole("button", { name: "Budget options: Dining Out" }));
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(screen.getByRole("menuitem").textContent).toBe("B");
  });
});
