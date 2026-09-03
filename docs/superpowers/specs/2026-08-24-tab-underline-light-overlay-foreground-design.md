# Visible Underline Tabs and Theme-Aligned Light Overlays

## Goal

Make the selected state of every shared Underline tab unmistakable and make text on Light media overlays follow each website theme without becoming unreadable when the website is in dark mode.

## Shared tab contract

`contentTabRail.ts` remains the single presentation owner for Contained, Pill, and Underline tabs.

- Underline tabs use a transparent two-pixel bottom border in their resting state.
- The selected tab changes that real border to `primary` on light surfaces or `primary-foreground` on brand surfaces.
- The tab overlaps the rail divider by one pixel so the two-pixel selected line remains visible.
- Hover, keyboard focus, 44px minimum height, horizontal scrolling, and reduced-motion behavior remain unchanged.
- No block adds a private underline implementation.

## Light-overlay foreground contract

Add `--light-overlay-foreground` to both modes of all five website theme presets and expose it to Tailwind as `text-light-overlay-foreground`.

- The value is the corresponding theme's light-mode foreground color.
- The value stays dark in website dark mode because the Light overlay itself remains white.
- Default uses its near-black foreground; Sunset uses its warm charcoal; Blue uses its warm near-black; Kodama uses its plum near-black; SNMIH uses its institutional navy.
- The shared Light media-overlay title, supporting text, eyebrow, and link classes consume this token.
- Dark and Brand media-overlay foreground contracts remain unchanged.
- Banner CTA receives the fix through `resolveMediaOverlay`; it does not gain a block-specific color exception.

## Compatibility

No Payload fields, saved values, generated types, block registrations, or renderer boundaries change. Existing `themeMode: light` documents immediately adopt the corrected theme-aligned foreground.

## Verification

- Extend theme contracts to assert that `light-overlay-foreground` exists in every theme and mode and reaches at least 4.5:1 against opaque white.
- Extend shared tab contracts to assert the real two-pixel active border on light and brand surfaces and the removal of the pseudo-element underline.
- Extend Banner CTA media-overlay rendering coverage to assert `text-light-overlay-foreground` for Light tone.
- Run focused tab, theme, Banner CTA, media-overlay, TypeScript, project-context update/check, and diff validation.
