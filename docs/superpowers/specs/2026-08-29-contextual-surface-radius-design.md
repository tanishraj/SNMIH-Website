# Contextual Surface Radius Design

**Date:** 2026-08-29
**Status:** Superseded by `2026-08-29-semantic-radius-contract-design.md`

## Problem

The SNMIH Green theme intentionally introduces rounded corners, but applying the full theme radius to every bordered surface creates awkward corner geometry in components where imagery, borders, and adjacent content meet. The featured News & Events carousel exposes the issue most clearly: its full-bleed image and thin outline make the top corners feel inflated and visually detached from the editorial layout.

A global radius reduction would also flatten buttons, tabs, inputs, and intentional cards. The correction therefore needs to distinguish surface roles instead of changing the theme token indiscriminately.

## Design Direction

Use a contextual radius hierarchy:

1. **Controls and intentional standalone cards** keep the theme's standard radius.
2. **Compact outlined surfaces with full-bleed media** use the theme's small radius (`rounded-sm`). In SNMIH Green this resolves to a restrained 6px corner; in SNMIH Blue it remains square because the theme radius base is zero.
3. **Joined tables, matrices, segmented grids, and edge-sharing cells** remain square unless the outer container alone owns the corner treatment.
4. **Pills, badges, avatars, dialogs, and deliberately expressive cards** are outside this change and retain their existing semantics.

This preserves the visual identity of both themes: Green stays gently rounded, while Blue remains sharp and institutional.

## Scope

The implementation will audit the current public frontend for the same structural condition as the reported carousel:

- a thin bordered or ringed container;
- full-bleed media or content touching the container edge;
- a large theme radius that makes the border or media crop look visually swollen;
- comparable desktop and mobile behavior.

The News & Events featured carousel is the required correction. Other components will change only when they match all of the above conditions. Ordinary cards will not be changed merely because they use the theme radius.

## Component Rules

### Featured News & Events carousel

- Use the small semantic radius for the main featured card and its selectable rail cards.
- Keep media clipped by the owning card so the image, overlay, focus treatment, and border share identical corner geometry.
- The shared `Card` primitive must not impose hard-coded child-image, header, or footer radii; the card shell alone owns clipping and defaults to the theme radius.
- Preserve the current card layout, content hierarchy, interaction behavior, and active/inactive state colors.
- Keep focus visibility intact; do not solve the visual issue by removing the outline or ring.

### Comparable media surfaces

- Apply the same small-radius treatment only to structurally equivalent outlined/full-bleed cards.
- Prefer changing the local surface class over weakening global tokens.
- Avoid nested competing radii: either the outer surface owns clipping, or an explicitly inset child owns its own corners.
- Direct card images inherit their visible crop from the parent shell rather than declaring a second radius.

### Structural and joined surfaces

- Rows, tables, month grids, tab rails, and other joined containers must not gain per-cell rounding.
- When a joined container needs rounding, only its outer boundary may own it, with overflow clipping where necessary.

## Theme and Mode Behavior

- SNMIH Green: small structural corners render at 6px through the existing radius scale.
- SNMIH Blue: small structural corners remain square through the zero-radius base token.
- Light and dark modes continue to use semantic background, foreground, border, and focus colors; this work introduces no hard-coded surface colors.

## Responsive and Interaction Requirements

- Radius and clipping must remain consistent at desktop, tablet, and mobile widths.
- Hover, active, keyboard-focus, and selected-carousel states must not shift the card geometry.
- Images and overlays must not bleed beyond the border during transitions.
- The change must not alter carousel sizing, scrolling, navigation, or content truncation.

## Verification

1. Add or update focused integration contracts for the featured carousel's semantic small-radius treatment.
2. Run the affected News & Events carousel tests and theme contract tests.
3. Run lint or type/build checks in proportion to the final diff.
4. Visually inspect one bounded desktop/mobile pass in both SNMIH Green and SNMIH Blue, including light and dark mode when the local audit surface supports it.
5. Run the project-context update/check loop and inspect the final diff against the change-impact map.

## Non-Goals

- Changing the global radius tokens.
- Making every card use the same radius.
- Redesigning News & Events content, typography, spacing, or carousel behavior.
- Altering admin controls, dialogs, badges, pills, or form components.
- Refactoring unrelated surface or card implementations.
