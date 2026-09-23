# Task 6 review (sonnet)

## Spec Compliance
Matches the brief. Verified independently (not just re-reading the report):
- `eslint.config.mjs`: exactly two `no-restricted-syntax` selectors added — `JSXAttribute[name.name='data-testid'] > Literal` and `CallExpression[callee.property.name='getByTestId'] > Literal.arguments` — no leftover template-literal selector. Block sits before `prettier,`.
- Checked for flat-config rule clobbering: the only other `no-restricted-syntax` block is scoped to `src/domain/**/*.ts` / `src/server/**/*.ts` (ADR-0005), which does not overlap the new block's globs. Confirmed with `eslint --print-config` on three files — all show exactly the two ADR-0003 selectors, nothing lost or merged incorrectly.
- Exactly 2 violation fixtures + 2 control fixtures wired into `boundaries.test.ts`'s `violations`/`allowed` arrays (lines 154-165, 203-212), which already assert `severity === 2` and empty-messages respectively for every entry.
- `src/shared/test-ids.ts`: `TEST_IDS = {} as const satisfies Readonly<Record<string, string>>`, `TestId` derived via `(typeof TEST_IDS)[keyof typeof TEST_IDS]` — matches brief verbatim.
- Ran `npm run lint` (exit 0, repo-wide) and `npm test`: 26 files / 429 tests, matching the report. Grepped `app/`, `src/ui/`, `tests/e2e/` for existing `data-testid`/`getByTestId` — none found outside a README mention.

## Strengths
- Fixture/comment style matches sibling fixtures exactly.
- Rule comment explicitly records the owner's narrowing (string literals only) so a future reader doesn't have to re-derive scope from git blame.
- `--print-config` shows clean, non-overlapping rule scoping between the ADR-0005 Date block and the new ADR-0003 block.

## Issues

### Critical (Must Fix)
None.

### Important (Should Fix)
None.

### Minor (Nice to Have)
- `test-ids.test.ts` only exercises the two predicates against the current empty `TEST_IDS`, which trivially satisfies both — inherited verbatim from the brief's Step 1 code, not an implementer deviation; worth a follow-up when the first id lands.
- Report fidelity: the `npm run lint`/`typecheck` output lines are paraphrased rather than pasted verbatim, and the reconstructed line-count deltas are slightly off. None of this affects correctness — independently reran and got matching results — but the report isn't a faithful transcript in these spots.
- Latent hazard, not a defect: flat-config rule blocks for the same rule name don't merge across overlapping globs. Noted for the next task touching `no-restricted-syntax` on these globs.

## Assessment
**Task quality:** Approved
**Reasoning:** Diff matches the brief exactly (selectors, fixtures, registry, rule placement), independently reverified lint/test/print-config all confirm the claims, and no false positives or rule-clobbering exist on the three globs. The only findings are pre-existing plan-level test weakness and report paraphrasing, neither of which change the shipped behavior.

---

## Controller notes

- 429 vs. the plan's original 427 prediction: traced and explained (Task 5's fix round already
  moved the running baseline from 420 to 422; this task's actual design adds 7 tests, not 5 — the
  controller's own dispatch message under-predicted by 2). Not a defect.
- The "trivially-passing" empty-registry test was mutation-tested during plan authoring (plan
  evidence E11: a duplicate-id mutation and a camelCase-id mutation were both killed against this
  exact test in the prototype) — proven correct, just not yet exercised by a committed fixture,
  since there is nothing to encode as one while `TEST_IDS` is empty.
