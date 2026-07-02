---
description: Audit an already-built feature against its design, then reconcile the mismatches
argument-hint: <feature or system to audit>
---

You are auditing an **already-implemented** feature for drift from its intended design — the kind of mismatch that creeps in when an implementer had to fill a gap in the design with an assumption. You will **find** the mismatches, **report** them, let me **choose the direction** for each, then **fix** the confirmed ones. You do not silently rewrite anything: sometimes the code is right and the design doc is stale.

## What to audit

$ARGUMENTS

## Step 0 — load the project context

Read the **project profile** at [`.claude/project-profile.md`](../project-profile.md). It names, for *this* project: the design docs, the deeper specs (decision records / backlog / build-status mapping), the code map, the binding rules, the terminology canon, and the test command. All project specifics come from there. If it's missing, ask me where the design docs and code map live before auditing.

## Step 1 — assemble the intended design (the "should")

The high-level design docs are summaries; assumption-level bugs hide in the details, so gather the **full** intended behaviour:

1. Read the relevant **design doc(s)** for the feature (path/routing from the profile).
2. Read the **deeper specs** the profile points to that cover this feature — decision records (ADR-###), backlog specs, and the deliverable→code mapping in the build-status doc. These pin down mechanics the summaries don't.
3. Note the **binding rules** the feature must honour, and the **canonical terms** it uses.
4. Write down, as an explicit checklist, the concrete claims the design makes ("X resolves by Y", "the safe option zeroes Z"). **Flag every place the design is silent or vague** — those are exactly where an implementer would have had to assume.

## Step 2 — observe the actual behaviour (the "is")

Using the code map and the deliverable→code mapping, find the code that implements the feature and read what it **actually does** — the real formulas, branches, states, and edge-case handling. Read tests too: they encode what behaviour was assumed correct. Don't trust names; trace the logic.

## Step 3 — produce the mismatch report

Compare the checklist (Step 1) to the behaviour (Step 2). Present a table; one row per finding:

| # | Design says (doc ref) | Code does (file:line) | Severity | Likely cause | Recommended direction |
|---|---|---|---|---|---|

- **Severity:** Blocking (wrong player-facing behaviour or a binding-rule violation) · Should-fix · Minor.
- **Likely cause:** `design was silent/ambiguous` (assumption gap) · `code is wrong` · `design is stale — code is the better truth` · `intentional, undocumented deviation`.
- **Recommended direction:** **fix code** (align to design) · **update design** (code is right; the doc/spec is wrong or stale) · **clarify** (genuinely ambiguous — needs my call).

Also list, separately, the **silent spots** from Step 1 where the design never said and the code just picked something — even if the pick looks fine, these are the root cause and worth pinning down.

If you find **zero** mismatches, say so plainly and stop — don't invent findings.

## Step 4 — reconcile (interactive)

Present the report, then confirm direction **per finding** before changing anything. Use the AskUserQuestion tool in batched rounds (group findings; default each to your recommended direction so I can accept fast). Do **not** proceed to edits until directions are confirmed.

Then apply the confirmed directions:

- **Fix code** → implement the correction following the project's conventions exactly (the same gates as `/implement-feature`: layering, determinism, concurrency, persistence/migrations, terminology). Add or fix a test that **pins the now-correct behaviour** so it can't drift again. Run the project's test command and report honestly.
- **Update design** → edit the design doc (and the deeper spec/ADR if relevant) to match the real, better behaviour, and note *why* it changed. Apply the project's doc-maintenance rule.
- **Clarify** → ask me the specific question; once answered, route to fix-code or update-design.

## Step 5 — summary & prevention

End with: what was confirmed, what you changed (code vs docs), and which tests now guard it. If several findings traced back to the **same silent/ambiguous spot** in the design, call it out and offer to tighten that design doc so the gap stops producing assumptions — this is how the audit feeds back into prevention.
