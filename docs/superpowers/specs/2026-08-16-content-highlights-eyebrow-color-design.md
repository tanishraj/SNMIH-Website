# Content Highlights Eyebrow Color

## Goal

Make the Content Highlights section eyebrow visually match the block's established primary-accent markers and actions.

## Design

- Keep using the shared `SectionEyebrow` component.
- Add the semantic `text-primary` class only at the Content Highlights call site.
- Continue passing the section background through `surface`, allowing SNMIH's surface-aware CSS to override the fallback on brand, gradient-brand, overlay, and dark-mode surfaces where contrast requires it.
- Do not change the shared eyebrow component or other blocks.

## Verification

- Add a rendering contract that checks the primary class and section surface attribute.
- Run the focused Content Highlights and section-eyebrow integration tests.
- Run TypeScript and targeted lint checks.
