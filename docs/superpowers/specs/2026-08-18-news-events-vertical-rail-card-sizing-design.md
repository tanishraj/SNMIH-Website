# News & Events Vertical Rail Card Sizing Design

## Goal

Ensure every card in the desktop vertical carousel rail occupies the complete width and height of
its allocated slide, even when an entry has short or missing optional content.

## Scope

- Keep the existing 36rem desktop rail and three-card viewport.
- Keep the current slide basis, scrolling, selection, autoplay, typography, clamping, and card
  styling.
- Preserve the horizontal mobile rail's content-driven height.
- Do not change collection loading, carousel configuration, or Admin fields.

## Sizing Contract

The desktop vertical sizing chain must be explicit at every relevant layer:

1. The vertical `CarouselItem` spans the full rail width.
2. Its interactive button spans the full width and height of the allocated slide.
3. The card surface spans the full width and height of the button.

This prevents intrinsic content width or height from shrinking the visible card surface when title,
description, date, or classification content is short or absent.

The horizontal mobile carousel keeps full-width buttons but does not receive a forced height.

## Accessibility and Interaction

The existing button remains the only interactive element for each slide. Focus behavior, pressed
state, keyboard handling, and the visible focus ring remain unchanged. Enlarging the card surface
also preserves the full allocated slide as the pointer and touch target.

## Verification

- Add a sparse-content integration case.
- Assert that vertical slides explicitly span the available width.
- Assert that vertical buttons and card surfaces span their allocated width and height.
- Assert that horizontal buttons retain content-driven height.
- Run the focused carousel integration suite, TypeScript, lint, formatting, layout detection, and
  the project-context update/check loop.
