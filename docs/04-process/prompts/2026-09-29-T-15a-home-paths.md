# Prompt — T-15a, pull request A: the absolute home-directory paths leave the tree

The same background Claude Code session (Opus 5.5) that wrote T-15a's plan
(`plans/2026-09-28-T-15a.md`, PR #70; its prompt record is `prompts/2026-09-28-T-15a.md`). The owner's
answers at the plan gate, verbatim (Azerbaijani), in order:

    Q1,Q2,Q3,Q4,Q6-bəli tövsiyə olunan, Q5 - bu frontend mentor https://www.frontendmentor.io/profile/wdaz, Coded by - giyhub olsun.
    Q7 MİT əsasən nəyi əhatə edir və nə üçün lazım olur?

("Q1, Q2, Q3, Q4, Q6 — yes, the recommended ones. Q5 — this is the Frontend Mentor profile …; 'Coded by'
should be GitHub. Q7 — what does MIT mainly cover, and why is it needed?" The agent explained MIT's grant
and conditions, why a public repository without a licence is "all rights reserved", and four options for
the documents.)

    Bu tam proyekt tam olaraq qorunsun. Həm kod, həm də sənədlər. Ançaq şəxsi istifadə üçün azaddır.

("The whole project is to be fully protected, code and documents both, but free for personal use." The
agent read the PolyForm Strict and Noncommercial 1.0.0 texts from
`github.com/polyformproject/polyform-licenses` and offered four options, recommending (a) PolyForm Strict
1.0.0 for the whole repository.)

    Doc pr merge edim? Orda şərhlər var

("Should I merge the doc PR? There are comments on it." The agent answered no: by Q1a the plan pull
request merges after A. It assessed Copilot's three comments: the prompt record in a plan pull request
has precedent (T-14's, `9fae561`); reading each file as a buffer before decoding is right and is taken
into A's test; "check are gone" is grammatical — "exports" is the subject.)

    Lisenziya üçün Variant A

("Option A for the licence.")

The brief the agent worked from: the plan's Tasks A1 and A2 — the guard test first and red, then the
prefix-only substitution, proved prefix-only, the scripts checked with `sh -n`; backlog v1.50 records
the answers, A's done-marker and the licence change; one pull request to `main`.

Standing rules: `AGENTS.md` §2 (one change per pull request, conventional commits, the process log, never
fabricate), `docs/04-process/governance.md` (the owner merges).
