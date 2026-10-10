# Code review — handling

- **1 — kept, with a reason.** `router.refresh()` has no completion signal, so the tool cannot wait for it; the
  window is one server render. The answer is the structured, retryable `not_found` (`write-path.md` 2.11 (4)), and
  `list_budgets` shows the new id. Remembering added ids in the bus would make the page's delete dialog name a
  budget it does not yet show. No change.
- **2 — kept, as the spec reads.** `budgets.md` 2.13 and H15 say the tools call the API themselves and the page
  refreshes after; `ui-kit.md` 2.3's "a write of the page" is the page's own write function, which `trackWrite`
  counts. An agent's write is the server's to order (last write wins, as two tabs do). No change.
- **3 — fixed.** Every positional locator is now a named one: the card by its category, the avatar by its row,
  the used option by its theme, the donut segment by its colour, the Spent/Remaining pair as a list.
- **4 — fixed.** `Donut` keys segments by theme and occurrence; Overview's markup is otherwise unchanged
  (`overview.spec.ts` passes).
- **5 — kept.** BU-Q9 (a) chose the server table knowing it is px-based; noted.
- **6 — `formRef` removed.** The second parse narrows the amount's type for the request; the unplaced-issue
  message is `ui-kit.md` 2.7's form error for any write. Kept.
- **7 — the comment removed;** the follow-up commits use the conventional form.
