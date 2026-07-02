---
description: Implement an already-designed feature, following the project's conventions
argument-hint: <the design write-up, a spec path, or a short description>
---

You are implementing a feature that has **already been worked out at design level**. Your job is the code, the tests, and the docs — not redesigning. If a design decision is genuinely missing, ask; don't invent it.

## What to implement

$ARGUMENTS

## Step 0 — load the project context

Read the **project profile** at [`.claude/project-profile.md`](../project-profile.md). It names, for *this* project: the code map, the binding rules, the test command + build notes, the stable-ID convention, and the doc-maintenance rule. All project specifics come from there.

If the input references a design write-up or a spec file, **that is your source of truth** — read it. If the profile is missing, ask me for the basics before writing code.

## Step 1 — get oriented cheaply

1. Read the project's **code map** (path from the profile) — this is your "where does code go" guide.
2. Read the relevant **design doc(s)** for the feature and the **binding rules** named in the profile.
3. Check the project's **engineering decision records** for anything touching the area you'll change.

## Step 1.5 — surface assumptions before writing code (don't guess)

Most implementation drift comes from quietly filling a gap in the design with an assumption. Before you write code, list **every assumption you're about to make** and **every place the design under-specifies a mechanic** (a formula, an edge case, a state transition, an ordering, a default). For each, either:

- cite the design/spec clause that settles it, or
- **stop and ask me** — a one-line question with your proposed default — when the choice is material and the design doesn't pin it down.

Only proceed past an unsettled, material ambiguity once I've answered. Trivial, clearly-implied details you may decide yourself, but state them in your final summary so they're visible. This is the cheap step that prevents an `/audit-feature` finding later.

## Step 2 — implement, honouring the binding rules

Treat every rule in the profile as a gate that gets a PR rejected. In particular (derive the exact list from the profile):

- **Layering** — keep game logic / rules where the profile says they belong; don't leak adapter/UI types into the core or business rules into the UI layer.
- **Determinism** — use the project's injected clock and seeded RNG; no wall-clock or ambient randomness in logic the profile marks deterministic.
- **Concurrency** — run state-mutating flows under the project's existing serialization; don't add a second writer.
- **Domain-specific invariants** — whatever the profile flags as foundational (for this project: offline-safety and low-action-high-decision). Don't break them for convenience.
- **Persistence** — schema changes go through the project's migration mechanism; respect which models are schema-free (e.g. JSON columns).
- **Terminology** — user-facing copy uses the canon verbatim; new term → add it to the canon first.

## Step 3 — tests

- Add/extend tests in the project's test project, matching the existing style and using its test doubles rather than real infra.
- Cover the invariants the profile calls out for the area you changed (e.g. loop/idempotency/determinism). Run the project's test command and **report the result honestly** — including the build notes in the profile for known non-code failures.

## Step 4 — update docs in the same change

Apply the project's **doc-maintenance rule** (from the profile): update the doc a behaviour change invalidates, tag new code with the stable IDs it implements, and reflect shipped planned-work in the design docs' status.

Work in small, verifiable steps. When done, summarise: what changed, where, which tests cover it, and which docs you updated.
