# Academic Programmes Ruled Action Spacing

## Goal

Give the ruled action in Academic Programmes Grid and List cards reliable breathing room above its divider, including cards whose action is aligned to the bottom.

## Scope

- Change only the ruled Grid/List card action.
- Keep the inline action used with bottom-positioned programme details unchanged.
- Keep the Detailed Cards action unchanged.
- Preserve existing typography, colors, divider styling, link treatment, card height matching, and responsive behavior.

## Design

The ruled action will use two layers:

1. An outer layout wrapper preserves bottom alignment and provides a guaranteed `2rem` space before the divider.
2. An inner action row owns the existing top divider, `1.25rem` internal top padding, link text, and adjacent arrow.

Separating layout spacing from the divider prevents `margin-top: auto` from absorbing the intended description-to-divider gap when card content is tight.

## Accessibility and Behavior

The card remains a single link. No interactive element, focus treatment, label, target behavior, or document order changes.

## Verification

- Add or update the focused Academic Programmes client contract to distinguish the spacer from the ruled action row.
- Confirm the inline bottom-details action and Detailed Cards action retain their existing markup contracts.
- Run focused Academic Programmes tests, TypeScript, lint, the design detector, and the required project-context update/check loop.
