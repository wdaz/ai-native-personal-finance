# Task 1 review: pinned gitleaks and the `postgres_connection_string` rule

Range: 27d6ceb..17d4543 (one commit, six files, +336).

## Spec Compliance: ✅

- ✅ All six files in the brief's list have a hunk: `.gitleaks.toml`, `scripts/gitleaks.sh` (mode 100755), both fixtures, fixture README, `tests/unit/secret-guard.test.ts`. Nothing else is in the diff.
- ✅ Checked by hand against the brief: the fixtures (7 and 10 lines), `.gitleaks.toml`, `scripts/gitleaks.sh` and the test file all match the brief's code blocks exactly. The README differs only in markdown table padding. The report says Prettier made that change, and the diff's tables match the brief's.
- ✅ Backlog T-02a: `[extend] useDefault = true` (.gitleaks.toml:9-10); rule id `postgres_connection_string` (.gitleaks.toml:16); `.next/` and `docs/00-discovery/inputs/` in the global `[[allowlists]]` (.gitleaks.toml:41-43); a fixture that fires, plus four mutations that the report says turned tests red on purpose (DoD v1.1).
- ✅ D1: VERSION=8.30.1 and one SHA-256 per platform (scripts/gitleaks.sh:14-25). Check I ran: fetched `gitleaks_8.30.1_checksums.txt` from the GitHub release. All four pinned hashes (darwin_arm64, darwin_x64, linux_x64, linux_arm64) match the published ones byte for byte.
- ✅ D4: no entropy threshold; the local-host exemption uses `regexTarget = "match"` with `$` anchoring (.gitleaks.toml:27-30); the placeholder allowlist is anchored to the whole secret (.gitleaks.toml:35-37); violations line 7 (`localhost.example.com`) holds the anchor in place.
- ✅ D5: the fixtures hold only `{{…}}` placeholders (controls line 1 is the literal `.env.example` localhost default, as the brief specifies), and no path allowlist covers `tests/`.
- ✅ D15: nothing skips. A missing tool makes `beforeAll` throw, and the file goes red (the RED evidence in the report shows this).
- ⚠️ D13 (`--redact`, plus a test that the fake password never appears) is not in this task's scans. It belongs to `scripts/secret-scan.sh` in Task 2, so it goes to cannotVerify, not to a finding here.
- ⚠️ Step 10's `gitleaks git --pre-commit --staged` scan was not run because of a sandbox refusal. A `dir` scan of the whole working tree was run instead and was clean. It is equivalent for six newly added files, and the as-committed test (secret-guard.test.ts:136-139) covers the fixtures directly. The report states this openly.

## Strengths

- Every guarantee has a mutation that kills it. The report's table matches the brief's and adds a correctly explained second casualty for the local-host mutation (controls line 1 is a literal localhost credential).
- The violations test compares both the set of reported lines and the set of rule ids, so a rule that reports everything would also fail. It also handles gitleaks' duplicate `decoded:percent` finding.
- The wrapper's download is atomic: it downloads to a temp dir under the cache, renames with `mv` on one filesystem, and removes the temp dir through a trap on the checksum failure path.
- The fixture README explains in words why placeholders are used and what the rule does not cover.

## Issues

### Critical

None.

### Important

None.

### Minor

1. **tests/unit/secret-guard.test.ts:62-68 (`parseReport`)**
   - What: the docstring says "any other status is the tool failing", but gitleaks also exits **1** on fatal errors.
   - Check I ran: `scripts/gitleaks.sh stdin --config /nonexistent.toml ...` printed `FTL unable to load gitleaks config` and returned `exit=1` with empty stdout.
   - Why it matters: a config error still turns the test red, so there is no false green. But it goes red as a bare `SyntaxError: Unexpected end of JSON input` with gitleaks' stderr dropped, which is exactly what the Step 6 evidence shows. Tasks 2–3 reuse this helper.
   - How to fix: throw with `result.stderr` when `stdout.trim()` is empty, or pass `--exit-code` with a distinct value in `report`. This changes the brief's code, so it is planMandated.

2. **tests/unit/secret-guard.test.ts:103-115 ("…and keeps nothing")**
   - What: the test asserts only that `<cache>/8.30.1/gitleaks` is absent. It does not check that the `.download.*` temp dir was removed.
   - Why it matters: deleting the `trap` at scripts/gitleaks.sh:79 would leave the tarball behind without any test going red.
   - How to fix: also assert that `readdirSync(join(cache, "8.30.1"))` is empty. This extends the brief's test, so it is planMandated.

3. **.gitleaks.toml:43 (global path allowlist)**
   - What: `(?:^|/)docs/00-discovery/inputs/` also exempts that path nested anywhere, for example `tests/docs/00-discovery/inputs/x`. The `.next/` form has the same property.
   - Why it matters: the exemption is wider than the backlog's one folder. Today it hides nothing. The `(?:^|/)` form is needed because `gitleaks dir <abs>` reports absolute paths, so a bare `^` anchor would break the dir-mode test.
   - How to fix: record the trade-off in the comment, or anchor on the repo-relative form once Task 2 fixes the scan roots. The brief's text is verbatim, so this is planMandated.

4. **scripts/gitleaks.sh:28 (`[ ! -x "$bin" ]`)**
   - What: the SHA-256 is checked only at download. A binary already in the cache is executed without re-verification.
   - Why it matters: this is acceptable for a cache in `node_modules/.cache`, but it is not stated anywhere. The header comment says "checked … before it is ever executed", which suggests more.
   - How to fix: reword the comment to "checked once, at download". This is planMandated.

5. **Commit 17d4543 trailers (from the report; not visible in the diff's commit subject)**
   - What: the report says the commit carries an extra `Co-Authored-By: Claude Sonnet 5` line and a `Claude-Session` line beyond the brief's message. It also flags a model-name mismatch in the Opus trailer.
   - Why it matters: this is attribution hygiene only.
   - How to fix: the owner or controller decides. No code change is needed.

## Assessment

Task quality: **Approved**. The diff matches the brief, all four pinned checksums match the official release, and every rule and allowlist is shown to fail on purpose. The only findings are a diagnostic gap in `parseReport` and small coverage or wording issues. None of them lets a leak through.
