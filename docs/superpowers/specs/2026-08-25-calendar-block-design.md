# Calendar Block Design

## Goal

Add an industry-grade `Calendar` Page block that presents published News & Events records in an interactive month calendar and chronological timeline. The block must preserve the project’s one-client-per-deployment architecture, use the existing editorial workflow, remain fully theme-aware, and provide a strong responsive and accessible experience.

The attached desktop references establish the visual direction: a restrained institutional calendar, a companion Timeline view, classification filtering, and a stable Upcoming panel.

## Scope

This effort includes:

- One Page-compatible `calendar` block registered for Pages, Reusable Sections, and the News & Events detail template.
- A server-rendered initial month with client-side view, filter, and month-navigation interaction.
- On-demand month loading through a validated read-only endpoint.
- Event data sourced exclusively from published Event-behavior News & Events records.
- Classification-owned semantic calendar tones.
- A site-wide IANA timezone setting defaulting to `Asia/Kolkata`.
- An explicit All-day event field and consistent News & Events date/time formatting.
- Production/live-preview parity, block thumbnail coverage, generated types, documentation, and tests.

This effort does not create a separate Calendar Event collection, manually authored block-local events, academic-term configuration, semester labels, visitor persistence, recurring-event rules, event editing from the public interface, or a third mobile agenda model.

## Decisions

- Editors select one to five active Event-behavior classifications per Calendar block.
- The initial month is the current month in the configured site timezone.
- Desktop opens in Calendar view and does not remember the visitor’s previous view.
- Phones use Timeline-first automatically and do not expose the month-grid toggle.
- Upcoming always shows the next four current-or-future events across every selected classification. It does not follow the visible month, active filter, or active view.
- Event tiles and rows are complete accessible links to existing News & Event detail pages.
- Multi-day events cover every inclusive calendar date in month view and appear once with a date range in Timeline view.
- A day cell displays at most two event tiles. `+N more` switches to Timeline and focuses that date.
- The calendar week starts on Sunday.
- The desktop reference composition is preserved without a semester label.

## Content Model

### Calendar block

Create `src/blocks/Calendar/config.ts` with slug `calendar`, interface name `CalendarBlock`, singular label `Calendar`, and the standard block thumbnail Admin configuration.

The Content tab contains:

- Optional `eyebrow`, `title`, `accentTitle`, and `description` fields.
- Standard header actions with at most two rows.
- `classifications`: a required, sortable, has-many relationship to `news-event-classifications`, with one to five rows. Admin filtering permits only records with `active: true` and `behavior: event`.
- `allEventTypesLabel`, default `All event types`.
- `upcomingEyebrow`, default `Up next`.
- `upcomingTitle`, default `Upcoming`.
- `emptyMonthMessage`, default `No events scheduled for this month.`
- `emptyUpcomingMessage`, default `No upcoming events.`
- Standard footer actions with at most two rows.

The Theme Settings tab contains:

- Standard block appearance fields.
- Section content alignment: Left or Center, default Left.
- Standard section padding: None, Compact, Default, or Comfortable, default Default.

There is no event source switch, manual event array, semester field, upcoming-count setting, desktop-default-view setting, week-start setting, or separate card-surface selector.

### News & Event classifications

Add `calendarColor` to `NewsEventClassifications`:

- Type: select.
- Options: Green, Blue, Cyan, Amber, and Violet.
- Default and runtime fallback: Blue.
- Visible only when `behavior` is Event.
- Visitor output normalizes unknown or missing values to Blue.

The color is a durable classification attribute, not a Calendar-block override. Multiple classifications may intentionally share one color. Calendar labels remain visible, so color is never the sole distinction.

### News & Events

Add `eventAllDay` to the Event Details tab:

- Type: checkbox.
- Default and runtime fallback: false.
- Relevant only for Event-behavior entries.
- Story normalization clears it with the existing event-only fields.

