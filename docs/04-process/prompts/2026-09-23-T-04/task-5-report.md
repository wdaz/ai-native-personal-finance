# Task 5 Report: A tool's input schema that cannot come back empty (finding F1)

## Summary

Implemented `toolInputJsonSchema`, a guard function that wraps Zod's `z.toJSONSchema` and throws at definition time if:
1. The conversion returns an empty schema (the violation E7 that `zod-to-json-schema` exhibits)
2. Any string field lacks a `maxLength` constraint

The implementation includes comprehensive test coverage and passes all project gates.

## Execution Record

### Step 1: Write the failing test
✅ Created `tests/unit/shared/tool-schema.test.ts` with 8 test cases covering:
- Preservation of maxLength constraints in shared schemas
- Support for tools with no input parameters
- Violation fixture for zod-to-json-schema output
- Non-object schema rejection
- String fields without maxLength validation
- Nested object and array validation
- Boolean schema properties
- Enum and literal value handling

### Step 2: Run test to confirm failure
✅ Test failed as expected with:
```
Error: Cannot find package '@/src/shared/tool-schema' imported from /Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-04-shared/tests/unit/shared/tool-schema.test.ts
```

### Step 3: Write `src/shared/tool-schema.ts`
✅ Implemented guard function with:
- Type definitions for JSON Schema and converter functions
- `toInputJsonSchema` default converter using `z.toJSONSchema` with `io: "input"`
- `unboundedStrings` function to recursively find strings without maxLength
- Main `toolInputJsonSchema` export that validates schema structure and constraints

### Step 4: Run test for success
✅ All tests passed:
```
Test Files   1 passed (1)
     Tests   8 passed (8)
  Start at   10:15:19
  Duration   96ms
```

### Step 5: All unit gates
Executed all project quality gates:

#### prettier --write
```
src/shared/tool-schema.ts 4ms (unchanged)
tests/unit/shared/tool-schema.test.ts 2ms (unchanged)
```
✅ Passed

#### npm run lint
```
> ai-native-personal-finance@0.1.0 lint
> eslint . --max-warnings 0
```
✅ Passed (0 warnings)

#### npm run format:check
```
> ai-native-personal-finance@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
```
✅ Passed

#### npm run typecheck
```
> ai-native-personal-finance@0.1.0 typecheck
> tsc --noEmit
```
✅ Passed

#### npm test
```
Test Files   25 passed (25)
     Tests   420 passed (420)
  Start at   10:15:36
  Duration   5.50s
```
✅ Passed — reached expected gate: 412 → 420 tests (+8 new tests)

### Step 6: Commit
✅ Successfully committed with exact message:
```
feat(shared): toolInputJsonSchema — z.toJSONSchema that throws on an empty or unbounded schema (T-04, F1)
```

Commit SHA: **b693be3**

Files changed:
- Created: `src/shared/tool-schema.ts` (47 lines)
- Created: `tests/unit/shared/tool-schema.test.ts` (58 lines)

## Result

**Status:** DONE

**Test Summary:** 420/420 passed (25 test files)

**Concerns:** None — all gates passed, implementation matches specification, violation fixture (E7) properly tested.

---

## Fix Round 1: Nullable strings and z.uuid() exemption

Review identified two issues with the `unboundedStrings` function:

### Finding 1: Nullable/union strings bypass the check
**Issue:** Zod 4's `z.toJSONSchema` writes `type: ["string", "null"]` for nullable strings (and similarly arrays for unions), not the bare string `"string"`. The condition `node.type === "string"` was false for these, so they were never validated for `maxLength`.

**Verification:**
```
$ npx tsx -e 'import { z } from "zod"; console.log(JSON.stringify(z.toJSONSchema(z.object({ note: z.string().nullable() }), { io: "input" }), null, 2))'

{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "note": {
      "type": [
        "string",
        "null"
      ]
    }
  },
  ...
}
```

**Fix:** Updated type check to handle both string and array forms:
```ts
const isString = node.type === "string" || (Array.isArray(node.type) && node.type.includes("string"));
```

### Finding 2: z.uuid() should be exempt per plan D17
**Issue:** The plan's decision D17 (`docs/04-process/plans/2026-09-23-T-04.md`) states "`z.uuid()` exempt from `maxLength`". A bare `z.uuid()` field was throwing because no exemption existed.

**Verification:**
```
$ npx tsx -e 'import { z } from "zod"; console.log(JSON.stringify(z.toJSONSchema(z.object({ id: z.uuid() }), { io: "input" }), null, 2))'

{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      ...
    }
  },
  ...
}
```

**Fix:** Added `format === "uuid"` to the exemption list:
```ts
const bounded =
  node.maxLength !== undefined ||
  node.enum !== undefined ||
  "const" in node ||
  (node as { format?: string }).format === "uuid";
```

### Changes Made

**File: `src/shared/tool-schema.ts`**
- Updated JSDoc to mention uuid exemption
- Modified `unboundedStrings` to check for array types containing "string"
- Added `format === "uuid"` to bounded string exemptions

**File: `tests/unit/shared/tool-schema.test.ts`**
- Added test: "throws on a nullable string without maxLength — type is array including 'string'"
  - Tests that `.nullable()` strings without `maxLength` are properly detected
- Added test: "accepts z.uuid() — exempt from maxLength per plan D17"
  - Tests that `z.uuid()` fields do NOT throw despite lacking `maxLength`

### Test Results

#### Specific test file
```
npx vitest run tests/unit/shared/tool-schema.test.ts

Test Files   1 passed (1)
     Tests   10 passed (10)
  Start at   10:21:10
  Duration   110ms
```

#### Full test suite
```
npm test

Test Files   25 passed (25)
     Tests   422 passed (422)
  Start at   10:21:14
  Duration   5.53s
```

#### Quality gates
```
npm run lint
> eslint . --max-warnings 0
✅ Passed

npm run format:check
> prettier --check .
All matched files use Prettier code style!
✅ Passed

npm run typecheck
> tsc --noEmit
✅ Passed
```

### Amended Commit

```
feat(shared): toolInputJsonSchema — z.toJSONSchema that throws on an empty or unbounded schema (T-04, F1)
```

Amended SHA: **058f3de**

Test Coverage:
- 10 tests in tool-schema.test.ts (8 original + 2 new)
- 422 total tests across suite (420 + 2 new)
