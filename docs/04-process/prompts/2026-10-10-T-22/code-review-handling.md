# Review handling

1. Fixed: an abort after the confirm marks the request, and its answer resolves the tool even on a failure;
   the dialog stays open for the person. Test added (fails without the fix).
2. Fixed: the id comes from a counter that only goes up. Test added (fails without the fix).
3. Fixed: the three rows are tests now.
4. Kept, with a comment: no write passes a signal yet, so `aborted` cannot happen; a caller that adds one
   must handle it first.
5. Fixed: the cleanup always releases the slot; `trackWrite` still counts the request in flight.
6. Partly: `AMOUNT_MAX` is `BigInt(AMOUNT_MAX_CENTS)`. The status table stays: `tool-result.ts` is in
   `src/webmcp`, and moving it to `src/shared` is outside this task.
7. Not a choice for the build: `ui-kit.md` 2.5 and 4.4 set `maxLength` 32 (an approved spec value); kept.
