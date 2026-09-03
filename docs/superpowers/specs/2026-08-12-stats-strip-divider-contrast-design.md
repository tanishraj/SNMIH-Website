# Stats Strip Adaptive Divider Contrast

## Goal

Make Stats Strip's internal dividers recede into every configured section background instead of becoming bright white on a primary surface.

## Design

Internal row and column dividers will use the foreground token paired with the selected background at 15% opacity:

- `primary` → `primary-foreground/15`
- `secondary` → `secondary-foreground/15`
- `accent` → `accent-foreground/15`
- `muted` and `none` → `foreground/15`

The component will resolve this automatically from `appearance.background`. Editors will not receive another setting. Theme token changes will continue to flow through automatically in light and dark modes.

Only Stats Strip's internal grid dividers are affected. The optional outer section border remains controlled by the shared block appearance setting.

## Verification

- Render each supported background and assert the matching semantic divider class.
- Confirm primary no longer uses `border-border` for internal dividers.
- Confirm row and column dividers use the same resolved color.
- Run the focused Stats Strip integration tests and TypeScript validation.
