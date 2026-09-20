# Task 6 Implementation Report

## Overview
Implemented Task 6 of the T-01 scaffold: created `.env.example` listing all environment variables named in approved documents and added a unit test to prevent silent drift.

## Files Created and Modified

### Created Files
- `.env.example`: 45 lines listing all documented environment variables organized by section (Database, Session & demo account, Reset, WebMCP, Environment, Release 1 specs). Each variable includes its source documents and usage guidance.

### Modified Files
- `tests/unit/scaffold.test.ts`: Appended a fourth `describe` block (lines 77-107) that:
  - Parses `.env.example` to extract all declared variables (matching pattern `^([A-Z][A-Z0-9_]*)=`)
  - Validates that all 13 required variables are declared
  - Confirms no `NEXT_PUBLIC_*` variables are declared directly (they are derived by next.config)

## Verification Commands and Output

### 1. `git check-ignore -v .env.example`
```
.gitignore:13:!.env.example	.env.example
Exit code: 0
```
The file matches the negation pattern in `.gitignore` (line 13: `!.env.example`), which is correct. The `.gitignore` rules are:
- Line 11: `.env` ignored
- Line 12: `.env.*` matched (covers `.env.example`)
- Line 13: `!.env.example` negates the rule for this file only

This allows `.env.example` to be committed while all other `.env*` files remain ignored.

### 2. `npm test`
```
Test Files: 1 passed (1)
Tests: 96 passed (96)
Duration: 75ms
```
All tests pass. The new test block added 14 test cases:
- 13 tests via `it.each(required)` — one for each required variable
- 1 test for the NEXT_PUBLIC negation check
Total increased from 82 (before) to 96 (after).

### 3. `npm run lint`
```
No output
Exit code: 0
```

### 4. `npm run typecheck`
```
No output
Exit code: 0
```
No TypeScript strict mode errors despite using `?.[1]` guards with proper type predicates.

### 5. `npm run format:check`
```
Checking formatting...
All matched files use Prettier code style!
Exit code: 0
```

## Commit Details
- **Commit SHA**: `baf2436`
- **Message**: `chore(config): .env.example covering ADR-0005/0006/0007 and the R1 specs (T-01)`
- **Files changed**: 2 (`.env.example` created, `tests/unit/scaffold.test.ts` modified)
- **Insertions**: 78

## Test Summary
All 96 tests pass, including the 13 new parameterized tests for required variables and the negation check for `NEXT_PUBLIC_*` variables.

## Deviations and Notes

### None
The implementation followed the brief exactly. The brief specified:
- ✅ Create `.env.example` with the exact content provided
- ✅ Append a fourth `describe` block to the outer `describe("T-01 scaffold", …)` without modifying existing blocks
- ✅ Reuse existing `repoRoot` and `readFileSync` imports
- ✅ All verification commands passed
- ✅ Committed with the specified message

### Observations
- The `.env.example` file contains 13 documented environment variables:
  1. `DATABASE_URL` — Neon pooled / local Postgres connection
  2. `SESSION_SECRET` — At least 32 characters (SPEC-auth §5)
  3. `DEMO_EMAIL` — Login credential for demo account
  4. `DEMO_PASSWORD_HASH` — bcrypt hash for demo password
  5. `DEMO_PASSWORD_DISPLAY` — Plain text password shown on login page (ADR-0006, NFR-S1)
  6. `RESET_SECRET` — Bearer secret for POST /api/admin/reset
  7. `WEBMCP_MODE` — native | polyfill | off (default: polyfill)
  8. `WEBMCP_ORIGIN_TRIAL_TOKEN` — Chrome origin-trial token for production only
  9. `APP_ENV` — test mode enables /api/test/* endpoints and window.__pf hook
  10. `CRON_SECRET` — Vercel scheduled reset secret
  11. `RESET_INTERVAL_DAYS` — Banner reset frequency (default: 10)
  12. `RESET_ROW_THRESHOLD` — Database size threshold for reset (default: 2000)
  13. `RESET_BYTES_THRESHOLD` — Storage size threshold for reset (default: 52428800 = 50 MB)

- The test correctly enforces that these variables cannot drift without CI failure.
- The regex pattern `^([A-Z][A-Z0-9_]*)=` properly matches environment variable declarations while ignoring comments and blank lines.

## Concerns
None. The task is complete and fully verified.
