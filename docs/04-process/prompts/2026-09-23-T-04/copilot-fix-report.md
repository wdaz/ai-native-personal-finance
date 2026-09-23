# Copilot fix report — PR #10, finding 2

Brief: `docs/04-process/prompts/2026-09-23-T-04/copilot-fix-brief.md`

## What changed

- `src/shared/tool-schema.ts:10-13` — header comment: added a sentence stating the guard's actual
  boundary (rejects `anyOf`/`oneOf`/`allOf`/`$ref`/`prefixItems`/schema-valued
  `additionalProperties` outright).
- `src/shared/tool-schema.ts:24-31` — new module-level `UNCHECKED_KEYWORDS` const
  (`anyOf`, `oneOf`, `allOf`, `$ref`, `prefixItems`, `patternProperties`).
- `src/shared/tool-schema.ts:41-51` — in `unboundedStrings`, after the `isString` branch and
  before the `properties`/`items` walk: throws if the node has any `UNCHECKED_KEYWORDS` key
  (naming the keyword and the path), then throws if `node.additionalProperties` is itself a
  schema object (record/catchall case — `isSchema` already excludes `false` and `undefined`, so
  `z.strictObject` and plain `z.object` schemas already in the codebase are unaffected).
- `tests/unit/shared/tool-schema.test.ts:75-104` — 6 new tests, one per shape from the brief
  (nullable object, union, tuple, record, catchall, `.meta()` reuse), each asserting the exact
  `toThrow` message naming the right keyword. Added both record and catchall (brief allowed
  either or both) for completeness.

## Verify

### `npx vitest run tests/unit/shared/tool-schema.test.ts`

```
 Test Files  1 passed (1)
      Tests  17 passed (17)
   Start at  11:16:04
   Duration  117ms (import 52%, transform 37%, tests 9%, worker 3%)
```

11 original tests + 6 new = 17, all passing.

### `npm test` (whole suite)

```
 Test Files  26 passed (26)
      Tests  436 passed (436)
   Start at  11:16:08
   Duration  5.54s (tests 86%, import 8%, transform 6%, worker 1%)
```

430 previously + 6 new = 436, all passing.

### `npm run lint`

```
> ai-native-personal-finance@0.1.0 lint
> eslint . --max-warnings 0
```

No output — clean.

### `npm run typecheck`

```
> ai-native-personal-finance@0.1.0 typecheck
> tsc --noEmit
```

No output — clean.

### `npx prettier --check src/shared/tool-schema.ts tests/unit/shared/tool-schema.test.ts`

```
Checking formatting...
All matched files use Prettier code style!
```

## Commit

`fix(shared): toolInputJsonSchema fails closed on anyOf/oneOf/allOf/$ref/tuples/records`

SHA: this commit itself (`git log -1 --format=%H` on `task/T-04-shared`) — reported alongside
this file in the same commit, so it cannot self-reference its own hash.

## Concerns

None. All five shapes from the brief's evidence section trace correctly through the new checks
(verified by hand against the exact JSON Schema output given, and confirmed by the passing
tests). No existing schema in the codebase (`LoginSchema`, `SignupSchema`, `OverviewDtoSchema`,
`MetaDtoSchema`) uses any of the newly-rejected shapes, so this is a pure tightening with no
behavior change for current tool schemas.
