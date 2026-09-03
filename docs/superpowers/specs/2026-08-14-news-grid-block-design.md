# News Grid Block Design

## Goal

Add a separate **News Grid** page block that presents an editorial row of automatically selected
News & Events entries plus an optional promotional image card. The composition follows the supplied
SNMIH reference while remaining reusable across themes and sites.

The existing **News & Events Highlights** block remains unchanged. News Grid reuses its governed
collection query and live-preview snapshot pipeline but owns a distinct card composition, type-specific
calls to action, configurable desktop column count, and promotional-card behavior.

## Block identity and availability

- Admin label: **News Grid**
- Payload slug: `newsGrid`
- Generated interface: `NewsGridBlock`
- Available in Pages and Reusable Sections
- Supported by production rendering and Page live preview
- Included in the block thumbnail definition and fixture catalogs
- Documented in the block guide and feature inventory

This is an additive schema change and requires no content migration.

## Collection binding

News Grid must not store manually selected News/Event relationships. It uses the existing
`getNewsEventsHighlights` data source and therefore inherits its public-content rules:

1. query published News in newest-publication order;
2. query published current/upcoming Events in nearest-start order;
3. begin with News and alternate News/Event entries;
4. backfill from the available type when the other type is exhausted;
5. exclude past Events and duplicate entries;
6. generate canonical `/news-events/[slug]` destinations from the collection serializer.

Production rendering catches query failures and degrades to the configured empty state or a valid
promotional card. Page live preview preloads the same count-specific collection snapshot used by News
& Events Highlights so preview and production receive the same public card shape.

## CMS schema

The block follows the project's standard **Content** and **Theme Settings** tabs.

### Content

Section fields:

- `eyebrow`: optional short label
- `title`: required primary heading text
- `accentTitle`: optional italic continuation rendered inside the same `h2`
- `description`: optional supporting textarea
- `actions`: up to two shared header actions
- `footerActions`: up to two shared actions below the cards
- `totalCards`: integer from 1 through 6, default 3
- `newsActionLabel`: optional News link label, default **Read update**
- `eventActionLabel`: optional Event link label, default **View details**
- `emptyStateMessage`: optional query-empty/failure message, default **No updates published yet.**

`totalCards` describes the complete visible card count. A valid enabled promotional card occupies the
last slot, so the server requests `totalCards - 1` collection entries. When `totalCards` is 1 and the
promotional card is valid, the collection query is skipped. If the promotional card is disabled or
invalid, the full total is requested from News & Events.

The optional `featureCard` group contains:

- `enabled`: show/hide control
- `image`: optional Media background image
- `eyebrow`: optional short label
- `title`: required for the promotional card to be considered valid
- `actionLabel`: optional link label, default **Explore**
- `linkType`: None, Page, or Custom URL
- `page`: conditional Page relationship
- `url`: conditional custom URL
- `openInNewTab`: conditional checkbox

A valid title is sufficient to render the promotional card. Missing image or destination does not
remove the card; those optional elements simply reserve no space. Incomplete Page/custom links are
ignored through the shared CMS link resolver.

### Theme Settings

- Shared block appearance controls
- `contentAlignment`: Left or Center, default Left
- `cardsPerRow`: 2, 3, or 4, default 3
- Shared section padding: None, Compact, Default, or Comfortable

Left alignment places valid header actions opposite the heading at medium widths and above. Center
alignment stacks and centers the action group. All actions retain their per-action link/button mode,
variant, and optional arrow controls from the shared action model.

## Visual design

