---
description: Review the current changes against the project's binding design & architecture rules
argument-hint: (optional) a focus area, PR, or branch to review
---

Review the pending changes against the project's binding rules. This is a **design-and-architecture conformance review** — complementary to, not a replacement for, generic correctness/security review skills (the profile lists any the project has; run those for bugs and vulnerabilities, run this for "does it respect how this project is built").

Focus / scope (optional): $ARGUMENTS

## Step 0 — load the project context

Read the **project profile** at [`.claude/project-profile.md`](../project-profile.md). It enumerates, for *this* project: the binding rules (pillars + architecture decisions), the terminology canon, the persistence/migration mechanism, and the doc-maintenance rule. Your checklist is derived from that profile — not hard-coded here. If it's missing, ask me where the project's rules live before reviewing.

## Step 1 — establish the diff

Look at what changed: `git status`, `git diff <base>...HEAD` (or the working tree if uncommitted). If a focus area is given, weight toward it but still scan the whole diff for rule violations.

## Step 2 — review against each rule in the profile

Read the binding-rules docs the profile points to, then check the diff against every one. As a generic spine (map each to the profile's specifics):

1. **Layering** — did any adapter/UI type leak into the core, or any business rule into the UI layer?
2. **Determinism** — any wall-clock or ambient randomness where the project requires an injected clock / seeded RNG? Still idempotent where required?
3. **Concurrency** — does a new state-mutating path run under the project's serialization? Any second writer?
4. **Domain invariants** — whatever the profile marks foundational (for this project: offline-safety, low-action-high-decision). Any violation?
5. **Single-source gates** — does any view/path reinvent a gate the project centralises (e.g. a display-tier/permission resolver)?
6. **Terminology** — does user-facing copy match the canon verbatim? New term added to the canon?
7. **Persistence** — schema change without a migration, or a migration for what's actually schema-free?
8. **Doc-maintenance rule** — behaviour changed without updating the doc it invalidates? New stable IDs tagged in code?
9. **Tests** — are the invariants the profile calls out still covered for what changed?

## Step 3 — output

Group findings as **Blocking** (a binding-rule violation), **Should-fix**, and **Nits**. For each: `file:line`, the rule it breaks, and the concrete fix. End with a one-line verdict: safe to merge against the project's rules, or not?
