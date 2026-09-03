# News and Events Page Blocks Design

**Date:** 2026-08-17

**Status:** Approved

## Goal

Extend the existing collection-driven News & Events blocks so editors can build the supplied two-part page composition inside Pages or Reusable Sections:

1. a synchronized featured-story carousel with a large image story and a one-item-at-a-time story rail;
2. a classification-tabbed grid of recent entries.

The dedicated `/news-events` archive route remains unchanged. Existing saved instances of `News & Events Highlights` and `News Grid` retain their current layouts and behavior unless an editor explicitly selects a new layout.

## Content Model

The existing required `contentType` select in `NewsEvents` becomes the single editorial classification for every entry. Expand its accepted values while retaining the existing field name and stored `news` and `event` values:

| Admin label  | Stored value   | Tab label     |
| ------------ | -------------- | ------------- |
| News         | `news`         | News          |
| Events       | `event`        | Events        |
| Notice       | `notice`       | Notice        |
| Holiday      | `holiday`      | Holiday       |
| Achievements | `achievement`  | Achievements  |
| Announcement | `announcement` | Announcement  |
| Others       | `other`        | Others        |

Each entry belongs to exactly one classification. `All` is a derived tab and is not a stored value.

Event-specific behavior remains tied only to `event`:

- Event Start and Event Location remain required for Event entries.
- Event End and Registration Action remain Event-only fields.
- Event date formatting, upcoming/past detection, and expiry filtering remain Event-only behavior.
- Every other classification uses the publication date and behaves as editorial news content.

Existing Topics and Tags remain independent taxonomy. They continue to support archive placement, cross-linking, and detail-page navigation; they do not drive these fixed tabs.

Because the existing values remain valid and the same field is expanded, existing News and Event documents require no migration.

## Shared Public Data Contract

Expand the public card classification type to the seven stored values. A card continues to contain its title, excerpt, detail URL, display date, image, primary topic, and event metadata when applicable.

Classification labels must come from one shared mapping used by the carousel, tab list, cards, archive-facing presentation, previews, and tests. Do not duplicate label spelling across components.

All block queries must preserve the existing public eligibility contract:

- Payload `_status` is `published`;
- editorial `workflowState` is `published`;
- expired Event entries are excluded from these overview blocks;
- selection uses bounded fields and relationship depth;
- a failed query degrades to the configured empty state rather than breaking the Page.

Non-event entries sort by publication recency. Event entries sort by their next upcoming start date. Mixed automatic results reuse the existing interleaving principle so upcoming Events do not overwhelm, or disappear behind, other recent classifications.

## News & Events Highlights: Featured Carousel

### Compatibility and configuration

Add a layout field to the existing `newsEventsHighlights` block:

- `cards`: the current three-card highlights layout and the fallback for missing legacy values;
- `featuredCarousel`: the new synchronized carousel.

The existing Content and Theme Settings remain available: eyebrow, title, description, header action, footer actions, item count, empty-state message, content alignment, section appearance, border, and padding.

Carousel mode adds:

- `featuredEntries`: an ordered, multi-value relationship to `news-events`, limited to the same maximum supported item count;
- `autoplay`: a checkbox enabled by default.

The existing item-count normalization remains 1–6. Editors normally select 3–6 entries for this composition. A single eligible entry renders as a static feature without carousel controls or autoplay.

The outer section header is optional in carousel mode so the feature can begin directly with content, as in the supplied reference. The current cards layout retains its existing title guard and markup when selected.

### Selection and fallback

Resolve carousel entries in this order:

1. preserve the editor-authored relationship order;
2. discard duplicate, missing, unpublished, workflow-ineligible, and expired Event entries;
3. stop at the configured item count when enough manual entries remain;
4. fill remaining positions with eligible automatic highlights that are not already selected.

Automatic fallback must not reorder valid manual entries. It uses the expanded classification set, with upcoming Events participating through the existing mixed-highlight behavior.

### Desktop composition

The feature uses the regular block container and a two-column desktop composition:

