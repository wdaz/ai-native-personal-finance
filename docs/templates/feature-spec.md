# SPEC-<feature> — <feature name>

Status: Draft | In review | Approved
Author(s): <owner / agent> · Date: YYYY-MM-DD
Implements: US-xx, US-yy · Constrained by: ADR-NNNN, NFR-x
Design: <Figma frame names>

## 1. Purpose

*One paragraph: what the user achieves.*

## 2. Behaviour

*Precise, in the order the user meets it. Numbered so tests can reference
"2.3".*

## 3. States

| State | Trigger | What the user sees | Exit |
|-------|---------|--------------------|------|
| Empty | | | |
| Loading | | | |
| Error | | | |
| Default | | | |

## 4. Rules and boundaries

*Validation, limits, calculations (with worked examples from `data.json`),
date handling, money formatting.*

## 5. Data

*Entities read and written; fields; who owns the source of truth.*

## 6. Interfaces

### UI
*Components/routes touched, keyboard behaviour, accessible names.*

### API
*Endpoints or server actions, request/response shape, errors.*

### WebMCP tools
| Tool | Type | Input schema | Output | Safety rule |
|------|------|--------------|--------|-------------|

## 7. Tests required

| Level | What is asserted | Traces to |
|-------|------------------|-----------|
| Unit | | rule 4.x |
| Integration/API | | 6.API |
| E2E | | behaviour 2.x |
| WebMCP | | 6.tools |

## 8. Out of scope

## 9. Open questions

*Anything an implementing agent would have to guess. The spec is not
Approved while this section is non-empty.*
