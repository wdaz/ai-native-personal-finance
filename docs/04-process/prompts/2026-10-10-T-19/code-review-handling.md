# T-19 review findings and what was done

The `/code-review` skill on Opus (`code-review-opus.md`) found nothing blocking. Copilot could not review this
pull request (three errors on its side), so this is the one review, per the owner's rule of 2026-10-10.

| Finding | Done |
|---|---|
| 1. The pagination moved focus after every page change, also on Back and Forward, and `.focus()` scrolled the page (should-fix) | focus moves only after a control of the pagination was activated, with `preventScroll`; unit test |
| 2. Back and Forward resynced the controls only when the server's answer changed: an abandoned push or a clamped view left the intended query stale and the history flag set (should-fix) | `popstate` bumps a counter the resync effect depends on, so it runs on every Back and Forward; two unit tests (each fails without the fix) |
| 3. Enter ending an IME composition submitted the search (nit) | ignored while `isComposing` |
| 4. The status line marked a change spoken before its frame ran (nit) | marked inside the frame |
| 5. A second read of the table for "No transactions yet" (nit) | left as is: 2.1 and 2.10 specify it, and the read only happens when a search finds nothing |
| 6. A page click during a pending search keeps the clicked page (nit) | left as is: spec 2.5 says so (the search applies, then the page change) |
| 7. Duplication: `TransactionsError`/`OverviewError`, `listTransactionsPath`/`transactionsSearch`, the visually hidden rule (nit) | left as is: each sits in its own layer or page and joining them couples pages for a few lines; noted for a later tidy-up |
| 8. `pageItems`' `maxNumbers` acts as a switch (nit) | left as is: the only callers pass the two constants; its doc comment names them |
