import { z } from "zod";

/**
 * A Zod schema as the JSON Schema a WebMCP tool publishes (ADR-0004, SPEC-webmcp-tools §2.4),
 * converted with Zod's own `z.toJSONSchema`. The conversion is checked rather than trusted:
 * `zod-to-json-schema` returns `{ "$schema": … }` and nothing else for a Zod 4 schema, without
 * an error (T-04 plan, E7), and an empty schema passes every check that looks for a missing
 * property. So a tool's input must come back as an object schema, and every string in it must
 * carry a `maxLength` — an `enum` or `const` is bounded by its values.
 * Anything else throws when the tool is defined, not when an agent calls it.
 */

type JsonSchema = z.core.JSONSchema.BaseSchema;
type Convert = (schema: z.ZodType) => JsonSchema;

const toInputJsonSchema: Convert = (schema) => z.toJSONSchema(schema, { io: "input" });

const isSchema = (value: unknown): value is JsonSchema =>
  typeof value === "object" && value !== null;

/** The paths of every string without a `maxLength`, e.g. `name` or `tags[]`. */
function unboundedStrings(node: JsonSchema, path: string): string[] {
  const isString =
    node.type === "string" || (Array.isArray(node.type) && node.type.includes("string"));
  if (isString) {
    const bounded = node.maxLength !== undefined || node.enum !== undefined || "const" in node;
    return bounded ? [] : [path];
  }
  const properties = Object.entries(node.properties ?? {}).flatMap(([key, child]) =>
    isSchema(child) ? unboundedStrings(child, path ? `${path}.${key}` : key) : [],
  );
  const items = isSchema(node.items) ? unboundedStrings(node.items, `${path}[]`) : [];
  return [...properties, ...items];
}

export function toolInputJsonSchema(
  schema: z.ZodType,
  convert: Convert = toInputJsonSchema,
): JsonSchema {
  const json = convert(schema);
  if (json.type !== "object" || !isSchema(json.properties)) {
    throw new Error(`A tool input must convert to an object schema, got ${JSON.stringify(json)}`);
  }
  const unbounded = unboundedStrings(json, "");
  if (unbounded.length > 0) {
    throw new Error(`Tool input strings need a maxLength: ${unbounded.join(", ")}`);
  }
  return json;
}
