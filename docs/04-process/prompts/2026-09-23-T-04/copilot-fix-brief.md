# Copilot fix brief — PR #10, finding 2

GitHub Copilot's automated review of PR #10 (commit `e19a51a`) found, verbatim:

> `unboundedStrings` only traverses `properties` and `items`. JSON Schema shapes like `$ref`,
> `anyOf`/`oneOf`/`allOf`, and tuple arrays (`prefixItems`) will currently bypass the maxLength
> check, which contradicts the header comment's "every string" guarantee. Consider either
> recursing into these keywords (and failing closed on `$ref`) or explicitly throwing when they
> appear so tools can't publish schemas that the guard can't validate.

This is the same gap the final whole-branch review (`final-review.md`, Minor #2) already named,
widened to 5 shapes after the controller's own probing. It was deferred to T-11 at the time
("no current shared schema is nullable-object shaped"). The owner has now asked for it to be
fixed in this PR, via a subagent.

## Files

- Modify: `src/shared/tool-schema.ts`
- Modify: `tests/unit/shared/tool-schema.test.ts`

## Chosen approach: fail closed (the simpler of Copilot's two suggestions, and what the final
review recommended)

Rather than recursing into `anyOf`/`oneOf`/`allOf`/`$ref`/tuples/records (real recursion risks
infinite loops on genuinely self-referential schemas, which Zod does produce a `$ref: "#"` for),
`unboundedStrings` should **throw** the moment it meets a JSON Schema keyword it does not know how
to check, naming the keyword and the path. A tool author who needs one of these shapes then has to
flatten it or the guard has to be deliberately extended — never silently pass.

## Evidence: the 5 shapes, exact JSON Schema output (measured, Zod 4.6.5, `z.toJSONSchema(schema,
{ io: "input" })`)

```js
// 1. A nullable object — z.object({ pot: z.object({ note: z.string() }).nullable() })
{"type":"object","properties":{"pot":{"anyOf":[{"type":"object","properties":{"note":{"type":"string"}},"required":["note"]},{"type":"null"}]}},"required":["pot"]}

// 2. A union of objects — z.object({ x: z.union([z.object({ a: z.string() }), z.object({ b: z.string() })]) })
{"type":"object","properties":{"x":{"anyOf":[{"type":"object","properties":{"a":{"type":"string"}},"required":["a"]},{"type":"object","properties":{"b":{"type":"string"}},"required":["b"]}]}},"required":["x"]}

// 3. A tuple — z.object({ pair: z.tuple([z.string(), z.string()]) })
{"type":"object","properties":{"pair":{"type":"array","prefixItems":[{"type":"string"},{"type":"string"}],"items":false,"minItems":2,"maxItems":2}},"required":["pair"]}

// 4. A record — z.object({ tags: z.record(z.string(), z.string()) })
{"type":"object","properties":{"tags":{"type":"object","propertyNames":{"type":"string"},"additionalProperties":{"type":"string"}}},"required":["tags"]}

// 5. A catchall — z.object({ extra: z.object({}).catchall(z.string()) })
{"type":"object","properties":{"extra":{"type":"object","properties":{},"additionalProperties":{"type":"string"}}},"required":["extra"]}

// 6. .meta({ id }) reused twice — const Pot = z.object({ name: z.string() }).meta({ id: "Pot" }); z.object({ pot: Pot, otherPot: Pot })
{"type":"object","properties":{"pot":{"$ref":"#/$defs/Pot"},"otherPot":{"$ref":"#/$defs/Pot"}},"required":["pot","otherPot"],"$defs":{"Pot":{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}}}
```

Note case 4 and 5 (`record`/`catchall`) do **not** produce a `patternProperties` key — Zod emits
`propertyNames` + a schema-valued `additionalProperties` instead. So the fix needs two checks, not
one: an explicit unchecked-keyword list, AND a separate check that `additionalProperties` is a
schema object (not the boolean `false` every `z.strictObject` in this codebase already produces,
and not absent, which is what a plain `z.object` produces — verified: `z.object({})` alone
converts to `{"type":"object","properties":{}}`, no `additionalProperties` key at all, so this
second check does not fire on any schema already in the codebase).

## Exact change to `src/shared/tool-schema.ts`

In `unboundedStrings`, immediately after the `isString` branch returns (so string-typed nodes are
unaffected) and before the existing `properties`/`items` walk, insert:

```ts
const UNCHECKED_KEYWORDS = [
  "anyOf",
  "oneOf",
  "allOf",
  "$ref",
  "prefixItems",
  "patternProperties",
] as const;

