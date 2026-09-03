# Page Header Action Layout

## Goal

Remove the Page Header Key Facts rail and replace it with a simpler, reusable action layout. Editors can keep links and buttons directly below the description or move them into a right-side action column like the supplied admissions reference. The Page Header must use the same section-content alignment vocabulary as the rest of the block library.

## Content model

- Keep the existing primary `actions` array and its link/button presentation controls.
- Add `actionPlacement` with two options:
  - `inline`: actions sit directly below the description and use the normal wrapping action row.
  - `side`: actions occupy a right-side column and stack vertically at desktop widths.
- Default new Page Headers to `inline`.
- Expand `contentAlignment` to `left`, `center`, and `right` and label it `Section Content Alignment`.
- Hide the existing `keyFacts` and `keyFactsNumberPosition` fields from Payload. Preserve their stored values so existing documents are not destructively migrated, but do not render them.

## Variant compatibility

Minimal and Banner remain the preferred Page Header variants. The stored `split` value remains accepted for backwards compatibility because removing a live Payload select value would make existing documents unsafe to edit.

- Existing Split headers render as the regular appearance-based header without the Key Facts rail.
- Legacy Split always uses `side`, preserving its two-column intent without relying on a newly added field value. Editors who want Inline placement switch the variant to Minimal or Banner.
- Minimal and Banner headers without a saved `actionPlacement` fall back to `inline`.
- The Split option is labelled as a legacy side-action layout in the admin so editors use Minimal or Banner for new content. Action Placement is hidden while Split is selected because its placement is fixed.

No collection migration is required.

## Layout

### Inline actions

Eyebrow, title, description, and actions form one content column. Actions render immediately after the description and wrap horizontally using the existing `ContentActions` behavior.

```text
eyebrow
title
description
[ primary action ] [ secondary action ]
```

### Side actions

At the large breakpoint, the section becomes a two-column flex/grid composition:

```text
┌──────────────── content ────────────────┐  ┌──── actions ────┐
│ eyebrow                                 │  │ primary action   │
│ title                                   │  │ secondary action │
│ description                             │  └──────────────────┘
└─────────────────────────────────────────┘
```

The copy column retains a readable measure. The action column is right-aligned, has a sensible minimum width, and uses equal-width stacked actions. Links and buttons retain their configured CMS presentation; placement does not rewrite them into a different action type.

Below the large breakpoint, Side collapses beneath the description in DOM order. The actions remain easy to tap and cannot cause horizontal overflow.

## Alignment behavior

`Section Content Alignment` controls the eyebrow, title, description, and Inline actions:

- Left: copy and inline actions align left.
- Center: copy is centered with a centered readable measure; inline actions center.
- Right: copy aligns right with its readable measure pushed to the right; inline actions align right.

For Side placement, the action rail remains on the physical right at desktop widths to preserve the reference composition. Its action labels follow their components' normal internal alignment. When the rail stacks on mobile, it follows the selected section alignment.

## Banner treatment

Banner keeps its existing full-bleed image, overlay, height, typography, and theme behavior. Only the foreground content composition changes. Side placement produces the supplied reference layout: editorial copy on the left and a vertically stacked action rail on the right.

Minimal and legacy Split headers continue to use the selected block appearance background and foreground.

## Footer actions

`footerActions` remain separate from the primary action placement. They continue to render through `BlockFooterActions` after the main Page Header content and are not moved into the side rail.

## Accessibility and responsive behavior

- DOM order is always copy followed by primary actions, matching the mobile reading order.
- Existing anchor/button semantics, focus treatments, labels, external-target behavior, and optional arrows remain unchanged.
- Side placement activates only when enough width exists for two useful columns.
- Long labels wrap safely; the action rail does not force page overflow.
- Right and center alignment do not alter heading hierarchy or breadcrumb order.
- The decorative Banner image behavior is unchanged.

## Testing

Automated coverage verifies:

- Key Facts fields remain stored but hidden and their renderer is removed.
- Number Position is hidden and no Key Facts rail markup is emitted.
- Action Placement offers Inline and Side with the approved fallbacks.
- Section Content Alignment offers Left, Center, and Right.
- Inline actions render below the description.
- Side actions render in a desktop right rail and preserve copy-first DOM order.
- Side actions stack beneath the description on smaller layouts.
- Minimal, Banner, and legacy Split values all render without losing actions.
- Existing breadcrumb, appearance, overlay, footer-action, and theme behavior remains intact.

Visual verification covers Inline and Side at 375px, 768px, and 1440px, including light and brand surfaces and a Banner with an image overlay.

## Out of scope

- Destructive removal of stored Key Facts data.
- A database migration that rewrites legacy Split blocks.
- Per-action placement controls.
- Moving footer actions into the primary action rail.
- Changes to global button/link styling or Banner overlay colors.
