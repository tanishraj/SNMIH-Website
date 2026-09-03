# Hero Banner Rename Design

## Objective

Rename the existing **Hero Institutional** page block to **Hero Banner** everywhere in the active codebase and local Payload data without changing its appearance, configuration, or runtime behavior.

## Canonical identity

| Concern | Current | New |
| --- | --- | --- |
| Payload block slug | `heroInstitutional` | `heroBanner` |
| Payload interface | `HeroInstitutionalBlock` | `HeroBannerBlock` |
| Config export | `HeroInstitutionalBlock` | `HeroBannerBlock` |
| React component | `HeroInstitutionalBlockComponent` | `HeroBannerBlockComponent` |
| Source directory | `src/blocks/HeroInstitutional` | `src/blocks/HeroBanner` |
| Admin label | Hero Institutional | Hero Banner |
| Thumbnail | `hero-institutional.jpg` | `hero-banner.jpg` |
| Render test | `hero-institutional-render.int.spec.ts` | `hero-banner-render.int.spec.ts` |
| DOM data prefix | `data-hero-*` | `data-hero-banner-*` |

The plural Payload label will be **Hero Banners**.

## Source and schema changes

- Move the block config and component into `src/blocks/HeroBanner`.
- Rename exported types, config objects, component names, internal block-like types, imports, and renderer cases.
- Register only `heroBanner` in the Pages collection and system-page block lists.
- Preserve every existing field name and option because the rename does not alter behavior or authoring controls.
- Rename block-specific DOM diagnostics from the generic `data-hero-*` prefix to `data-hero-banner-*` so the old identity is completely removed.
- Regenerate `src/payload-types.ts` after the schema identity changes.

## Thumbnail and preview

- Rename the existing thumbnail asset to `public/block-thumbnails/hero-banner.jpg` without altering its image content.
- Update the thumbnail definition, label, alternate text, slug, preview fixture key, and component import.
- The new preview route will be `/block-thumbnail-previews/heroBanner`.
- The old `/block-thumbnail-previews/heroInstitutional` route must return 404.

## Local data preservation

The local MongoDB database currently contains one current block and 100 versioned blocks with `blockType: 'heroInstitutional'`.

A guarded one-time local rewrite will update:

- `pages.layout[].blockType`
- `_pages_versions.version.layout[].blockType`

Only the block type changes. Block IDs, content, media relationships, buttons, appearance, alignment, overlay, theme, width, and height values remain unchanged. The rewrite will validate old/new counts and preserve document fingerprints. If validation fails during execution, the changed documents will be restored from in-memory snapshots.

No runtime compatibility alias or migration file will remain because the project is local-only and the stored data is updated directly.

## Verification

- Focused config, renderer, component, thumbnail, and registration tests pass under the new identity.
- ESLint passes for every changed TypeScript file.
- `git diff --check` passes.
- Active source, tests, and thumbnails contain no `HeroInstitutional`, `heroInstitutional`, `Hero Institutional`, or `hero-institutional` references.
- The homepage renders the preserved Hero Banner block.
- The new thumbnail preview renders and the old route returns 404.
- Database checks confirm one current and 100 versioned `heroBanner` blocks, with zero legacy block identities.
- No files are staged.

## Out of scope

- Visual or responsive changes.
- Payload field additions, removals, or renames beyond the block identity.
- Compatibility aliases.
- A reusable deployment migration.
- Unrelated refactoring.
