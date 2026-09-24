import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineTool } from "@/src/webmcp/defineTool";

const OK = {
  name: "get_balance",
  description: "Returns the demo account's current balance.",
  input: z.object({}),
  annotations: { readOnlyHint: true },
  execute: async () => ({ content: [{ type: "text" as const, text: "ok" }] }),
};

describe("defineTool (SPEC-webmcp-tools §2.4 — throws at definition time)", () => {
  it("builds a registrable ToolDefinition from valid options", () => {
    const tool = defineTool(OK);
    expect(tool.name).toBe("get_balance");
    // z.toJSONSchema adds its own "$schema" key (T-04, tool-schema.test.ts) — matched partially.
    expect(tool.inputSchema).toMatchObject({ type: "object", properties: {} });
    expect(typeof tool.execute).toBe("function");
  });

  it.each(["", "has space", "über", "x".repeat(129)])(
    "throws on a name outside ^[A-Za-z0-9_.-]{1,128}$: %j",
    (name) => {
      expect(() => defineTool({ ...OK, name })).toThrow(/name/);
    },
  );

  it("throws on a description over 200 characters", () => {
    expect(() => defineTool({ ...OK, description: "x".repeat(201) })).toThrow(/description/);
  });

  it("accepts a description of exactly 200 characters", () => {
    expect(() => defineTool({ ...OK, description: "x".repeat(200) })).not.toThrow();
  });

  it("throws when annotations are missing (violation fixture)", () => {
    const withoutAnnotations = {
      ...OK,
      annotations: undefined as unknown as (typeof OK)["annotations"],
    };
    expect(() => defineTool(withoutAnnotations)).toThrow(/annotations/);
  });

  it("Review Focus 4 — propagates toolInputJsonSchema's throw for an unbounded string (T-04)", () => {
    expect(() => defineTool({ ...OK, input: z.object({ note: z.string() }) })).toThrow(
      "Tool input strings need a maxLength: note",
    );
  });

  it("every registry tool needs an object input schema — an empty object is fine, a bare string is not", () => {
    expect(() => defineTool({ ...OK, input: z.string() })).toThrow(
      "A tool input must convert to an object schema",
    );
  });
});

describe("defineTool's execute wrapper (SPEC §2.5, plan D3 — never throws)", () => {
  const echo = defineTool({
    name: "echo",
    description: "Echoes its input.",
    input: z.object({ value: z.string().max(10) }),
    annotations: { readOnlyHint: true },
    execute: async ({ input, signal }) => ({
      content: [{ type: "text", text: input.value }],
      structuredContent: { value: input.value, signal },
    }),
  });

  it("validates input first, returning a structured `validation` error rather than throwing", async () => {
    const result = await echo.execute({ value: 123 });
    expect(result.isError).toBe(true);
    expect(result.code).toBe("validation");
    expect(result.content[0]?.type).toBe("text");
  });

  it("calls the tool's own execute with the parsed input and signal: undefined (plan Q2)", async () => {
    const result = await echo.execute({ value: "hi" });
    expect(result.structuredContent).toEqual({ value: "hi", signal: undefined });
  });

  it("catches a thrown execute as a structured server_error, never rethrowing", async () => {
    const broken = defineTool({
      ...OK,
      execute: async () => {
        throw new Error("boom");
      },
    });
    const result = await broken.execute({});
    expect(result.isError).toBe(true);
    expect(result.code).toBe("server_error");
  });
});
