# Research note — Frontend Mentor licence: what may be public in this repository

Status: Final (v1) · Author(s): Agent (Claude, Cowork) · Date: 2026-09-20
Answers: what happens to the challenge material when the repository goes public (T-16); raised by the T-01 agent's README-attribution suggestion.

## Question
The repository will become public. It contains material from the Frontend Mentor "Personal finance app" challenge (a **Pro/premium** challenge with Figma designs). What may stay, what must go, and what attribution is required?

## Answer (short)
Public solution repositories are not just allowed but expected — Frontend Mentor requires a public repo and a live URL to submit a solution. Starter assets (avatars, illustration, `data.json`, the challenge README) are what every public solution ships, and `README-template.md` prescribes the attribution: a link to the challenge page and the "Challenge by Frontend Mentor. Coded by …" footer. The hard rule is **"don't distribute the design files"**: the `.fig` is already excluded, but the two Claude Design exports in `docs/00-discovery/inputs/design/` are rendered reproductions of the premium design (every screen, the style guide, the illustration) and sit in a grey zone that is closer to the forbidden side. Recommendation: keep them out of the public repository — remove them from the tree **and from history** in T-16 (or before the first public push), and keep them in the private Claude project / locally. The licence also forbids using *premium* challenges in free content, courses or tutorials; a portfolio write-up about the process is not a tutorial, but if the project becomes a blog series or talk, ask support@frontendmentor.io first.

## Findings
| # | Finding | Source | Date |
|---|---------|--------|------|
| F1 | Allowed: streaming yourself doing challenges; using **free** challenges in free content/courses "while providing attribution to Frontend Mentor and linking to the challenge page". | [Challenge License & Usage](https://www.frontendmentor.io/license) | 2026-09-20 |
| F2 | Forbidden: "don't distribute the design files"; "re-selling or distributing free or premium challenge starter code"; "using any challenges in commercial content … with or without attribution" without a commercial licence; "using **premium** challenges in your free content/course/tutorials". | same | 2026-09-20 |
| F3 | Submitting a solution requires "a repository where our code is stored so that other people can easily see it" — **public** — plus a live URL (GitHub Pages, Vercel, Netlify recommended). | [A complete guide to submitting solutions](https://medium.com/frontend-mentor/a-complete-guide-to-submitting-solutions-on-frontend-mentor-ac6384162248) | 2026-09-20 |
| F4 | The starter `.gitignore` shipped with the challenge excludes only `*.sketch`, `*.fig`, `*.xd` ("Please do not remove lines 5 and 6"); it does not exclude images, fonts or `data.json` — i.e. those are expected in public solutions. | `~/Own/personal-finance-app/starter-code/.gitignore` (local copy) | 2026-09-20 |
| F5 | `README-template.md` (starter) opens with "This is a solution to the [Personal finance app challenge on Frontend Mentor](https://www.frontendmentor.io/challenges/personal-finance-app-JfjtZgyMt1)" and ends with author links incl. a Frontend Mentor profile — the expected attribution shape. | local copy | 2026-09-20 |
| F6 | The Figma README that ships with the design: "Please be sure not to share our design files with anyone else … keep the design file separate from your codebase." | `~/Own/personal-finance-app-figma/README.md` (local copy) | 2026-09-20 |
| F7 | Challenge page: "Build a Personal Finance App — Frontend & Full-Stack Project", "professional Figma designs included"; it is one of the Pro challenges. | [Challenge page](https://www.frontendmentor.io/challenges/personal-finance-app-JfjtZgyMt1) | 2026-09-20 |
| F8 | Many public full-stack solutions of this exact challenge exist on the platform (Next.js + Prisma + PostgreSQL, Angular + Express, Astro …), each linking a public GitHub repo. | [Solutions list](https://www.frontendmentor.io/solutions/fullstack-personal-finance-app-coding-challenge-solution-PkY0Fanf-A) | 2026-09-20 |

## What is in this repository today
| Item | Origin | Public? | Action |
|------|--------|---------|--------|
| `public/avatars/*.jpg` (30) | starter assets | Yes — every solution ships them (F4) | keep; attribution in README |
| `docs/00-discovery/inputs/data.json` | starter | Yes | keep |
| `docs/00-discovery/inputs/challenge-brief.md` | starter README | Yes — commonly committed; it is the brief, not the design | keep, add a one-line origin note at the top |
| `docs/02-architecture/design-tokens.md` | values also in the starter's public `style-guide.md` | Yes | keep |
| `docs/00-discovery/inputs/design/style-guide.html` | Claude Design export **of the Figma file** | Grey → treat as No | remove from tree and history before public (T-16) |
| `docs/00-discovery/inputs/design/app-prototype.html` | Claude Design export **of the Figma file** (all screens, illustration) | Grey → treat as No | same |
| `personal-finance-app.fig` | design file | No | never in repo (already ignored) |
| Login illustration (`illustration-authentication.svg`) | starter assets | Yes when copied from the starter (T-06) | keep |

## Implications for this project
1. **T-16 gains a step:** remove `docs/00-discovery/inputs/design/*.html` from the working tree and rewrite history (`git filter-repo --path docs/00-discovery/inputs/design/app-prototype.html --path docs/00-discovery/inputs/design/style-guide.html --invert-paths`) before the repository is made public; update `inputs/design/README.md` to say the exports live outside the repo and how to obtain them (re-export from Claude Design). All specs that cite the exports keep the citation — the files are an input, not a dependency of the build.
2. **README attribution (T-16, as the T-01 agent proposed):** "Solution to the Personal finance app challenge on Frontend Mentor" with the challenge link, the "Challenge by Frontend Mentor. Coded by Ruslan Haqverdi" footer, and a note that the design is not included.
3. **Process narrative is fine; a tutorial is not.** The portfolio's process story (docs, log, retrospective) is a solution write-up. If it turns into a course, talk series or paid content, contact support@frontendmentor.io first (F2).
4. **Licence for our own code:** Frontend Mentor's terms do not address it. An MIT licence for *our* code with an explicit "challenge assets © Frontend Mentor, used under their terms" clause is the common pattern; decide in T-16.

## Confidence and expiry
High on F1–F6 (primary sources and shipped files). The exports' status (grey zone) is a judgement, not a stated rule — the conservative choice costs nothing. Re-check the licence page before T-16.