Event Start remains required for Event behavior. Event End remains optional and cannot precede Event Start. For all-day entries, Start and End still store valid timestamps, while public formatting and calendar grouping use their site-timezone calendar dates and omit time. An all-day end date is inclusive.

### Site Settings

Add a Regional tab to `SiteSettings` with a required `timeZone` select:

- Values are validated IANA timezone identifiers from a project-owned supported list that includes
  the canonical `Asia/Kolkata` identifier.
- Default and runtime fallback: `Asia/Kolkata`.
- Admin copy identifies it as the timezone used for event dates, event times, calendar month boundaries, and “today.”
- Updating the setting invalidates Site Settings and every cached News & Events/Calendar date projection.

Existing records require no database migration. Missing Calendar Color reads as Blue; missing All-day reads as false; missing Site Timezone reads as `Asia/Kolkata`.

## Date and Time Contract

Create a shared date/time utility that owns:

- IANA timezone validation and the `Asia/Kolkata` fallback.
- Conversion from a zoned `YYYY-MM` month to inclusive UTC query boundaries.
- Stable zoned date keys in `YYYY-MM-DD` form.
- Current-month and today resolution.
- Month labels, weekday labels, date ranges, and 12-hour time labels.
- Inclusive multi-day expansion by zoned calendar day.
- All-day date-only output.

News & Events cards, lists, detail metadata, feeds, structured data, and Calendar projections consume the same site timezone rather than their current hard-coded UTC formatter. The display change is intentional: stored timestamps remain unchanged, while visitor-facing dates and times shift to the deployment’s configured timezone.

Server-rendered values remain deterministic. Client components receive normalized date keys, labels, and ISO timestamps rather than recomputing formatted output from the browser timezone.

For Event structured data, all-day Start and End serialize as local calendar dates. Timed events retain ISO date-time values.

## Data Query and Normalization

### Classification scope

Relationship values are normalized to at most five unique IDs while preserving editor order. The server resolves only active Event-behavior classifications. Missing, inactive, duplicate, Story-behavior, or malformed relationships are omitted without widening the scope.

The rendered legend and filter follow the surviving editor order. A block with no usable classification scope renders its standard header plus a calm empty state in draft/live preview and no fabricated events.

### Visible month

For a requested zoned month, query published Event-behavior News & Events records whose interval overlaps the month:

- `eventStart` is on or before the month’s UTC end boundary; and
- `eventEnd` is on or after the month’s UTC start boundary, or a missing End falls back to Event Start.

Results sort by Event Start and then stable document ID. The adapter returns only public fields needed by Calendar:

- ID, slug, href, title.
- classification ID, label, badge label, slug, and normalized calendar color.
- Event Start, optional Event End, All-day flag.
- normalized zoned start/end date keys and display labels.
- optional public location.

The client expands multi-day coverage from the normalized zoned date keys, not raw browser-local dates.

### Upcoming

Upcoming returns the first four selected-scope events whose effective end is on or after the current instant. Ongoing multi-day events qualify. An all-day event's effective end is the end of its inclusive final site-timezone date, so it remains Upcoming throughout that day. Results sort by Event Start and stable document ID. Upcoming is prepared independently from the visible month and remains stable while the visitor changes month, filter, or view.

## Runtime Architecture

### Server-first initial render

`CalendarBlockComponent` is a Server Component. It resolves the site timezone, selected classifications, current zoned month, month events, and Upcoming in parallel wherever dependencies permit. It passes one serializable snapshot to `CalendarClient`.

The block preserves the established server/client boundary:

- Server modules may import Payload, configuration, and cached loaders.
- Client modules receive normalized public data only and never import Payload or `server-only` modules.
- Shared normalization and presentation types remain client-safe.

### On-demand month endpoint

Add `GET /api/calendar-events` with these parameters:

- `month`: exactly `YYYY-MM` and a real calendar month.
- `classifications`: one to five unique classification IDs within bounded length.
- `draft`: optional and accepted only for an authenticated authorized preview request.

Public calls return published Event-behavior records only. Classification IDs are not an authorization boundary because every returned record is already public; the endpoint nevertheless resolves IDs against active Event classifications and rejects malformed or oversized scopes. It never broadens an invalid non-empty scope to every classification.

Authenticated draft calls pass the authenticated user with `overrideAccess: false`. Users without the required News & Events read capability receive a non-success response and no draft data.

The response contains the normalized visible-month snapshot only. It uses bounded result counts, explicit field selection, stable ordering, and a versioned response shape.

### Caching and invalidation

- Fixed month/classification projections use keys containing month, ordered classification IDs, timezone, and response version.
- Cache tags include News & Events, News & Event classifications, and Site Settings.
- Existing News & Events/classification invalidation hooks invalidate Calendar projections after publish, unpublish, delete, or classification changes.
- Site timezone changes invalidate every date projection.
- Upcoming is time-sensitive and uses bounded time revalidation rather than indefinite caching.
- Draft preview responses are not shared with public cache entries.

### Live preview

Production and authenticated Page/News Event preview paths discover Calendar classification dependencies through direct blocks and supported populated Reusable Sections. Initial preview snapshots use the authenticated server read path. Month navigation in preview requests the endpoint with draft intent and access enforcement. Production and live-preview renderer switches retain equal Calendar coverage.

## Visitor Interface

### Standard block shell

The Calendar uses the shared regular block container, responsive padding, semantic appearance resolver, optional section header, shared Content Actions, and Block Footer Actions. The header may be absent without leaving empty space.

The Calendar interface uses an opaque semantic Card surface over every supported section appearance. Borders use `border`, text uses `card-foreground`, supporting text uses the paired muted semantic foreground, and radius follows the project radius token. Brand and gradient sections retain readable inner surfaces in both website modes.

### Toolbar

One bordered toolbar appears above the main content:

- Previous-month button with a visible arrow icon and accessible month-specific label.
- Current month and year.
- Next-month button with a visible arrow icon and accessible month-specific label.
- Calendar/Timeline Toggle Group on `md` and wider.
- Single Select filter containing All Event Types followed by surviving classifications in editor order.

Desktop defaults to Calendar. The chosen view is component-local and is not persisted. Month changes retain the active event-type filter. The All label is editor-configurable and falls back to `All event types`.

Use installed shadcn Button, Toggle Group, Select, Badge, Separator, and Empty primitives. Do not install or use shadcn Calendar/React Day Picker: it is a date-selection control and does not model this event-month layout.

### Calendar view

- Sunday-first, seven-column semantic month calendar.
- Always render six week rows so navigation does not cause large layout jumps.
- Adjacent-month days remain visible with a muted treatment.
- Today uses a textual current-day cue for assistive technology plus a theme-aware visual marker.
- Each event tile shows its classification label or distinguishable tone treatment and title.
- Each tile is a complete link to its News & Event detail route.
- Each date displays at most two tiles.
- A remaining count renders as a button labelled with the exact hidden count. Activating it switches to Timeline, focuses the target date group, and announces the view change.
- Multi-day events appear on every inclusive covered date with start, continuation, and end cues. Accessible labels include the complete event date range.

### Timeline view

- The visible month/year forms a compact leading column at wide desktop sizes.
- Events render once in chronological order as ruled rows.
- Each row includes date or date range, classification Badge, event title, optional time, and optional location.
- The complete row is an accessible detail link.
- All-day rows omit time.
- Applying an event-type filter retains date order and changes only the main Calendar/Timeline content.
- A filtered or empty month uses the configured empty state.

### Upcoming panel

