# Block thumbnail images

These JPEGs are generated from the real production block components. Do not edit them manually.

Run the complete generator from the project root:

```bash
pnpm generate:block-thumbnails
```

The command reuses this project's development server when one is already available; otherwise it starts and stops an isolated server. It renders deterministic fixtures in the canonical light theme and overwrites every file in this directory. Every output is exactly 1600×900 with safe padding for Payload's cover-style crop.

The generator prefers Playwright's bundled Chromium and falls back to a locally installed Chrome or Edge channel. If none is available, run `pnpm exec playwright install chromium` once.

Fixture media lives in `public/block-thumbnail-assets/` and must remain local and license-safe. Fixture definitions live in `src/block-thumbnails/fixtures.tsx`; block labels, filenames, URLs, alt text, and capture alignment live in `src/block-thumbnails/definitions.ts`.

When adding a block:

1. Add native `admin.images.thumbnail` metadata through `getBlockThumbnailAdmin()`.
2. Add one metadata definition and one production-component fixture with the same slug.
3. Add any required local fixture media.
4. Run `pnpm generate:block-thumbnails`.
5. Run `pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts --config ./vitest.config.mts`.

The focused tests fail when a registered block, fixture, metadata entry, or 1600×900 JPEG is missing.
