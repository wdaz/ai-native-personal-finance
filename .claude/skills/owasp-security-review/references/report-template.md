# Report template

Use this structure for every run so that two reports can be diffed. Replace
the angle-bracket placeholders; delete nothing — an empty section says
"None." rather than disappearing.

```markdown
# OWASP security review — <app name> — <YYYY-MM-DD>

- **Scope:** <all 13 categories | the categories reviewed>
- **Target:** <local production build (`npm run build && npm start`) at http://localhost:<port> | deployed host (passive) | static only>
- **Commit:** <full SHA> on <branch>
- **Reviewer:** <agent, model> for <owner>
- **Checklist:** OWASP Web Application Security Testing Cheat Sheet, 131 items (skill IDs)

## Summary

| Status     | Count                    |
| ---------- | ------------------------ |
| PASS       | <n>                      |
| FAIL       | <n>                      |
| BY DESIGN  | <n>                      |
| N/A        | <n>                      |
| NOT TESTED | <n>                      |
| **Total**  | <n — 131 for a full run> |

Findings by severity: Critical <n> · High <n> · Medium <n> · Low <n> · Observations: <n>

<Two to four sentences: the overall posture, the most important finding, and
what was not tested and why.>

## Findings

One block per finding, most severe first. A finding is one defect and may fail
several checklist items; each of those FAIL rows names the finding. IDs are
`F-01`, `F-02`, … within this report.

### F-01 — <short title> (<Critical | High | Medium | Low>)

- **Checklist items:** <SESS-07, SESS-10>
- **Requirement:** <NFR-S2 / SPEC-auth §4 / ADR-0006 — or "none written" if no document covers it>
- **Evidence:** <file:line, test name, or the exact command and the relevant lines
  of its output — copied from the run, cookie values and secrets redacted>
- **Impact:** <what an attacker can do, in this app, given its real users and data>
- **Recommendation:** <the fix, and the failing test that should prove it>
- **Proposed PR:** `fix(<area>): <summary>` — one finding per PR, test first

## Observations

Things worth recording that need no change. They do not become PRs.
"None." if there are none.

## By design

Items that look like failures but are documented decisions. The owner can
revisit any of them.

| ID         | Behaviour                                  | Decision it follows |
| ---------- | ------------------------------------------ | ------------------- |
| <AUTHN-13> | <demo credentials shown on the login page> | <NFR-S1>            |

## Not tested

| ID        | Reason                      | What would settle it                                            |
| --------- | --------------------------- | --------------------------------------------------------------- |
| <TRAN-01> | <no deployed host in scope> | <one `openssl s_client -connect <host>:443 -servername <host>`> |

## Full checklist

One row per item, in checklist order. Evidence is short: a path with line,
a test name, a command, or for N/A the search that found nothing.

| ID      | Status | Evidence | Finding |
| ------- | ------ | -------- | ------- |
| INFO-01 | <PASS> | <…>      |         |
| SESS-07 | <FAIL> | <…>      | <F-01>  |
| …       |        |          |         |

## Method

- Commands run (in order, with the target), and which items each one covered.
- Existing tests cited as evidence, with the command used to run them and its result.
- Anything deliberately not done (e.g. no requests to the deployed host) and why.
```