- Eyebrow and title use editor-configurable labels with `Up next` and `Upcoming` fallbacks.
- The panel shows four current-or-future events across all selected classifications.
- Each row includes a prominent date, color marker plus classification text, title, optional time, and optional location.
- Each row is a complete accessible detail link.
- A semantic legend follows the list in selected classification order.
- With no qualifying events, the panel remains present and renders the configured Upcoming empty state.

## Responsive Behavior

- `lg` and wider: main view and a fixed-width Upcoming sidebar share one grid row. The sidebar is not sticky.
- `md` through below `lg`: the main view is full-width and Upcoming follows below it.
- Below `md`: the client automatically renders Timeline-first, hides the Calendar/Timeline toggle, and retains month navigation and the single event-type filter.
- On compact screens, the Timeline leading month column collapses into the section flow and event rows use touch-friendly vertical rhythm.
- DOM and focus order remain Toolbar, main view, Upcoming, footer actions at every breakpoint.
- No horizontal page overflow is introduced. Calendar view is not horizontally scrolled on phones because it is replaced by Timeline-first.

## Event Tone System

Define five calendar tone families: Green, Blue, Cyan, Amber, and Violet. Each family provides a semantic accent value suitable for borders/dots and a subtle Card-mixed tile surface. Event text remains `card-foreground`; tone is not used as body-text color.

The tones must:

- Remain distinguishable in light and dark website modes.
- Meet non-text contrast for markers and borders where required.
- Preserve body/link contrast through Card foreground semantics.
- Avoid raw Tailwind palette classes inside the component.
- Use the same mapping in month tiles, timeline Badges, Upcoming markers, and legend entries.

Add theme contract tests covering every website theme in both modes. Classification labels and continuation text ensure meaning survives monochrome/high-contrast interpretation.

## Interaction and State

`CalendarClient` owns:

- Active view on `md` and wider.
- Active classification filter.
- Visible month.
- Current month snapshot.
- A session-only map of completed month snapshots keyed by month and ordered classification scope.
- One abortable in-flight request.
- Loading, failure, retry, live-announcement, and focused-date state.

Month navigation keeps the current content visible, sets the main region `aria-busy`, prevents duplicate requests, and announces the newly loaded month. Stale requests are aborted or ignored. A failed request retains the last successful month and exposes an inline Retry action. Retrying requests the intended month again.

View changes do not fetch. Event-type filtering is performed against the already loaded month snapshot. Upcoming never changes in response to client controls.

Nonessential transitions respect reduced-motion preference.

## Accessibility

- The block has one logical section heading when an authored title exists; internal panel headings follow the surrounding hierarchy.
- Toolbar controls have explicit accessible names, visible focus indicators, and usable touch targets.
- Toggle Group and Select retain their shadcn/Radix keyboard behavior.
- Weekday abbreviations are visual only; assistive labels expose full weekday names.
- Month cells use semantic table/calendar relationships without turning noninteractive dates into buttons.
- Dates use `<time dateTime="YYYY-MM-DD">` or ISO date-time values as appropriate.
- Current day, adjacent-month dates, all-day status, classifications, multi-day continuation, and hidden-event counts have non-color cues.
- Event links have descriptive accessible names including classification and date where the visible title alone is ambiguous.
- Loading uses a polite live region. Request failures use `role="alert"` and a real Retry button.
- Moving from `+N more` to Timeline moves focus to the target date heading without disrupting DOM reading order.
- Mobile visual order matches DOM and keyboard order.

## Empty and Failure States

- No usable selected classifications: retain any authored section header and render a calm editor/preview empty state; do not query every classification.
- No events in the visible scope: retain navigation and month structure, with the configured month empty message in the main region.
- No events after filtering: retain filter controls and render the same configured empty message with the active classification named for assistive context.
- No upcoming events: retain the Upcoming panel with its configured empty message.
- Invalid/deleted event records: omit them without inventing labels, dates, locations, or links.
- API validation error: return a structured 400 response.
- Unauthorized draft request: return 401 or 403 without falling back to public draft access.
- Runtime request failure: retain the last successful content and provide Retry.

