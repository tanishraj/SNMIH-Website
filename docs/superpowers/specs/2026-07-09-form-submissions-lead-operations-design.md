# Form Submissions Lead Operations Design

## Summary

This spec turns `form-submissions` from a basic inbox into a first-class operations surface for the CMS starter.

The goal is not to build a CRM. The goal is to give every form submission a consistent operator workflow so client teams can safely triage, assign, follow up, and audit inbound activity after handoff.

This work builds on the existing forms and review-promotion foundation:

- all public form submissions already land in `form-submissions`
- review submissions already promote into linked `reviews` content
- operators already have a protected admin surface for submissions

What is missing is the common lead-operations layer that makes the collection useful for real marketing and intake workflows.

## Why This Direction

Three approaches were considered.

### 1. Recommended: one common operations model for all form submissions

Every form submission gets the same core operational fields and lifecycle, while form intent controls defaults and special automation.

This gives the starter one consistent operator workflow and avoids hidden submission classes.

### 2. Mixed submission models

Only some forms, such as contact or demo requests, get the full operations workflow, while lighter forms remain basic stored records.

This seems simpler initially, but it creates two mental models for operators and weakens handoff clarity.

### 3. CRM-like workflow now

Add assignment rules, activity history, service-level states, and automation routing immediately.

This would overfit the starter before the base submission model is stable and would push the project toward platform behavior too early.

### Decision

Use one common operations model for all form submissions, with manual assignment only in this phase.

## Product Contract

After this work:

- every form submission uses the same operational core
- every form declares a `submissionIntent`
- operators can assign ownership, add notes, and move submissions through a fuller resolution lifecycle
- review promotion continues to work inside the richer submission model
- the system captures optional source metadata when the frontend provides it
- the submission event seam carries richer metadata for future automation

This remains a CMS operations layer, not a CRM replacement.

## Architecture

### Single Submission Surface

`form-submissions` remains the single collection for inbound forms.

No new collections are introduced for:

- leads
- reviews intake
- newsletter records
- campaign contacts

This is a deliberate constraint. The starter should have one operator-facing inbox model, not multiple partially overlapping ones.

### Intent-Driven Behavior

The existing form-level submission typing should evolve into a clearer intent model:

- `general`
- `lead`
- `review`

Intent does not change where the submission is stored. It changes:

- operator expectations
- downstream event semantics
- special automation, such as review promotion

### Operator Surface

The primary operating surface is still `form-submissions`.

Operators should use it to:

- triage submissions
- assign ownership
- add internal notes
- understand source context
- navigate to promoted review content when relevant

The raw submitted payload remains visible for traceability, but it is not the main workflow surface.

## Schema Changes

### Forms

Each form should expose:

- `submissionIntent`
  - `general`
  - `lead`
  - `review`

Default should remain `general`.

This supersedes the earlier, narrower idea of submission typing while preserving the same architectural role.

### Form Submissions

`form-submissions` should use one common operations model for all submissions.

Core fields:

- `status`
  - `new`
  - `in_review`
  - `qualified`
  - `won`
  - `rejected`
  - `archived`
- `owner`
  - relationship to `users`
- `internalNotes`
  - operator-only notes
- `submissionIntent`
  - copied from the source form and stored read-only as intake truth
- `source`
  - optional submission source
- `campaign`
  - optional campaign identifier
- `landingPage`
  - optional captured page path or URL
- `lastActionAt`
  - tracks the last meaningful operator action

Existing read-only intake truth remains:

- `form`
- `submitterName`
- `submitterEmail`
- `submittedAt`
- `data`

Existing review-specific linkage remains:

- `linkedReview`
- `promotionError`

## Submission Lifecycle

The unified operator lifecycle should be:

1. submission arrives as `new`
2. operator optionally assigns `owner`
3. operator moves it into `in_review`
4. operator resolves it as `qualified`, `won`, `rejected`, or `archived`

This lifecycle applies across all submission intents.

Intent-specific meaning:

