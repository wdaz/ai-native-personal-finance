# Report — ui-kit review 4, stand-in, scope (T-15d S1b)

As returned by a read-only Opus reviewer that stood in for Copilot (which errored), by the owner's decision of 2026-10-05, for commit 00fc2cfec8a5b16f5137774aee4eab62e52f0975.

**Minor findings**

1. **`docs/03-specs/ui-kit.md:291`, and `docs/03-specs/release-2-handoffs.md:31` (H13 (5)), cite the wrong rule.**
   - What is wrong: both cite "plan D14" for the rule that changing an Approved document goes to the owner.
   - Evidence: D14 (plan on `develop`, lines 92–96) lists S2's lessons for drafters' briefs ("a spec that changes what the design draws asks the owner; reading the designer's changelog is not approval…"). It says nothing about amending Approved documents. That rule is in `governance.md` (v1.10, "Still the owner's…": "Every amendment of an Approved document, which the owner approves by merging its pull request").
   - Fix: cite governance v1.10 ("Every amendment of an Approved document"), or governance plus D14, in both places.
   - Severity: minor.

2. **`docs/03-specs/release-2-handoffs.md:3` edits the Status line, which plan D10 does not allow.**
   - What is wrong: D10 says "Each spec pull request edits only its own new row and the Done cells it fills", to avoid conflicts between the parallel spec pull requests. This PR also rewrites the shared Status line, which the parallel S3–S6 pull requests will also want to edit, so it invites the merge conflicts D10 is meant to prevent.
   - Evidence: the Status line diff in this PR, against D10's text in the plan.
   - Fix: drop the Status line change and let the H13 row stand on its own, or record in D10 or the process log that adding one Status clause per spec is accepted.
   - Severity: minor. Your review brief allows this edit, but the plan's wording does not.

3. **`docs/03-specs/release-2-handoffs.md:31` (H13 (5)) and `docs/03-specs/ui-kit.md:7` tie every design fact to the v0.3 re-read.**
   - What is wrong: both say the design facts are those "re-read for `ui-kit.md` v0.3" ("(v0.3)" on line 7).
   - Evidence: the changelog's §12–§16 facts the spec now uses (UK-Q4's last part, UK-Q10, the 47 px box, §15a) were read for v0.6 and v0.7, as `ui-kit.md` §9 "The design source" (line 347) itself records.
   - Fix: say "re-read on 2026-10-05 (v0.3, again for v0.6 and v0.7)".
   - Severity: minor.

VERDICT: no important findings

Its passed checks (as relayed with the findings): Status Draft v0.8; transactions.md only the 2.8 sentence + v1.0.13; tech-debt.md only v1.29 + TD-24; release-2-handoffs.md only Status, H3 cell, H13; no /Users/ or design address or project id; §9 all answered; owner quotes identical; governance v1.10 and plan citations match develop; D11 done.
