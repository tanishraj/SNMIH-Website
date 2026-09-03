# Leadership Profile Card Hierarchy Design

## Goal

Improve the information hierarchy inside Leadership Profiles cards so the designation reads as an accent, the qualification remains legible supporting information, and expertise appears as quieter tertiary metadata.

## Approved Presentation

- The profile name remains the primary display-font heading.
- The designation remains sentence case, sans-serif, `text-sm`, and medium weight.
- The designation uses the card surface's semantic accent color, matching the visual role of a section eyebrow without adopting its mono, uppercase, or wide-tracking typography.
- Qualification remains separate supporting metadata at `text-sm` with the card surface's secondary text color.
- Expertise is rendered separately from qualification at `text-xs` with a softer secondary/gray treatment.
- Multiple expertise items retain compact dot separators and wrapping that never begins a wrapped line with a separator.
- Cards without qualification or expertise omit the corresponding element without leaving empty spacing.
- Default, Primary, Secondary, Muted, and Accent card backgrounds retain readable semantic contrast; no hard-coded light-theme gray is used on dark card surfaces.
- Leadership Label moves out of the portrait and into the content area above the name as a wrapping academic nameplate. It uses compact eyebrow typography without a floating pill, shadow, or image overlap.
- Card background becomes one block-level setting shared by every profile. Existing saved per-profile values remain a runtime-only fallback for blocks that predate the shared setting; new authoring does not expose independent profile colors.
- Profile names render as `h3` when the section has an authored title or accent title and as `h2` when no section heading exists.

## Scope

This changes the existing Leadership Profiles server presentation and moves Card Background from each profile to the block Theme Settings. It does not change profile content fields, card interaction, or block registration. Payload types and the picker thumbnail are regenerated.

## Verification

Update focused rendering and theme-contract tests to distinguish designation, qualification, and expertise. Run the affected Leadership Profiles, card renderer, and card theme suites; then run TypeScript, lint, diff checks, and the required project-context update/check loop.
