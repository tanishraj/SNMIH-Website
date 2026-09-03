# Standalone Breadcrumb Block

## Goal

Add a simple standalone Breadcrumb block that can be placed anywhere in a Page or Reusable Section. It must reuse the existing page-hierarchy resolver, follow the selected website theme, and give editors a restrained set of presentation controls without duplicating Page Header behavior.

## Content model

The block has Content and Theme Settings tabs.

Content contains a required `breadcrumbMode` select:

- `automatic` — default; derive Home, ancestors, and the current Page from the current page hierarchy.
- `custom` — render an editor-defined trail.

When Custom is selected, show a `breadcrumbs` array with the same fields and behavior used by Page Header:

- Label.
- Link Type: Page or Custom URL.
- Page relationship when Page is selected.
- Custom URL when Custom URL is selected.

The last resolved item is always treated as the current location and is not linked. Empty labels are removed. Missing relationships or URLs degrade to plain text instead of producing broken links.

The standalone block does not automatically suppress Page Header breadcrumbs. Editors explicitly set the Page Header's Breadcrumb Display to Hidden when both blocks exist and only one trail should be visible.

## Theme settings

The block exposes:

- `separator`: Chevron, Slash, Arrow, or Dot. Chevron is the default.
- `alignment`: Left, Center, or Right. Left is the default.
- `size`: Compact or Default. Default is the default.
- `showHome`: checkbox, enabled by default. It hides only a resolved Home crumb (`/` or the conventional Home label), never an arbitrary first custom item.
- `showCurrentPage`: checkbox, enabled by default.
- `appearance`: the shared Background and Border controls.
- `sectionPadding`: None, Compact, or Default. Compact is the default.

These controls affect presentation only. The resolved hierarchy remains the same source for navigation semantics and structured data.

## Visual design

The block extends the incumbent design system rather than introducing a new visual language.

- Typography uses the existing body family and theme foreground colors.
- Ancestor links use the established semibold content-link weight without an underline or embedded action arrow. On light surfaces they use the theme primary color; on brand and dark surfaces they inherit the readable section foreground.
- The current item is never linked and uses a quieter regular weight so the navigable path remains visually clear.
- Separators are decorative, muted, and excluded from assistive technology.
- Chevron and Arrow use Lucide icons; Slash and Dot use text glyphs with consistent spacing.
- Compact size reduces type and inter-item spacing; Default retains the normal breadcrumb reading size.
- Alignment applies to the complete wrapping trail, including wrapped lines.
- Appearance and borders use shared block tokens so light, dark, brand, and gradient backgrounds remain consistent with other blocks.

No card, pill, glass, shadow, or bespoke color treatment is added. The refinement comes from type weight, spacing, and predictable hierarchy.

## Responsive behavior

- The trail wraps naturally on narrow screens and never creates horizontal page overflow.
- Each crumb keeps its separator and label together where practical.
- Long labels can wrap safely without forcing a fixed-width container.
- Touch and keyboard interaction remain standard links; no client-side interaction is required.
- The block uses the shared regular block container and responsive padding scale.

## Shared architecture

Extract the existing Page Header breadcrumb markup into a shared `BreadcrumbTrail` presentation component. Page Header and the standalone Breadcrumb block both use it.

The shared component accepts already resolved items plus presentation options. It does not query Payload or infer page hierarchy. This keeps resolution, rendering, and CMS configuration independently testable.

Keep `resolveAutomaticPageBreadcrumbs` and custom breadcrumb normalization in the existing breadcrumb library. Generalize the custom-item type only as needed so Page Header and Breadcrumb block fields share the resolver without unsafe casts or duplicated logic.

Production and live-preview block renderers already compute automatic breadcrumbs from the current Page. Forward those items to the standalone block, including blocks nested inside populated Reusable Sections. Pages rendered without current-page context safely receive an empty automatic trail.

## Registration and preview coverage

Register the block in:

- Page layout blocks.
- Reusable Section layout blocks.
- Production block rendering.
- Live-preview block rendering.
- Block thumbnail definitions and fixtures.
- Generated Payload types.

The block renders nothing when filtering and normalization leave no visible items. Automatic breadcrumbs remain empty on the configured homepage.

## Structured data

Continue using the existing page-level `BreadcrumbList` JSON-LD resolver. Adding a standalone block must not emit a second structured-data script.

The visible standalone trail can hide Home or the current Page as a presentation choice, while page-level structured data retains the complete resolved hierarchy. Custom Page Header breadcrumb mode continues to control the existing page-level structured-data override; the standalone block does not silently change that established contract.

## Accessibility

- Render a semantic `<nav aria-label="Breadcrumb">` landmark.
- Render ordered breadcrumb content with list semantics.
- Apply `aria-current="page"` only when the current item is visible.
- Mark separators `aria-hidden="true"`.
- Keep navigable ancestors as anchors and non-navigable items as text.
- Preserve visible keyboard focus through the shared project link styles.
- Do not encode separator meaning through color alone.

## Testing and verification

Automated coverage verifies:

- Automatic mode renders Home, ancestors, and the current Page.
- Custom mode supports Page and Custom URL items.
- Homepage and empty trails render no block markup.
- Show Home and Show Current Page filter only the visible trail.
- The resolved current-page item is unlinked and uses `aria-current="page"` when it is visible.
- All four separators render decoratively.
- Left, Center, and Right alignment classes are applied.
- Compact and Default sizes use the approved type and spacing classes.
- Shared appearance and padding settings are applied.
- Page Header uses the extracted shared renderer without behavioral regression.
- Production, live preview, and nested Reusable Sections receive page context.
- Block schema, picker registration, thumbnail fixture, and generated types include Breadcrumb.

Verification includes Payload type generation, TypeScript, formatting, focused integration tests, the full test suite, and responsive visual checks at mobile and desktop widths on neutral and brand surfaces.

## Out of scope

- Automatically hiding Page Header breadcrumbs.
- Breadcrumbs for non-Page templates such as articles, reviews, News, or Events.
- Per-item separator or color controls.
- Icons inside breadcrumb labels.
- Animated transitions or overflow carousels.
- A second breadcrumb JSON-LD script owned by the block.
