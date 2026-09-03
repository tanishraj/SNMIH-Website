# Department Profiles Featured Carousel Design

## Objective

Extend the existing Department Profiles block with an optional featured-profile area that reuses the established Profile Carousel presentation. The featured area appears after the shared search-and-department toolbar, responds to the selected department, and disappears while the visitor searches. The existing directory remains the complete authoritative list.

## Product Decision

This feature belongs inside Department Profiles rather than in a new Page block. The active department and search query are client-owned state inside the directory, so a separate block could not reliably coordinate with them. Profiles remain authored once in the existing Department Profiles array.

## Authoring Contract

### Block-level content

- Place the feature toggle, subsection titles, and per-profile Featured checkbox in the Content tab so editors can configure the directory structure without moving into visual settings.
- Add `showFeaturedCarousel`, labeled `Enable Featured Profile Carousel`, as an optional checkbox with a default of `false`.
- Add `featuredCarouselTitle`, labeled `Featured Carousel Title`, conditionally visible when the feature is enabled and defaulted to `Featured Profiles`.
- Add `directoryTitle`, labeled `Directory Title`, conditionally visible when the feature is enabled and defaulted to `Profile Directory`.
- Add `featured`, labeled `Featured in Carousel`, to every existing profile row as an optional checkbox with a default of `false`.
- Featured profiles continue to use their existing image, name, designation, department assignment, and image position. Editors do not duplicate profile content or maintain a separate featured list.
- Featured order follows the existing profile-array order.

### Carousel-specific theme settings

When `showFeaturedCarousel` is enabled, expose prefixed equivalents of the existing Profile Carousel card controls in the Theme Settings tab:

- `featuredCarouselCardVariant`: Text Below Image or Image Overlay.
- `featuredCarouselSize`: Compact, Default, or Comfortable card/media sizing. This deliberately controls only the embedded cards; it does not reproduce Profile Carousel's outer `None` section-padding choice because Department Profiles already owns section spacing.
- `featuredCarouselOverlayAlignment`: Left, Center, or Right.
- `featuredCarouselThemeMode`: Auto, Light, Dark, or Brand.
- `featuredCarouselOverlayStyle`: Light, Dark, or Darker.
- `featuredCarouselOverlayDirection`: the shared media-overlay directions.
- `featuredCarouselOverlayCoverage`: Full or Split.

Overlay-only controls are conditionally visible when the featured card variant is Image Overlay. Department Profiles continues to own the outer section appearance, padding, container, header, content actions, and footer actions. These section-level fields are not duplicated for the embedded carousel.

### Validation

- At most 12 profiles may be marked featured, matching the existing Profile Carousel capacity.
- Every featured profile must have a Profile Image because the shared Profile Carousel card requires usable media.
- Non-featured directory profiles may continue to omit images and use the existing placeholder.
- Validation applies to authored featured rows even while the featured area is disabled, preventing dormant invalid configuration.

## Runtime Normalization

- Missing legacy `showFeaturedCarousel` and `featured` values resolve to `false`; no migration or backfill is required.
- Existing Department Profiles normalization remains authoritative for valid departments, department assignment, text trimming, media resolution, and image position.
- The resolved profile shape gains a `featured` boolean.
- Featured presentation profiles are mapped from the normalized directory profiles:
  - `name` remains Name.
  - `designation` becomes the Profile Carousel Role / Designation.
  - the resolved department name becomes the Profile Carousel Department.
  - image and image position pass through unchanged.
- Invalid legacy featured rows without usable images are omitted from the featured area but remain valid directory entries with the existing placeholder behavior.

## Shared Presentation Architecture

Extract the static-row/manual-carousel decision from the current Profile Carousel wrapper into one reusable internal collection component. It accepts normalized Profile Carousel profiles plus card variant, size, overlay settings, and the parent section background.

Both consumers use that shared component:

- Profile Carousel retains its current section header, appearance, actions, spacing, and behavior.
- Department Profiles renders only the shared card collection inside its existing section. It does not nest another `<section>`, container, outer padding, or action region.

The shared collection preserves the existing behavior exactly:

- 1–4 profiles render as the current responsive static row/grid without navigation controls.
- 5–12 profiles render as the current manual looping carousel with drag/swipe and Previous/Next controls.
- Autoplay is not added.

