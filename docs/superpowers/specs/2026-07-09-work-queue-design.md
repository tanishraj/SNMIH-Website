# Work Queue Design

## Summary

This spec introduces `work-queue` as a first-class operational collection for the editorial-first CMS starter.

The goal is to give operators one durable admin surface for actionable work that emerges across the CMS, while keeping content collections as the source of truth for content itself.

This is not a generic project-management system. It is an operational layer for managing the kinds of actions that already exist in this starter:

- approvals
- moderation
- follow-up
- publish blockers
- media governance issues
- system/content exceptions that require human action

The admin experience should feel like `Operational Audit Events`: a normal Payload collection under the `Admin` group, with list filters, edit views, and direct navigation. The difference is that `Operational Audit Events` is read-only historical evidence, while `Work Queue` is an editable operational inbox.

## Why This Direction

Three approaches were considered.

### 1. Recommended: persisted queue collection with hook-driven sync

Every actionable source can create or update a canonical queue item through a shared sync layer.

This gives operators:

- one list view
- durable assignment and status tracking
- one filtering model
- stable URLs for queue items
- operational history that survives source state changes

It also matches the admin collection layout the project already uses successfully.

### 2. Computed admin dashboard with no stored queue records

The system could derive actionable work on the fly from each collection and render a custom dashboard.

This reduces schema work, but it is the wrong fit here. Operators need editable status, assignee, notes, due dates, and resolution summaries. A computed-only surface becomes fragile, inconsistent, and harder to test.

### 3. Partial queue for only a few collections

The system could support only `reviews`, `form-submissions`, or only approval workflows at first.

That would be easier to ship, but the user direction is explicit: this should be full-fledged and cover the operationally relevant CMS surfaces in one pass. A partial queue would immediately create exceptions and weaken the handoff story.

### Decision

Use a real `work-queue` collection under `Admin`, with automatic item creation and synchronization across all relevant source collections.

## Product Contract

After this work:

- operators have a single `Work Queue` collection in the admin
- queue items are created automatically from existing CMS events and source states
- operators can change queue status, assignee, priority, due date, notes, and resolution summary directly in the collection
- queue items link back to the underlying source document
- source snapshot fields inside the queue remain read-only
- queue records are preserved for operational history even after the underlying issue is resolved
- duplicate queue items are prevented by a canonical dedupe key
- admins always have access and capability-based users can be granted queue access explicitly

This remains a CMS operations layer. It does not replace approvals, content collections, forms, or audit logging.

## In Scope

Day-one coverage includes all currently relevant actionable surfaces:

- `pages`
- `articles`
- `reviews`
- `form-submissions`
- `media`
- `system-pages`
- `headers`
- `footers`
- `navigation-links`
- `redirects`

The queue should handle the operational conditions already implied by the current product direction:

- approval-required states
- moderation-required states
- follow-up-required states
- publish-blocked states
- media-governance-required states
- operator-facing system issues tied to source documents

## Explicit Non-Goals

This phase does not introduce:

- manual creation of ad hoc queue items
- SLA policies
- auto-assignment or round-robin ownership
- external ticketing integrations
- tenant-specific workflow modeling
- a separate custom dashboard replacing the collection UI
- a generic workflow abstraction for every future use case

`Work Queue` should be strong for the current starter without becoming a platform inside the platform.

## Architecture

### Core Model

`work-queue` is its own collection and is the source of truth for operational handling.

Source collections remain the source of truth for:

- content
- reviewable records
- intake records
- media assets
- navigational structure

`work-queue` stores a persisted projection of actionable operational work derived from those sources.

That boundary is important:

- source document fields continue to define whether work exists
- queue document fields define who owns the work and where it is in the handling lifecycle

### Queue Creation Model

Queue items are created and maintained by hook-driven sync, not by manual operator authoring.

Each actionable source state maps to one queue item keyed by a deterministic dedupe key. The dedupe key should uniquely identify the operational condition, not just the source document.

