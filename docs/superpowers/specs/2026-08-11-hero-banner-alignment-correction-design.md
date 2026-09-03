# Hero Banner Alignment Correction Design

## Goal

Make the Hero Banner Horizontal Alignment setting position every content element on one consistent
horizontal axis while preserving the configured reading widths, responsive layout, and theme.

## Problem

The component applies centered text and centers the outer content column, but the title and
description each have their own maximum width without alignment-aware margins. Their text is
centered inside boxes that remain anchored to the start of the wider content column. Long and
short elements therefore appear to use different center points.

The current content column also relies on `lg:flex-1`, which makes its width behavior depend on
the flex context instead of expressing the configured content width directly.

## Approved Design

Use an explicit alignment contract at both layout levels:

- The outer shell positions the complete content column with `justify-start`, `justify-center`,
  or `justify-end`.
- The content column uses `w-full` plus the selected narrow, default, or wide maximum width at
  every horizontal alignment.
- The title and description retain their existing readable maximum widths and receive
  alignment-aware margins: `mr-auto` for left, `mx-auto` for center, and `ml-auto` for right.
- The eyebrow follows the existing text alignment across the full content column.
- The action row remains full-width and uses its existing start, center, or end justification so
  mobile full-width buttons and desktop intrinsic-width buttons keep working.

For Center, the eyebrow, title, description, and buttons share the hero's center axis even when
their maximum widths differ. Left and Right receive the equivalent deterministic behavior.

## Responsive and Theme Behavior

The content column remains full-width within the standard Hero Banner container on small screens,
then respects the selected maximum width as space becomes available. Existing title sizes,
description sizes, wrapping, gaps, hero heights, overlays, foreground tones, appearances, and
button variants remain unchanged.

No hardcoded colors, dimensions, or theme-specific exceptions are added.

## Component Boundaries

Only `src/blocks/HeroBanner/Component.tsx` changes at runtime. Payload fields, generated types,
saved block data, media resolution, link resolution, and block registration remain unchanged.

## Testing

Extend `tests/int/hero-banner-render.int.spec.ts` to verify:

- Center uses a centered outer shell and centered title/description margins.
- Left uses start positioning and right-auto margins.
- Right uses end positioning and left-auto margins.
- The content column uses the selected width map instead of a center-only width branch.
- Action alignment remains consistent with the selected horizontal alignment.

Run the focused Hero Banner render test, targeted ESLint, TypeScript checking, and a diff scope
review.

## Out of Scope

- Hero Banner schema or CMS option changes.
- Typography, spacing, overlay, height, button, or theme redesign.
- Hero Carousel alignment behavior.
- Announcement transition changes.
