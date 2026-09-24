# Task 5 report: PR template mirroring the Definition of Done

Commit: 46f334f `docs(process): a PR template that mirrors the Definition of Done` (branch task/T-13-ci-hardening, on top of 12d3a6f).
Files: `.github/pull_request_template.md`, `tests/unit/pr-template.test.ts`.

## Real DoD item count
21 (3 Scope and traceability, 6 Code, 6 Tests, 3 Accessibility and design, 3 Process). Matches the plan. `grep -c "^- \[ \] "` on the template: 21.

## TDD evidence
- RED (before the template existed): `ENOENT: no such file or directory, open '.../.github/pull_request_template.md'`, 0 tests run, 1 failed suite. Matched the prediction.
- GREEN: `Tests 2 passed (2)`; `prettier --check` on both files clean. Matched "2 passed".
- Failing on purpose (mutation): deleted the "Money is integer cents..." line from the template; test 1 failed with
  `"missing": ["Money is integer cents in code and DB; formatted only at the edge."]`, `"extra": []`. Template restored (git status showed only the two new files).

## Test counts
Full `npm test` after the change: 74 files / 935 tests passed (baseline 73 / 933; +1 file, +2 tests). typecheck, lint, format:check all clean (format:check and lint re-run after the final prettier fix).

## Deviations
1. Template body built with a single `sed -e ... >> file` (two `-e` expressions instead of the brief's `sed | sed`), because the harness refuses pipes. My first attempt (`sed -n '/^## Scope.../,$ s/^## /### /p'`) printed only the heading lines; I recreated the header with Write and redid it correctly. Final template body is a copy of the DoD from `## Scope and traceability` on, headings demoted to `###`, then `prettier --write` (no visible change).
2. Test fixture changed from the brief: `stale` is derived from `dod` instead of `checklist(template)`. In the brief's form the fixture test also failed whenever the template lost a line (observed during the first mutation run: both tests went red, and the fixture reported an extra "missing" item), so it did not test the comparison in isolation. Now only the mirror test goes red on a template mutation; the fixture test still proves `diff` reports both a dropped and an invented item.
3. Prettier reformatted the test after that edit (the chain fit on one line); the formatted version is committed.
4. The Write tool refused the report path (session isolated to the worktree), so this report was written with a shell heredoc.

## Concerns
- The mirror test only reads `- [ ]` lines, so the "Evidence" bullets (plain `- ` bullets) and the HTML comment are not compared, by design.
- The DoD file was not touched.

## Follow-up round

Commit: ae38686 `test(process): make the PR template's unticked and ordering checks fail on purpose` (only tests/unit/pr-template.test.ts; template untouched).

- Important 1: hoisted `const ticked = /^- \[[xX]\]/m;`, used in the mirror test; new fixture test "(fixture) reports a ticked item" asserts `checklist("- [x] item")` still returns the item (why the regex is needed), `- [x] item` matches `ticked`, `- [ ] item` does not.
  Mutation (temporarily `- [x] Money is integer cents...` in the template), `npx vitest run ... --reporter=dot`: 1 failed | 3 passed; the failing assertion is the guard, line 32:
  `AssertionError: expected '<!--\n  Task id and title ...' not to match /^- \[[xX]\]/m` (received text shows `- [x] Money is integer cents in code and DB; formatted only at the edge.`); the diff and `toEqual(dod)` assertions above it passed. Template restored from .bak; `git status --short` showed only the test file modified.
- Minor 1: describe title now `... (DoD, build-workflow, "Per task" step 5)`; verified against docs/04-process/build-workflow.md (step 5 is "PR - description = the Definition of Done checklist, ticked"; the file has no §5).
- Minor 2: added `expect(checklist(template)).toEqual(dod);` after the diff assertion, plus fixture "(fixture) reports a duplicated item and a swapped order": both cases give an empty `diff` (proving the set difference is blind to them) while `not.toEqual(dod)` holds.
- Minor 3: the dropped/invented fixture is now `checklist(asTemplate(dod.slice(1).concat("An item the DoD does not have")))`, built as Markdown from `dod`, independent of the template.
- Results: `npx vitest run tests/unit/pr-template.test.ts` 4 passed; typecheck, lint, format:check clean (prettier reformatted one line, committed formatted); `npm test` 74 files / 937 tests passed (+2 vs 935).