Examples:

- one document awaiting approval should yield one approval queue item
- one media asset missing required governance metadata should yield one media-governance queue item
- one form submission requiring follow-up should yield one follow-up queue item

If the same source document later produces a different actionable condition, that may become a separate queue item if it represents distinct operational work. If the same condition is re-saved repeatedly, the same queue item must be updated instead of duplicated.

### Collection Coverage Model

### Content And Structure Collections

These collections should create queue items when they enter approval-required or publish-blocked states:

- `pages`
- `articles`
- `system-pages`
- `headers`
- `footers`
- `navigation-links`
- `redirects`

Examples of actionable reasons:

- awaiting approval
- publish blocked by workflow state
- publish blocked by validation or required operational checks
- editorial follow-up required before publication

### Reviews

`reviews` should create queue items for moderation and approval handling where the current review workflow requires human action before public availability.

Examples:

- pending moderation
- pending approval
- requires editorial correction

### Form Submissions

`form-submissions` should create queue items for operational follow-up based on their current lead/review/general operations state where human action is still required.

Examples:

- new lead requires owner
- submission in review requires follow-up
- review intake requires moderation outcome

### Media

`media` should create queue items for governance and maintenance states.

Examples:

- required metadata missing
- replacement requires review
- cleanup needed
- media governance exception blocks safe use

## Data Model

`work-queue` should store enough information to support list operations, filtering, ownership, and safe operator handling without mutating source truth.

### Source Identity Fields

- `sourceCollection`
- `sourceID`
- `sourceTitle`
- `sourceSlug` when available
- `sourceURL` or admin path when useful for direct navigation

These fields act as operator-facing snapshots and routing metadata.

### Queue Classification Fields

- `queueType`
  - `approval`
  - `moderation`
  - `follow_up`
  - `publish_issue`
  - `media_issue`
  - `system_issue`
- `reasonCode`
  - deterministic internal identifier for the specific condition
- `summary`
  - short human-readable description
- `details`
  - optional longer context for operators
- `priority`
  - `low`
  - `normal`
  - `high`
  - `urgent`

### Editable Operational Fields

- `status`
  - `open`
  - `in_progress`
  - `blocked`
  - `resolved`
  - `canceled`
- `assignee`
  - relationship to `users`
- `dueDate`
- `operatorNotes`
- `resolutionSummary`

These are the only fields operators should routinely edit.

### System Integrity Fields

- `dedupeKey`
- `sourceUpdatedAt`
- `firstOpenedAt`
- `lastSyncedAt`
- `resolvedAt`
- `autoResolved`

These fields allow idempotent sync, stable historical behavior, and easier debugging.

## Admin Experience

### Placement

`Work Queue` should appear under the `Admin` group, matching `Operational Audit Events`.

This keeps operational tools together:

- `Users`
- `Operational Audit Events`
- `Work Queue`

The user intent is to make `Work Queue` a normal admin collection, not a hidden system utility.

### List View

The list view is the primary operating surface.

It should support filtering by:

- status
- queue type
- source collection
- assignee
- priority
- due date

Recommended default columns:

- summary
- source collection
- source title
- queue type
- status
- assignee
- priority
- due date
- last synced at

Search should prioritize summary and source title.

### Edit View

The edit view should split fields cleanly:

- read-only source snapshot and queue reason fields
- editable operational handling fields
- read-only timestamps and sync metadata

Operators should be able to:

- change `status`
- assign or reassign `assignee`
- adjust `priority`
- set `dueDate`
- add `operatorNotes`
- add `resolutionSummary`

Operators should not be able to:

- rewrite source-derived reason fields
- change dedupe keys
- change source identity
- manually fabricate queue items

### Deep Linking

Every queue item should expose a clear link back to the source document in the Payload admin.

This is required so an operator can:

