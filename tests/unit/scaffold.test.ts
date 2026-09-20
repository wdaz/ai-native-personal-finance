import { describe, expect, it } from "vitest";
import { WEBMCP_MODES } from "@/src/shared/env";

describe("scaffold", () => {
  it("resolves the @/ path alias", () => {
    expect(WEBMCP_MODES).toEqual(["native", "polyfill", "off"]);
  });

  it("has NODE_ENV set to 'test' under Vitest", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });
});
