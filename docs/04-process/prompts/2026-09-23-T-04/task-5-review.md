# Task 5 review (sonnet)

## Spec Compliance

Matches D17/brief closely. `src/shared/tool-schema.ts:1` imports only `zod` (ADR-0002 respected); test imports `@/src/shared/schemas` test-only, per brief.

- Empty-schema shape (E7): correctly caught — `json.type !== "object" || !isSchema(json.properties)` (tool-schema.ts:34-36), tested with the *exact* real broken-package output `{"$schema":"http://json-schema.org/draft-07/schema#"}` (test:17-22), and via the `convert` parameter as required, not an inlined bad Zod schema. `{}` input (get_balance) accepted (test:11-13).
- Recursive descent: yes, into `properties` and `items` both (tool-schema.ts:20-24), tested with `pot.note, tags[]` (test:39-44). Error names every offending path, joined.
- enum/literal exemption: implemented (`node.enum !== undefined || "const" in node`) and tested (test:52-55). Verified independently.

⚠️ **`z.uuid()` is flagged as a violation, contradicting the plan's own D17 decision** ("`z.uuid()` exempt from `maxLength`", plan:231). Verified empirically: throws `"Tool input strings need a maxLength: id"`. No exemption code, no test either way. `OverviewDtoSchema` has several `id: z.uuid()` fields nested in arrays. Deferred to Release 2 per the plan's own scoping — flagging as a deviation to note.

⚠️ **Docs staleness, not this task's fault**: `docs/02-architecture/adr/0004-webmcp-adapter.md:14` and `webmcp-tools.md:19` in this checkout still say `zod-to-json-schema` — `main` has the F1 amendment (165a425, PR #9) but `task/T-04-shared` branched before it and hasn't merged it in. Code correctly targets `z.toJSONSchema`; just the branch's local docs text is behind main.

## Strengths
- Fixture reproduces the *real* broken-package output verbatim, exactly what DoD v1.1 asks for.
- `convert` injection point is clean and actually exercised by the E7 test.
- Error messages name the path (`pot.note`, `tags[]`).
- Boolean-schema properties correctly skipped, tested.

## Issues

### Critical (Must Fix)
None.

### Important (Should Fix)
**Nullable/union-typed strings bypass the check entirely.** `unboundedStrings` tests `node.type === "string"` (tool-schema.ts:19), but Zod 4's `z.toJSONSchema` emits `type: ["string", "null"]` for `.nullable()` and `type: ["string", "number"]` for unions — an array, never the bare string `"string"`. Verified empirically: `toolInputJsonSchema(z.object({ note: z.string().nullable() }))` returns successfully with no `maxLength` check ever applied. Not exercised by current shared schemas, but an untested, unguarded gap in the core recursion this task exists to deliver.

### Minor (Nice to Have)
- The `z.uuid()` deviation above — worth a test asserting the intended behavior, or implementing the plan's exemption.
- Consider a `.nullable()`/union regression test once the Important issue is fixed.

## Assessment
**Task quality:** Needs fixes
**Reasoning:** Core empty-schema and nested-recursion behavior is solid and well-tested, but the type-array blind spot (nullable/union strings silently exempted) undermines the completeness guarantee this guard is meant to provide, and the `z.uuid()` handling diverges from the plan's explicit D17 decision without a test either way.

---

## Fix round 1/5

Both findings resumed with the original implementer: (1) treat a property as string-typed when
its `type` is `"string"` or an array containing `"string"`; (2) exempt `format === "uuid"` per
D17. Fixed via `git commit --amend` (058f3de), +2 regression tests, 422/422.

## Re-review (sonnet) — scoped to the fix

### Finding Verdicts
- **Nullable/union-typed strings bypass the check** — ADDRESSED. `tool-schema.ts:23-24` now checks `node.type === "string" || (Array.isArray(node.type) && node.type.includes("string"))`. Regression test `test.ts:59` verifies the array-typed case is caught; independently reran the file, 10/10 pass.
- **`z.uuid()` exempt from `maxLength` (D17)** — ADDRESSED. `tool-schema.ts:30` adds `(node as { format?: string }).format === "uuid"`. Test `test.ts:64` confirms no throw.

### New Breakage in the Fix Diff
None Critical/Important. One Minor/nit: the `format` type cast at `tool-schema.ts:30` is redundant (`JsonSchema` already declares `format?: string`); harmless.

### Out-of-Scope Observations
`unboundedStrings` still never descends into `anyOf`/`oneOf`/`allOf`. A `.nullable()` **object**
(Zod 4 compiles this to `{ anyOf: [...] }`, unlike a nullable string's `type` array) would hide an
unbounded string nested inside it. Pre-existing gap, not introduced by this fix round. No current
shared schema is nullable-object shaped; worth a note for T-11 (out of scope here).

### Verdict
**Fix round:** All findings addressed, no new Critical/Important breakage.
