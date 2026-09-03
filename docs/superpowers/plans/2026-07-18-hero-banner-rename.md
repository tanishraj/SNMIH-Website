# Hero Banner Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Hero Institutional block with the canonical Hero Banner identity while preserving its behavior and all current and versioned local data.

**Architecture:** Apply a clean rename across tests, Payload schema, React rendering, thumbnails, preview fixtures, and generated types with no runtime alias. Then directly rewrite matching local MongoDB layouts and verify that only the new identity remains.

**Tech Stack:** Payload CMS 3.85, React 19, Next.js 16, TypeScript 5.7, MongoDB, Vitest.

## Global Constraints

- Canonical slug is `heroBanner`.
- Canonical type names are `HeroBannerBlock` and `HeroBannerBlockComponent`.
- Source directory is `src/blocks/HeroBanner`.
- Admin labels are `Hero Banner` and `Hero Banners`.
- Thumbnail identity is `hero-banner.jpg` and `heroBanner`.
- DOM diagnostics use the `data-hero-banner-*` prefix.
- Preserve all field names, block IDs, content, media, buttons, appearance, alignment, overlay, theme, width, height, order, and publication state.
- Update both `pages.layout` and `_pages_versions.version.layout` in the local database.
- No runtime alias, compatibility branch, or persistent migration file is allowed.
- Do not stage or commit any files.

---

### Task 1: Establish the canonical test contract

**Files:**
- Move: `tests/int/hero-institutional-render.int.spec.ts` → `tests/int/hero-banner-render.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `tests/int/block-thumbnails.int.spec.ts`

**Interfaces:**
- Produces: failing expectations for `heroBanner`, `HeroBannerBlock`, `HeroBannerBlockComponent`, `data-hero-banner-*`, and `hero-banner.jpg`.

- [ ] **Step 1: Rename the focused render test and component import**

```ts
import { HeroBannerBlockComponent } from '@/blocks/HeroBanner/Component'

describe('Hero Banner block', () => {
  createElement(HeroBannerBlockComponent, {
    backgroundImage,
    title: 'Learn without limits',
  })
})
```

Apply `data-hero-*` → `data-hero-banner-*` throughout the moved test.

- [ ] **Step 2: Update registration and schema expectations**

```ts
const { HeroBannerBlock } = await import('@/blocks/HeroBanner/config')
expect(layoutField?.blocks?.map((block) => block.slug)).toContain('heroBanner')
expect(layoutField?.blocks?.map((block) => block.slug)).not.toContain('heroInstitutional')
```

Change rendered test data from `blockType: 'heroInstitutional'` to `blockType: 'heroBanner'` and update the system-page exclusion list.

- [ ] **Step 3: Update thumbnail expectations**

```ts
expect(getBlockThumbnailDefinition('heroBanner')).toMatchObject({
  filename: 'hero-banner.jpg',
  label: 'Hero Banner',
  slug: 'heroBanner',
})
```

- [ ] **Step 4: Run the renamed tests and confirm they fail before implementation**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/hero-banner-render.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/system-page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts
```

Expected: failures because the Hero Banner source identity is not implemented yet.

### Task 2: Rename the Payload block and renderer

**Files:**
- Move: `src/blocks/HeroInstitutional/config.ts` → `src/blocks/HeroBanner/config.ts`
- Move: `src/blocks/HeroInstitutional/Component.tsx` → `src/blocks/HeroBanner/Component.tsx`
- Modify: `src/collections/Pages.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`

**Interfaces:**
- Produces: `HeroBannerBlock`, `HeroBannerBlockComponent`, and the only renderer case `heroBanner`.
- Consumes: the existing configuration and JSX without behavior or styling changes.

- [ ] **Step 1: Rename the config identity**

```ts
export const HeroBannerBlock: Block = {
  slug: 'heroBanner',
  interfaceName: 'HeroBannerBlock',
  admin: getBlockThumbnailAdmin('heroBanner'),
  labels: {
    singular: 'Hero Banner',
    plural: 'Hero Banners',
  },
}
```

Keep every existing field and option unchanged.

- [ ] **Step 2: Rename the component and DOM contract**

```ts
type HeroBannerBlockLike = {
  appearance?: BlockAppearance | null
  backgroundImage?: unknown
  buttons?: HeroButton[] | null
  contentWidth?: 'default' | 'narrow' | 'wide' | null
  description?: string | null
  eyebrow?: string | null
  height?: '40' | '60' | '80' | 'balanced' | 'compact' | 'default' | 'immersive' | null
  horizontalAlignment?: 'center' | 'left' | 'right' | null
  overlayStyle?: 'brand' | 'dark' | 'darker' | 'ink' | 'light' | 'soft' | null
  themeMode?: 'auto' | 'dark' | 'light' | null
  title: string
  verticalAlignment?: 'bottom' | 'center' | 'top' | null
}

export function HeroBannerBlockComponent(props: HeroBannerBlockLike) {}
```

