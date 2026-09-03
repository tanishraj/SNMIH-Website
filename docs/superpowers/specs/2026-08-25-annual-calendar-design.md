# Annual Calendar Block Design

**Status:** Approved for implementation planning
**Date:** 2026-08-25
**Selected direction:** Institutional Ledger

## Summary

Add a Page-compatible `Annual Calendar` block that presents every month of the current site-timezone
year as one continuous institutional ledger. Each month owns a chronological list of dated events, and
a separate `Coming next` panel sits beside the complete ledger on desktop. The block is a sibling of
the existing interactive `Calendar`: it reuses the same event ownership, classification scope,
timezone, theme, editor settings, and Upcoming behavior while serving a distinct year-at-a-glance
browsing job.

## Goals

- Let visitors scan January through December without switching months or views.
- Preserve every month as a stable year landmark, including months without events.
- Keep the next four upcoming events visible beside the annual list on desktop.
- Match the current SNMIH typography, spacing, color, border, radius, light-mode, and dark-mode
  contracts.
- Keep News & Events as the sole owner of event content.
- Give editors the same configuration vocabulary and validation used by the existing Calendar block.
- Keep production and authenticated live preview behavior equivalent.

## Non-goals

- Do not replace or change the existing Calendar block.
- Do not add month, year, calendar/timeline, classification, or pagination controls to the public
  interface.
- Do not let editors duplicate or manually author events inside the block.
- Do not add year navigation in the initial release.
- Do not add a data migration or rewrite existing content.
- Do not invent new theme colors, typography roles, spacing scales, radii, or card systems.

## Block Identity and Registration

- Admin label: `Annual Calendar`
- Block slug: `annualCalendar`
- Generated interface name: `AnnualCalendarBlock`
- Picker group: `Explore`
- Register it in the canonical Page and Reusable Section block catalogs and both production and
  client-safe live-preview renderers.
- Add a block-picker thumbnail and fixture using realistic institutional event data.
- Include the block in Page, Reusable Section, System Page, News & Events Detail Template, block
  catalog, renderer-parity, and thumbnail contracts wherever those registries permit ordinary Page
  blocks.

## Admin Configuration

The block mirrors the existing Calendar editor structure.

### Content tab

- `eyebrow`
- `title`
- `accentTitle`
- `description`
- header `actions`, maximum two
- `footerActions`, maximum two
- `classifications`
  - relationship to `news-event-classifications`
  - one to five selections
  - required
  - active Event-behavior records only
  - unique selection validation
  - editor order is retained for deterministic metadata but does not change chronological event order
  - relationship creation remains disabled
- `upcomingEyebrow`, default `Up next`
- `upcomingTitle`, default `Coming next`
- `emptyStateMessage`, default `No events are scheduled for this month.`

### Theme Settings tab

- shared block appearance fields
- `contentAlignment`, Left or Center, default Left
- `size`, using the shared None, Compact, Default, and Comfortable section-padding options

The existing Calendar field `adjacentMonthDates` is deliberately omitted because the annual ledger
has no adjacent-month date cells.

## Public Layout

### Section header

Use the shared section header contract: optional eyebrow, title plus accent title, description, header
actions, alignment, appearance, container, and spacing behavior. The display family is permitted only
for this section-level title.

### Annual ledger

- Render a year header with `Calendar <year>` and the total event count.
- Render January through December in calendar order for the current year in the configured site
  timezone.
- Each month is a two-column chapter on desktop:
  - month name and optional `Current` marker on the left
  - dated event rows or the configured empty message on the right
- The ledger carries a narrow success-colored orientation spine. The current month marker and today
  treatment use semantic success/background tokens rather than hard-coded SNMIH colors.
- Each event row contains:
  - start day and abbreviated month in a semantic `<time>` element
  - classification-colored marker
  - event title
  - time or `All day`
  - location when present
  - complete range metadata for multi-day events
  - classification badge label as text, so color is never the only classification cue
- Event rows are complete links to their News & Events detail pages.
- Events are sorted chronologically by start time and stable ID. Multiple events on the same date
  remain individually visible.
- Multi-day events appear once under their start date and show their complete inclusive range.
- Empty months remain visible with the configured empty-state message.
- A completely empty year still renders all twelve month chapters.

### Coming next panel

- Reuse or extract the existing `CalendarUpcoming` typography, event-row, empty-state, and
  surface-aware focus contracts without changing the existing Calendar presentation.
- Show the same stable next four current or upcoming events used by Calendar.
- Omit the classification legend from this panel, matching the approved Institutional Ledger design;
  each annual-ledger event already carries a visible classification label.
- Upcoming may cross the current-year boundary because its job is chronological next-action awareness,
  not summarizing the visible annual ledger.
- Keep the panel sticky beside the ledger at desktop widths.
- Move it below the complete ledger on smaller screens.

### Footer

Render shared footer actions after the annual layout using the selected section alignment.

## Visual System

- Display: Playfair Display, limited to the section-level title.
- Text: Inter for month names, event titles, descriptions, locations, and ordinary controls.
- Utility: IBM Plex Mono for dates, classifications, counts, and current/today labels.
- Use `regularBlockContainerClasses` and `regularBlockMobilePaddingClasses`.
- Use shared content-section heading and description classes.
- Resolve section surfaces through `resolveBlockAppearanceClasses`.
- Panels remain transparent over the selected block background and use semantic foreground, muted
  foreground, border, primary, success, and calendar-tone tokens.
