# T-04 final-review fix: revert the `z.uuid()` exemption in `toolInputJsonSchema`

## What changed

**`src/shared/tool-schema.ts`**
- Line ~9 (header comment): reverted
  `— an \`enum\`, \`const\`, or \`format: "uuid"\` is bounded by its values or format.`
  to
  `— an \`enum\` or \`const\` is bounded by its values.`
- Lines 26-30 (`bounded` check inside `unboundedStrings`): removed the
  `(node as { format?: string }).format === "uuid"` clause. Now:
  ```ts
  const bounded = node.maxLength !== undefined || node.enum !== undefined || "const" in node;
  ```

**`tests/unit/shared/tool-schema.test.ts`**
- Replaced `it("accepts z.uuid() — exempt from maxLength per plan D17", ...)` (line 64) with
  `it("throws on a bare z.uuid() without maxLength — D17 rejected exempting it", ...)`, asserting
  `toolInputJsonSchema(z.object({ id: z.uuid() }))` throws
  `"Tool input strings need a maxLength: id"`.
- Added a new test directly after it: `it("accepts z.uuid().max(36) — Release 2's documented
  pattern", ...)`, asserting `toolInputJsonSchema(z.object({ id: z.uuid().max(36) }))` does not
  throw.
- Before writing it, confirmed with
  `npx tsx -e "import { z } from 'zod'; console.log(JSON.stringify(z.toJSONSchema(z.object({ id: z.uuid().max(36) }), { io: 'input' })))"`
  that the JSON Schema really carries `maxLength: 36`:
  ```json
  {"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"id":{"type":"string","maxLength":36,"format":"uuid","pattern":"^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"}},"required":["id"]}
  ```

## Test output

`npx vitest run tests/unit/shared/tool-schema.test.ts`:
```
 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  10:50:58
   Duration  120ms (import 55%, transform 36%, tests 7%, worker 3%)
```

`npm test` (full suite):
```
 Test Files  26 passed (26)
      Tests  430 passed (430)
   Start at  10:51:01
   Duration  5.64s (tests 85%, import 8%, transform 6%, worker 1%)
```

**Note on count: 430, not 429.** The task brief said the total "should stay 429." Arithmetic
says otherwise: the fix *replaced* one test (flip, net 0) and then *added* one more test
alongside it (net +1), so the file went from 10 tests to 11, and the full suite went from
whatever it was before this commit to +1. It landed on 430/430, not 429/429. Reporting the
exact number per the brief's own fallback instruction rather than rounding or forcing it to 429.

`npm run lint`:
```
> ai-native-personal-finance@0.1.0 lint
> eslint . --max-warnings 0
```
(no output — clean)

`npm run typecheck`:
```
> ai-native-personal-finance@0.1.0 typecheck
> tsc --noEmit
```
(no output — clean)

`npx prettier --check src/shared/tool-schema.ts tests/unit/shared/tool-schema.test.ts`:
```
Checking formatting...
All matched files use Prettier code style!
```

## Commit

`211188c8f14083efa13a4bb4e624bdcc9e68058e` — one commit, no `--no-verify`, pre-commit hook (incl.
secret scan) passed on the first try, no `GITLEAKS_CACHE_DIR` fallback needed.

```
fix(shared): revert the z.uuid() exemption in toolInputJsonSchema — D17 rejected it (final review)

The plan's D17 decision table lists "z.uuid() exempt from maxLength" in its
"Alternative rejected" column, not its "Decision" column — the alternative
was rejected, not adopted. A task review earlier read it the other way and
added the exemption; the final whole-branch review caught the misreading
against the table's own header and against SPEC-webmcp-tools §2.4,
ADR-0004, and this branch's own T-15 hand-off ("ids with .max(36) for
toolInputJsonSchema"). A bare z.uuid() field is unbounded again; Release 2
tool authors add .max(36) explicitly, as the backlog already says.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014UsVVTon9cgqWxvbCpiHQG
```

Files changed: `src/shared/tool-schema.ts`, `tests/unit/shared/tool-schema.test.ts` (2 files, 8
insertions, 7 deletions).

## Concerns / notes for the team lead

- `docs/04-process/process-log.md` had an unrelated, unstaged modification already sitting in
  the worktree when I started (documenting this same D17 misreading/correction) — not made by
  me, not part of this task's instructions, and not included in my commit. Left it untouched;
  it looks like another concurrent agent's in-progress edit for the process log entry covering
  this same finding.
- Everything else in the working tree was clean before and after this commit — no other stray
  changes.
