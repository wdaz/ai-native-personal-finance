# Prompt — Release 1 housekeeping: Status lines

The same background Claude Code session (Sonnet 5) that prepared TD-19 and TD-20, working from
`origin/main` `376af44` (PR #64's merge). The owner's messages, verbatim (Azerbaijani), in order:

    T-14 bağlanıb? Artıq #64 merge oldu

("Is T-14 closed? #64 is merged now.")

    T-15 keçidi bloklayan başqa nə yarımcıq işlər qalıb?

("What other unfinished work blocks the move to T-15?")

    1. cold start nədi? Nə üçün lazımdır?
    2. Olsun. Amma siyahını göstər.
    3. Ümümi retroda danışacam.

(Answering the agent's three proposals: 1 — the cold-start measurement for NFR-D4: "what is a cold
start, why is it needed?"; 2 — the pull request for the stale Status lines: "yes, but show the list";
3 — the empty "Owner changes" fields of the process log: "I will speak about them at the general
retrospective".)

    a. bəli
    B. Bu demo məqsədli olduğu üçün buna ehtiyyac yoxdu. Digər sesiyada aparıldı və rəqəmlər normaldı. Ona görə bypass etmək olar.

("a. yes" — the pull request with the list the agent had shown; "B. This is a demo, so it is not
needed. It was done in another session and the numbers were normal. So it can be bypassed.")

    B bəndini artıq digər sesiyada bağlayıram. Sən ancaq Statusları düzəlt

("I am closing item B in the other session already. You only fix the Statuses." — sent while the agent
was editing; it narrowed the pull request to Status lines and dropped the cold-start note.)

The brief the agent worked from is the list it showed the owner in its reply to "2. Olsun. Amma
siyahını göstər.": sixteen plan files to *Done* with their pull request and merge commit, the deploy
runbook's Status, and the assumptions file's Status and its Q3/Q4 cells. Standing rules:
`AGENTS.md` §2 (one change per PR, conventional commits, the process log),
`docs/04-process/governance.md` (only the owner marks anything Approved; the owner merges).
