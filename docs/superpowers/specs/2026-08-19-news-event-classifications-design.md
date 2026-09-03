# News & Event Classifications Design

## Goal

Move News & Events classifications out of hardcoded collection and block configuration into a reusable CMS collection. Editors can create, rename, archive, select, and order classifications while each News & Events entry continues to belong to exactly one classification.

The implementation must preserve existing News/Event URLs, detail pages, block layouts, tab variants, pagination, and Story/Event-specific behavior.

## Current Model

`NewsEvents` currently stores a required `contentType` select with seven hardcoded values:

- News
- Event
- Notice
- Holiday
- Achievement
- Announcement
- Other

`NewsEventsTabs` stores an array containing one hardcoded classification value and a block-local display label per row. The server eagerly loads groups for all seven values, and the public Load More route validates against the same fixed value list.

Topics remain a separate taxonomy. A Topic describes subject matter such as Admissions or Cardiology; a News & Event Classification describes the entry format such as Event, Notice, or Achievement.

## New Collection

Add `NewsEventClassifications` with collection slug `news-event-classifications` and place it with News & Events in the Content admin group.

Each record contains:

- `title`: required visitor-facing tab label, for example `Events`.
- `slug`: clean generated slug and stable public/query identity.
- `badgeLabel`: optional compact or singular label, for example `Event`; falls back to `title`.
- `behavior`: required `story` or `event` select.
- `description`: optional editor guidance.
- `active`: required checkbox, default `true`.
- `legacyValue`: hidden immutable compatibility key retained only for old local records; new records leave it empty.

The collection uses the existing `manage_news_events` capability for create and update access. Classification records are publicly readable because they contain harmless taxonomy metadata and archived records must remain resolvable on existing entry detail pages. Authenticated users with `manage_news_events`, `manage_pages`, or `manage_page_settings` can read them so every Admin relationship selector that owns the Tabs block can resolve its options. The `active` field controls new relationship choices and public block tabs; it does not hide an archived record that an existing entry still references.

Classifications are not draft-versioned. They behave like central taxonomy records: a published change is immediately reflected wherever the classification is used.

The classification collection is excluded from the repository-wide Trash plugin: classification retirement uses `active`, while an actual delete remains a guarded hard delete. Referenced classifications cannot be deleted. Editors archive them by disabling `active`; unused classifications may be deleted. Reference checks include relationship IDs across News & Events entries, Pages, Reusable Sections, and the News & Events Detail Page global, plus legacy values on old entries. A referenced classification cannot switch between Story and Event behavior because that could invalidate existing entry data; editors create a new classification instead. The hidden `legacyValue` cannot be assigned or changed through normal CMS writes.

## News & Events Entry Schema

Replace the visitor-facing `contentType` select with a required single `classification` relationship to `news-event-classifications`.

The relationship selector:

- allows creating classification records;
- lists active classifications for new selection;
- preserves an archived classification already referenced by an existing entry;
- remains exactly one relationship per entry.

During the compatibility window, the hidden legacy `contentType` field is optional and has no default. New entries must explicitly select a classification. An existing local record may continue to validate from its original stored legacy value until an editor assigns the relationship; a new create request can never acquire News implicitly from the legacy fallback. If neither a relationship nor an original resolvable legacy value exists, validation directs the editor to select a classification.

The existing Topics and Tags relationships remain unchanged.

The Event Details tab and all of its fields remain visible for predictable editing without a custom admin component. All legacy `contentType`-based Admin conditions and field validators are removed. The tab description explains that the fields apply only to Event-behavior classifications. Server validation resolves the selected classification using the current request and requires Event Start and Event Location only when `behavior` is `event`. It rejects selecting an inactive classification on create or relationship change but permits the same archived relationship already stored on the entry. Story entries ignore event-only values publicly; normalization clears stale event-only values if an entry changes from Event to Story.

Card, detail, metadata, badge, and structured-data adapters expose:

- the classification relationship ID;
- the classification slug;
- `title` for tab labels;
- `badgeLabel ?? title` for badges;
- `behavior` for Story/Event presentation and date rules.

## News & Events Tabs Block

Replace the configurable `tabs` array with an optional sortable `classifications` relationship:

- `relationTo: 'news-event-classifications'`
- `hasMany: true`
- `admin.isSortable: true`
- `allowCreate: true`
- filter new choices to active records

The relationship order becomes visitor tab order. Classification titles become tab labels. Block-local classification label overrides are removed so a central rename updates every use consistently.

Remove the legacy `tabs` array, its fixed select options, its validation, and its runtime normalization. The block must never synthesize the former News, Events, Notice, Holiday, Achievements, Announcement, or Others tabs.

The block retains:

- customizable `allTabLabel`;
- mandatory automatic All tab in the first position;
- `itemsPerTab` and Load More;
- Card Grid and Editorial List layouts;
- cards-per-row controls;
- Contained, Pill, and Underline tab variants;
- action labels, empty-state copy, section heading/actions, footer actions, and appearance settings.

When classifications are selected, the All tab contains entries from only those classifications. A block selecting News, Events, and Achievements will not show Holiday or Notice entries under All.

When no classifications are selected, the block renders only the mandatory All tab. That All tab contains entries from every active classification, but the active classifications do not become separate named tabs automatically.

