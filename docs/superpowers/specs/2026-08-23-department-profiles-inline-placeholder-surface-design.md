# Department Profiles Inline Placeholder Surface Design

## Goal

Make the missing-image placeholder in Inline Department Profile cards use a visible tint derived from the card, section, or page surface instead of rendering a fixed muted rectangle. Preserve the existing Image Overlay placeholder because its media overlay supplies the required visual treatment and contrast.

## Presentation Contract

`ProfileMedia` will accept an optional placeholder class. When omitted, it retains the existing neutral `bg-muted text-muted-foreground` fallback used by Image Overlay cards.

Inline cards will pass `bg-current/10` and the secondary foreground class from their already-resolved card surface. The media wrapper will not add `bg-background/60`, a border, or an inset ring. Consequently:

- Boxed Inline cards receive a subtle tint derived from their resolved card surface.
- Framed Grid and Ruled Grid Inline cards receive a subtle tint derived from the current section or page surface.
- The user icon retains surface-aware contrast without introducing a separate CMS option.
- Real profile images and every Image Overlay card remain unchanged.

## Scope and Compatibility

This is a presentation-only change in `DepartmentProfileCard.tsx`. It does not alter Payload configuration, generated types, stored content, directory filtering, responsive sizing, or card-frame geometry.

## Verification

The Department Profiles integration test will assert that an Inline missing-image placeholder uses the surface-aware `bg-current/10` tint without a ring or the old `bg-muted` and `bg-background/60` treatment. The same test will verify that an Image Overlay missing-image placeholder still uses the neutral fallback. TypeScript, ESLint, focused rendering tests, diff hygiene, and the permitted project-context check will complete the change.