Rename every `data-hero-*` attribute to the corresponding `data-hero-banner-*` attribute without changing class names or JSX structure.

- [ ] **Step 3: Register and render only the new block**

```tsx
import { HeroBannerBlock } from '@/blocks/HeroBanner/config'

case 'heroBanner':
  return <HeroBannerBlockComponent key={block.id ?? `${block.blockType}-${index}`} {...block} />
```

- [ ] **Step 4: Run schema and rendering tests**

Expected: component, page registration, and system-page tests pass; thumbnail work remains pending.

### Task 3: Rename the thumbnail identity

**Files:**
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Move: `public/block-thumbnails/hero-institutional.jpg` → `public/block-thumbnails/hero-banner.jpg`
- Test: `tests/int/block-thumbnails.int.spec.ts`

**Interfaces:**
- Produces: preview slug `heroBanner`, fixture key `heroBanner`, and asset `hero-banner.jpg`.

- [ ] **Step 1: Replace the definition**

```ts
defineThumbnail({
  alt: 'Hero Banner block preview',
  filename: 'hero-banner.jpg',
  label: 'Hero Banner',
  slug: 'heroBanner',
})
```

- [ ] **Step 2: Rename the fixture key and component import**

```tsx
heroBanner: (
  <HeroBannerBlockComponent
    backgroundImage={{ alt: 'Abstract architectural landscape', url: editorialLandscape }}
    description="Practical learning, thoughtful teaching, and spaces designed for discovery."
    eyebrow="Learning without limits"
    height="compact"
    horizontalAlignment="left"
    overlayStyle="light"
    themeMode="auto"
    title="A place to learn, connect, and grow."
  />
)
```

Preserve all existing fixture content and configuration.

- [ ] **Step 3: Rename the JPEG without changing its binary contents**

Run: `mv public/block-thumbnails/hero-institutional.jpg public/block-thumbnails/hero-banner.jpg`

- [ ] **Step 4: Run thumbnail tests**

Expected: definition, fixture, asset, and preview contracts pass.

### Task 4: Regenerate types and rewrite local data

**Files:**
- Modify: `src/payload-types.ts`
- Modify external local state: MongoDB database `payload-cms-starter-kit`
- No migration file is created.

**Interfaces:**
- Produces: `HeroBannerBlock`, `HeroBannerBlockSelect`, and stored `blockType: 'heroBanner'` values.

- [ ] **Step 1: Regenerate Payload types**

Run: `pnpm run generate:types`

Expected: `src/payload-types.ts` contains only the new block identity.

- [ ] **Step 2: Back up matching layouts in memory and rewrite block types**

```ts
const renameLayout = (layout: Record<string, unknown>[]) =>
  layout.map((block) =>
    block.blockType === 'heroInstitutional'
      ? { ...block, blockType: 'heroBanner' }
      : block,
  )
```

Apply the function only to matching `pages.layout` and `_pages_versions.version.layout` arrays. Store the original arrays before writing and restore them if any write or validation fails.

- [ ] **Step 3: Validate data preservation**

Compare before/after fingerprints containing each block ID and serialized block content with `blockType` omitted. Expected: one current and 100 versioned blocks are renamed, zero legacy blocks remain, and all fingerprints match.

### Task 5: Complete verification

**Files:**
- Verify all files from Tasks 1–4.

**Interfaces:**
- Produces: evidence that the canonical rename is complete and unstaged.

- [ ] **Step 1: Run the focused test suite**

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/hero-banner-render.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/system-page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts
```

Expected: all focused tests pass.

- [ ] **Step 2: Run ESLint and repository checks**

```bash
pnpm exec eslint src/blocks/HeroBanner tests/int/hero-banner-render.int.spec.ts
git diff --check
git diff --cached --name-only
```

Expected: lint and diff checks pass; staged output is empty.

- [ ] **Step 3: Scan for the legacy identity**

```bash
rg -n "HeroInstitutional|heroInstitutional|Hero Institutional|hero-institutional" \
  src tests public/block-thumbnails
```

Expected: no matches.

- [ ] **Step 4: Verify runtime routes**

At a mobile viewport, load `/` and assert one element with `data-hero-banner-block="true"` and zero legacy hero attributes. Load `/block-thumbnail-previews/heroBanner` and assert the Hero Banner section renders. Load `/block-thumbnail-previews/heroInstitutional` and expect HTTP 404.
