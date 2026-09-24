# Runbook — headed native WebMCP check

Status: **Draft — not yet run by a person** (T-12, 2026-09-24) · Author(s): Agent · Executed by:
the owner (a headed browser with a flag; no CI job and no agent session can do this — NFR-B2,
US-38 AC2, ADR-0003 "native mode is a headed runbook step")

## Why this exists

CI proves the polyfill and off paths. The native path — `document.modelContext` provided by the
browser itself — needs a browser that has it, so it is checked by hand.

## What is known and where it comes from

- Native support: Chrome ≥ 149 (origin trial), Edge ≥ 150 —
  `docs/00-discovery/research/webmcp-status.md` F6 (checked 2026-09-08).
- Local testing without an origin-trial token: `chrome://flags/#enable-webmcp-testing` and the
  "Model Context Tool Inspector" extension — the same note, F7 (a secondary source, 2026-09-08).
  Re-check both before running; the API moved once already (F8).
- The exact labels of the extension's UI are not recorded here because nobody has run it yet.
  After the first run, edit this page to match what you saw.

## Steps

1. Use Chrome ≥ 149. Open `chrome://flags/#enable-webmcp-testing`, enable it, relaunch.
2. Install the Model Context Tool Inspector extension.
3. Build and start the app in native mode (native means "opportunistic native, polyfill
   fallback" — SPEC-webmcp-tools §2.1):
   `WEBMCP_MODE=native npm run build && WEBMCP_MODE=native npm run start`
4. Log in as the demo user and open `/overview`.
5. Expected: the sidebar indicator reads **Agent tools: native · 2**.
   If it reads _polyfill · 2_, the browser did not provide `document.modelContext` before the app
   loaded — the flag is off or the build is too old. That is the fallback working, not a failure
   of the app; fix the browser and reload.
6. In the Tool Inspector, list the tools. Expected: `get_balance` and `get_overview_summary`,
   each with a description and an input schema with no properties.
7. Call each with `{}`. Expected: a result whose structured content is the Overview's figures in
   cents plus `currency: "USD"` and `unit: "cents"`.
8. Open Transactions from the sidebar. Expected: the indicator reads _native · 0_ and the
   inspector lists no tools; return to Overview and both are back.

## Record (fill in after each run)

| Date | Chrome version | Flag or OT token | Indicator on Overview | Tools listed | Both calls returned | Notes |
| ---- | -------------- | ---------------- | --------------------- | ------------ | ------------------- | ----- |
|      |                |                  |                       |              |                     |       |
