# News & Events Detail Template Design

## Purpose

Make every `/news-events/[slug]` page use one administrator-configurable detail template while
keeping each page's editorial content owned by its News & Events collection entry.

The template must provide a fixed global Page Header, an automatic Breadcrumb, an entry-specific
introduction and featured image, a polished Lexical article body, and a right-hand metadata/share
sidebar. It must remain aligned with the project's existing theme, spacing, Page Header,
Breadcrumb, card-surface, and media-presentation contracts.

## Approved Architecture

Add a versioned Payload global named **News & Events Detail Template** with the slug
`news-events-detail-template`. Register it under the Configuration admin group.

The global owns shared presentation settings only. News & Events records continue to own the
dynamic title, excerpt, featured image, classification, dates, event details, taxonomy, SEO, and
Lexical body.

The detail route loads the published News & Events entry and published template global in parallel.
The route then passes both through a dedicated detail-page presentation boundary. Existing SEO,
canonical metadata, workflow, public filtering, and preview authorization behavior remain unchanged.
Structured-data types and entry fields remain unchanged except that NewsArticle author data uses the
global Author Label instead of the retired per-entry byline.

This is a controlled template, not an unrestricted block builder. Editors cannot remove the entry
body, add duplicate entry-title regions, or reorder required structural areas. Existing shared field
and presentation helpers should be extracted or reused where appropriate instead of duplicating Page
Header, Breadcrumb, appearance, spacing, overlay, or card-surface contracts.

## Access, Versions, and Caching

- The global uses drafts/versions.
- Public rendering reads only its published state.
- Users with either News & Events management or page-settings management capability can view and
  update it.
- The loader is cached using the project's existing global caching conventions.
- Saving the template invalidates affected News & Events detail rendering.
- A normalized built-in default keeps detail pages usable before the global is configured or when
  loading fails.

## Admin Configuration

The global uses three top-level tabs.

### Page Header

The fixed header appears identically on every News & Events slug page. It includes:

- Eyebrow.
- Required title.
- Description.
- Minimal or Banner variant.
- Background image and shared media-overlay controls when Banner is selected.
- Content alignment and width.
- Height.
- Semantic appearance and section spacing.

This is the only eyebrow on the public detail page. The dynamic entry introduction has no eyebrow.
Header actions are outside this design's scope.

### Breadcrumb

Breadcrumb items are generated dynamically as:

1. Home.
2. News & Events.
3. Current entry title.

Editors can configure:

- Semantic appearance.
- Separator.
- Size.
- Show Home.
- Show Current Entry.
- Section spacing.

Custom breadcrumb items are intentionally unsupported because the current-entry item must always
match the dynamic record. The Breadcrumb renders as its own section directly below the fixed Page
Header.

### Article Layout

Editors can configure:

- Required Author Label, defaulting to `Management, SNMIH`.
- Semantic section appearance.
- Vertical section spacing.
- Sidebar card semantic background.
- Sidebar card outline.
- Featured-image aspect-ratio preset.

The featured-image object position continues to come from each News & Events entry. The sidebar is
always on the right at desktop widths and therefore has no position control. Its Story Details and
Share This interface labels remain fixed.

## News & Events Collection Compatibility

The existing per-entry `authorName`/Byline field is retained in stored data for compatibility but is
hidden from the admin editor and ignored by public detail rendering. The global Author Label is the
only public author source.

No migration or destructive cleanup of legacy byline values is required.

## Public Layout

Every News & Events detail page renders in this order:

1. Fixed global Page Header.
2. Standalone automatic Breadcrumb.
3. Entry introduction containing the dynamic title and excerpt, without an eyebrow.
4. Entry featured image, without any text or other content overlay.
5. Desktop two-column article region containing the Lexical body and right sidebar.

The featured image appears before the two-column region and uses the regular project container. The
article grid uses a fluid main column and a compact fixed-width sidebar. On smaller screens the grid
becomes a single column and the sidebar moves below the article content.

The desktop sidebar uses the project's established sticky offset so its short cards remain useful
while reading. Sticky behavior is disabled when the layout stacks.

## Sidebar Content

