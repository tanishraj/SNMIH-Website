# Review Intake Promotion Design

## Summary

This spec revises the current reviews implementation so public review submission flows through the existing `forms` infrastructure while approved reviews still become publishable website content.

The core separation is:

- `forms` defines the public review intake form
- `form-submissions` stores the immutable inbound submission and moderation trace
- `reviews` stores the editable, SEO-aware, block-capable public content entry

Public users should never submit directly to the `reviews` collection. They submit through a normal form. The system then automatically creates or updates a linked draft review entry for editorial moderation and later publishing.

## Why This Direction

Three approaches were considered.

### 1. Recommended: forms for intake, reviews for published content

Public review submission uses the generic forms route. Each successful review submission creates:

- one `form-submissions` record
- one linked `reviews` draft or in-review document

This keeps inbound operations and publishable content separate while preserving a first-class public reviews content model.

### 2. Dual review systems

Keep the generic forms pipeline and also keep the dedicated `/api/reviews/submit` route.

This creates competing intake paths, duplicate validation rules, and inconsistent operator behavior.

### 3. Reviews-only intake

Let the public website submit directly to `reviews` and treat that collection as both intake storage and publishable content.

This is simpler short term, but it weakens the CMS architecture. Intake operations, spam handling, audit state, and publishable content become tightly coupled.

### Decision

Use `forms` for intake and `reviews` for publishable content.

## Product Contract

After this work:

- the public review form is configured as a normal `forms` entry
- public review submissions go only through `POST /api/forms/[slug]/submit`
- successful review submissions create a `form-submissions` record first
- the system automatically creates or updates a linked `reviews` entry from that submission
- the linked review starts unpublished and ready for moderation
- operators manage inbound review intake in `Form Submissions`
- editors and publishers refine and publish public review content in `Reviews`
- the dedicated `POST /api/reviews/submit` route is removed from the active architecture

## Architecture

### Intake Side

`forms` remains the public-facing intake definition layer. A review form is just a form with an explicit intake type, not a special endpoint.

The recommended form-level discriminator is:

- `submissionType: 'general' | 'review'`

This keeps review handling explicit and avoids fragile heuristics based on slug or field names.

### Operations Side

`form-submissions` remains the operational source of truth for what the public user actually submitted.

This record is:

- immutable as raw submitted data
- the audit trace for spam, retries, timestamps, and moderation history
- the anchor point for future automation or lead-routing behavior

### Content Side

`reviews` remains a first-class content collection used for:

- editorial cleanup
- SEO management
- block-based layout composition
- workflow and publishing
- frontend review pages

The `reviews` collection is no longer treated as the public intake surface.

## Data Flow

The review submission lifecycle should work as follows:

1. A frontend page renders a normal `FormBlock` connected to a published `forms` entry whose `submissionType` is `review`.
2. The public user submits through the generic forms endpoint.
3. The endpoint validates the generic form payload and then applies stricter review validation for review-type submissions.
4. The system creates the `form-submissions` record.
5. The same request flow automatically creates or updates a linked `reviews` entry.
6. The linked review is stored as Payload `_status: 'draft'` with `workflowState: 'in_review'`.
7. Admin or publisher moderates and publishes from `reviews`.
8. The original form submission remains the intake record and is never edited as public content.

## Schema Changes

### Forms

Add an explicit intake discriminator to `forms`:

- `submissionType`
  - `general`
  - `review`

Default should remain `general` so all existing forms continue behaving exactly as they do now.

### Form Submissions

Extend `form-submissions` with review-ops metadata so operators can triage review submissions without opening raw JSON.

Recommended additions:

- `submissionType`
- `submitterName`
- `submitterEmail`
- `linkedReview`
  - relationship to `reviews`
- optional operator-facing failure or retry note if linked review generation fails

The existing `data` JSON field remains the immutable raw normalized payload.

### Reviews

Keep `reviews` as the public content collection, but add a link back to the originating submission:

