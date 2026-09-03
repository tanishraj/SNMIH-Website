# Optional Editorial Workflow Design

## Goal

Keep editorial workflow support in the starter, but remove unnecessary operational friction for teams that do not need approval-driven publishing on every user account.

The primary requirement is:

- `Admin` must not be forced through workflow
- workflow should be enforced only for users who explicitly need it
- publishing rights and workflow participation must remain separate concepts

This keeps the starter usable for both:

- lightweight website teams that publish directly
- controlled editorial teams that require review and queue visibility

## Why This Change

The current implementation treats workflow as part of the save and publish contract for all users of workflow-enabled collections.

Today:

- Pages, Articles, Reviews, and System Pages all expose a `Workflow` tab
- `workflowState` is enforced in `beforeChange`
- review and scheduled states create automatic Work Queue items
- publishing can be blocked by unresolved Work Queue items

This is useful for disciplined editorial operations, but it is too heavy for `Admin` and too rigid for clients who simply want trusted operators to edit and publish content directly.

The starter should support workflow as an optional operating mode, not as mandatory ceremony for every role.

## Current Behavior

### Workflow-aware collections

The current workflow model applies to:

- `pages`
- `articles`
- `reviews`
- `system-pages`

Each collection includes a `Workflow` tab with:

- `workflowState`
- `scheduledPublishAt`
- `changeSummary`
- `lastReviewedAt`
- `lastReviewedBy`
- `publishedAt`
- `publishedBy`

### Enforcement behavior

The current enforcement hook:

- resolves workflow state from submitted data or existing document state
- keeps `draft` content as draft
- moves `in_review` content to draft and records review metadata
- requires `scheduledPublishAt` for scheduled content
- requires publish capability for `published`
- checks for blocking Work Queue items before publish
- writes publish metadata when publish succeeds

### Work Queue behavior

The current queue model creates operational items automatically when content enters certain workflow states.

Examples:

- `in_review` creates an approval item
- `scheduled` creates a high-priority approval item

Important current limitation:

- queue items are not auto-assigned to `Site Manager`
- there is no enforced role-to-role approval chain
- Work Queue acts as an operational inbox, not a strict approval router

That means the current system is workflow-aware, but not a true role-based approval pipeline.

## Design Principles

The revised workflow model should follow these principles:

1. `Admin` should always have the fastest path.
2. Workflow should be capability-driven, not assumed.
3. Publishing rights should remain independent from workflow requirements.
4. Queue noise should only exist when workflow is actually in use.
5. The admin UI should adapt to the user’s operating mode.

## Capability Model

### New capability

Add:

- `require_editorial_workflow`

This capability means:

- the user must use workflow states when moving content toward publication
- approval and scheduled queue behaviors should apply
- direct publish should not be the default path for that user

### Existing capabilities remain separate

Keep:

- `publish_pages`
- `publish_articles`
- `publish_reviews`
- `publish_system_pages`
- `manage_work_queue`

These continue to mean:

- `publish_*`: the user is allowed to publish that content type
- `manage_work_queue`: the user can see and operate queue items

They should not implicitly mean:

- workflow is required
- workflow is visible
- the user must submit for review first

## Role Defaults

### Admin

Defaults:

- full capabilities
- workflow bypass always

Behavior:

- can save draft or publish directly
- is not blocked by workflow ceremony
- may still see workflow metadata for visibility if desired

### Site Manager

Defaults:

- current system-level and publish capabilities remain enabled
- `manage_work_queue` remains enabled
- `require_editorial_workflow` disabled by default

Behavior:

- can operate in direct-publish mode by default
- can still handle review and queue work when other users submit content for approval
- can be opted into required workflow later if a client wants that operating style

### Content Manager

Defaults:

- current content editing capabilities remain enabled
- current publish capabilities may remain as currently configured
- `require_editorial_workflow` enabled by default

Behavior:

- uses workflow states when preparing content for publication
- creates approval queue items when submitting content for review
- can be simplified later for clients who do not want a review step

## Runtime Rules

### 1. Admin bypass

`Admin` should always bypass workflow enforcement.

That means:

- publishing from the document should not require manual workflow updates
- admin publish should not create approval queue noise
- workflow fields should never block admin save or publish operations

### 2. Users without `require_editorial_workflow`

If a user does not have `require_editorial_workflow`:

- saving draft should behave normally
- direct publish should be allowed when the relevant `publish_*` capability exists
- workflow approval queue items should not be created for ordinary publish
- scheduled publication may still be allowed if scheduling remains part of the direct-publish path

This is the lightweight operating mode.

### 3. Users with `require_editorial_workflow`

If a user has `require_editorial_workflow`:

- `draft` remains the working state
- `in_review` is the primary handoff state
- `in_review` creates an approval queue item
- `scheduled` requires `scheduledPublishAt` and creates the scheduled queue item
- publishing still requires the relevant `publish_*` capability

This is the controlled operating mode.

### 4. Publish blockers

Blocking Work Queue checks should apply only when workflow-driven publication is actually in play.

Recommended behavior:

- do not block admin direct publish through workflow queue requirements
- do not block lightweight direct-publish users through workflow queue requirements
- preserve blocking checks for workflow-required publish paths where queue approval matters

## Work Queue Behavior

### Queue creation

Queue items should only be created when a workflow-required user enters a workflow state that represents operational action.

Create queue items for:

- `in_review`
- `scheduled`

Do not create approval queue items for:

- admin direct publish
- non-workflow direct publish

### Assignment

Do not auto-assign queue items to `Site Manager` in this phase.

Keep:

- manual assignment
- manual status updates
- queue visibility for operators who have queue access

This is simpler, more predictable, and easier to explain to clients.

## Admin UX

### Admin experience

For `Admin`:

- workflow should not be part of the normal publishing path
- workflow data may remain visible as secondary metadata
- admin should not feel forced to update the `Workflow` tab during normal content work

### Non-workflow user experience

For users without `require_editorial_workflow`:

- hide the `Workflow` tab entirely, or reduce it to an advanced surface
- rely on normal draft and publish behavior in the document editor
- avoid exposing operational fields they do not need

### Workflow-required user experience

For users with `require_editorial_workflow`:

- show the `Workflow` tab
- show `workflowState`, `scheduledPublishAt`, and `changeSummary`
- keep audit fields read-only
- make review submission understandable as an editorial handoff

### Capability UI

Add `Require Editorial Workflow` to the capabilities UI as its own checkbox.

Recommended placement:

- near Publishing or Operations

It should be explained in plain language, for example:

- “Require this user to submit content through editorial workflow before publication.”

## What This Design Does Not Introduce

This design does not add:

- automatic role-based approval routing
- a mandatory Site Manager approval step
- complex multi-stage editorial workflows
- collection-specific workflow policies in this phase

Those could be added later, but they are not required for the starter’s current goal.

## Recommendation

Adopt workflow as an optional editorial discipline, not a universal publishing contract.

The recommended starter behavior is:

- `Admin`: full bypass
- `Site Manager`: direct-publish operator by default
- `Content Manager`: workflow-driven by default
- workflow requirement controlled by capability
- publish access controlled separately
- queue usage only when workflow is actually active

This gives the starter a better balance of:

- clarity
- flexibility
- lower admin friction
- stronger client handoff safety
