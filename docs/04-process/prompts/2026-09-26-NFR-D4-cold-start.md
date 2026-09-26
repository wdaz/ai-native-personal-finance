# Prompt — NFR-D4's cold-start note, missed by T-14

The same background Claude Code session (Sonnet 5) that ran T-14, continued after its context was
compacted, started this change from the current `main` (`376af44`) with the repository's `AGENTS.md`,
`CLAUDE.md` and the owner's memory loaded. Three owner messages, verbatim (Azerbaijani; English in
brackets), in the order they arrived:

    Cold start yoxlanılıb?
    [Has cold start been checked?]

    Yaz və pr yarat
    [Write it and create a PR]

    bitmiş olaraq qeyd et
    [Record it as done]

The first is a question, asked after the agent had answered "what is cron" for the owner. The agent
searched the documents for "cold start" before answering (`docs/01-requirements/non-functional-
requirements.md` D4, `docs/03-specs/tech-debt.md` TD-21, `docs/04-process/plans/2026-09-25-T-14.md`
lines 890–891, the runbook), answered "no", and took one read-only measurement of production
(`GET /api/meta`, cold 2.96 s, warm 0.44 s) to say where it stood. The second message accepted the
agent's offer of "a small docs pull request, no code". The third arrived while the agent was
starting it; the agent read it as: write NFR-D4's cold-start note into the documents as **done**
(closed, not left as a follow-up), and rested "done" on measurements rather than on the first
single data point — three rounds, ten minutes idle before each.

The brief the agent worked from is the documents themselves: NFR-D4 ("cold start ≤ 10 s documented
if the host sleeps", verified by "Runbook"); TD-21's **Not measured** and **Fix** lines ("NFR-D4's
cold-start note still has to be written"); `docs/04-process/runbooks/deploy.md` step 5 and its
Record table; the standing rules of `AGENTS.md` §2 (one change per PR, conventional commits, the
process log), `docs/03-specs/definition-of-done.md` and `docs/04-process/governance.md` (the owner
merges; agents never merge).

The measurement script is `2026-09-26-NFR-D4-cold-start/scripts/cold-rounds.sh`. It sends GET
requests to public URLs only and carries no secret. The copy that ran wrote to the job's temporary
directory; the saved copy takes the output path as its first argument and lets `BASE` override the URL, and is
otherwise the same.