## Block Registration and Builder UX

Calendar joins the `Explore` picker group. It becomes part of the client-approved default vocabulary while remaining available anywhere the canonical Page registry is accepted.

Implementation must update:

- Server-only canonical block catalog.
- Page and Reusable Section schema registries through the catalog.
- News Events detail schema registry through the catalog.
- Production renderer switch.
- Live-preview renderer switch.
- Block thumbnail definition, production fixture, and 1600×900 JPEG.
- Generated Payload types and Admin import map if required.
- Block operator guide, feature inventory, content model documentation, and maintained project context.

The existing explicit server/client registry boundary remains intact.

## Validation and Security

- Calendar classification relationship count is one to five.
- Relationship duplicates are rejected or normalized without changing editor order.
- Runtime classification resolution requires active Event behavior.
- API month parsing rejects malformed, impossible, oversized, or repeated values.
- API classification parsing rejects empty, malformed, duplicate, and more-than-five scopes.
- Public Local API queries explicitly constrain `_status: published`, `workflowState: published`, Event behavior, and selected classification IDs.
- Draft Local API queries pass the authenticated user with `overrideAccess: false`.
- Response fields are explicitly selected and normalized before serialization.
- Query limits are bounded and documented; the UI never requests an unbounded event history.
- Existing News & Events normalization, cache invalidation, and takedown behavior remain authoritative.

## Testing and Verification

### Focused unit and integration coverage

- Calendar block field labels, defaults, relationship filters, and one-to-five constraints.
- Calendar Color and All-day schema behavior.
- Site timezone default, validation, versions, access, and invalidation.
- IST current-month boundaries, near-midnight timestamps, cross-month ranges, inclusive all-day ranges, invalid dates, and timezone fallback.
- Month-overlap query construction and classification scoping.
- Published-only public data and access-enforced draft data.
- Stable month and Upcoming sorting.
- Missing/deleted/inactive/Story classifications never widen scope.
- Initial server render, classification order, event links, all-day output, multi-day coverage, two-event cap, and `+N more` count.
- Calendar/Timeline view switching, filtering, month navigation, cache reuse, stale request cancellation, retry, and live announcements.
- Upcoming independence from month, filter, and view.
- Phone Timeline-first behavior and absence of horizontal page overflow.
- Keyboard focus after `+N more`, Toggle Group/Select behavior, focus-visible states, semantic date markup, and empty/error states.
- Five calendar tone families across five website themes in light and dark modes.

### Repository contracts

- Page block, Reusable Section, and News detail registry parity.
- Production and live-preview switch parity.
- Production fixture and thumbnail coverage.
- Generated Payload type synchronization.
- Theme and block-surface contracts.
- Documentation and project-context inventory.

### Required commands

At minimum, implementation runs:

```bash
pnpm generate:types
pnpm generate:importmap
pnpm generate:block-thumbnails
pnpm exec tsc --noEmit
pnpm exec eslint <changed-files>
pnpm exec vitest run <focused-calendar-and-news-event-tests>
pnpm project-context:update
pnpm project-context:check
git diff --check
```

Run the broader block registry, live preview, thumbnail, theme, public access, and production-build checks in proportion to the final diff.

## Acceptance Criteria

The feature is complete when an editor can add Calendar from Explore, select one to five central Event classifications, and publish a block that:

- Opens to the current `Asia/Kolkata` month in Calendar view on desktop.
- Uses Timeline-first on phones.
- Navigates months without full-page reloads.
- Filters the visible month by one classification or All.
- Renders multi-day and all-day events correctly.
- Links every event to its News & Event detail page.
- Keeps the next four Upcoming events stable and classification-complete.
- Handles overflow, loading, empty, failure, and retry states accessibly.
- Matches every theme and both color modes using semantic surfaces and radii.
- Preserves public/draft access boundaries and production/live-preview parity.