Inactive or missing records in a non-empty selection are skipped. If no selected classification resolves publicly, the block keeps only All with the existing empty state rather than widening the scope to every classification.

## Data Loading and Ordering

Initial block rendering resolves the selected active classification records and loads only their groups. With an empty selection, it resolves all active classifications only as the All data scope while keeping the visible tab list to All. News Grid and News & Events Highlights resolve all active classification records and split Story/Event queries by behavior so custom classifications appear consistently outside the Tabs block as well.

- A Story classification queries published entries by classification relationship and sorts latest publication/display date first.
- An Event classification queries current or upcoming published entries by classification relationship and sorts earliest event start first.
- All groups selected Story classifications and selected Event classifications separately, then preserves the existing mixed Story/Event interleaving behavior.

The first page size remains the configured `itemsPerTab`. Initial group results retain the existing `{ docs, hasNextPage, page }` shape.

The public Load More endpoint accepts:

- one classification ID for a specific tab; or
- the ordered selected classification IDs for All;
- an omitted classification scope for the unconfigured All-only mode, which resolves every active classification server-side;
- page and allowed limit values.

The route validates ID syntax, de-duplicates IDs, rejects empty/unknown/inactive selections with `400`, rejects more than 50 classification IDs as malformed public input, and returns only published entries. Because the endpoint returns public content, caller-supplied IDs do not grant access to drafts.

The block client continues to keep independent page and loading state for each tab, resets safely when configured tabs change, and de-duplicates appended entry IDs.

## Default Records

The initial central records preserve current behavior:

| Title        | Badge label  | Slug           | Behavior |
| ------------ | ------------ | -------------- | -------- |
| News         | News         | `news`         | Story    |
| Events       | Event        | `event`        | Event    |
| Notice       | Notice       | `notice`       | Story    |
| Holiday      | Holiday      | `holiday`      | Story    |
| Achievements | Achievement  | `achievement`  | Story    |
| Announcement | Announcement | `announcement` | Story    |
| Others       | Other        | `other`        | Story    |

These records are ordinary CMS records after creation. Editors may rename them, archive them, or add new Story/Event classifications. Because this project is local-only, classifications and relationships are created or updated manually in Admin; no migration engine, CLI, or automatic startup mutation is included.

## Compatibility Window

Retain the legacy `contentType` field as hidden compatibility data during this implementation. Runtime reads prefer the new populated classification and use legacy normalization only when an unmigrated record is encountered. New and updated entries require the classification relationship, while the compatibility hook maps a known legacy value before required-field validation.

The News & Events Tabs block has no legacy rows or hardcoded runtime fallback. An empty relationship selection is a deliberate All-only configuration.

## Error Handling

- Missing classifications on new entries fail validation with an editor-facing message.
- Archived classifications remain readable on existing entry detail pages but cannot be newly selected.
- A classification marked Event enforces Event Start and Event Location; an invalid Event End remains rejected.
- Missing or inaccessible classifications in public block queries are skipped and logged without exposing draft data.
- Invalid pagination input returns `400` with stable public messages.
- Query failures return the existing generic `500` response and do not expose Payload errors.
- Reference checks prevent deleting classifications still used by entries or blocks.

## Caching and Revalidation

Classification create, update, archive, or delete operations revalidate News & Events list/detail caches and Page caches that can render News & Events blocks. Existing NewsEvents change hooks continue to revalidate entry-driven caches.

Server loaders remain server-only. Live preview receives serialized classification/group snapshots through the established preview boundary and does not import Payload-backed modules into client code. Tab snapshots are keyed by a stable scope signature containing ordered classification IDs and item limit, not item count alone, so two equal-sized blocks with different selections cannot collide. Dependency discovery continues through populated Reusable Sections with the established depth and cycle guards.

## Tests and Verification

Add or update focused coverage for:

- classification collection registration, fields, access, active filtering, and deletion guards;
- default classification definitions and legacy normalization behavior;
- required single classification relationships;
- Story/Event validation and stale event-field cleanup;
- relationship-based and legacy entry compatibility records;
- sortable selected classifications, automatic first All tab, and All-only empty selection;
- selected-scope All aggregation and empty-selection all-active aggregation;
- Story sorting, Event filtering/sorting, and mixed ordering;
- dynamic badge labels and detail metadata;
- Load More validation, paging, de-duplication, and independent tab state;
- Page, Reusable Section, thumbnail preview, and live-preview rendering;
- two equal-count Tabs blocks with different selected classifications and a nested Reusable Section;
- search API/page, OpenGraph, feeds, metadata routes, and thumbnail fixtures;
- cache revalidation and server/client import boundaries.

Regenerate Payload types and the import map if required by the collection registration. Run targeted integration tests, TypeScript, ESLint, Prettier, and the project-context update/check loop.

## Non-Goals

- Do not merge classifications with Topics or Tags.
- Do not change News/Event public URL structure.
- Do not redesign News & Events cards, editorial rows, tabs, or detail pages.
- Do not add per-block classification label overrides.
- Do not add classification-specific colors.
- Do not automatically mutate production data during application startup.
- Do not remove entry-level `contentType` compatibility in this block-focused cleanup.
- Do not commit the specification or implementation changes.
