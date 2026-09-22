export const meta = {
  name: 'sdd-task',
  description: 'One SDD plan task: implement, package, review, bounded fix loop',
  whenToUse: 'Executing one task of an approved implementation plan with a review gate',
  phases: [
    { title: 'Implement', detail: 'fresh implementer per task brief' },
    { title: 'Review', detail: 'spec compliance + task quality' },
    { title: 'Fix', detail: 'fix round + scoped re-review, max 5' },
  ],
}

const A = args
const SKILL = '/Users/ruslan/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/skills/subagent-driven-development'
const WS = A.workspace
const BRIEF = `${WS}/task-${A.task}-brief.md`
const REPORT = `${WS}/task-${A.task}-report.md`
const CONTEXT = `${WS}/context.md`
const EXTRA = (A.extraFiles || []).map(f => `${WS}/${f}`)

const IMPL_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['DONE', 'DONE_WITH_CONCERNS', 'BLOCKED', 'NEEDS_CONTEXT'] },
    commits: { type: 'array', items: { type: 'string' } },
    testSummary: { type: 'string' },
    concerns: { type: 'string' },
    reportPath: { type: 'string' },
  },
  required: ['status', 'commits', 'testSummary', 'concerns', 'reportPath'],
}
const PKG_SCHEMA = {
  type: 'object',
  properties: { diffPath: { type: 'string' }, head: { type: 'string' }, commitCount: { type: 'number' } },
  required: ['diffPath', 'head', 'commitCount'],
}
const FINDING = {
  type: 'object',
  properties: {
    severity: { type: 'string', enum: ['Critical', 'Important', 'Minor'] },
    text: { type: 'string', description: 'file:line — what is wrong, why it matters, how to fix' },
    planMandated: { type: 'boolean', description: 'true if the brief/plan text explicitly requires the thing flagged, or the fix would contradict the brief' },
  },
  required: ['severity', 'text', 'planMandated'],
}
const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    specCompliant: { type: 'boolean' },
    specIssues: { type: 'array', items: { type: 'string' }, description: 'missing / extra / misunderstood, with file:line' },
    cannotVerify: { type: 'array', items: { type: 'string' } },
    findings: { type: 'array', items: FINDING },
    taskQuality: { type: 'string', enum: ['Approved', 'Needs fixes'] },
    reviewPath: { type: 'string' },
  },
  required: ['specCompliant', 'specIssues', 'cannotVerify', 'findings', 'taskQuality', 'reviewPath'],
}
const RR_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: { type: 'array', items: { type: 'object', properties: { finding: { type: 'string' }, addressed: { type: 'boolean' }, evidence: { type: 'string' } }, required: ['finding', 'addressed', 'evidence'] } },
    newBreakage: { type: 'array', items: FINDING },
    outOfScope: { type: 'array', items: { type: 'string' } },
    reviewPath: { type: 'string' },
  },
  required: ['verdicts', 'newBreakage', 'outOfScope', 'reviewPath'],
}

const COMMON_RULES = `
Working directory: ${A.worktree} (a git worktree on branch task/T-02a-secret-guard). Run every command from it.
The shell harness refuses commands whose git invocations it cannot prove stay inside this worktree (git in pipelines driven by variables, git hidden inside other launchers). Use plain, literal commands run from the worktree root; split compound commands if refused.
Never run git push, gh pr create/edit/ready, or anything that leaves this machine (controller ruling P1). Never merge. Never touch files outside the task's file list, except your report file in ${WS}.
Commit messages: use the exact message the brief gives, and end it with these two lines (keep the Co-Authored-By line the brief already has, add the second):
Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KxS8aoYzGp7ikX4BgnqQ5u
You do not dispatch subagents — not helpers, never a reviewer. Review is the controller's job, after your report.`