// (inside unboundedStrings, after the isString block:)
const unchecked = UNCHECKED_KEYWORDS.find((keyword) => keyword in node);
if (unchecked !== undefined) {
  throw new Error(
    `Tool input schema at "${path || "(root)"}" uses "${unchecked}", which this guard does not check — flatten the schema or extend the guard`,
  );
}
if (isSchema(node.additionalProperties)) {
  throw new Error(
    `Tool input schema at "${path || "(root)"}" uses "additionalProperties" as a schema (a record or catchall), which this guard does not check — flatten the schema or extend the guard`,
  );
}
```

(`UNCHECKED_KEYWORDS` can be a module-level `const` above the function, or inline — your choice,
match the file's existing style.) `isSchema` already exists in the file (`typeof value ===
"object" && value !== null`) and correctly returns `false` for the boolean `additionalProperties:
false` that every `z.strictObject` in this codebase produces, and for `undefined` (a plain
`z.object` with no `additionalProperties` key at all) — so this does not false-positive on any
schema already used by `LoginSchema`, `SignupSchema`, `OverviewDtoSchema` or `MetaDtoSchema`.

Also update the file's header comment: it currently ends "…carry a `maxLength` — an `enum` or
`const` is bounded by its values." Add one more sentence honestly stating the guard's actual
boundary, e.g.: "A schema using `anyOf`, `oneOf`, `allOf`, `$ref`, a tuple's `prefixItems`, or a
record/catchall's schema-valued `additionalProperties` is rejected outright rather than silently
passed — flatten such a shape or extend the guard."

## Tests to add to `tests/unit/shared/tool-schema.test.ts`

One test per shape (1, 2, 3, 4-or-5 — pick one of record/catchall since they exercise the same
code path, or add both for completeness, 6), each asserting `toThrow` with a message naming the
right keyword, using the exact Zod schemas above. Follow the file's existing style (see the
`.nullable()` and `z.uuid()` tests already in the file for the pattern: build the schema inline,
assert the exact throw message via a partial string match). Example for case 1:

```ts
it("throws on a nullable object field — anyOf, not a type array", () => {
  const schema = z.object({ pot: z.object({ note: z.string() }).nullable() });
  expect(() => toolInputJsonSchema(schema)).toThrow('uses "anyOf"');
});
```

Do the same for the union (case 2), the tuple (case 3, expect `'uses "prefixItems"'`), the record
or catchall (case 4/5, expect `'uses "additionalProperties" as a schema'`), and the `.meta()`
reuse (case 6, expect `'uses "$ref"'`).

## Verify

`npx vitest run tests/unit/shared/tool-schema.test.ts` (all tests pass, old and new — the file
currently has 11 tests; you're adding 4 or 5, so expect 15 or 16, report the exact number). Then
`npm test` (whole suite — currently 430; report the exact new total, don't round). Then `npm run
lint && npm run typecheck && npx prettier --check src/shared/tool-schema.ts tests/unit/shared/tool-schema.test.ts`.

## Commit

One commit. This repo has a secret-scan pre-commit hook; if it fires, retry with
`GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "..."`. Never `--no-verify`.
Conventional message, e.g.:

```
fix(shared): toolInputJsonSchema fails closed on anyOf/oneOf/allOf/$ref/tuples/records

Copilot's review of PR #10 found the guard's walker only descends into
`properties` and `items`, silently passing five JSON Schema shapes a
nullable/union object, a tuple, a record/catchall, and a reused `.meta()`
schema compile to (anyOf, prefixItems, a schema-valued
additionalProperties, and $ref). The final whole-branch review had
already named the same gap and deferred it to T-11; fixed here instead,
per the owner's decision on PR #10's review. The walker now throws,
naming the keyword and the path, instead of returning an empty result.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014UsVVTon9cgqWxvbCpiHQG
```

## Report

Write your report to `docs/04-process/prompts/2026-09-23-T-04/copilot-fix-report.md`: what you
changed (file:line), the exact test output (paste real output, not paraphrased), the commit SHA.
Return to me: status (DONE/BLOCKED), commit SHA, one-line test summary, concerns. You do not
dispatch subagents.