The sidebar contains two separate semantic cards.

### Story Details

Every classification displays:

- Author Label from the global template.
- Entry classification.
- Entry display date.

Event entries additionally display, when present:

- Start and end date/time.
- Location.
- Registration action using the entry's existing action configuration.

Empty optional values do not leave labels or placeholders.

### Share This

The card contains:

- Share, using the browser Web Share API when available.
- Copy Link, using the Clipboard API and an accessible success state.

When native sharing is unavailable, Share falls back to the same copy-link behavior. Failures retain
an operable control and expose an accessible status rather than throwing or breaking the page.

Only this small share-control boundary is a Client Component. The detail page and article content
remain server-rendered.

## Lexical Article Presentation

The News & Events body continues to use the shared writing-focused Lexical editor. The frontend adds
a dedicated article typography contract covering every enabled feature:

- H2, H3, and H4 hierarchy with consistent spacing and no generated H1.
- Readable paragraph measure, line height, and vertical rhythm.
- Bold, italic, underline, strike-through, and inline code.
- Ordered, unordered, nested, and checklist lists.
- Blockquotes and horizontal rules.
- Theme-aware links with hover and keyboard-focus states.
- Inline Media uploads constrained responsively with semantic border, radius, spacing, and captions
  when emitted by the renderer.
- Editor-authored alignment and indentation.

Typography uses existing theme tokens and semantic colors rather than hardcoded palette values. It
must remain readable across all theme presets and light/dark modes. Rich content must not overflow
the main column; long links, media, nested lists, and preformatted content must remain responsive.

## Data Flow and Preview

Production flow:

1. Resolve and validate the published News & Events entry.
2. Load and normalize the published detail-template global.
3. Generate unchanged metadata and structured data from the entry.
4. Render the shared detail-page presentation with the normalized entry and template.

Preview flow:

1. Preserve the existing authenticated News & Events draft lookup.
2. Convert the live entry data through the existing public detail adapter.
3. Render the same detail-page presentation with the template settings.
4. Continue using `RefreshRouteOnSave` for server-owned data changes.

The public adapter stops exposing the legacy per-entry author as the visible byline. NewsArticle
JSON-LD uses the global Author Label as an Organization author. Other existing detail fields, SEO
properties, and structured-data behavior remain intact.

## Error and Empty-State Behavior

- A missing entry still returns the existing not-found behavior.
- A missing or failed template load uses normalized built-in defaults.
- Missing optional event metadata is omitted cleanly.
- Missing optional media does not render a broken image wrapper.
- Share API errors remain local to the share controls.
- Rich-text rendering remains inside the existing route-level rendering boundary and must not alter
  SEO or structured-data output beyond the approved global author source.

## Verification

Implementation verification must cover:

- Global registration, labels, tabs, fields, defaults, access, versions, and admin visibility.
- Published global loading, normalization, caching, and invalidation.
- News and Event detail variants.
- Built-in defaults when template data is missing or invalid.
- Fixed Page Header rendering and configuration.
- Automatic dynamic Breadcrumb generation.
- Entry introduction and non-overlay featured image.
- Right-hand desktop sidebar and responsive stacking.
- Global author behavior and ignored legacy bylines.
- Conditional Event metadata and registration action.
- Share, Copy Link, native-share fallback, and accessible status behavior.
- Lexical headings, paragraphs, inline formatting, lists, checklists, links, quotes, rules, uploads,
  alignment, indentation, overflow handling, and semantic theme styling.
- Authenticated News & Events live preview.
- Existing metadata and structured-data contracts, with the NewsArticle author sourced from the
  global Author Label.
- Payload type generation, lint, TypeScript, focused integration tests, and project-context
  update/check.

## Out of Scope

- Per-entry template overrides.
- A freeform block builder for detail pages.
- Custom breadcrumb authoring.
- Configurable left sidebar placement.
- Content overlays on the featured image.
- Entry-specific eyebrows.
- Header actions.
- Destructive removal of stored legacy byline data.

## Repository Safety

Do not stage or commit the implementation or this specification unless the user explicitly requests
it in a later turn. Preserve unrelated staged and unstaged work already present in the repository.