- the large active story occupies approximately two-thirds of the width;
- a three-item vertical rail occupies the remaining third;
- both areas share a stable visual height;
- the large story uses its featured image, configured object position, theme-aware overlay, classification badge, title, excerpt, date, and detail action;
- the rail shows classification, date, title, and a bounded excerpt;
- the active rail item receives a clear semantic accent or outline.

The rail is a navigator. Selecting a rail item changes the active large story and scrolls the rail by one item when necessary. The active feature owns the primary detail link so selection and navigation remain distinct and accessible.

### Responsive composition

- Desktop: large feature left, vertical rail right.
- Tablet: large feature above a horizontal rail.
- Mobile: one feature at a time with compact previous/next controls and position feedback; the dense desktop rail is not forced into the narrow viewport.

Content remains in source order, long titles and excerpts clamp without changing card height, and no viewport may gain horizontal page overflow.

### Motion and accessibility

Autoplay advances one item every six seconds and synchronizes the feature and rail. It pauses while the carousel contains hover or keyboard focus and resumes after interaction. It is disabled when the editor turns it off, when only one item exists, or when the visitor requests reduced motion.

Previous and next controls remain available whenever multiple entries exist. Controls have explicit accessible labels. Carousel semantics announce the current position without repeatedly announcing autoplay changes. Keyboard focus order follows the visible DOM order.

## News Grid: Classification Tabs

### Compatibility and configuration

Add a display-mode field to the existing `newsGrid` block:

- `grid`: the current unfiltered News Grid and the fallback for missing legacy values;
- `classificationTabs`: the new tabbed grid.

Tabbed mode adds an `itemsPerTab` control with `3`, `6`, `9`, and `12`; the default is `6`. Existing cards-per-row controls remain available with 2, 3, or 4 desktop columns. Existing section appearance, alignment, spacing, header actions, footer actions, action labels, and empty-state configuration remain available.

The section eyebrow, title, accent title, description, and header actions are optional in tabbed mode. When none are authored, the tab list starts the block without an empty header wrapper. The existing grid mode retains its established header requirement and rendering behavior.

The existing manually authored feature card remains exclusive to standard grid mode. It does not appear inside classification tabs because it has no collection classification and would make tab results inconsistent.

### Tabs and data

Render tabs in this fixed order:

1. All
2. News
3. Events
4. Notice
5. Holiday
6. Achievements
7. Announcement
8. Others

`All` contains the newest bounded mixed set. Every classification tab contains only entries whose single stored classification matches that tab. The server loads bounded grouped card data; the client receives presentation-ready cards and performs instant tab switching without additional navigation or a browser-side Payload query.

Tabs do not paginate or load more. The optional shared footer action provides the handoff to a complete archive or another editor-selected destination.

### Interaction and responsive layout

The active tab defaults to `All`. The tab list implements the ARIA tabs pattern:

- Left and Right arrows move between tabs.
- Home and End move to the first and last tab.
- focus and selected state remain visible on every theme surface.
- the tab row scrolls horizontally on narrow screens without wrapping into a tall control stack.

Cards use the existing News Grid structure: classification badge, formatted date, display-font title, bounded excerpt, and the appropriate content link. The grid remains one column on mobile, two on tablet, and the configured 2–4 columns at the established desktop breakpoint.

Event cards continue to use the configured Event action label. News, Notice, Holiday, Achievement, Announcement, and Other cards use the configured News action label so expanding the classification does not add six redundant action-label fields.

Changing tabs replaces the grid content in place. The active panel receives a stable accessible label, and empty classifications render the configured empty-state message rather than collapsing the entire block.

## Theme and Visual Contract

Both new modes compose existing semantic primitives rather than introducing screenshot-specific values:

- `resolveBlockAppearanceClasses()` for page, subtle, brand, and gradient section surfaces;
- the shared regular container and section-padding contract;
- shared content heading, description, item, metadata, eyebrow, action, and footer-action styles;
- semantic card and overlay contrast resolution;
- the active theme's `--background`, `--foreground`, `--primary`, `--muted`, `--accent`, `--success`, `--border`, `--ring`, and `--radius` values;
- the project display, sans-serif, and metadata font variables.

