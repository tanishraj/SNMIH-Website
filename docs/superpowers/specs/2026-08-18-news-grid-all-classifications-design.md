# News Grid All-Classifications Design

## Goal

Expand the existing News Grid so it automatically displays every published News & Events
classification instead of limiting collection-backed cards to News and Event records.

## Scope

The eligible classifications are:

- News
- Event
- Notice
- Holiday
- Achievement
- Announcement
- Other

The block remains collection-backed and retains its existing section content, appearance, card-count,
column-count, feature-card, action, and empty-state configuration. This change does not add manual
collection cards or editor-selectable classification filters.

## Data Selection and Ordering

News Grid will use one Payload Local API query against `news-events`.

Every returned record must satisfy both public workflow conditions:

- Payload `_status` is `published`.
- Editorial `workflowState` is `published`.

All published non-event classifications are eligible. Event records are eligible only while they are
current or upcoming under the existing event rule:

- `eventEnd` is at or after the current time; or
- `eventEnd` is absent and `eventStart` is at or after the current time.

Eligible records are ordered by:

1. `publishedAt` descending;
2. `createdAt` descending as the legacy fallback;
3. `id` descending as the stable tie-breaker.

`updatedAt` will no longer control News Grid order, so editing an older record does not make it look
newly published. Event Start and Event End determine eligibility but do not override the shared
publication ordering.

## Presentation and Admin Compatibility

Each collection card will display the canonical label for its stored classification. Non-event
records must no longer fall back visually to the News badge.

The existing stored `newsActionLabel` field remains unchanged to avoid a data migration, but its
Admin label becomes **Default Action Label**. It applies to News, Notice, Holiday, Achievement,
Announcement, and Other cards. The existing `eventActionLabel` remains **Event Action Label** and
applies only to Event cards.

The feature card continues to reserve the final configured slot when it is valid. `Total Cards`
continues to cap the combined collection cards and optional feature card exactly as it does now.

## Error and Empty-State Behavior

The existing failure boundary remains unchanged: a failed News Grid query is logged server-side and
degrades to the configured empty state rather than crashing the Page. A valid editor-authored feature
card continues to render even when no collection record qualifies.

## Verification

Focused News Grid tests will verify:

- the query admits all non-event classifications;
- expired Events remain excluded through the existing event predicate;
- ordering uses `publishedAt`, `createdAt`, and `id` in that order;
- every classification renders its canonical badge label;
- the Event CTA remains event-specific;
- every non-event classification uses the default CTA;
- the Admin field keeps the `newsActionLabel` key while showing the new label;
- existing feature-card slot and empty-state behavior remain intact.

The affected test suite, TypeScript check, formatting/lint checks, and the required project-context
update/check loop will run after implementation. The stored generated Payload type shape remains
unchanged; regeneration may update the field's generated documentation comment.