const implementerPrompt = () => `You are implementing Task ${A.task}: ${A.taskName}

Where this fits: ${A.fit}

## Task Description
Read your task brief first: ${BRIEF}
It is your requirements, with the exact values, code and commands to use verbatim. Copy code blocks exactly; do not "improve" them.
Shared context (Global Constraints, Decisions D1–D15 and owner answers, File structure): ${CONTEXT}
${EXTRA.length ? 'Also read: ' + EXTRA.join(', ') : ''}

## Controller notes for this task
${A.notes}

## Rules
${COMMON_RULES}

## Your Job
1. Implement exactly what the brief specifies, following its steps in order (TDD: failing test first, watch it fail for the stated reason, then implement).
2. Verify: run the focused tests while iterating, the full commands the brief names before committing.
3. Do the brief's "make each guarantee fail on purpose" step for real: apply each mutation alone, record which test went red, restore the exact original text, and confirm with git diff that no mutation remnant remains.
4. Commit as the brief says.
5. Self-review your own diff (completeness, YAGNI, pristine test output). Fix what you find.
If the brief's code or expected output does not match reality, do not silently deviate: fix only if the deviation is forced, explain it precisely, and report DONE_WITH_CONCERNS. If you cannot proceed, report BLOCKED or NEEDS_CONTEXT with specifics.

## Report
Write your full report to ${REPORT}: what you implemented; tests and results; TDD evidence (RED: command + relevant failing output + why expected; GREEN: command + passing output); the mutation table with the test that went red for each; files changed; self-review findings; concerns. Then return the structured result (status, commits as "sha subject", one-line test summary, concerns or "none", reportPath).`

const fixPrompt = (open, round, escalate) => `You are fixing review findings for Task ${A.task}: ${A.taskName} (fix round ${round} of 5).
${escalate ? `A prior implementer attempted this task ${round - 1} time(s); you own it now. Read the report file for what was tried.` : 'A previous implementer built this task; its report is the persistent memory of what was done.'}

Brief (requirements, verbatim values): ${BRIEF}
Shared context: ${CONTEXT}
${EXTRA.length ? 'Also: ' + EXTRA.join(', ') : ''}
Report file (read it; append your fix report at the end): ${REPORT}

## Controller notes for this task
${A.notes}

## Open findings to fix (verbatim from review)
${open.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Rules
${COMMON_RULES}
Fix only these findings. Commit the fix with a conventional message: "fix(secret-guard): <what> (T-02a review round ${round})" plus the two trailer lines.
Re-run the tests that cover the amended code (name the files), then append to the report file: what you changed, the covering tests, the exact command, and its output.
Return the structured result.`

const packagePrompt = (base) => `Run these two commands from ${A.worktree} and report the results. Do nothing else; do not modify any file.
1. git rev-parse HEAD
2. ${SKILL}/scripts/review-package ${A.plan} ${base} <the full SHA printed by command 1>
Command 2 prints "wrote <path>: <n> commit(s), <bytes> bytes". Return diffPath = that path, head = the full SHA from command 1, commitCount = n.`

