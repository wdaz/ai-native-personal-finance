# Task 3 review (sonnet)

## Spec Compliance

**Matches the brief exactly.** The diff is a literal implementation of `task-3-brief.md` Steps 1, 4, 6 — `docs/03-specs/auth.md`, `src/shared/schemas.ts`, `src/server/http.ts`, and both test files reproduce the brief's code blocks verbatim.

- **`LoginSchema`**: email — `requiredText().trim().min(1, stop(COPY.required)).max(EMAIL_MAX, stop(COPY.emailInvalid)).regex(EMAIL_PATTERN, COPY.emailInvalid)` (`schemas.ts:26-30`). `EMAIL_PATTERN` exactly `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (§4). Password: `requiredText().min(1, COPY.required)` only — never trimmed, no length cap, matching "login only checks presence." Verified `.trim()` runs before length checks.
- **`SignupSchema`**: name 1–60 trimmed, then measured post-trim (`schemas.ts:34`); password chain `min(1, stop) → min(8, stop) → max(128)` (`schemas.ts:36-39`), so an empty password aborts at the presence check and reads `COPY.required`, never `passwordTooShort`.
- **One issue per field**: every length/format check but the last in a chain uses `stop()` (`{ message, abort: true }`), confirmed present in zod 4.6.5's type defs as a real, functioning check option. `LoginSchema.safeParse({})` yields exactly `[["email", required], ["password", required]]`.
- **`ErrorEnvelopeSchema`**: `ERROR_CODES` is the exact seven codes in §2.10's order (`schemas.ts:52-60`); `issues`/`retryAfter` optional; `retryAfter` is `z.int().positive()` — rejects `0`, negatives, fractions.
- **`toErrorIssues`**: spreads `{...issue, path: ...}` with no `input` field added.
- **`http.ts`**: `errorResponse`'s signature byte-identical; the body it writes unchanged — only `ApiErrorCode` changed from a hand-written union to `ErrorEnvelope["error"]`. Grepped the rest of the repo for other consumers — nothing breaks.
- **SPEC-auth v1.0.1**: the diff's two hunks are character-for-character what finding F2 specified; `message: "Email or password is incorrect"` and `message: "Too many attempts"` present; §2.10 text itself untouched.
- **No Task-4 scope creep**: no `OverviewDtoSchema`, `MetaDtoSchema`, or enum imports anywhere in the diff.
- **Two commits**, correctly named, matching the brief's Step 9 messages exactly.

⚠️ Per-commit file scoping and the secret-scan hook wrapper could not be independently verified from the diff artifact alone (trust-not-verify from this artifact).

## Strengths

- Check ordering inside each field's chain is deliberately built so exactly one message surfaces per field — covered by direct tests, not assumed.
- Tests assert on `[path, message]` pairs via a shared `messages()` helper, not just `success: false`.
- `http.ts` change is minimal and traceable: only the type source changed, response shape provably untouched.
- SPEC and code changes trace cleanly to the owner's rulings (answer 5, finding F2) with explicit changelog/version bump.

## Issues

### Critical (Must Fix)
None.

### Important (Should Fix)
None.

### Minor (Nice to Have)
- `stop()` (`schemas.ts:20`) sets the deprecated `message` key instead of `error` on Zod v4 check params (confirmed deprecated in `node_modules/zod/v4/core/api.d.ts`). Functionally identical today and fully covered by passing tests — worth swapping to `error` next time this file is touched, before a future zod major drops the alias.

## Assessment

**Task quality:** Approved
**Reasoning:** The diff is a faithful, well-tested implementation of the brief with no functional or spec deviations found; the only gaps (commit-scoping and hook-wrapper verification) are structurally outside what this diff artifact can show, not defects in the code itself.

---

## Controller resolution of the two ⚠️ items

Verified directly: `git show --stat fca80a8` → `docs/03-specs/auth.md | 6 +++---` only, 3+/3-.
`git show --stat 2b95b95` → `src/server/http.ts`, `src/shared/schemas.ts`, and the two new test
files only. Correctly scoped. Both commits exist in `git log`, which a failing pre-commit hook
would have blocked — the hook ran and passed. Task 3 marked complete.
