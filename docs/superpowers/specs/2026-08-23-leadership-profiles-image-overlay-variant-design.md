# Leadership Profiles Image Overlay Variant Design

## Goal

Add an image-led Leadership Profiles card variant that matches the supplied portrait reference while preserving the existing Standard layout and the project's shared section, theme, and media-overlay patterns.

## Scope

- Add a block-wide Card Layout setting with `Standard` and `Image Overlay` options.
- Keep `Standard` as the saved default and runtime fallback so existing documents render unchanged.
- Fix the stale Standard-layout aspect-ratio test and remove the redundant `sm:text-lg` name utility.
- Do not add links, buttons, hover interactions, per-profile overlay settings, or new profile content fields.

## Editor Configuration

The Theme Settings tab receives a required `cardLayout` select:

- `standard`: the current image-above-content card.
- `imageOverlay`: a fixed portrait image with text overlaid near the bottom.

When `imageOverlay` is selected, expose the existing shared media-overlay controls at block level:

- Overlay Tone: Auto, Light, Dark, or Brand.
- Overlay Strength: Light, Dark, or Darker.
- Overlay Direction: Even / Vertical, Left to Right, Right to Left, Bottom to Top, or Top to Bottom.
- Overlay Coverage: Full or Split, following the shared helper's existing directional behavior.

Defaults for the new variant are Dark tone, Dark strength, Bottom to Top direction, and Full coverage. The existing shared Card Background control remains relevant only to the Standard layout and should be conditionally hidden for Image Overlay without deleting its saved value.

## Rendering

### Standard

Preserve the current opaque semantic card, `4:3` media, compact content spacing, adaptive `h2`/`h3` profile headings, and all profile metadata. Use `font-sans text-lg` for profile names without a redundant breakpoint override.

### Image Overlay

- Render the profile image as the complete card surface at a fixed `4:5` portrait ratio.
- Preserve the existing per-profile image-position setting and `object-cover` behavior.
- Apply `resolveMediaOverlay` and its resolved frame, gradient, and text classes instead of creating block-specific overlay colors.
- Position a compact text stack at the bottom of the card above the overlay.
- Show only Leadership Label, Name, and Designation.
- Keep Qualification and Expertise saved in Payload but do not render them in this variant; they reappear if the editor switches back to Standard.
- Keep the card non-clickable and use the same adaptive `h2`/`h3` name semantics as Standard.
- Preserve the rounded card frame and border using semantic tokens.

The block-wide overlay configuration applies identically to every profile so the directory remains cohesive.

## Normalization and Compatibility

- Missing or invalid `cardLayout` values normalize to `standard`.
- Overlay values normalize through the existing shared media-overlay presentation helper.
- Existing documents require no migration.
- Invalid or absent overlay values use the approved defaults.
- Profile filtering, text trimming, expertise limits, image requirements, legacy shared-surface fallback, header behavior, actions, spacing, and responsive columns remain unchanged.

## Responsive and Accessibility Behavior

- Retain one mobile column, at most two tablet columns, and the configured two-to-four desktop columns.
- The fixed `4:5` image ratio scales fluidly with each grid column.
- Existing wrapping utilities prevent long labels, names, and designations from overflowing.
- Images retain authored alternative text.
- Profile names retain semantic heading levels.
- Overlay text colors come from the shared tone resolver to preserve light, dark, and brand contrast behavior.
- No interactive affordances are introduced.

## Verification

- Extend schema tests for Card Layout, defaults, options, and conditional overlay fields.
- Extend render tests for Standard fallback, Image Overlay structure, fixed ratio, content visibility, overlay normalization, text hierarchy, and non-interactivity.
- Update the stale `aspect-[4/3]` expectations to `aspect-4/3`.
- Verify both semantic card surfaces and overlay tones.
- Regenerate Payload types and only the Leadership Profiles thumbnail.
- Run the focused Leadership Profiles, card theme, thumbnail, Page registration, and live-preview contracts; run TypeScript, lint, Impeccable detector, diff checks, and the project-context update/check loop.
