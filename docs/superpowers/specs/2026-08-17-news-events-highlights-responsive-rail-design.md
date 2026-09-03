# News & Events Highlights Responsive Rail Design

## Goal

Keep the News & Events Highlights supporting cards visible as the viewport narrows and make the featured panel height match exactly three visible vertical rail-card slots.

## Responsive layout

At widths of 768px and above, the carousel uses a two-column composition:

- the featured story remains on the left;
- the vertical supporting-card carousel remains visible on the right;
- both columns share a fixed `36rem` height;
- the right column keeps a practical minimum width of `18rem` while the featured panel receives the remaining space; and
- the gap uses the existing responsive section spacing.

Below 768px, the layout returns to one column. The featured story remains full-width and the supporting cards remain visible immediately below it in the existing horizontal carousel. The design does not squeeze a permanent side rail into phone widths.

## Rail sizing and scrolling

The vertical carousel viewport uses the same `36rem` height as the featured panel. Each vertical slide occupies one-third of the rail height, including its established inter-card spacing, so exactly three supporting cards are visible at once. The button and card fill the slide height, while the existing title and excerpt line clamps prevent variable content length from changing the row geometry.

When the block has more than three entries, the existing Embla carousel scrolls the vertical rail to keep the selected entry in view. Clicking a rail card, autoplay, and previous/next controls continue to synchronize the featured story and both responsive rails.

When fewer than three entries exist, the available cards retain the same one-third-height slots and the remaining rail space stays empty. The featured panel height remains stable so Page layout does not jump when the collection count changes.

## Preserved behavior

- The carousel remains collection-driven and uses the configured item count.
- Authored media and the bundled SNMIH fallback image behave exactly as before.
- Autoplay timing, hover/focus pausing, reduced-motion handling, manual controls, and active-card styling remain unchanged.
- Theme surfaces, typography, spacing outside the carousel shell, section actions, and footer actions remain unchanged.
- News Grid and News & Events Tabs are outside this change.

## Accessibility and interaction

All rail items remain real buttons with their existing accessible labels and pressed state. Phone-width cards keep touch-friendly horizontal scrolling. Tablet and desktop users retain pointer, keyboard, and carousel-control access without content being hidden solely because the viewport is narrower than the former 1024px breakpoint.

## Verification

- Add source/rendering contracts for the 768px two-column breakpoint, shared `36rem` column height, three equal vertical slots, and phone-only horizontal rail.
- Preserve the existing carousel interaction, reduced-motion, image-fallback, and classification tests.
- Visually inspect the production block fixture at desktop, resized tablet, and phone widths in one bounded pass; fix any overflow or clipping together and perform at most one confirmation pass.
- Run focused carousel, thumbnail, responsive-layout, TypeScript, lint, and project-context checks.

## Constraints

- Do not add runtime height measurement or ResizeObserver-based synchronization.
- Do not change the Payload schema or regenerate Payload types.
- Do not change News Grid or News & Events Tabs.
- Do not commit or stage changes.
