# Department Profiles Card Variants Design

**Date:** 2026-08-23

## Objective

Extend the existing Department Profiles block with an Inline card layout and Small, Medium, and Large card sizes while preserving its current directory, filtering, pagination, section, and theme behavior. Existing saved blocks must retain their present Image Overlay appearance.

## Configuration

Add two required block-level selects under Theme Settings:

- **Card Layout** (`cardLayout`): Image Overlay (`overlay`) or Inline (`inline`). Default and runtime fallback: Image Overlay.
- **Card Size** (`cardSize`): Small (`sm`), Medium (`md`), or Large (`lg`). Default and runtime fallback: Large.

The existing Image Position field remains available for both layouts. Overlay Tone and Overlay Strength remain stored but are shown in Admin only when Card Layout is Image Overlay.

The profile Image upload becomes optional. Name and Department remain required. Existing profiles with images need no migration.

## Image Overlay Layout

Image Overlay retains the current static, non-clickable card treatment and bottom-to-top full overlay. Card size changes density and proportion:

- Large: current `4:5` portrait, current padding, and current typography.
- Medium: `1:1` aspect ratio with moderately reduced padding and typography.
- Small: `5:4` aspect ratio with compact padding and typography.

When an image is missing, the complete media area uses a semantic muted placeholder with a centered `UserRound` icon. The overlay and text remain present, readable, and theme-aware.

## Inline Layout

Inline cards are horizontal, static, and non-clickable. A compact media area sits on the left and a text stack sits on the right in this order:

1. Name
2. Optional designation
3. Department

The card uses a subtle semantic surface and border compatible with Page, Subtle, Brand, and Gradient Brand sections. Missing images use the same centered `UserRound` placeholder. Card size scales the media dimension, padding, gap, and typography:

- Large: roomiest row and largest thumbnail.
- Medium: default-density directory row.
- Small: compact row for high-density directories.

The configured grid remains independent: one column on mobile, at most two on tablet, and the selected two, three, or four columns on wide screens.

## Data Flow and Compatibility

The server component continues to normalize author text and department assignments. A profile remains renderable when it has a valid name and department even if media cannot be resolved. It passes an optional normalized image, the resolved card layout, and resolved card size to the client.

The client continues to filter the complete normalized list before pagination. Search, department tabs, All-first ordering, Load More, result announcements, keyboard tab behavior, and empty-state behavior are unchanged.

Missing or invalid `cardLayout` values resolve to `overlay`. Missing or invalid `cardSize` values resolve to `lg`, preserving existing saved content exactly.

## Accessibility and Responsive Behavior

- Placeholder icons are decorative and hidden from assistive technology because the adjacent profile name supplies identity.
- Real images retain the profile name as their fallback alt text.
- Inline text must wrap without forcing horizontal overflow.
- Medium and Small overlay cards must retain sufficient gradient coverage and contrast for the full metadata stack.
- Existing search, tab, status, and Load More semantics remain unchanged.

## Testing and Generated Artifacts

Focused tests will cover:

- schema defaults, options, conditional overlay controls, and optional images;
- legacy fallback to Image Overlay + Large;
- all three proportions for Image Overlay;
- Inline metadata order and all three density scales;
- real-image and `UserRound` placeholder rendering;
- profiles without images remaining searchable and filterable;
- unchanged pagination and accessible tab behavior.

After implementation, regenerate Payload types and the Admin import map if required, update the Department Profiles thumbnail/fixture and current block documentation, run the project-context update/check loop, and run focused tests, TypeScript, lint, theme contracts, and diff hygiene checks.

No commit will be created.
