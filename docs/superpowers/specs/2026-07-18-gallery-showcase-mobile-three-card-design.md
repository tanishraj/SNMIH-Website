# Gallery Showcase Mobile Three-Card Design

## Goal

Match the supplied mobile reference by showing a compact overlapping image fan followed by the Gallery Showcase text and actions, with no overlap between the media and content in iPhone Safari or Chrome.

## Responsive Presentation

Payload continues to require exactly five images. Below the `sm` breakpoint, render only the three center cards: source positions 2, 3, and 4. Hide source positions 1 and 5 with responsive CSS while retaining them in the DOM for the existing tablet and desktop presentation.

At `sm` and above, restore all five cards and preserve the existing transforms, size presets, animation, dragging, snap-back, hover behavior, image positioning, and layers.

The three visible mobile cards retain their existing transforms:

| Source position | Rotation | Horizontal offset | Vertical offset |
| --------------- | -------- | ----------------- | --------------- |
| 2               | `-19deg` | `-62%`            | `2%`            |
| 3               | `0deg`   | `0%`              | `-19%`           |
| 4               | `12deg`  | `62%`             | `2%`             |

Existing mobile card sizes remain unchanged: Compact `size-16`, Default `size-20`, and Comfortable `size-24`.

## Vertical Separation

Reserve enough mobile height for the rotated cards before rendering content:

- Compact: `h-36`, returning to the existing `sm:h-48 lg:h-52` values;
- Default: `h-40`, returning to the existing `sm:h-52 lg:h-60` values;
- Comfortable: `h-44`, returning to the existing `sm:h-60 lg:h-64` values.

The content remains in normal document flow after the fan. Replace margin-based separation with an explicit vertical layout gap between the fan and content stack so transformed images cannot cover the title, description, or actions. Content alignment, typography, and Payload configuration remain unchanged.

## Cross-Browser Behavior

Use responsive CSS classes only. Do not read `window`, viewport width, user agent, or browser state during React rendering. Safari and Chrome on iPhone receive identical server-rendered markup and responsive rules, avoiding hydration differences.

Horizontal clipping remains a defensive guard. The three-card mobile geometry fits naturally within the website container and must not introduce horizontal page scrolling.

## Testing and Verification

Focused coverage verifies:

- source positions 1 and 5 are hidden below `sm` and restored at `sm`;
- source positions 2, 3, and 4 remain visible at every breakpoint;
- all five cards remain available at `sm` and above;
- Compact, Default, and Comfortable use `h-36`, `h-40`, and `h-44` on mobile without changing `sm` or `lg` heights;
- mobile card sizes and every existing transform remain unchanged;
- the wrapper uses an explicit layout gap and the content does not rely on a top margin;
- no viewport-dependent React branch is introduced;
- the fan and content do not overlap at 320-, 375-, and 390-pixel viewports;
- browser consoles contain no hydration or runtime errors.

Run focused Vitest tests, scoped ESLint, thumbnail generation, thumbnail tests, browser geometry checks, and staged and unstaged diff checks. Do not stage or commit any files.

## Non-Goals

- Changing Payload's five-image requirement.
- Showing fewer than five images on tablet or desktop.
- Changing the supplied content, alignment controls, theme controls, or action behavior.
- Replacing Framer Motion.
- Adding editor controls for mobile image count or transforms.
- Refactoring unrelated blocks.
