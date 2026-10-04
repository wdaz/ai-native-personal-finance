# Report — the opening's review (T-15d, pull request #85)

The reviewer's final report, copied as it was handed back (the harness frames it as model output, not as the owner's
words). It reviewed the files as they stood at the tip of `task/T-15d-open` (`6825281`); it had no shell, so every regex
result is a hand trace, not a run.

**What it could not do:** no `git show`, no `npx vitest`, no `npx tsx`. "Do not take this report as evidence that the
tests pass."

## Findings

1. **Important (test gap): no test pins the block end.** `tests/unit/traceability.test.ts` (the fixture that ends a
   block at the next release heading) tests the lookahead `(?=\n### Release \d|$)` at `scripts/traceability.ts:41`.
   Under either mutation — (a) deleting `\n### Release \d|` so a block runs to the end of the file, (b) putting back the
   old `(?=\n### Release 2|$)` — every fixture and the real PRD give the same result, because each sentence ends with
   `. ` or `.` + newline before the next heading. Fix proposed: a fixture where the stopping point depends on the block
   end: `"### Release 2\nNo list here.\n### Release 3\nStories: US-50."`, expecting `releaseStoryIds(prd, 2)` to throw and
   `listedReleases(prd)` to equal `[3]`.
2. **Minor: the `Deferred` terminator is never reached.** In every input a `. ` comes before `Deferred`; removing the
   alternative fails no test, so the title "stops before Deferred" describes something the test does not check.
3. **Minor (latent): `Stories:` has no anchor, and the last block runs to the end of the file.** `Stories:` also matches
   inside "User Stories:"; without the `m` flag `$` is the end of input, so Release 3's block covers all of §6 onward.
   Nothing is wrong today (`Stories:` appears only at prd.md:3, :69 and :83). The doc comment is wrong for the last
   release.
4. **Minor: a high `built` can give a misleading pass.** If `built` is 2 and the PRD has lost its Release 2 sentence,
   `cumulativeStoryIds` silently checks only Release 1 and prints "all 18 stories of Releases 1–2". The test
   `listedReleases(PRD) === [1, 2]` guards this repository.
5. **Minor: a stale list file for a release the PRD no longer lists is not flagged.** Only listed releases are compared.
6. **Minor (test gap): the missing-file branch is untested.** `repository()` always writes both list files; without the
   `existsSync` branch `readFileSync` would throw ENOENT instead of printing the "differs from PRD §5" message.
7. **Minor (doc nit): the file's header comment still describes the old rule** ("every story of the release being
   built", not "and of every release before it").
8. **Minor (wording): "names 20" reads either way** — backlog v1.58 row T-15d, "read against Release 2 it names 20 of the
   23". The number is right: only US-11 (`transactions.test.ts:7`), US-27 (`bills.test.ts:10`, `calendar.test.ts:23`) and
   US-28 (`bills.test.ts:61`) are named, all top-level `describe` titles with no skip.
9. **Minor (completeness): one changed file is missing from the lists** — the `docs/03-specs/README.md` row for
   `release-<n>-stories.txt` is not named in backlog v1.58's list of what the opening carries, nor in the plan's file map.

## Areas with no defects found

- **The regexes on the real PRD:** Release 1's capture stops at `US-41. ` (18 ids; "AC1–AC2" and "R1" are not ids);
  Release 2's stops at `.` + newline, so the *Consequence (v1.3)* paragraph, which names US-04 and US-37, is excluded; even
  with the final period missing the capture would stop at "in Release 2. "; `\b` after the number is correct; a CRLF PRD
  is handled (CRLF in the `.txt` files would be a false drift on Windows — older than this change, and there is no
  `.gitattributes`).
- **Ordering and duplicates:** `listedReleases` and `cumulativeStoryIds` are correct; the duplicate fixture tests it.
- **`run()`:** every listed file is checked whether or not its release is being built; the `--write` output matches its
  test; the success message at `built` 1 is unchanged.
- **The test file's own titles:** none holds a story id; the `RELEASE_BEING_BUILT === 1` test is a deliberate tripwire.
- **Document claims:** 41 `^### US-\d\d` headings; 18 + 23 covers US-01…US-41 with no gap or overlap;
  `release-2-stories.txt` has 23 lines and matches the PRD; the ADR-0003 clarification matches the code; the hand-offs'
  references are correct (NFR-S3, `checkThreshold` with no call site, `resetToSeed`, the login rate limit,
  `proxy.ts` and `tests/api/logout-fallback.spec.ts`, `overview.md` §4.6 and §8, `reset-and-test-support.md` line 83,
  `auth.md` §2.10, US-04 AC3, US-38 AC1, US-39 AC2); the CI step name was already generic.

## What the agent did with it (commit `f736967`)

The agent re-read each finding against the files and ran the code itself, since the reviewer could not.

- **1, 2, 3, 6:** fixed and pinned. The block ends at the next heading of level 1–3 (so the last release stops at the
  next `##` section, not the end of the file), `Stories:` must start a line, and new tests cover the block end, the last
  release, the anchor, the `Deferred` terminator and the missing file. Each guard was removed once and its test failed:
  without the block-end lookahead 2 tests failed, without `Deferred` 1, without the `existsSync` branch 1 (72 tests pass
  with the guards in place).
- **7, 8, 9:** fixed (header comment; backlog wording "reports 20 of the 23 ids as named in no test title"; backlog
  v1.58 names the two `docs/03-specs/README.md` rows). The plan's file map is a merged document and was not edited.
- **5:** accepted as minor and left: it needs a stale file left behind by a deleted PRD sentence, which the reviewer of
  a PRD change sees in the diff.
- **4:** accepted as minor at `f736967` (the repository test on `listedReleases` guards this repository), then **fixed in
  `497284f`** when Copilot raised the same defect as a high finding: `cumulativeStoryIds` now throws when the release
  being built has no `Stories:` sentence. Copilot's next review found that `--write` still skipped it (medium, fixed in
  `74267f0`: the release is read before `--write`). The lesson, for the retrospective: the reviewer's "minor" and
  Copilot's "high" were the same finding, and the one the agent had accepted was the one the owner's rule (governance
  v1.9) says must be fixed.
- **CRLF in the `.txt` files:** older than this change; not changed.