- `sourceSubmission`
  - relationship to `form-submissions`

This makes admin navigation explicit in both directions and preserves traceability from website submission to published content.

## Validation And Mapping

### Review Validation

When `submissionType === 'review'`, the generic forms route should additionally enforce:

- `rating` required
- `reviewTitle` required
- `reviewBody` required
- `reviewerName` required
- `reviewerEmail` required and valid
- `isGenuineExperience` normalized as a boolean

The system should continue using the shared anti-spam protections already present in the forms pipeline:

- honeypot
- IP-based rate limiting

### Submission-To-Review Mapping

The promotion layer maps normalized form values into `reviews` fields.

Initial mapping should include:

- `title` from `reviewTitle`
- `reviewTitle`
- `reviewBody`
- `reviewerName`
- `reviewerEmail`
- `rating`
- `isGenuineExperience`
- `workflowState = 'in_review'`
- `_status = 'draft'`

The promoted review should not auto-populate publish-specific enhancements like SEO, display-safe name rewrites, or extra layout content. Those remain editorial tasks inside `reviews`.

## Idempotency And Failure Handling

### Idempotent Promotion

Promotion must not create duplicate reviews for the same submission.

If a submission already has a linked review:

- update that review instead of creating a second one

The submission-to-review relationship is the idempotency anchor.

### Failure Behavior

The intended behavior is transaction-like even if the underlying operations are not fully transactional in SQLite.

Rules:

- if form submission creation fails, no review should be created
- if form submission creation succeeds but review promotion fails, preserve the submission and mark it for operator visibility
- operators should be able to see that a review submission exists even if the linked review generation failed

This prevents lost intake while still surfacing promotion failures clearly.

## Admin Surface

The admin experience should present two separate surfaces with different responsibilities.

### Form Submissions

Used for:

- intake verification
- moderation trace
- spam or submission troubleshooting
- linking to the generated review

### Reviews

Used for:

- editorial rewriting and cleanup
- SEO completion
- optional block composition
- workflow progression
- final publishing

This preserves the earlier capability model:

- `manage_forms`
- `manage_form_submissions`
- `manage_reviews`
- `publish_reviews`

These capabilities govern operator access. They are not related to whether a public website visitor can submit a review.

## Routing And Frontend Contract

The public website should use the existing generic forms route for review intake.

As part of this design:

- the dedicated `src/app/api/reviews/submit/route.ts` route becomes obsolete
- the frontend review form should post only to `/api/forms/[slug]/submit`
- frontend review pages continue to read from `reviews`
- review layouts continue to use the existing `reviews.layout` block system

This preserves the public content experience while consolidating intake behavior.

## Migration

This spec is a revision of the current implementation, not a greenfield design.

Required migration direction:

- stop treating the dedicated reviews submit route as the main intake path
- move review intake behavior into the generic forms submit route
- keep existing public review pages and admin review editing intact
- add bidirectional linkage between submission and promoted review

Existing `reviews` content should remain valid. The change is about future intake behavior and admin traceability.

## Verification

Implementation is only complete when these behaviors are verified:

- a valid review form submission creates one `form-submissions` record
- the same submission creates one linked `reviews` draft or in-review document
- the linked review is visible in admin and routable after publish
- invalid review payloads are rejected through the generic forms route
- generic non-review forms still submit exactly as before
- duplicate review creation does not occur when the same submission is reprocessed
- admin can navigate from submission to review and from review back to source submission

## Non-Goals

This work does not include:

- removing the `reviews` collection entirely
- building a generic promotion framework for every form type
- auto-publishing public reviews
- converting `form-submissions` into editable content entries
- expanding the review block library beyond the current starter needs

## Recommendation

The correct end state for this starter is not “reviews are only forms” and not “reviews are only content.”

The stable architecture is:

- forms for intake
- form submissions for operational truth
- reviews for public content

That separation fits the editorial-first, client-handoff-safe CMS direction much better than a single collection trying to serve every concern at once.
