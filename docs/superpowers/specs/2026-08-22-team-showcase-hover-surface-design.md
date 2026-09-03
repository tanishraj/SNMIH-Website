# Team Showcase Hover Surface Repair

## Goal

Restore the intended shadcnblocks Team 11 hover-bio interaction so the raised member card always has an opaque, theme-correct background.

## Source Pattern

The current Team Showcase is an adapted version of `@shadcnblocks/team11`. Team 11 renders the animated hover layer with an opaque `bg-background` surface. During the local semantic-card refactor, the raised layer lost that background and the default member surface began resolving to `bg-transparent`, causing hover content to appear without a card background.

## Design

Keep the current grid, member fields, image treatment, responsive column logic, and Framer Motion hover-bio animation.

When a member is hovered at the existing medium-and-up breakpoint, the animated overlay will resolve that member's configured card surface:

- Default cards use `bg-card text-card-foreground` on the raised overlay.
- Primary, Secondary, Muted, and Accent cards use their existing semantic surface classes.
- The highlighted member content continues using the same secondary text, divider, and icon colors derived from `resolveCardSurface`.

The surface belongs to the animated wrapper, matching Team 11's ownership model. The base card keeps its current inherited/default treatment and does not become an opaque boxed card.

## Interaction and Responsiveness

- Preserve mouse-enter and grid mouse-leave behavior.
- Preserve the shared Framer Motion `layoutId`, spring duration, and bounce.
- Preserve the medium-and-up hover overlay; mobile continues showing the existing non-hover member card.
- Do not introduce new links, buttons, focus targets, configuration fields, or dependencies.

## Theme and Edge Cases

- Default cards remain readable on light, brand, and gradient section backgrounds because the raised state uses the Card surface rather than transparency.
- Explicit card backgrounds remain visually identical between base and raised states.
- Empty descriptions retain the existing compact highlighted-card flow without an invented fallback.
- Invalid card-background values continue falling back through `resolveCardSurface`.

## Verification

- Add a focused resolver or render contract proving the default raised state uses `bg-card text-card-foreground`.
- Verify every explicit card surface produces its existing opaque semantic classes in the raised state.
- Preserve the Team 11 motion, desktop-only overlay, responsive grid, image-ratio, and per-card theme contracts.
- Run focused Team Showcase, card-surface, layout, theme, TypeScript, lint, design-detector, and project-context checks.