The default desktop composition is:

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│ EYEBROW                                                   View all news ↗     │
│ News & announcements.                                                        │
│ Optional description                                                         │
│                                                                               │
│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────────────────┐ │
│ │ CATEGORY          │ │ CATEGORY          │ │ IMAGE                         │ │
│ │ DATE              │ │ DATE              │ │                               │ │
│ │ News title        │ │ Event title       │ │ PROMO EYEBROW                 │ │
│ │                   │ │                   │ │ Promotional title             │ │
│ │ Read update ↗     │ │ View details ↗    │ │ Explore ↗                     │ │
│ └───────────────────┘ └───────────────────┘ └───────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────┘
```

- The shared regular-block container, section spacing, eyebrow, heading, description, action, and
  link contracts determine typography and rhythm.
- The accent title is an italic continuation within the section `h2`; it does not introduce another
  heading or a component-local font.
- Collection cards use a subtle surface-aware border, equal internal padding, and a flexible column
  layout that keeps their action links aligned at the foot without fixed content heights.
- Card category and date use established eyebrow/metadata styles. Card titles use the shared content
  item heading family and scale.
- News and Event cards use distinct editor-configured action labels but the same canonical link
  behavior and visual treatment.
- The promotional card uses its image as a full-bleed background. A restrained dark overlay preserves
  white-text contrast. Without an image, it falls back to the selected semantic section surface rather
  than a hard-coded color.
- The promotional card is always the last card in DOM and visual order.
- No carousel, manual item selection, animation, per-card raw colors, or detached shadow treatment is
  introduced.

## Theme behavior

The block uses the existing semantic systems:

- `resolveBlockAppearanceClasses` for section background, foreground, and border behavior
- shared content style contracts for section and card typography
- `SectionEyebrow` with the resolved section/overlay surface
- `border-current/15` for subdued adaptive card borders
- `ContentActions`, `BlockFooterActions`, and `ContentLink` for actions and links
- `getMediaImageProps` plus the Media focal-position data supplied by the News/Event serializer
- `rounded-[var(--radius)]` where the selected theme's component geometry calls for it

The block contains no SNMIH-only color values. Theme and dark-mode changes flow through current color,
semantic surfaces, and shared action tokens.

## Responsive behavior

- Mobile renders one card per row.
- Medium widths render at most two cards per row.
- Extra-large widths render the configured 2, 3, or 4 cards per row.
- A 2-column selection remains two columns at medium and extra-large widths.
- A 3- or 4-column selection expands from two columns at medium to the selected count at extra large.
- Header actions stack below the introduction on narrow screens.
- Long headings, taxonomy labels, dates, and link labels wrap without truncation or horizontal overflow.
- Images retain a stable card footprint through aspect/cover behavior without forcing collection cards
  to fixed heights.
- Reading and tab order remain header, header actions, collection cards, promotional card, then footer
  actions.

## Rendering and count resolution

The implementation separates count resolution from presentation:

1. trim and validate the section title;
2. determine whether the promotional card is valid (`enabled` plus non-empty title);
3. normalize `totalCards` into the supported 1–6 range;
4. compute `collectionItemCount = max(0, totalCards - validFeatureCount)`;
5. skip the query when `collectionItemCount` is zero, otherwise call the existing highlights query;
6. pass collection items and the normalized total to the pure presentation component;
7. defensively slice collection items so the presentation can never exceed the configured total;
8. append the valid promotional card as the final slot;
9. render the empty message only when neither collection nor promotional content is available.

Live preview uses the same helper to decide which collection count must be prefetched. Counts of zero
are not added to the snapshot because they require no query.

## Accessibility

- The section uses one `h2`; each visible card uses an `h3`.
- Collection cards are semantic articles with one clear link destination.
- The promotional image uses the editor-authored Media alt text/fallback title but is decorative when
  implemented as a full-bleed background behind equivalent visible text.
- Text over imagery maintains contrast through the overlay in light and dark modes.
- Links and buttons retain shared visible keyboard focus states and safe external-link attributes.
- No content or destination is available only through hover.

## Registration and documentation

Implementation registers News Grid in:

- `src/collections/Pages.ts`
- `src/collections/ReusableSections.ts`
- `src/blocks/renderPageBlocks.tsx`
- `src/blocks/renderLivePreviewPageBlocks.tsx`
- `src/block-thumbnails/definitions.ts`
- `src/block-thumbnails/fixtures.tsx`
- `src/lib/newsEventsPreviewShared.ts`

Generated Payload types are refreshed after registration. The block guide and feature inventory are
updated with the automatic collection binding, total-card semantics, promotional slot, and responsive
column controls.

## Testing and verification

Automated coverage verifies:

- Payload tabs, defaults, bounds, labels, feature-card conditions, and link conditions;
- registration in Pages, Reusable Sections, production rendering, and live preview;
- total-card normalization and feature-inclusive query counts, including the zero-query case;
- automatic query failure degradation;
- News/Event interleaving remains delegated to the existing tested collection helper;
- 2-, 3-, and 4-card desktop grid mappings and safe fallback for stale values;
- mobile/tablet responsive column contracts;
- type-specific action labels and canonical collection destinations;
- promotional-card validation, final ordering, optional image/link behavior, and external-link safety;
- empty, feature-only, collection-only, and mixed states;
- shared appearance, typography, spacing, radius, border, and action hooks;
- thumbnail definition/fixture coverage, generated types, and documentation registration.

Validation includes focused Vitest coverage, Payload type generation, TypeScript, scoped ESLint,
format/diff checks, an Impeccable detector pass, and bounded desktop/tablet/mobile visual inspection.
The explicitly requested in-app browser is used for interactive inspection when that browser surface
is available; its temporary unavailability does not authorize substitution with a different browser.

## Out of scope

- Changing the existing News & Events Highlights block
- Manual News/Event selection or per-card editorial overrides
- Past Events in the automatic stream
- Carousel/autoplay behavior
- Per-card background/color controls for collection entries
- New theme tokens or hard-coded SNMIH brand colors
