import { describe, expect, it } from "vitest";
import { cx } from "@/src/ui/cx";

describe("cx", () => {
  it("joins the class names that apply and drops the rest", () => {
    expect(cx("item", false, "active", undefined, null, "")).toBe("item active");
  });

  it("is empty when nothing applies", () => {
    expect(cx(false, undefined)).toBe("");
  });
});
