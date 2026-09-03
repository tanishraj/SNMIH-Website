# Section-Aware Default Card Design

## Goal

Make the `Default Card` surface visually belong to its containing section. It must not add an independent background color, and its borders must remain subtle across every section background and in light and dark modes.

## Surface Contract

- `Default Card` renders with a transparent background.
- The card inherits its foreground color from the containing section.
- Borders and dividers use the inherited foreground color at low opacity rather than the global `border` token.
- Icons, supporting text, links, and button treatments remain readable against the inherited section surface.
- Explicit `Primary`, `Secondary`, `Muted`, and `Accent` card surfaces keep their existing semantic backgrounds and contrast behavior.
- Existing CMS field names and stored values remain unchanged.

## Section Awareness

The shared card-surface resolver will accept the containing block background as context. For a default card it will derive presentation from that context:

| Section background | Default card background | Card foreground | Border/divider |
| --- | --- | --- | --- |
| None | Transparent | Normal foreground | Foreground at low opacity |
| Primary | Transparent | Primary foreground | Primary foreground at low opacity |
| Secondary | Transparent | Secondary foreground | Secondary foreground at low opacity |
| Muted | Transparent | Normal foreground | Foreground at low opacity |
| Accent | Transparent | Accent foreground | Accent foreground at low opacity |

Blocks will pass their resolved section background to the shared resolver. This keeps the behavior centralized and prevents block-specific color drift.

## Media Cards

Image and video cards may still need a gradient behind overlaid text. The default card's outer surface remains transparent, while media overlays use a dedicated neutral dark gradient and light text for image-independent readability. This overlay is not treated as the card background.

## Accessibility

- Default-card text follows the same foreground token already selected for the section.
- Borders are decorative and intentionally lower contrast; they are not used as the only indicator of an interactive state.
- Links, focus indicators, and buttons retain semantic interactive contrast.
- Dark mode uses the active theme tokens rather than hardcoded light colors.

## Compatibility

- No Payload schema or data migration is required.
- The existing `cardBackground: "default"` value retains its meaning but gains section-aware rendering.
- Missing or invalid card-background values continue to fall back to `default`.

## Verification

- Add resolver tests for every section background with a default card.
- Update renderer tests to assert transparent default surfaces and subtle inherited borders.
- Verify explicit semantic card backgrounds are unchanged.
- Run TypeScript, focused integration tests, ESLint for touched files, and `git diff --check`.
