# News & Events Highlights Presentation Design

## Goal

Refine the News & Events Highlights block so its introductory content can be aligned by editors, while its cards use shorter consistent images and concise four-line excerpts.

## Scope

The change applies only to the News & Events Highlights page block. It does not change the News & Events archive, individual story pages, collection queries, publication rules, item count, pagination, or live-data behavior.

## Payload configuration

Add a required `contentAlignment` select field to the block's **Layout & Theme** tab. It offers:

- Left (`left`)
- Center (`center`)
- Right (`right`)

The default is `left`.

## Rendering behavior

Content alignment applies only to the block-level eyebrow, title, and description. Left uses start alignment and left-aligned text, center uses centered placement and text, and right uses end alignment and right-aligned text.

The optional action is independent of Content Alignment. On desktop it occupies a dedicated right-hand header column aligned to the bottom of the text group. On mobile it renders below the text and remains right-aligned.

News/Event cards remain left-aligned in every mode for consistent metadata and excerpt readability.

## Card media and excerpts

Each card image uses the same shorter responsive height rather than the existing `16:10` aspect ratio. Images continue to use `object-cover`, respect each entry's configured object position, retain the existing rounded card treatment, and preserve the subtle hover zoom.

Each card excerpt is visually clamped to four lines with an ellipsis. The underlying News/Event excerpt remains unchanged and appears in full on the individual entry page.

## Theme and responsive behavior

All new styles use existing semantic theme tokens and shared spacing. No raw color values or new global CSS are introduced. The card grid and existing mobile breakpoints remain unchanged.

## Verification

Focused server-render tests must verify:

- the Payload field exists in **Layout & Theme** with a left default;
- left, center, and right values reach the presentation component;
- block text classes follow the selected value while the action remains right-aligned;
- card images use the shorter fixed responsive height;
- card excerpts use a four-line clamp;
- card content remains left-aligned.

TypeScript, targeted ESLint, focused Vitest coverage, the production build, and `git diff --check` must pass.