The Department Profiles consumer keys the featured collection by active department so carousel position resets predictably when the visitor selects another department.

## Visitor Layout and Interaction

The rendered sequence is:

```text
Department Profiles header

[ Search ] [ All | Medicine | Anatomy | … ]

Featured Profiles
[ shared Profile Carousel cards / manual controls ]

Profile Directory
[ existing Department Profiles directory ]
[ Load More ]

Footer actions
```

### Department behavior

- The All tab shows every valid featured profile in authored order.
- A department tab shows only featured profiles assigned to that department.
- Switching departments updates both the featured set and the existing directory filter.
- If the active department has no featured profiles, the complete featured subsection—including its title—is omitted.
- Featured profiles remain present in the directory below.

### Search behavior

- Any non-empty normalized search query hides the complete featured subsection, including its title and carousel controls.
- Search continues to filter the complete directory exactly as it does now.
- Clearing the query restores the featured set for the active department.
- Search never changes featured flags, authored order, or carousel configuration.

### Subsection labels

- Featured Carousel Title and Directory Title render only when the feature is enabled.
- The Featured Carousel Title renders only when the current state has at least one valid featured profile and no active search query.
- The Directory Title remains visible while searching so the result region retains context.
- Authored blank titles omit their heading without inventing replacement visitor copy; defaults apply to new records through Payload.

## Visual and Semantic Contract

- Featured cards use the existing Profile Carousel card layouts, typography, image geometry, semantic card surfaces, overlay system, and manual controls.
- The embedded carousel inherits the Department Profiles section background and therefore remains theme-correct across light, dark, subtle, brand, and gradient surfaces.
- The toolbar remains above both the featured and directory regions, visually establishing that department tabs govern both.
- The featured region receives clear vertical separation without a redundant boxed section or competing background.
- The directory cards, frame, search, tabs, pagination, and empty state remain unchanged.
- Subsection titles use `h3` when Department Profiles has a section-level `h2`, and `h2` when the parent block has no heading.
- Manual carousel controls retain their existing accessible names, keyboard behavior, touch targets, drag interaction, and focus treatment.
- Department tab keyboard interaction, search status announcements, directory tabpanel semantics, and Load More behavior remain unchanged.

## Responsive Behavior

- The toolbar retains its current stacked-to-horizontal responsive behavior.
- Featured cards use Profile Carousel’s current one-column phone, two-column tablet, and four-column desktop sizing.
- Static featured sets and the manual carousel use the same breakpoint behavior as the standalone Profile Carousel.
- Directory card sizing and column rules remain independent and unchanged beneath the featured region.

## Empty, Invalid, and Compatibility States

- Feature disabled: render the existing Department Profiles output without featured/directory subsection titles or new spacing.
- Feature enabled with no profiles marked featured: omit the featured subsection and render the titled directory.
- Active department with no matching featured profiles: omit the featured subsection and retain the filtered directory.
- Active search query: omit the featured subsection and retain the filtered directory.
- Invalid featured profile without an image in legacy data: omit it from the featured set but retain it in the directory.
- No valid directory profiles: preserve the block’s existing server-side `null` behavior.
- No matching directory search/filter results: preserve the existing public empty-state message.

## Verification

- Schema tests cover the enable toggle, conditional subsection titles, per-profile Featured checkbox, carousel layout/size controls, and overlay-only conditions.
- Validation tests cover 0–12 featured profiles, rejection of 13, rejection of featured profiles without images, and continued acceptance of non-featured profiles without images.
- Generated Payload types cover all new fields.
- Shared Profile Carousel tests prove standalone output and the 1–4 static / 5–12 carousel boundary remain unchanged after extraction.
- Department Profiles client tests cover All and department-specific featured sets, authored order, department changes, search suppression/restoration, no-featured states, and inclusion of featured profiles in the directory.
- Rendering tests cover both featured card variants, overlay settings, inherited section surfaces, subsection heading levels, disabled-feature compatibility, and invalid legacy media fallback.
- Registration, production renderer, live preview, block thumbnail, theme, TypeScript, lint, and maintained project-context contracts are checked in proportion to the cross-file block change.

## Maintained Context

Update `block-system.md` to record the department-aware featured carousel contract and refresh `project-inventory.json` after generated types and any new shared files are final.
