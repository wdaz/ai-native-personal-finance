# T-18 review findings and what was done

| Finding | Done |
|---|---|
| Ties of 4.4 and the stand-in ids (general 1, Opus 3) | `idNeverDecides` in `scripts/seed-figures.ts`, asserted for the seed and every variant, with a violation fixture; 4.4's repeated names and amounts held to the spec text |
| Unchecked prose figures (general 2) | the date range, distinct timestamps, General's pages, the `a` search's pages and names, the untrimmed space and the page-5 numbers are derived and held to the spec text |
| Seed values in domain fixtures (general 3) | neutral names, dates and amounts |
| 2.13's stale `no-store` sentence (general 4, Opus 5) | corrected in `transactions.md` v1.0.17 |
| A cut `q` ending in a space (general 5, Opus 1) | trimmed again after the cut; 2.3 says so (v1.0.17); unit test |
| UTF-16 and surrogates (Opus 2) | the 60 stay UTF-16 units, as the field's `maxLength` and the name limit count; the cut drops a lone high surrogate; 2.3 says so; unit test |
| API title section (general 6) | 2.13 |
| `+`/`%20` strict, empty first value (general 7) | both modes; `sort=&sort=nope` reads as the default |
| `ErrorEnvelopeSchema` comment (Opus 4) | updated |
| `findMany()` without `select` (Opus 7) | selects the six fields the list uses |
| Seed rows rebuilt per view (Opus 9) | built once per `transactionFigures()` |
| Shared mapper and row type with Overview (Opus 6, 8) | not done: Overview's mapping also carries `recurring` for its bills and feeds a different domain input; one shared helper would couple two pages for two lines each. Left as is |
