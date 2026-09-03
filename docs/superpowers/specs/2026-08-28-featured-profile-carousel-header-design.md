# Featured Profile Carousel Header Refinement Design

## Objective

Refine the featured Profile Carousel embedded in Department Profiles so its department metadata matches the established smaller Department Profile cards and its manual navigation controls share one row with the Featured Profiles title.

## Scope

- Change the shared Profile Carousel **Image Overlay** card only: Department becomes compact label metadata above the profile name.
- Keep the **Text Below Image** card layout and metadata order unchanged.
- Move Previous/Next controls into the Featured Profiles heading row only for the embedded Department Profiles carousel.
- Preserve the standalone Profile Carousel section header, spacing, controls, carousel threshold, interaction, and editor settings.
- Do not add or change Payload fields, generated types, content migrations, filtering, search, autoplay, or directory cards.

## Shared Component Architecture

`ProfileCarouselCollection` gains an optional header slot. For one through four profiles, it renders the optional header above the existing static grid. For five through twelve profiles, it passes the header into `ProfileCarouselClient`.

`ProfileCarouselClient` supports two presentation modes:

- Without a header slot, preserve the current standalone layout: reserved top space with controls positioned at the upper right.
- With a header slot, render a normal-flow header row containing the supplied title at the inline start and Previous/Next controls at the inline end. Do not add the existing `pt-14` control spacer.

Department Profiles supplies its semantic subsection heading through this slot. It no longer renders the Featured Profiles heading separately above the collection. The shared carousel continues to own navigation context, preventing duplicated or disconnected controls.

## Overlay Department Label

For Image Overlay cards, render metadata in this order:

1. Department
2. Profile name
3. Role / designation

Department uses the established compact profile-label grammar: sans-independent mono typography, uppercase text, semibold weight, tight line height, and expanded tracking. It inherits the resolved overlay foreground so contrast remains correct for Auto, Light, Dark, and Brand overlay tones.

This overlay-label correction applies to every consumer of the shared Profile Carousel card, including the standalone Profile Carousel. Text Below Image continues to render name, role, then department as secondary supporting copy.

## Layout and Responsive Behavior

- The embedded header row uses flex layout with the title growing and controls remaining non-shrinking.
- Previous/Next buttons retain their existing size, visual variant, accessible names, focus treatment, and disabled behavior.
- The title retains the current sans-serif subsection typography and semantic `h2`/`h3` level selected by Department Profiles.
- A short or wrapped title must not overlap the controls. The row uses the existing spacing scale and remains usable at narrow mobile widths.
- Static featured collections display the same title spacing but no navigation controls.

## Compatibility

- Feature disabled: Department Profiles output remains unchanged.
- Fewer than five featured profiles: static grid behavior remains unchanged except that the existing title is supplied through the shared collection boundary.
- Five or more featured profiles: card count, loop behavior, drag/swipe, keyboard controls, and one/two/four responsive item widths remain unchanged.
- Standalone Profile Carousel receives no header slot and therefore retains its current control spacing and placement.

## Verification

- Profile Carousel tests verify overlay department order and compact label classes.
- Shared collection tests verify that an optional header renders without creating a nested section.
- Department Profiles tests verify that five featured profiles place the semantic title and Previous/Next buttons inside one header row and omit the extra carousel top spacer.
- Existing tests continue to prove standalone carousel control placement, static/cardinality boundaries, department filtering, search suppression, and directory inclusion.
- Run focused tests, TypeScript, scoped lint, Prettier, and the required project-context update/check loop.
