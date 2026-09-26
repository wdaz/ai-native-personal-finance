# Prompt — T-16: what is already done, written down

The same background Claude Code session (Sonnet 5) that closed the Status lines, working from
`origin/main` `d058cce` (PR #65's merge). The owner's messages, verbatim (Azerbaijani), in order:

    T-16-nın done olması üçün nələr qalıb?

("What remains for T-16 to be done?")

    1. Public flip nədir?
    2. Hazırda done sayılan işləri taskda qeyd aparaq ki, onları təkrar yoxlamayaq.

("1. What is the public flip? 2. Let us record in the task what counts as done now, so that we do not
check it again.")

The brief the agent worked from is its own answer to the first message: the list of what T-16's backlog
row still asks for, sorted into what is finished, what is real work, and what waits for the owner. Only
the first bucket — the finished items — goes into this pull request, each with the source it was read
from and the date, as the owner asked. Standing rules: `AGENTS.md` §2 (one change per PR, conventional
commits, the process log, never fabricate), `docs/04-process/governance.md` (only the owner marks
anything Approved; the owner merges).
