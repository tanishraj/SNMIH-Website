# Annual Calendar Year Stream Design

**Status:** Approved
**Date:** 2026-08-25

## Goal

Replace the Annual Calendar ledger's table-like presentation with a chronological Year Stream while
preserving the block's existing data ownership, twelve-month scope, semantic theme behavior, live
preview, and independent Coming Next panel.

Replace the custom academic period's four Month/Year selectors with two Payload date pickers. The
selected day is authoring input only; the block derives and uses the month and year.

Refine the stream with subtle month dividers and smaller timeline markers, and let editors attach an
optional downloadable calendar-year PDF in a dedicated sidebar panel.

## Boundaries

- This changes the Annual Calendar block only. The interactive Calendar block remains unchanged.
- News & Events remains the source of event records and classification colors.
- The current-year and custom academic-year modes remain available.
- A custom academic period still contains exactly twelve consecutive inclusive months.
- Coming Next remains the next four eligible events from today and does not filter to the selected
  annual period.
- The downloadable PDF is editor-supplied Media. The block does not generate or synchronize PDF
  content from News & Events.
- No content migration or compatibility bridge is required for the uncommitted Month/Year fields.
- Display typography remains reserved for the block-level section title. Stream labels, month names,
  event names, controls, and metadata use the existing text and utility families.
- All colors, borders, focus states, and supporting text use existing semantic theme contracts in
  light and brand surfaces across light and dark website modes.

## Authoring Model

### Period fields

`periodMode` keeps these values:

- `currentYear`: derive January through December from the current date in the configured site
  timezone. Both date fields are hidden and ignored.
- `customAcademicYear`: show two conditional Payload date fields:
  - `periodStartDate`, labelled **Academic Year Start Date**.
  - `periodEndDate`, labelled **Academic Year End Date**.

Both date fields use Payload's day-only date-picker presentation. Editors may select any day. Runtime,
validation, preview keys, and queries extract the UTC calendar year and month from the stored date and
discard the day and time.

Examples:

- `2026-07-15` resolves to July 2026.
- `2027-06-02` resolves to June 2027.
- Together they resolve to July 2026 through June 2027 and label the stream
  `Academic year 2026–2027`.

The inclusive start and end months must differ by exactly eleven month indexes, producing twelve
months. Missing, malformed, reversed, shorter, or longer custom ranges fail validation with:

`Choose dates whose months define exactly 12 consecutive months.`

The runtime repeats this validation and fails closed before issuing a News & Events query. Current
year mode ignores stale hidden date values in preview and cache identity.

### Calendar PDF fields

Editors may select one optional `calendarPdf` Media relationship restricted to PDF files. Two
conditional text fields keep the document identity separate from the action:

- `calendarPdfTitle` controls the descriptive document label and defaults to
  `Academic calendar PDF`.
- `calendarPdfLabel` controls the button label and defaults to `Download`.

The absence of a selected PDF is the visibility control: no separate enable switch is needed. An
unresolved Media relationship also produces no public download panel or broken link.

## Visitor Experience

### Overall composition

The block retains its optional shared section introduction and actions. Below it, desktop uses the
existing main-plus-sidebar composition:

- The Year Stream occupies the flexible main column.
- The sidebar remains 20rem wide and contains Coming Next followed by the optional PDF download
  panel.
- Mobile and tablet stack the Year Stream before Coming Next, matching DOM and reading order.

The period label and total event count remain in a quiet summary row above the stream, without a
boxed table header.

### Year Stream

One one-pixel vertical semantic divider runs through the month sequence. Every month is a chapter on
that chronology:

- A 10px square month marker intersects the spine; the spine is optically centered through it.
- The month name, optional Current badge, and event count form one compact chapter heading.
- The Current marker uses the semantic success color; other markers use the section foreground and
  panel surface.
- Every month except the last ends with a subtle semantic divider. It begins after the timeline spine
  so the chronology remains visually continuous and the stream does not regress into a table grid.
- The existing chapter spacing remains generous around each divider.

Populated months render an ordered stack of linked event cards. Each card contains:

1. A tabular date block with the two-digit day and short month or Today label.
2. Event title.
3. Time or All day plus optional location.
4. Classification label, retaining its non-color text cue.
5. A narrow semantic classification-tone mark.

Cards use the existing panel surface, one semantic border, square SNMIH radius, and a restrained
hover/focus surface. The Today card receives the existing current-day semantic highlight. Event links
retain an inset visible focus ring appropriate to light or brand surfaces.