Under SNMIH this produces the existing navy/ink typography, green accents, ice surfaces, fine dividers, square corners, and current typography scale. Other registered themes and dark mode must remain legible without special-case component markup.

Classification badges use a restrained semantic mapping built from theme tokens. They may distinguish classifications, but must not hardcode the reference screenshot's colors or create seven unrelated visual palettes.

### shadcn composition boundary

Reuse the project's installed shadcn primitives before adding custom equivalents:

- `Carousel` provides the Embla viewport and orientation foundation;
- `Card` composition structures rail and grid cards;
- `Badge` renders classifications;
- `Button` renders carousel controls;
- `Empty` renders bounded empty states;
- `Separator` renders structural dividers when a semantic divider is needed.

The specialized synchronized feature/rail controller and collection-backed tab panels remain project components because they coordinate project-specific data and behavior. Do not import a registry marketing block or add a new shadcn dependency unless implementation proves an installed primitive cannot satisfy an approved requirement. Any custom layout classes are limited to composition and responsive geometry; colors and typography continue to come from component variants, shared content classes, and semantic theme tokens.

## Empty, Invalid, and Legacy States

- A missing layout/display-mode value resolves to the existing layout.
- Existing block documents gain no new wrappers, motion, tabs, or spacing until the new mode is selected.
- Whitespace-only optional section content emits no empty elements.
- Invalid manual carousel relationships are ignored before fallback selection.
- One carousel item is static; zero items show the configured empty state or render nothing when no message exists.
- Missing media uses an accessible semantic fallback surface and never renders a broken image.
- A tab with no entries shows its local empty state while preserving the tabs and surrounding section.
- Query failures are caught at the server block boundary and do not crash sibling blocks.

## Live Preview and Block Thumbnails

Production and live preview use the same presentation components and normalized data structures. Preview snapshots must contain representative entries for every classification and enough carousel items to demonstrate synchronization without importing server-only collection loaders into the client preview boundary.

Update the existing block fixtures and 1600×900 JPEG thumbnails so:

- News & Events Highlights demonstrates the featured-carousel option;
- News Grid demonstrates classification tabs and themed cards.

No new block registration, slug, interface name, renderer switch case, or thumbnail identity is introduced.

## Testing and Verification

Focused schema and data tests verify:

- the seven exact classification values and labels;
- Event-only validation and conditional fields;
- compatibility of existing `news` and `event` documents;
- new layout/display-mode defaults and conditional Admin fields;
- carousel relationship limits, autoplay default, and item-count normalization;
- published/workflow filtering, expired Event filtering, deduplication, manual order, automatic fallback, and mixed sorting;
- grouped tab queries and per-tab limits.

Focused presentation and interaction tests verify:

- legacy cards and grid markup remains unchanged by default;
- optional headers emit no empty wrappers in the new modes;
- carousel feature/rail synchronization, single-item behavior, controls, pause behavior, and reduced-motion handling;
- desktop vertical rail, tablet horizontal rail, and mobile compact composition;
- fixed tab order, All grouping, per-classification filtering, ARIA roles, keyboard navigation, and empty panels;
- 2-, 3-, and 4-column grid behavior;
- shared semantic theme classes, focus visibility, image fallbacks, and action rendering;
- Page, Reusable Section, production renderer, live-preview renderer, thumbnail, spacing, and theme contracts.

Completion verification includes:

- `pnpm generate:types`;
- `pnpm generate:block-thumbnails` and visual thumbnail inspection;
- focused News & Events collection, data, highlights, News Grid, preview, registration, theme, and accessibility tests;
- `pnpm exec tsc --noEmit` and lint in proportion to the final change surface;
- `pnpm project-context:update` and `pnpm project-context:check`.

## Out of Scope

- Changing or directly rendering these blocks on the dedicated `/news-events` archive route.
- Replacing the existing Topics or Tags taxonomy.
- Pagination, load-more, or browser-side collection fetching inside the tabbed block.
- Introducing a third block, a new collection, or duplicate detail routes.
- Changing unrelated global themes or existing saved block layouts.
