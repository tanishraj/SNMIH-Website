# Publish Queue Safety Design

## Summary

This spec adds a publish-safety layer that uses `work-queue` as an actual gating surface for final publication.

The goal is not to turn the CMS into a workflow maze. The goal is to make the existing editorial workflow safer by preventing a document from moving to `published` while it still has unresolved queue items that represent publish-relevant operational blockers.

This builds directly on the current foundation:

- `enforceEditorialWorkflow` already centralizes editorial state transitions
- `work-queue` now persists actionable operational items across the CMS
- `Operational Audit Events` already records meaningful operator actions

What is missing is the connection between those systems. Right now, the queue documents operational work, but it does not actually protect the final publish action.

## Why This Direction

Three approaches were considered.

### 1. Recommended: publish guard inside the existing workflow enforcement hook

When a supported collection attempts to move to `published`, the existing `enforceEditorialWorkflow` hook performs one additional check against `work-queue`.

This is the cleanest design because the publish transition is already centralized there. The rule remains readable:

- resolve next workflow state
- check publish capability
- validate scheduled state when relevant
- check queue blockers when relevant
- stamp publish metadata

### 2. Separate queue-blocking hook after workflow enforcement

The queue safety rule could live in a second `beforeChange` hook layered after `enforceEditorialWorkflow`.

This would work, but it splits one publish rule across multiple hooks and makes the final decision path harder to follow, debug, and test.

### 3. No hard block, only admin warnings

The system could surface warnings about blocking queue items but still allow publication.

That is not strong enough for the starter’s client-handoff-safe direction. If publish safety matters, the rule should actually enforce safety.

### Decision

Add queue blocker checks directly inside `enforceEditorialWorkflow`, limited to final publish transitions.

## Product Contract

After this work:

- moving a supported document to `published` will fail if blocking queue items still exist for that source
- the blocking rule will only consider queue items in statuses `open` or `blocked`
- `in_progress`, `resolved`, and `canceled` queue items will not prevent publication
- only queue items with publish-relevant types will block publication in this phase
- the publish error will explain the first blocking reason and indicate whether more blockers exist
- scheduling will remain allowed even when publish blockers exist

This remains a CMS safety layer. It does not attempt to model every possible workflow dependency.

## In Scope

The publish queue guard should apply to the collections that already use the explicit editorial workflow hook:

- `pages`
- `articles`
- `reviews`
- `system-pages`

The guard should only run when the next workflow state is `published`.

## Explicit Non-Goals

This phase does not introduce:

- queue-based blocking for `scheduled`
- queue-based blocking for draft saves or review moves
- queue-based blocking for `headers`, `footers`, `navigation-links`, `redirects`, `media`, or `form-submissions`
- per-client override rules for blocker types
- warning-only UI in place of actual enforcement
- automatic escalation of every queue type into a publish blocker

## Architecture

### Guard Placement

The queue blocker check should live inside `enforceEditorialWorkflow`.

It should run only after:

- the next workflow state has been resolved
- the user’s publish capability has been confirmed

It should run before:

- publish metadata is stamped
- the hook returns the final `published` transition payload

This keeps the rule local to the transition that it protects.

### Blocking Rule

Only queue items meeting all of the following conditions should block publish:

- `sourceCollection` matches the collection being published
- `sourceID` matches the document being published
- `status` is `open` or `blocked`
- `queueType` is `approval` or `publish_issue`

This is the narrowest strong rule that still gives `Work Queue` real operational authority.

Queue items with these statuses should not block:

- `in_progress`
- `resolved`
- `canceled`

Queue items with these types should not block in this phase:

- `moderation`
- `follow_up`
- `media_issue`
- `system_issue`

### Why `in_progress` Does Not Block

Blocking on `in_progress` would make the queue less trustworthy.

If operators know that moving an item into active work also blocks publication, they are more likely to leave items in `open` or avoid using `in_progress` honestly. That weakens the operational model.

`open` and `blocked` are the better blockers:

- `open` means no one has resolved the concern yet
- `blocked` means someone tried and hit a real obstacle

### Source Mapping

The queue guard needs a stable source mapping from the workflow hook into `work-queue`.

The hook should receive or derive:

- source collection slug
- current source document id

That should be used to query `work-queue` by source identity, not by dedupe key, because multiple publish-relevant blockers may exist for the same document.

## Error Contract

When blocking queue items exist, the publish action should fail with a human-readable error.

The message should:

- name the first blocking queue summary
- mention how many additional blockers exist when relevant
- instruct the operator to resolve the issue in `Work Queue` before publishing

Example shape:

- `Cannot publish because Work Queue still has a blocking item: "<summary>". Resolve it in Work Queue before publishing.`
- `Cannot publish because Work Queue still has blocking items: "<summary>" and 2 more. Resolve them in Work Queue before publishing.`

The error should not dump raw IDs or every queue record into the UI.

## Query Behavior

The queue lookup should be intentionally small and deterministic.

Recommended query constraints:

- `sourceCollection = <current collection>`
- `sourceID = <current doc id>`
- `status in ['open', 'blocked']`
- `queueType in ['approval', 'publish_issue']`
- low depth
- deterministic sort so the first summary shown is stable

This keeps the guard readable and cheap.

## Safety Boundaries

### Scheduling Is Still Allowed

The queue guard should not block `scheduled`.

This is deliberate. Scheduling is an editorial staging action, not final publication. Teams should still be able to prepare content while resolving final blockers before release.

### Unsupported Collections Stay Unchanged

Collections that do not publish through `enforceEditorialWorkflow` should not gain queue blocking in this phase.

That means no publish-safety behavior changes yet for:

- `headers`
- `footers`
- `navigation-links`
- `redirects`
- `media`
- `form-submissions`

### Queue Presence Alone Is Not Enough

The mere existence of a queue item should not block publish.

The queue item must be both:

- of a blocking type
- in a blocking status

This keeps the contract predictable for operators.

## Relationship To Existing Workflow Rules

The queue guard does not replace the current editorial workflow rules.

It sits alongside them:

- capability rules still determine who may publish
- schedule rules still require `scheduledPublishAt`
- queue rules now determine whether publication is operationally safe

This means a publish attempt can fail for either editorial authority or queue safety, and both are valid.

## Testing Strategy

Add direct hook-level coverage for `enforceEditorialWorkflow` with mocked `req.payload.find`.

Tests should prove:

- publish succeeds when no matching queue blockers exist
- publish fails when an `open` `approval` queue item exists for the same source
- publish fails when a `blocked` `publish_issue` queue item exists for the same source
- publish succeeds when matching queue items are only `in_progress`
- publish succeeds when matching queue items are only `resolved` or `canceled`
- publish succeeds when matching queue items are non-blocking types such as `follow_up`
- scheduling still succeeds even when blocking queue items exist

The tests should stay in the current repo pattern:

- lightweight Vitest specs
- direct invocation of hook helpers
- mocked Payload request methods

## Migration And Rollout Notes

This change should require no backfill and no schema migration beyond what `work-queue` already introduced.

The rule begins working as soon as queue data exists.

Because `work-queue` is already populated only from ongoing source activity, the guard should be introduced with awareness that only current queue records can block publish.

That is acceptable for this phase.

## Success Criteria

This design is successful when:

- publishable collections cannot move to `published` while unresolved publish-relevant queue blockers still exist
- the block rule is narrow, predictable, and understandable
- operators can still use `in_progress` honestly without accidentally blocking publish
- scheduling remains available
- the error message explains what to do next
- tests prove the queue guard behaves correctly across blocking and non-blocking cases
