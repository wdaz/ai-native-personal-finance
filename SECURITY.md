# Security policy

This is a solo-maintainer portfolio project — `docs/04-process/governance.md`'s Roles table
names one Owner and no other reviewer — serving one shared demo account with no real personal
data (NFR-S1, `docs/01-requirements/non-functional-requirements.md`). That context matters for
how a finding is weighed, not for whether it gets reported: please report it.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for this repository — the **Security** tab
→ **Report a vulnerability** (or go directly to
`https://github.com/wdaz/ai-native-personal-finance/security/advisories/new`) — instead of a
public issue or pull request. It opens a private draft security advisory that only the
maintainer can see until a fix is ready.

Private vulnerability reporting is turned on for this repository (read from GitHub's API,
2026-09-25). If the button is still not available to you, please open a regular issue asking
the maintainer for a private channel, without describing the finding there.

## What happens next

- The report is acknowledged as soon as practical.
- A confirmed, exploitable finding stays a private draft advisory until a fix is merged, per this
  project's `owasp-security-review` skill (`.claude/skills/owasp-security-review/SKILL.md`); the
  advisory and `docs/04-process/process-log.md` record it only afterward.
- A finding that turns out to be a documented, accepted decision rather than a defect is
  explained and closed (`docs/03-specs/tech-debt.md`) instead of silently ignored.

## Scope

This repository: the application (`app/`, `src/`, `prisma/`), its CI (`.github/workflows/`) and
its build/test tooling (`scripts/`). A vulnerability in a third-party dependency used here is in
scope too, alongside reporting it upstream to that project.

## Supported versions

One version is ever deployed — `main`
(`docs/02-architecture/adr/0007-hosting-and-delivery.md`) — so there is no older release branch
to report a finding against separately.
