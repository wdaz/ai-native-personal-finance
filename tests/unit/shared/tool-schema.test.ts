import { describe, expect, it } from "vitest";
import { z } from "zod";
import { LoginSchema, SignupSchema } from "@/src/shared/schemas";
import { toolInputJsonSchema } from "@/src/shared/tool-schema";

describe("toolInputJsonSchema (ADR-0004, SPEC-webmcp-tools §2.4; T-04 plan F1)", () => {
  it("keeps every maxLength of a shared schema — SPEC-auth §6's 60, 254 and 128", () => {
    const json = toolInputJsonSchema(SignupSchema);
    expect(json.type).toBe("object");
    expect(json.properties).toMatchObject({
      name: { type: "string", maxLength: 60 },
      email: { type: "string", maxLength: 254 },
      password: { type: "string", maxLength: 128 },
    });
  });

  it("accepts a tool that takes no input — get_balance's {} (SPEC-webmcp-tools §3)", () => {
    expect(toolInputJsonSchema(z.object({}))).toMatchObject({ type: "object", properties: {} });
  });

  it("throws on what zod-to-json-schema returns for a Zod 4 schema (violation fixture, E7)", () => {
    const zodToJsonSchemaOutput = () => ({
      $schema: "http://json-schema.org/draft-07/schema#" as const,
    });
    expect(() => toolInputJsonSchema(SignupSchema, zodToJsonSchemaOutput)).toThrow(
      "A tool input must convert to an object schema",
    );
  });

  it("throws on a schema that is not an object", () => {
    expect(() => toolInputJsonSchema(z.string().max(3))).toThrow(
      "A tool input must convert to an object schema",
    );
  });

  it("throws on a string without a maxLength, naming it — LoginSchema's password has none", () => {
    expect(() => toolInputJsonSchema(LoginSchema)).toThrow(
      "Tool input strings need a maxLength: password",
    );
  });

  it("looks inside nested objects and arrays", () => {
    const schema = z.object({ pot: z.object({ note: z.string() }), tags: z.array(z.string()) });
    expect(() => toolInputJsonSchema(schema)).toThrow(
      "Tool input strings need a maxLength: pot.note, tags[]",
    );
  });

  it("skips a property written as a boolean schema — JSON Schema's `true` holds no string", () => {
    const withAnyValue = () => ({ type: "object" as const, properties: { anything: true } });
    expect(toolInputJsonSchema(z.object({}), withAnyValue).properties).toEqual({ anything: true });
  });

  it("takes an enum or a literal as bounded by its values", () => {
    const schema = z.object({ category: z.enum(["Bills", "Dining Out"]), kind: z.literal("x") });
    expect(() => toolInputJsonSchema(schema)).not.toThrow();
  });

  it("throws on a nullable string without maxLength — type is array including 'string'", () => {
    const schema = z.object({ note: z.string().nullable() });
    expect(() => toolInputJsonSchema(schema)).toThrow("Tool input strings need a maxLength: note");
  });

  it("accepts z.uuid() — exempt from maxLength per plan D17", () => {
    const schema = z.object({ id: z.uuid() });
    expect(() => toolInputJsonSchema(schema)).not.toThrow();
  });
});
