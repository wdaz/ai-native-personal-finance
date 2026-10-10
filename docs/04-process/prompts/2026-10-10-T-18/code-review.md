# Review brief (general-purpose subagent, read-only)

Review `git diff origin/develop...HEAD` (T-18) against `transactions.md` 2.2–2.4, 2.13, 4.2–4.7, §6
"Server and API", §7's "Unit — domain", "Unit — shared and server" and "API" rows (v1.0.17), and the
plan's D1–D8. Look for: correctness bugs (sort keys and ties, every row of 2.3, the joined message),
contract mismatches (DTO, statuses, `no-store`, messages), layer violations (ADR-0002), tests that pass
vacuously or type seed figures, traceability, and §7 rows T-18 should test but does not. Read-only
commands only; no Postgres. Report numbered findings with file:line, severity, scenario and fix.

# Report (summary)

Nothing blocking. Seven findings: (1) 4.4's ties not generated, and the stand-in ids' soundness only a
comment; (2) some prose figures of 4.2 and 4.5 unchecked; (3) domain fixtures reusing seed values;
(4) 2.13's sentence that the helpers set no `no-store` is stale; (5) a lenient cut `q` can end in a
space; (6) an API title cites 2.10 for the 401 instead of 2.13; (7) `+`/`%20` checked lenient only, and
no repeated parameter whose first value is empty.
