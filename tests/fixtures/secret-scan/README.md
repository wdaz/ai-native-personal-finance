# tests/fixtures/secret-scan

Connection strings used by `tests/unit/secret-guard.test.ts` to prove that the
`postgres_connection_string` rule in `.gitleaks.toml` still fires, and still stays silent
where it should (T-02a, NFR-S5, DoD v1.1). Gitleaks' default rules do not detect a
Postgres URI at all — measured on 2026-09-22 against gitleaks 8.30.1 with a Neon pooled URL
and a generic `postgres://` one — so without this rule, and without a test that makes it
fire, the secret scan would pass on the one secret this project is certain to hold.

## Why the fixtures contain `{{…}}` placeholders

A fixture that holds a detectable connection string would turn the CI `secret scan` job
red for as long as it exists, and exempting this folder by path would open a permanent
hole: anything that later landed here would be invisible to both the hook and CI. So the
password in each URI is a placeholder, and the rule's placeholder allowlist ignores
`{{…}}`. The test replaces the placeholders with fake credentials and scans the result
through `gitleaks stdin` with the shipped `.gitleaks.toml`:

| Placeholder                | Replaced with           | Why                                                     |
| -------------------------- | ----------------------- | ------------------------------------------------------- |
| `{{PASSWORD}}`             | `npg_T3stOnlyN0tReal`   | shaped like a Neon password                             |
| `{{PASSWORD_URL_ENCODED}}` | `T3st%40Only%21N0tReal` | special characters must be percent-encoded in a URI     |
| `{{WEAK_PASSWORD}}`        | `postgres`              | the rule has no entropy threshold; a weak one is caught |

The committed files are themselves a test case: scanned as stored, they report nothing.

## What is covered

`postgres-violations.txt.fixture` — every line must be reported:

| Line | Case                                                                                    |
| ---- | --------------------------------------------------------------------------------------- |
| 1    | Neon pooled URL in a `.env` file (the production `DATABASE_URL`, ADR-0007)              |
| 2    | Neon direct URL (what migrations use)                                                   |
| 3    | YAML, `postgres://` scheme, explicit port                                               |
| 4    | TypeScript string, percent-encoded password, IP host                                    |
| 5    | Template literal, upper-case scheme                                                     |
| 6    | A weak password on a remote host — the local exemption is by host, not by password      |
| 7    | Host `localhost.example.com` — the local exemption matches the whole host, not a prefix |

`postgres-controls.txt.fixture` — nothing may be reported:

| Line | Case                                                                   |
| ---- | ---------------------------------------------------------------------- |
| 1    | The `.env.example` default (`localhost`), exactly as committed in T-01 |
| 2    | A strong password on `localhost` — credentials for this machine only   |
| 3    | `127.0.0.1`                                                            |
| 4–7  | Documentation placeholders: `USER:PASSWORD`, `password`, `${…}`, `<…>` |
| 8    | An empty value                                                         |
| 9    | A user without a password                                              |
| 10   | No credentials; `host:port` must not be read as `user:password`        |

The two halves matter equally: a rule that reported nothing would pass every control, and
one that reported everything would pass every violation.

## Not covered by the rule

Key–value DSNs (`host=… password=…`), JDBC `?password=` parameters and bare `PGPASSWORD=`
lines are outside the URI form this project uses (Prisma reads `DATABASE_URL`). No scanner
covers generic high-entropy strings either; that is why T-16 rotates every secret that was
ever real before the repository goes public, rather than trusting a green scan.

`gitleaks git` reads diffs only (measured on 2026-09-22 in the T-02a final review), so a
secret typed only into a commit or annotated tag message was outside both the hook and CI.
Since T-13 the history scan (the CI `secret scan` job and `npm run secrets:scan`) also feeds
every commit message and annotated-tag message to `gitleaks stdin` with this repository's
config. The pre-commit hook still cannot see a message that is being written; a
`commit-msg` hook would be needed (out of scope).
