# Back to Top Button Design

## Objective

Add a globally available Back to Top control to the public website. The control should improve navigation on long pages while remaining visually quiet, accessible, theme-aware, and isolated from Payload Admin.

## Scope

- Render once in the public frontend layout.
- Enable it on every public page without an editor-facing setting.
- Do not render it in Payload Admin or development-only block thumbnail routes.
- Reuse the shared Button primitive and semantic theme tokens.

## Interaction

- Keep the control hidden while the visitor is near the top of the page.
- Reveal it after the visitor has scrolled more than `64px`, avoiding first-pixel flicker from
  mobile bounce and accidental movement while still feeling immediate.
- Hide it again when the visitor returns within `64px` of the top.
- Clicking it scrolls the document to the top.
- Use smooth scrolling when motion is allowed.
- Use immediate scrolling when `prefers-reduced-motion: reduce` is active.
- Recheck visibility on resize so the derived state remains current through viewport changes.

## Presentation

- Use a compact icon-only button with the Lucide `ArrowUp` icon.
- Position it at the bottom-right of the viewport with responsive spacing and mobile safe-area support.
- When a visible consent surface would occupy that corner, move the control directly above the
  consent surface using its measured rendered height rather than a fixed estimate.
- Use the shared primary Button treatment, including the theme-defined control radius, light/dark colors, hover state, and focus ring.
- Reveal and hide it with opacity and vertical translation without moving page content.
- Keep it below cookie consent, dialogs, galleries, and other modal layers.

## Consent Surface Coordination

- The full-width Bottom Bar always contributes its actual bottom obstruction height.
- A Floating Card or Corner Badge contributes its actual bottom obstruction height only when its
  rendered horizontal bounds intersect the button's bottom-right column. This keeps desktop
  left-positioned surfaces independent while correctly handling their nearly full-width mobile layout.
- The modal does not move the control; its overlay remains above and isolates background controls.
- Observe consent-surface resizing so wrapped copy, custom labels, zoom, responsive reflow, and an
  expanded Corner Badge update the offset without hard-coded dimensions.
- Clear the offset immediately when the consent surface unmounts after acceptance or rejection.

## Accessibility

- Use a native button with `type="button"`.
- Provide `aria-label="Back to top"` and a matching tooltip through `title`.
- Remove the hidden control from pointer and keyboard interaction.
- Preserve the visible shared focus treatment.
- Mark the arrow icon as decorative.
- Do not move keyboard focus automatically after activation.

## Technical Design

- Add a focused client component under `src/components/global`.
- Track only the derived visible/hidden state, not the raw scroll position.
- Register the scroll listener as passive and coalesce measurements with `requestAnimationFrame` to avoid excessive React updates.
- Let overlapping non-modal consent variants publish a temporary CSS custom-property offset from
  their fixed surface's measured top edge. Determine eligibility from rendered horizontal bounds,
  not only the configured side, and keep the Back to Top component independent of consent state by
  consuming only that presentation variable.
- Use `ResizeObserver` plus viewport resize handling for consent measurements, with safe cleanup of
  the observer, listener, and custom property.
- Clean up scroll and resize listeners and any scheduled animation frame on unmount.
- Mount the component alongside the other global public controls in `src/app/(frontend)/layout.tsx`.
- Keep the component independent of Payload data and avoid adding a schema, migration, or generated-type change.

## Verification

- Add focused integration contracts covering global layout placement, the `64px` visibility
  threshold, accessible labeling, reduced-motion scrolling, safe-area positioning, shared Button
  usage, consent variant eligibility, measured resizing, and cleanup.
- Run the focused test, TypeScript validation, and lint for the affected files.
- Complete the project-context update/check loop.

## Out of Scope

- Editor configuration.
- Per-page overrides.
- Scroll-progress indicators.
- Automatic focus movement to the header or main content.