const reviewPrompt = (pkg) => `You are reviewing one task's implementation: first whether it matches its requirements, then whether it is well-built. This is a task-scoped gate, not a merge review — a broad whole-branch review happens after all tasks.

## What Was Requested
Read the task brief: ${BRIEF}
Global constraints that bind this task: the "## Global Constraints" section of ${CONTEXT} (copied verbatim from the plan). The same file holds the plan's Decisions D1–D15 and the owner's plan-gate answers.
${EXTRA.length ? 'Also relevant: ' + EXTRA.join(', ') : ''}
${A.reviewFocus ? 'Task-specific constraints to hold the diff against: ' + A.reviewFocus : ''}

## What the Implementer Claims They Built
Read the implementer's report: ${REPORT}

## Diff Under Review
Base: ${A.base}  Head: ${pkg.head}  Diff file: ${pkg.diffPath}
Read the diff file once — it has the commit list, stat summary and full diff with context; its context lines ARE the changed files. Do not Read a changed file separately unless a hunk you must judge is cut off, and say so. Do not re-run git commands. Do not crawl the codebase: inspect code outside the diff only to evaluate a concrete risk you can name, one focused check per named risk, and name both.
Your review is read-only on this checkout: do not mutate the working tree, index, HEAD or branches. The only file you write is your review report at ${WS}/task-${A.task}-review.md.
You do not dispatch subagents.

## Do Not Trust the Report
Treat the report as unverified claims; verify against the diff. Design rationales in the report are the implementer grading its own work — they never downgrade a finding.

## Tests
The implementer ran the tests with TDD evidence. Do not re-run the suite. Run a focused test only for a specific doubt no existing run answers. Warnings or noise in reported test output are findings. If evidence looks truncated, re-read the report file; genuinely missing evidence is a gap to report, not grounds to re-run.

## Part 1: Spec Compliance
Missing (skipped / claimed but not implemented), Extra (unrequested, over-engineering), Misunderstood. Every file the brief lists must have its hunk. Requirements that live outside this diff or span tasks go to cannotVerify.

## Part 2: Code Quality
Separation of concerns, error handling, DRY without premature abstraction, edge cases; tests verify real behaviour; each file one clear responsibility; plan's file structure followed.

## Calibration
Critical/Important/Minor by actual severity. Important = this task cannot be trusted until fixed (incorrect or fragile behaviour, missed requirement, maintainability damage you would block a merge over, swallowed errors, tests that assert nothing). Polish and "coverage could be broader" are Minor. If the brief explicitly mandates something this rubric calls a defect, report it as Important with planMandated=true. Set planMandated=true also when the fix you propose would contradict the brief's text.

## Output
Write the full review to ${WS}/task-${A.task}-review.md in this format: Spec Compliance (✅/❌ + ⚠️ items), Strengths, Issues (Critical / Important / Minor, each with file:line, what, why, how), Assessment (Task quality: Approved | Needs fixes, 1–2 sentence reasoning). Every line a verdict, a finding with file:line, or a check you ran.
Then return the structured result; each finding's text must carry its file:line.`

const reReviewPrompt = (open, pkg, fixBase, round) => `You are re-reviewing Task ${A.task} fix round ${round}. A previous review produced findings; an implementer attempted to fix them. Verdict each finding and inspect the fix diff — nothing else.

Task brief: ${BRIEF}
Findings under verification:
${open.map((f, i) => `${i + 1}. ${f}`).join('\n')}
Implementer's report (fix reports appended at the end): ${REPORT}
Fix base: ${fixBase}  Head: ${pkg.head}  Diff file: ${pkg.diffPath}
Read the diff file once; do not re-run git commands. Read-only on this checkout; the only file you write is ${WS}/task-${A.task}-rereview-${round}.md. You do not dispatch subagents.
Scope: the findings and the fix diff. Issues entirely outside the fix diff go to outOfScope (non-blocking).
Tests: confirm the fix report names the covering tests and shows their output; do not re-run the suite.
For each finding: addressed = true only if the specific defect no longer exists ("attempted" is not addressed), with file:line evidence. New breakage in the fix diff: severity + file:line.
Write the full re-review to the file above (Finding Verdicts / New Breakage / Out-of-Scope / Verdict), then return the structured result.`

