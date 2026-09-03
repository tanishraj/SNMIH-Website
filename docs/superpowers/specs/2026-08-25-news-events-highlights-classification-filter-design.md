# News & Events Highlights Classification Filter Design

## Goal

Let each News & Events Highlights block curate its source classifications while preserving its automatic, chronologically ordered carousel.

## Authoring

Add a `classifications` relationship field to the block Content tab, matching the News & Events Tabs selection pattern: active `news-event-classifications`, multiple selections, relationship-drawer creation, duplicate-safe normalization, and a maximum of 50 selected records.

The field controls inclusion only. Relationship order does not affect slide order. Leaving it empty includes every active classification. Existing blocks therefore retain their current behavior without a migration.

## Loading

Production resolves the selected relationship IDs and loads only published Story/Event entries in that strict classification scope. If a non-empty stored scope contains missing or inactive classifications, it returns no highlights rather than silently widening to all active classifications.

The existing automatic ordering remains unchanged: Stories use newest publication order, Events use current/upcoming start order, and the mixed result is interleaved up to the configured one-to-six item count.

## Live preview

Preview snapshots key Highlights data by both item count and ordered classification IDs. Multiple Highlights blocks with the same item count but different filters therefore receive independent data. Empty selections continue to use all active classifications.

## Deletion integrity

News & Events Highlights selections are genuine classification references. The existing guarded deletion scan detects the block in Pages, Reusable Sections, and the News & Events Detail Page template, including nested reusable layouts.

No migration script, automatic relationship cleanup, content rewrite, staging, or commit is part of this change.