Empty months remain present but do not consume event-card height. They render one short supporting
line, `No events are scheduled for this month.`, beneath the month heading. This preserves all twelve
months while avoiding the visual weight that made the ledger resemble tabular data.

### Coming Next

Coming Next keeps its existing component, data, ordering, sticky desktop placement, responsive stack,
and lack of a classification legend. Its visual treatment continues to share the selected Annual
Calendar section surface.

### Calendar PDF download

When a valid PDF resolves, a separate compact panel appears immediately below Coming Next. It uses
the same sidebar width, semantic border, section surface, and shared button treatment. Following the
Fee Structure download pattern, the panel places a File icon and configured document label on the
left and a compact Download-icon button with its configured action label on the right. The two groups
stack without reordering on narrow widths.

The link uses download semantics where the media host permits them. If a remote media provider does
not honor forced downloads, the browser may open the PDF using its standard behavior. The link's
accessible name always includes the configured visible label.

## Responsive Behavior

- Wide desktop: flexible Year Stream plus 20rem Coming Next.
- Standard desktop: the same two-column composition with the existing gap.
- Tablet and mobile: one column; Coming Next and the optional PDF panel follow the complete stream as
  one sidebar group.
- Event cards collapse their trailing classification metadata into the content stack when horizontal
  space is limited.
- Long titles and locations wrap without moving the date block off the leading edge.
- The spine, month marker, DOM order, and keyboard order remain aligned at every breakpoint.

## Accessibility

- The block title remains the section-level heading.
- Every month is a semantic section with a text-family heading.
- Event dates use `<time>` with machine-readable date values.
- Every event card is one complete descriptive link with a visible focus treatment.
- Classification remains communicated in text as well as color.
- Current and Today remain visible text, not color-only state.
- The design adds no motion or pointer-only interaction.
- Supporting text continues to use the surface-aware contrast contract.
- The PDF action is a native link with a visible keyboard focus state and no disabled-looking state.

## Data and Preview Contract

The shared Annual Calendar period input changes from `startMonth`, `startYear`, `endMonth`, and
`endYear` to `periodStartDate` and `periodEndDate`.

One normalization function owns:

- current-year fallback;
- safe date parsing;
- UTC month/year extraction;
- exact twelve-month validation;
- `YYYY-MM` start/end keys and twelve materialized month keys;
- `Calendar year YYYY` or `Academic year YYYY–YYYY` labels.

Production loading, persistent cache keys, authenticated live-preview scope keys, preview loading,
and presentation consume that same normalized contract. Preview scope identity includes the period
mode and the two saved dates only in custom mode. The annual response version increments so cached
Month/Year-era snapshots cannot satisfy the new contract.

The PDF relationship is presentation-only and does not alter event queries, response snapshots, or
cache identity. The server and authenticated preview normalize the Media URL and filename into the
same serializable presentation props.

## Failure Behavior

- Missing classifications retain the current not-configured presentation.
- Invalid custom dates produce no broad or fallback event query.
- Draft and production rendering share the same serialized presentation contract.
- Missing, deleted, or unresolved PDF Media hides the optional download panel.
- A custom range failure does not affect the independent interactive Calendar block.
- Empty months and an entirely empty period remain usable Year Stream states rather than errors.

## Verification

Automated contracts will cover:

- Payload date-field names, labels, conditions, picker presentation, and validation copy.
- Extraction of month/year from different days within the same month.
- January–December current-year fallback.
- Valid July–June academic range.
- missing, malformed, reversed, eleven-month, and thirteen-month failures.
- fail-closed data loading before Payload queries.
- cache and preview keys for current and custom modes.
- production and populated Reusable Section preview discovery.
- twelve month chapters, compact empty states, Current/Today text, event count, links, semantic classes,
  month dividers, smaller centered markers, and the absence of the former continuous ledger grid.
- PDF field configuration, Media type restriction, custom/default document and button labels,
  Fee Structure-aligned responsive layout, resolved download semantics, hidden unresolved state,
  sidebar order, and live-preview parity.
- mobile-friendly source order and unchanged Coming Next semantics.
- generated Payload types, thumbnail, operator documentation, project context, TypeScript, lint, and
  the affected integration suite.

A bounded visual pass will inspect the generated production thumbnail and, when an interactive browser
is available, desktop and mobile states for dense, sparse, empty, current, Today, long-content, light,
brand, and dark-mode cases.
