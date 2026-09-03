# Feature Matrix Complete Rename Design

## Goal

Rename the newly introduced Feature 166 page block to Feature Matrix throughout Payload, frontend rendering, styles, tests, thumbnails, generated types, and documentation. The final codebase must expose only the professional Feature Matrix name while retaining `@shadcnblocks/feature166` solely as historical upstream-source attribution.

## Compatibility Decision

This is an intentional breaking rename with no backward compatibility. Remove the `feature166` Payload slug, renderer branch, exports, data attributes, CSS identifiers, thumbnail slug, and filename. Do not add a legacy alias, fallback renderer, duplicate block registration, database migration, or compatibility union. Existing saved pages containing `blockType: 'feature166'` must be recreated with the new Feature Matrix block.

## Payload and Type Names

Use these canonical identifiers:

- block slug: `featureMatrix`;
- interface name: `FeatureMatrixBlock`;
- singular label: `Feature Matrix`;
- plural label: `Feature Matrices`;
- config export: `FeatureMatrixBlock`;
- wrapper export: `FeatureMatrixBlockComponent`;
- presentational export: `FeatureMatrix`;
- supporting types: `FeatureMatrixAlignment`, `FeatureMatrixImagePosition`, `FeatureMatrixItem`, and `FeatureMatrixSize`.

Rename the block directory to `src/blocks/FeatureMatrix`, the presentational component to `src/components/feature-matrix.tsx`, and imports accordingly. Register only `FeatureMatrixBlock` in Pages and handle only `case 'featureMatrix'` in the shared page renderer. Regenerate Payload types so `Page.layout` contains `FeatureMatrixBlock` and no `Feature166Block` declaration remains.

## Markup and CSS Names

Rename every block-owned HTML identifier from `feature166` to `feature-matrix`, including the section marker, alignment, background, size, border, animation, panel, image-position, actions, divider-beam, and phase data attributes.

In `src/styles/custom.css`, rename the divider selector, CSS custom properties, and horizontal/vertical keyframes from the `feature166` prefix to `feature-matrix`. Preserve the animation values, semantic `var(--primary)` color, responsive behavior, and reduced-motion behavior exactly. Do not move custom rules back into `globals.css`.

## Thumbnail and Fixture Names

Replace the thumbnail slug `feature166` with `featureMatrix`, rename `public/block-thumbnails/feature-166.jpg` to `public/block-thumbnails/feature-matrix.jpg`, and update the thumbnail definition, real-render fixture, exact-file tests, and any registered-slug expectations. The fixture continues to render the production wrapper with exactly four local images.

## Tests and Documentation

Rename `tests/int/feature166.int.spec.ts` to `tests/int/feature-matrix.int.spec.ts` and update every assertion, fixture, import, test description, and focused command to the new names. Add explicit absence checks for the old Payload slug, old generated type name, old data-attribute prefix, old CSS selector/keyframe prefix, old thumbnail slug, and old thumbnail filename.

Rename the existing Feature 166 design and plan documents to Feature Matrix filenames and rewrite implementation-facing references. Keep the literal `@shadcnblocks/feature166` only in the source-layout documentation because that remains the registry item from which the block was adapted.

## Verification

Run Payload type generation; the renamed focused tests; page-block, system-page-block, thumbnail-definition, and thumbnail-fixture tests; scoped Prettier and ESLint; thumbnail generation or an exact binary rename followed by deterministic preview verification; browser checks for responsive layout, image positions, divider motion, and reduced motion; and `git diff --check`.

The final audit must find no implementation reference to `Feature166`, `feature166`, `Feature 166`, `feature-166.jpg`, `data-feature166`, or `.feature166-`, except the explicitly allowed upstream source token `@shadcnblocks/feature166` in documentation. All changes remain unstaged.

## Non-Goals

- Supporting legacy `feature166` page data.
- Migrating database documents automatically.
- Changing Feature Matrix layout, content fields, image-position behavior, animation behavior, theme behavior, or thumbnail composition.
- Reinstalling the upstream registry block.