1. review the queue item
2. open the source record
3. take content action there
4. return to the queue if needed

## Sync Behavior

### Upsert Model

All source-driven queue synchronization should route through a shared helper.

The helper should:

- derive the dedupe key
- look up an existing queue item by dedupe key
- create the record if none exists
- update the existing record if one exists
- preserve operator-owned fields unless intentionally changed by queue rules

This is required to avoid collection-specific duplicate logic.

### Auto-Resolution

When a source condition is no longer actionable, the queue item should not be deleted.

Instead it should transition to a resolved state:

- `status` becomes `resolved` when the issue is naturally completed
- `status` becomes `canceled` when the underlying work is invalidated rather than completed

Examples:

- approval queue item resolves when approval is completed
- follow-up queue item resolves when submission workflow reaches a terminal handled state
- media issue queue item resolves when required metadata is corrected
- queue item may be canceled if the source record is removed or the condition disappears for a non-completion reason

This preserves operational history and keeps queue records auditable.

### Source Snapshot Updates

If the source title, slug, or other display metadata changes while the issue remains actionable, the queue item should refresh its snapshot fields.

Operator-owned fields should not be reset during normal sync:

- assignee should remain assigned
- status should remain as set unless the source rule requires terminal resolution
- notes should remain intact
- due date and priority should remain intact

### Hook Safety

Queue sync must avoid infinite loops and broken transactions.

Rules:

- all nested Payload operations inside hooks pass `req`
- queue writes use context guards to prevent re-trigger loops
- sync helper behavior is centralized rather than copy-pasted across collections
- source hooks should compute conditions and call the shared helper, not implement queue persistence inline in each file

## Access Model

Admins always receive full access.

Non-admin users should use a dedicated capability:

- `manage_work_queue`

This capability should control:

- visibility in the admin nav
- read access to queue records
- update access to operational fields

Create access should remain restricted to system-driven sync. Delete access should be disabled.

This mirrors the intent of `Operational Audit Events`: the surface is part of system operations, not open-ended content editing.

## Relationship To Operational Audit Events

`Operational Audit Events` and `Work Queue` serve different purposes and should reinforce each other.

`Operational Audit Events` is:

- read-only
- historical
- evidence-oriented

`Work Queue` is:

- editable in operational fields
- current-state oriented
- action-oriented

Meaningful queue state changes should produce operational audit records where appropriate, especially:

- assignment changes
- status transitions
- terminal resolution

The two systems should not duplicate the same role. Audit tells you what happened. Queue tells you what still needs attention and who owns it.

## Testing Strategy

### Queue Collection Tests

Add coverage for:

- queue record creation
- dedupe behavior
- update-in-place behavior
- manual status changes
- assignee updates
- terminal resolution
- canceled vs resolved outcomes

### Source Integration Tests

Each supported source collection should have coverage proving it can:

- create the correct queue item when entering an actionable state
- update the existing queue item when the source changes
- resolve or cancel the queue item when the condition clears

This should include at least:

- one content approval source
- `reviews`
- `form-submissions`
- `media`
- one structure collection such as `redirects` or `headers`

### Admin Behavior Tests

Add smoke coverage confirming:

- `Work Queue` appears under `Admin`
- read-only fields remain read-only
- editable operational fields save correctly
- capability-based visibility works as intended

## Migration And Rollout Notes

The collection should be introduced empty and start populating from ongoing source events.

If backfill is later needed, it should be treated as a separate operational task, not assumed into this phase.

This first implementation focuses on correctness of the live sync model rather than historical reconstruction.

## Success Criteria

This design is successful when:

- operators can open one `Work Queue` collection and see actionable CMS work across the starter
- queue items are created automatically from supported source states
- operators can manage assignee and status directly in the queue
- the admin surface feels native to Payload and sits alongside `Operational Audit Events`
- duplicate queue records are prevented
- queue history survives resolution
- tests prove the queue sync contract works across the supported collections