- Use `var(--radius)` rather than fixed corner values. SNMIH therefore remains square while other
  themes keep their configured radius.
- Preserve identical hierarchy and spacing in light and dark website modes; only semantic token values
  change.
- Classification tones remain accents for markers. Text always uses an accessible semantic foreground.

## Responsive Behavior

- Wide desktop: annual ledger plus a fixed-width sticky Coming Next column.
- Tablet: retain two columns while readable; the Upcoming column may narrow but event content remains
  the primary track.
- Mobile: one column, compact month-name track, full event content, followed by Coming Next.
- Do not horizontally scroll the complete ledger.
- Long titles and locations wrap without overlapping dates or markers.
- The structure remains usable with twelve empty months and with dense months containing many events.

## Accessibility

- Use one block-level section heading and month headings in a valid hierarchy.
- Mark dates and event ranges with semantic `<time>` values.
- Event titles remain descriptive link names.
- Provide visible keyboard focus using the current surface-aware ring contract.
- Expose `Current month` and `Today` in accessible text.
- Keep classification names visible alongside colored markers.
- Sticky behavior must not trap focus or obscure focused links beneath site chrome.
- The block introduces no automatic motion.
- Light and dark supporting text must use the complete paired semantic foreground contract rather than
  reduced opacity that weakens contrast.

## Data Contract

Introduce a serializable annual snapshot containing:

- snapshot version
- current year
- site timezone
- today date key
- ordered resolved classifications
- twelve ordered month records
- each month key, label, and ordered event array
- next four Upcoming events

The public server loader:

1. Resolves and de-duplicates the selected relationship IDs.
2. Resolves those IDs to active Event-behavior classifications.
3. Returns no snapshot when any configured relationship is missing, inactive, non-Event, or otherwise
   invalid; it never broadens to all classifications.
4. Derives the current year and inclusive year boundaries in the configured site timezone.
5. Queries published events whose start date falls within the year and queries Upcoming using the
   existing Calendar semantics.
6. Normalizes records through the shared Calendar event adapter.
7. Groups each event under its start month.
8. Materializes all twelve months, including empty ones.

The annual query should be cached by snapshot version, year, timezone, and ordered classification
scope. Existing News & Events, classification, and site-timezone revalidation hooks must invalidate
the annual cache alongside Calendar caches.

## Production and Live Preview

- Production uses a server-only block adapter to load the published annual snapshot.
- Authenticated Page and News & Events detail preview routes discover Annual Calendar scopes,
  including populated Reusable Sections, using the existing depth and cycle guards.
- Preview routes load draft-aware annual snapshots on the server with the authenticated user and
  access enforcement.
- The client-safe preview component receives only serializable snapshot data and imports no Payload or
  `server-only` module.
- Preview snapshot keys include the ordered classification scope so distinct Annual Calendar blocks
  cannot collide. Each snapshot carries its timezone-derived year, while the server cache key also
  includes that year to prevent cross-year reuse.
- Production and preview render through one shared presentation component.

## Classification Governance

- Annual Calendar relationships count as classification references.
- Deleting or changing the behavior of a referenced classification must identify the first Annual
  Calendar Page, Reusable Section, or News & Events Detail Template reference through the existing
  guarded-reference workflow.
- Editors remove or replace the relationship before deletion or behavior changes; no automatic
  content rewrite is introduced.

## Error and Empty States

- Missing block configuration renders the same calm, theme-aware configuration Empty pattern as
  Calendar.
- A valid configuration with no events renders twelve empty months plus an empty Coming Next panel.
- Loader failure is isolated by the existing production block error boundary.
- Live preview uses its existing preview boundary so a failed annual snapshot cannot collapse the
  complete editor preview.
- Public content must not silently broaden if part of the saved classification scope becomes invalid.

## Component Boundaries

Keep focused units with explicit contracts:

- Payload block config
- server data adapter
- shared annual snapshot helpers and normalization
- server block component
- client-safe preview component
- shared presentation
- annual ledger
- month chapter
- event row
- shared Upcoming event-list presentation with an Annual Calendar wrapper

The new block may reuse Calendar domain helpers and primitives, but must not turn the existing Calendar
client into a conditional component with two unrelated layout modes.

## Verification

Add focused tests for:

- schema parity and the intentional absence of `adjacentMonthDates`
- registration across allowed schemas and both renderers
- block catalog grouping and thumbnail coverage
- strict classification scope resolution and deletion references
- current-year boundaries in `Asia/Kolkata` and another configured IANA timezone
- January–December materialization and empty months
- chronological ordering, same-day events, all-day events, and multi-day start-month grouping
- Upcoming stability and year-boundary crossover
- semantic typography, surfaces, calendar tones, radius, and supporting-text contrast
- desktop sticky layout and mobile stacking contracts
- authenticated draft preview and scope-key isolation
- client/server import boundaries

Run Payload type generation, focused block and Calendar tests, block catalog/rendering/live-preview/theme
contracts, TypeScript, lint, the integration suite, and the required project-context update/check loop.

## Documentation

Update the block guide, News & Events guide, feature inventory, project-context block-system reference,
payload model reference where classification governance is described, generated inventory, and block
thumbnail documentation as required by the final change impact.

## Migration

No migration or content rewrite is required. This is a newly registered block with no saved documents.
