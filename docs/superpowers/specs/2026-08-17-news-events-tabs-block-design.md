# News & Events Tabs Block Design

## Objective

Create a standalone reusable `News & Events Tabs` Page block while restoring the existing
`News Grid` block to its pre-classification-tabs contract. The new block presents governed
News & Events records through fixed classification tabs and text-only cards styled entirely
through the project's existing semantic theme system.

## Scope

The new block uses:

- Display name: `News & Events Tabs`
- Payload slug: `newsEventsTabs`
- Generated interface: `NewsEventsTabsBlock`
- Availability: Pages and Reusable Sections

The existing `News Grid` must retain its original schema, server loader, preview behavior,
presentation, tests, documentation, generated type shape, and thumbnail. Its public query continues
to select only News and current/upcoming Event records.

The already-approved `News & Events Highlights` Featured Carousel remains unchanged.

## Content Model

The block has the established top-level `Content` and `Theme Settings` tabs.

Content fields:

- optional eyebrow
- optional title
- optional italic accent title
- optional description
- header actions using the shared content-actions field
- footer actions using the shared content-actions field
- items per tab: 3, 6, 9, or 12; default 6
- cards per row: 2, 3, or 4; default 3
- News action label; default `Read update`
- Event action label; default `View details`
- empty-state message

Theme Settings reuse the existing section appearance, content alignment, header-action vertical
alignment, and regular section-padding controls. A section title is optional because the block can
act as a self-explanatory filtered directory.

## Classification Contract

Each News & Events entry belongs to exactly one stored classification:

- `news`
- `event`
- `notice`
- `holiday`
- `achievement`
- `announcement`
- `other`

The client-facing tab order is fixed:

1. All
2. News
3. Events
4. Notice
5. Holiday
6. Achievements
7. Announcement
8. Others

`All` is derived and never stored on an entry.

## Data Flow

The server component normalizes the configured item count and loads a serialized group for every
tab from the existing News & Events data module. Public queries require both Payload `_status` and
editorial `workflowState` to be published. Event records must also be current or upcoming; all
other classifications use their publication date.

The interactive client receives the complete serialized group map. Tab changes do not issue browser
requests. A failed server query returns an empty group map so the block can render its configured
empty state without breaking the surrounding Page.

Live preview uses the existing News & Events snapshot pipeline, extended to scan `newsEventsTabs`
blocks by their configured item count and serialize grouped results under that count.

## Presentation

The screenshot supplied for the original request is a structural reference only. The block must
match the repository's theme and content-block conventions:

- shared regular section container and responsive padding
- shared `SectionEyebrow`, heading, description, content-action, and footer-action components
- semantic `background`, `primary`, `border`, `card`, and foreground tokens
- no hardcoded SNMIH colors and no manual dark-mode overrides
- `var(--radius)` for card geometry so the SNMIH square treatment and other themes adapt correctly
- existing focus-visible behavior and motion conventions

Tabs are horizontally scrollable when necessary. The active tab uses the theme's primary action
treatment; inactive tabs use the established outline treatment.

Cards are text-only and equal-height. Each card contains:

- classification badge
- publication date, or compact event date range
- title
- excerpt
- bottom-aligned action link

The layout is one column on mobile, two on tablet, and the configured two, three, or four columns on
large screens. The new card is owned by `NewsEventsTabs`; it may reuse shared primitives and helpers
but must not require changes to `News Grid`.

## Accessibility

The tab interface uses the ARIA tab pattern:

- one labelled `tablist`
- buttons with `role="tab"`, `aria-selected`, `aria-controls`, and roving `tabIndex`
- one active `tabpanel` labelled by its active tab
- click, Arrow Left, Arrow Right, Home, and End navigation
- focus moves with keyboard selection

Empty classifications keep the complete tablist visible and render the shared themed Empty
components inside the active panel.

## Registration and Project Integration

The block requires:

- its own config, server component, presentation, client tabs, card, preview, and shared normalizer
- registration in Pages and Reusable Sections
- production and live-preview renderer cases
- thumbnail definition, fixture, and dedicated 1600×900 JPEG
- generated Payload types
- operator documentation and project-context references

The shared News & Events group query and classification module remain reusable infrastructure.
Preview snapshot fields may remain shared, but their scanner must target `newsEventsTabs`, not
`newsGrid`.

## Testing and Verification

Focused tests cover:

- exact block schema and defaults
- fixed classification and label order
- publication/workflow/event-time query filters
- server query failure fallback
- card metadata, excerpts, action labels, and semantic theme classes
- mouse and keyboard tab selection
- empty panels and responsive two/three/four-column mappings
- optional section header and retained footer actions
- Pages, Reusable Sections, production renderer, and live-preview renderer registration
- preview snapshot counts
- thumbnail definition and fixture
- generated Payload types
- restored `News Grid` legacy contracts

Completion requires type generation, the new thumbnail, focused tests, typecheck, lint, project-context
update/check, and a final unstaged diff inspection. No files are committed or staged.
