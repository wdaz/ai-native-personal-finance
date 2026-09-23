### Task 5: A tool's input schema that cannot come back empty (finding F1)

The owner's F1 condition, answered "T-04: shared helper". Runs after F1's docs PR has named
`z.toJSONSchema` in ADR-0004 and SPEC-webmcp-tools §2.4 ("Before execution", item 2).

**Files:**
- Create: `src/shared/tool-schema.ts`, `tests/unit/shared/tool-schema.test.ts`

**Interfaces:**
- Consumes: `LoginSchema`, `SignupSchema` (Task 3, tests only).
- Produces: `toolInputJsonSchema(schema: z.ZodType, convert?: (schema: z.ZodType) =>
  z.core.JSONSchema.BaseSchema): z.core.JSONSchema.BaseSchema` in `src/shared/tool-schema.ts`.
  T-11's `defineTool` calls it for `inputSchema`.

- [ ] **Step 1: Write the failing test**

`tests/unit/shared/tool-schema.test.ts` — its third test hands the helper E7's exact output,
the violation fixture DoD v1.1 asks for:

```ts
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
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/unit/shared/tool-schema.test.ts`
Expected (*measured*, E15): FAIL — "Cannot find package '@/src/shared/tool-schema'".

- [ ] **Step 3: Write `src/shared/tool-schema.ts`**

```ts
import { z } from "zod";

/**
 * A Zod schema as the JSON Schema a WebMCP tool publishes (ADR-0004, SPEC-webmcp-tools §2.4),
 * converted with Zod's own `z.toJSONSchema`. The conversion is checked rather than trusted:
 * `zod-to-json-schema` returns `{ "$schema": … }` and nothing else for a Zod 4 schema, without
 * an error (T-04 plan, E7), and an empty schema passes every check that looks for a missing
 * property. So a tool's input must come back as an object schema, and every string in it must
 * carry a `maxLength` — an `enum` or `const` is bounded by its values. Anything else throws when
 * the tool is defined, not when an agent calls it.
 */

type JsonSchema = z.core.JSONSchema.BaseSchema;
type Convert = (schema: z.ZodType) => JsonSchema;

const toInputJsonSchema: Convert = (schema) => z.toJSONSchema(schema, { io: "input" });

const isSchema = (value: unknown): value is JsonSchema =>
  typeof value === "object" && value !== null;

/** The paths of every string without a `maxLength`, e.g. `name` or `tags[]`. */
function unboundedStrings(node: JsonSchema, path: string): string[] {
  if (node.type === "string") {
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
```

- [ ] **Step 4: Run the test to see it pass**

Run: `npx vitest run tests/unit/shared/tool-schema.test.ts`
Expected (*measured*): **8 passed (8)**.

- [ ] **Step 5: All unit gates**

Run: `npx prettier --write src/shared tests/unit/shared && npm run lint && npm run format:check && npm run typecheck && npm test`
Expected (*measured*, E15): every command exits 0; Vitest **420/420**.

- [ ] **Step 6: Commit**

```bash
git add src/shared/tool-schema.ts tests/unit/shared/tool-schema.test.ts
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(shared): toolInputJsonSchema — z.toJSONSchema that throws on an empty or unbounded schema (T-04, F1)"
```

---