// ---------- run ----------
let impl = null
let pkg = null
let review = null
let minors = []
let open = []
let fixBase = null
if (A.fixOnly) {
  // Controller ruled on findings the review returned; go straight to the fix loop.
  open = A.fixOnly.open
  fixBase = A.fixOnly.fixBase
  minors = A.fixOnly.minors || []
  log(`fix-only run from ${fixBase}: ${open.length} finding(s) after controller ruling`)
} else {
  phase('Implement')
  impl = await agent(implementerPrompt(), { label: `implement:T${A.task}`, phase: 'Implement', schema: IMPL_SCHEMA, model: A.implModel, effort: A.implEffort, agentType: 'general-purpose' })
  if (!impl) return { task: A.task, stage: 'implement', status: 'NO_RESULT' }
  if (impl.status === 'BLOCKED' || impl.status === 'NEEDS_CONTEXT') return { task: A.task, stage: 'implement', impl }

  phase('Review')
  pkg = await agent(packagePrompt(A.base), { label: `package:T${A.task}`, phase: 'Review', schema: PKG_SCHEMA, model: 'haiku', effort: 'low', agentType: 'general-purpose' })
  if (!pkg) return { task: A.task, stage: 'package', impl, status: 'NO_RESULT' }
  review = await agent(reviewPrompt(pkg), { label: `review:T${A.task}`, phase: 'Review', schema: REVIEW_SCHEMA, model: A.reviewModel, effort: A.reviewEffort, agentType: 'general-purpose' })
  if (!review) return { task: A.task, stage: 'review', impl, pkg, status: 'NO_RESULT' }

  const blocking = review.findings.filter(f => f.severity !== 'Minor')
  minors = review.findings.filter(f => f.severity === 'Minor').map(f => f.text)
  const needsRuling = blocking.filter(f => f.planMandated)
  if (needsRuling.length) {
    log(`${needsRuling.length} plan-mandated finding(s): returning to controller for a ruling`)
    return { task: A.task, stage: 'needs-ruling', impl, pkg, review, needsRuling, minors }
  }
  open = [...review.specIssues.map(s => `Spec: ${s}`), ...blocking.map(f => `${f.severity}: ${f.text}`)]
  fixBase = pkg.head
}
let head = fixBase
const rounds = []
const outOfScope = []
let round = 0
while (open.length && round < 5) {
  round++
  const escalate = round >= 4
  phase('Fix')
  log(`fix round ${round}/5: ${open.length} open`)
  const fix = await agent(fixPrompt(open, round, escalate), { label: `fix:T${A.task}:r${round}`, phase: 'Fix', schema: IMPL_SCHEMA, model: escalate ? 'opus' : A.implModel, effort: escalate ? 'high' : A.implEffort, agentType: 'general-purpose' })
  if (!fix || fix.status === 'BLOCKED' || fix.status === 'NEEDS_CONTEXT') {
    return { task: A.task, stage: 'fix', round, fix, impl, review, open, rounds, minors }
  }
  const fpkg = await agent(packagePrompt(fixBase), { label: `package:T${A.task}:r${round}`, phase: 'Fix', schema: PKG_SCHEMA, model: 'haiku', effort: 'low', agentType: 'general-purpose' })
  if (!fpkg) return { task: A.task, stage: 'fix-package', round, impl, review, open, rounds, minors }
  const rr = await agent(reReviewPrompt(open, fpkg, fixBase, round), { label: `rereview:T${A.task}:r${round}`, phase: 'Fix', schema: RR_SCHEMA, model: 'sonnet', effort: 'medium', agentType: 'general-purpose' })
  if (!rr) return { task: A.task, stage: 're-review', round, impl, review, open, rounds, minors }
  const stillOpen = rr.verdicts.filter(v => !v.addressed).map(v => v.finding)
  const newBlocking = rr.newBreakage.filter(b => b.severity !== 'Minor').map(b => `${b.severity} (new in fix): ${b.text}`)
  minors.push(...rr.newBreakage.filter(b => b.severity === 'Minor').map(b => b.text))
  outOfScope.push(...rr.outOfScope)
  rounds.push({ round, from: fixBase, to: fpkg.head, addressed: rr.verdicts.filter(v => v.addressed).length, open: stillOpen.length + newBlocking.length, openList: [...stillOpen, ...newBlocking], fixStatus: fix.status, fixConcerns: fix.concerns })
  open = [...stillOpen, ...newBlocking]
  fixBase = fpkg.head
  head = fpkg.head
}

return {
  task: A.task,
  stage: open.length ? 'breaker' : 'complete',
  base: A.base,
  head,
  impl,
  review: review ? { specCompliant: review.specCompliant, specIssues: review.specIssues, cannotVerify: review.cannotVerify, taskQuality: review.taskQuality, reviewPath: review.reviewPath, findings: review.findings } : null,
  rounds,
  open,
  minors,
  outOfScope,
}