### General

- default operational workflow only
- no special automation
- still fully assignable and trackable

### Lead

- same lifecycle and schema
- intended for sales, demo, contact, or business-development workflows
- future integrations can key off this intent

### Review

- same lifecycle and schema
- retains automatic promotion into linked `reviews` content
- operators can still track the intake record independently of editorial publishing

## Manual Assignment Constraint

Assignment should be manual only in this phase.

This means:

- no automatic owner rules
- no round-robin assignment
- no campaign-based assignment policies
- no SLA engine

This keeps the starter operationally strong without prematurely embedding business-process assumptions that vary widely across client projects.

## Metadata Capture

Submission capture should support optional contextual metadata:

- `source`
- `campaign`
- `landingPage`

These values should be accepted when the frontend provides them.

Rules:

- they are optional
- they are persisted exactly when present
- they are not inferred later by the backend
- absence should remain empty, not fabricated

This gives the starter a clean seam for campaign operations without forcing every form integration to provide full attribution immediately.

## Event And Integration Seam

The submission event seam should stay minimal but become richer.

Event payloads should include:

- submission ID
- form ID
- form slug
- submission intent
- current status
- owner when assigned
- source metadata when available
- normalized submission values

This is still a starter seam, not a production automation engine.

Its job is to make future extension predictable for:

- CRM sync
- email automation
- internal notifications
- analytics enrichment

## Admin UX

The admin surface should emphasize operations instead of raw storage.

Recommended default list columns:

- `status`
- `owner`
- `submissionIntent`
- `submitterName`
- `submitterEmail`
- `submittedAt`
- `lastActionAt`

Recommended operator-facing behavior:

- `status`, `owner`, and `internalNotes` are editable
- intake truth fields stay read-only
- source metadata is visible and searchable
- review-related submissions expose the linked review relationship clearly

The raw JSON should remain available, but should not dominate the edit screen.

## Field Behavior

### Immutable Intake Fields

These fields remain read-only after creation:

- `form`
- `submissionIntent`
- `submitterName`
- `submitterEmail`
- `submittedAt`
- `data`
- `linkedReview`
- `promotionError`

### Operator-Managed Fields

These fields are the live operations surface:

- `status`
- `owner`
- `internalNotes`

### Derived Operator Activity

`lastActionAt` should update when operators change:

- `status`
- `owner`
- `internalNotes`

It should not replace `submittedAt`. Both timestamps matter:

- `submittedAt` = when the intake happened
- `lastActionAt` = when an operator last touched the record meaningfully

## Review Compatibility

This operations layer must not break the review-intake architecture.

Required compatibility:

- review submissions still store an immutable intake record first
- review submissions still promote into linked draft reviews
- operators can triage the submission independently of the review content
- editors can continue publishing from `reviews`

The richer submission model supports review workflows; it does not replace them.

## Verification

Implementation is only complete when these behaviors are verified:

- all forms persist a shared operations model
- `general`, `lead`, and `review` intents persist correctly
- `status` supports the expanded lifecycle
- manual `owner` assignment works
- editing `status`, `owner`, or `internalNotes` updates `lastActionAt`
- optional `source`, `campaign`, and `landingPage` metadata store correctly when provided
- generic non-review forms continue to submit without regression
- review submissions still promote into linked `reviews`
- the event seam still fires and includes the richer metadata payload

## Non-Goals

This work does not include:

- automatic owner assignment
- SLA timers or escalation rules
- activity feeds or comment threads
- CRM-level opportunity management
- multi-pipeline workflow logic per form
- custom operator workflows per client

These can be added later through extension seams if specific client projects need them.

## Recommendation

The starter should treat every form submission as operationally important enough to track, even when some forms are lighter than others.

That means:

- one collection
- one common operations model
- one consistent operator workflow
- intent-driven behavior layered on top

This is the strongest next step toward a complete, handoff-safe marketing CMS because it turns inbound form activity into something teams can actually operate instead of merely store.
