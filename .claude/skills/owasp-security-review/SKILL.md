---
name: owasp-security-review
description: Whole-application security review against the 131-item OWASP Web Application Security Testing checklist. Records PASS / FAIL / BY DESIGN / N/A / NOT TESTED with evidence for every item and writes a findings report traced to the NFR-S requirements. Use this whenever the user asks for a security audit, pentest, OWASP check, security checklist, "is the app secure", a hardening review before a release or before the repository goes public, or a check of one area across the whole app (sessions, CSRF, XSS, headers, auth, rate limits), even if they never say "OWASP". Not for the changes of a single diff, PR or branch (use Claude Code's built-in `/security-review` command for that), and not for implementing fixes.
---

# OWASP security review

This skill walks the OWASP Web Application Security Testing checklist against
the running application and its source, one item at a time, and ends with a
report in which every one of the 131 items has a status and the evidence behind
it. The value is in the completeness and the evidence: a checklist with ticks
and no proof is an opinion, and the owner of this repository treats unverified
claims as defects of the report (`docs/04-process/governance.md`, "Reported
output is copied from the run").

The checklist, with a stable ID per item, is in
[`references/checklist.md`](references/checklist.md). The report structure is
in [`references/report-template.md`](references/report-template.md).

## Ground rules

These exist because a security review can do harm of its own: to the running
service, to the public repository, or to the process.

- **Test only what the owner controls, and by default only locally.** Run the
  dynamic checks against a local server. Against the deployed host, limit
  yourself to passive checks: response headers, one TLS handshake, the
  certificate, a normal page load. Anything active needs the owner's explicit
  go-ahead in this conversation. The deployed demo serves one shared dataset
  to every visitor (NFR-S1). A stored-XSS probe written there is served to
  everyone, and enough writes can push the data toward the reset threshold
  (NFR-S4). A reset ends every visitor's session (SPEC-auth §2.9).
  Search-engine caches and third-party content are observed, never probed.
- **Small, fixed request counts.** Rate-limit, lockout and DoS items are
  verified by reading the code and its tests, then confirmed with a bounded
  number of requests, e.g. limit + 1. Never flood anything, including
  localhost. Load testing is a different activity with its own tooling.
- **Evidence for every status, copied from the run.** A path and line, a test
  name, or the exact command and the lines of its output that matter. A claim
  you could not execute is written as a question with the command that would
  settle it, and the item is NOT TESTED.
- **Review, don't fix.** Do not change code during the review. Each finding
  becomes a proposed small PR of its own, with a failing test first. That is
  how the owner wants defects handled: one concern per PR, never folded into
  unrelated work.
- **The repository is public.** Write the report outside the repository by
  default, in the session's scratch directory if it has one, otherwise under
  `/tmp`. Tell the user the path. Committing it under `docs/` is the owner's
  decision, normally only after the findings are fixed, because a committed
  report with open findings is a public disclosure. Redact cookie values,
  tokens, password hashes and secrets from all evidence.

## Statuses

| Status         | Meaning                                                               | Evidence it needs                                            |
| -------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| **PASS**       | The control exists and you verified it                                | What you ran or read, and what it showed                     |
| **FAIL**       | The control is missing or broken, and no document accepts that        | The failing observation, and the finding id it belongs to    |
| **BY DESIGN**  | The behaviour looks like a failure, but a written decision accepts it | The NFR, PRD, spec or ADR row that decides it                |
| **N/A**        | The attack surface the item tests does not exist in this app          | Proof of absence, e.g. the grep that found no upload handler |
| **NOT TESTED** | It could not be verified in this run                                  | Why not, and what would settle it                            |

Deciding between them:

- **The attack surface does not exist** (no XML parsing, no uploads, no card
  payment, only one identity): **N/A**, with the evidence.
- **The surface exists but the control is absent, and a document accepts that**
  (e.g. SPEC-auth §8 puts password reset, remember-me and MFA out of scope;
  NFR-S1 shows the demo credentials on purpose): **BY DESIGN**, citing the row.
- **The surface exists, the control is absent, and no document covers it:
  FAIL.** An absence you can explain but cannot cite is still a FAIL, or a
  question for the owner.
- **Specified but not built yet** (check the backlog for whether its task has
  landed): **NOT TESTED**, with the reason "not built yet". It is not N/A,
  because it will exist.
- **An item that spans several channels or targets** (the UI, the API and the
  agent tools; local and deployed) takes the worst of its parts, in the order
  FAIL, NOT TESTED, PASS. The evidence names the part that decided it.

## Workflow

### 1. Fix the scope

Settle three things before testing, from the request if it already says them,
otherwise by asking in one short question:

- **Categories:** all 13, or a subset ("just sessions and auth").
- **Target:** a local production build (default), the deployed host (passive
  only unless the owner says otherwise), or static review only.
- **Code under review:** the branch and the commit SHA. Record the full SHA in
  the report, since findings are only meaningful against a known revision.

Start the local target as a production build: `npm run build && npm start`
(README), not `npm run dev`. The dev server serves source maps, verbose errors
and dev-only endpoints, which make CONF-02, CONF-05, INFO-06 and VAL-32 look
different from production. The same reason keeps E2E tests off `next dev`
(ADR-0003). Record the mode in the report header, and confirm the server
responds before step 3. If it will not build or start, fall back to static
review and mark the dynamic items NOT TESTED.

### 2. Build the context

Read before testing. Most items depend on knowing what the app is supposed to
do:

1. `AGENTS.md`, then the documents its reading order names.
2. `docs/01-requirements/non-functional-requirements.md`, section NFR-S: the
   security requirements the findings trace to.
3. `docs/03-specs/auth.md` (SPEC-auth) and
   `docs/02-architecture/adr/0006-auth-and-session.md`: the session model,
   the route matrix (§2.10), the rate limit (§4) and what is out of scope
   (§8). Sessions are sealed cookies, not server-side records, and several
   SESS items read differently because of it.
4. `docs/02-architecture/adr/0007-hosting-and-delivery.md`: this names the
   host but not its TLS, HSTS or body-size defaults. Verify those on the
   host itself, or mark the items NOT TESTED.
5. `docs/03-specs/backlog.md` and `git log`: which tasks have landed on the
   branch under review. The specs may describe code that is not on this
   branch yet.

The INFO items double as this inventory. Doing INFO-07 to INFO-14 first gives
you the list of entry points, roles and channels that every later category
tests against.

### 3. Walk the checklist

Work category by category in checklist order and record each item's status as
you go. Do not reconstruct the statuses from memory at the end. For each item,
pick the cheapest method that gives real evidence:

1. **An existing test** that already asserts the control. Cite it by file and
   test name, and run it. A cited test that you did not run is a prediction,
   not evidence.
2. **Static reading** of the code path, cited by file and line.
3. **A dynamic check** against the target, e.g. `curl -i`, a Playwright
   script, or a request with a tampered cookie. Record the command and the
   relevant response lines.

Some items test the same thing through different channels. INFO-11 asks for
every channel the data is reachable through: the UI, the JSON API, and the
agent-callable tools. The AUTHZ, SESS-11 and VAL items then apply to each
channel. A control enforced in the page but not in the API it calls is a FAIL.

When subagents are available, the categories split well across them, e.g.
INFO+CONF+TRAN, AUTHN+SESS+AUTHZ, VAL, and the rest. Review subagents in this
repository run **without write tools** (governance rule): read, grep and glob
only. They cannot run tests or send requests, so what they return is a
candidate status with its static evidence. The main session owns the running
server, runs every cited test and every dynamic check, and only then marks an
item PASS.

### 4. Rate each finding

A finding is one defect, which may fail several checklist items. Rate it by
what it allows in this app:

| Severity     | In this app, roughly                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Critical** | Unauthenticated access to data or actions, or remote code execution                                                                                         |
| **High**     | Authentication or session bypass, stored XSS, missing authorization on a write route, a secret exposed to the client                                        |
| **Medium**   | A missing defence-in-depth control that a documented requirement asks for (a header from NFR-S6, a rate limit from NFR-S4), open redirect, user enumeration |
| **Low**      | Hardening that no requirement asks for, information disclosure with no direct use                                                                           |

Weigh the real context. This is a demo with one shared account and no real
personal data (NFR-S1). The same bug matters differently here than in a
production bank, and the report should say how.

Something worth recording that needs no change is not a finding. It goes in
the report's Observations section and does not become a PR.

### 5. Write the report

Follow [`references/report-template.md`](references/report-template.md)
exactly, so that successive runs can be diffed item by item. Before handing it
over, check three things:

- The full-checklist table has exactly one row per item in scope (131 for a
  full run).
- The status counts in the summary add up to that number.
- Every FAIL row names a finding, and every finding names at least one FAIL row.

### 6. Hand off

End with a short message to the user: the report path, the counts per status,
the findings by severity, and the list of proposed fix PRs (one per finding).
Those PRs are the owner's to schedule. Do not open them unless asked. Add an
entry to `docs/04-process/process-log.md` using
`docs/templates/process-log-entry.md`, as `AGENTS.md` requires for every
substantive session. Keep open-finding details out of that entry while it is
public: a count and severities, with no exploit steps.

## Repository notes

These items have answers or constraints written in this repository's
documents. Start from them, verify against the code under review, and cite the
document.

| Item                         | What the documents say                                                                                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUTHN-13                     | Demo credentials on the login page are deliberate: BY DESIGN (NFR-S1).                                                                                                                                                                            |
| AUTHN-05, AUTHN-07, AUTHN-10 | Remember-me, password reset and MFA are out of scope: BY DESIGN (SPEC-auth §8).                                                                                                                                                                   |
| AUTHZ-04                     | "No user table" and one demo identity (SPEC-auth §5), so no second user exists at the same level: N/A with that citation.                                                                                                                         |
| AUTHN-01                     | Verify statically: the password comparison runs even when the email does not match (SPEC-auth §4), and a malformed login body gets the same 401 as wrong credentials (§2.10). Do not sample timings: 10 failed logins per IP trip the rate limit. |
| CONF-01, AUTHZ-02            | The route matrix (SPEC-auth §2.10) names the public routes. `/api/test/*` must answer 404 outside the test environment. `POST /api/admin/reset` must refuse requests without the secret.                                                          |
| CONF-05                      | NFR-S6 leaves the WebMCP `Permissions-Policy` `tools` feature at its default `self`. A missing `tools` directive is intended, not a FAIL.                                                                                                         |

## Traceability to NFR-S

Findings cite the requirement they violate. These are the checklist items each
security requirement mainly touches. A FAIL on one of them is a failed
requirement, not only a hardening gap.

| NFR | Requirement (short)                                                                                                     | Checklist items                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| S1  | Demo credentials only; no personal data                                                                                 | AUTHN-13 (BY DESIGN), CONF-07                                            |
| S2  | httpOnly, secure, SameSite session cookie; 7-day sliding; every API route needs a session (exceptions: SPEC-auth §2.10) | SESS-02, SESS-04, SESS-06, SESS-13, AUTHN-02, AUTHZ-02, AUTHZ-05, VAL-32 |
| S3  | Server-side validation with shared schemas; amount bounds; enums; server-generated ids                                  | VAL-19, VAL-27, VAL-29, VAL-30, VAL-31, VAL-06, VAL-09                   |
| S4  | Write endpoints rate-limited                                                                                            | AUTHN-03, DOS-01, DOS-02                                                 |
| S5  | No secrets in the repository                                                                                            | CONF-08, CONF-02                                                         |
| S6  | Security headers (CSP, frame-ancestors, referrer policy); WebMCP `Permissions-Policy` `tools` left at default `self`    | CONF-05, SESS-13                                                         |
| S7  | Agent tool descriptions and outputs are untrusted; no raw HTML                                                          | VAL-01, VAL-02, VAL-03, VAL-21                                           |

NFR-D4 (public HTTPS deployment) covers TRAN-01 to TRAN-05. No requirement
names HSTS, so a TRAN-06 FAIL is a finding with requirement "none written".

A FAIL that no document covers is still a finding. Mark its requirement "none
written", because a missing requirement is itself worth the owner's attention.
