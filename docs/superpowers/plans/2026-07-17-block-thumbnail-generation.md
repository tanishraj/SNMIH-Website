# Block Thumbnail Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate deterministic 1600×900 real-rendered Payload block thumbnails through one package command and require thumbnail coverage for every registered block.

**Architecture:** A metadata-only manifest supplies native Payload thumbnail metadata without importing React components into collection configuration. A separate fixture renderer maps the same slugs to production block components, a development-only Next.js route presents them in a fixed light-theme capture stage, and a Playwright script starts its own server and writes JPEG outputs.

**Tech Stack:** Payload CMS 3.85, Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Playwright 1.58, Sharp 0.34, Vitest 4.

## Global Constraints

- Output dimensions are exactly 1600×900 pixels.
- Every block uses `defaultWebsiteTheme` with a forced light color scheme.
- Preview fixtures use neutral repository-owned content and local assets only.
- The generator must not query Payload, require admin authentication, or depend on an already-running server.
- The preview route returns 404 outside development.
- Existing thumbnail filenames remain unchanged; FAQ uses `faq.jpg` and Review Submission uses `review-submission.jpg`.
- Existing frontend block behavior must remain unchanged.
- Do not stage or commit any changes.

---

### Task 1: Centralize native Payload thumbnail metadata and enforce coverage

**Files:**

- Create: `src/block-thumbnails/definitions.ts`
- Modify: `src/blocks/Announcement/config.ts`
- Modify: `src/blocks/HeroInstitutional/config.ts`
- Modify: `src/blocks/FeatureSpotlight/config.ts`
- Modify: `src/blocks/StatsStrip/config.ts`
- Modify: `src/blocks/Faq/config.ts`
- Modify: `src/blocks/ReviewSubmission/config.ts`
- Modify: `src/blocks/HeaderNavbar12/config.ts`
- Modify: `src/blocks/Footer56/config.ts`
- Modify: `src/blocks/systemPageFields.ts`
- Modify: `src/blocks/System404/config.ts`
- Modify: `src/blocks/SystemMaintenance/config.ts`
- Modify: `src/blocks/SystemComingSoon/config.ts`
- Delete: the nine existing `src/blocks/*/thumbnail.ts` files
- Test: `tests/int/block-thumbnails.int.spec.ts`

**Interfaces:**

- Produces: `blockThumbnailDefinitions`, `BlockThumbnailSlug`, `getBlockThumbnailDefinition(slug)`, `getBlockThumbnailAdmin(slug)`, `isBlockThumbnailSlug(value)`, and `isBlockThumbnailPreviewEnabled(nodeEnv)`.
- Consumes: native Payload `Block['admin']` and all block configs registered by Pages, Headers, Footers, and System Pages.

- [x] **Step 1: Write the failing manifest and Payload metadata test**

Create `tests/int/block-thumbnails.int.spec.ts`. Recursively traverse collection fields, including tabs and nested fields, to collect every `type: 'blocks'` entry from `Pages`, `Headers`, `Footers`, and `SystemPages`. Assert:

```ts
expect(registeredSlugs.toSorted()).toEqual(definitionSlugs.toSorted())
expect(new Set(definitionSlugs).size).toBe(definitionSlugs.length)

for (const block of registeredBlocks) {
  const definition = getBlockThumbnailDefinition(block.slug as BlockThumbnailSlug)
  expect(block.admin?.images?.thumbnail).toEqual({
    alt: definition.alt,
    url: definition.url,
  })
}

expect(isBlockThumbnailPreviewEnabled('development')).toBe(true)
expect(isBlockThumbnailPreviewEnabled('production')).toBe(false)
expect(isBlockThumbnailPreviewEnabled('test')).toBe(false)
```

The expected slug list is:

```ts
;[
  'announcement',
  'faq',
  'footer56',
  'headerNavbar12',
  'heroInstitutional',
  'reviewSubmission',
  'featureSpotlight',
  'statsStrip',
  'system404',
  'systemComingSoon',
  'systemMaintenance',
]
```

- [x] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts --config ./vitest.config.mts
```

Expected: FAIL because the manifest does not exist and FAQ and Review Submission have no thumbnail metadata.

- [x] **Step 3: Implement the metadata-only manifest**

Create `src/block-thumbnails/definitions.ts` with this public contract:

```ts
import type { Block } from 'payload'

type BlockThumbnailDefinitionInput = {
  alt: string
  filename: string
  label: string
  slug: string
  stageAlignment?: 'center' | 'top'
}

const defineThumbnail = <const Definition extends BlockThumbnailDefinitionInput>({
  stageAlignment = 'center',
  ...definition
}: Definition) => ({
  ...definition,
  stageAlignment,
  url: `/block-thumbnails/${definition.filename}` as const,
})

export const blockThumbnailDefinitions = [
  defineThumbnail({
    slug: 'announcement',
    label: 'Announcement',
    filename: 'announcement.jpg',
    alt: 'Announcement block preview',
  }),
  defineThumbnail({
    slug: 'heroInstitutional',
    label: 'Hero Institutional',
    filename: 'hero-institutional.jpg',
    alt: 'Hero Institutional block preview',
  }),
  defineThumbnail({
    slug: 'featureSpotlight',
    label: 'Feature Spotlight',
    filename: 'feature-spotlight.jpg',
    alt: 'Feature Spotlight block preview',
  }),
  defineThumbnail({
    slug: 'statsStrip',
    label: 'Stats Strip',
    filename: 'stats-strip.jpg',
    alt: 'Stats Strip block preview',
  }),
  defineThumbnail({
    slug: 'faq',
    label: 'FAQ',
    filename: 'faq.jpg',
    alt: 'FAQ block preview',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    slug: 'reviewSubmission',
    label: 'Review Submission',
    filename: 'review-submission.jpg',
    alt: 'Review Submission block preview',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    slug: 'headerNavbar12',
    label: 'Header Navbar 12',
    filename: 'header-navbar-12.jpg',
    alt: 'Header Navbar 12 block preview',
  }),
  defineThumbnail({
    slug: 'footer56',
    label: 'Footer 56',
    filename: 'footer-56.jpg',
    alt: 'Footer 56 block preview',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    slug: 'system404',
    label: 'System 404',
    filename: 'system-404.jpg',
    alt: 'System 404 preview',
  }),
  defineThumbnail({
    slug: 'systemMaintenance',
    label: 'System Maintenance',
    filename: 'system-maintenance.jpg',
    alt: 'System Maintenance preview',
  }),
  defineThumbnail({
    slug: 'systemComingSoon',
    label: 'System Coming Soon',
    filename: 'system-coming-soon.jpg',
    alt: 'System Coming Soon preview',
  }),
] as const

export type BlockThumbnailSlug = (typeof blockThumbnailDefinitions)[number]['slug']

export const isBlockThumbnailSlug = (value: string): value is BlockThumbnailSlug =>
  blockThumbnailDefinitions.some(({ slug }) => slug === value)

export function getBlockThumbnailDefinition(slug: BlockThumbnailSlug) {
  const definition = blockThumbnailDefinitions.find((item) => item.slug === slug)
  if (!definition) throw new Error(`Unknown block thumbnail slug: ${slug}`)
  return definition
}

export function getBlockThumbnailAdmin(slug: BlockThumbnailSlug): NonNullable<Block['admin']> {
  const { alt, url } = getBlockThumbnailDefinition(slug)
  return { images: { thumbnail: { alt, url } } }
}

export const isBlockThumbnailPreviewEnabled = (nodeEnv: string | undefined) =>
  nodeEnv === 'development'
```

Format the definition array across multiple lines with Prettier.

- [x] **Step 4: Connect every block config to the manifest**

Replace per-block thumbnail constant imports and inline `admin.images.thumbnail` objects with:

```ts
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

admin: getBlockThumbnailAdmin('featureSpotlight')
```

Use the matching slug for every block. Add native metadata to FAQ and Review Submission. Change `createSystemPageBlock` to accept:

```ts
thumbnailAdmin: NonNullable<Block['admin']>
```

and assign `admin: thumbnailAdmin`. Pass `getBlockThumbnailAdmin('system404')`, `getBlockThumbnailAdmin('systemMaintenance')`, and `getBlockThumbnailAdmin('systemComingSoon')` from the three system configs. Delete the now-unused thumbnail constant files.

- [x] **Step 5: Run focused verification**

Run:

```bash
pnpm exec prettier --check src/block-thumbnails/definitions.ts src/blocks tests/int/block-thumbnails.int.spec.ts
pnpm exec eslint src/block-thumbnails/definitions.ts src/blocks tests/int/block-thumbnails.int.spec.ts
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/global-header.int.spec.ts tests/int/global-footer.int.spec.ts tests/int/system-page-blocks.int.spec.ts --config ./vitest.config.mts
```

Expected: metadata coverage assertions pass. File-existence assertions are added in Task 3 after the missing outputs can be generated.

### Task 2: Render deterministic fixtures in a development-only capture stage

**Files:**

- Create: `public/block-thumbnail-assets/editorial-landscape.svg`
- Create: `public/block-thumbnail-assets/collaboration.svg`
- Create: `public/block-thumbnail-assets/portrait.svg`
- Create: `public/block-thumbnail-assets/brand-mark.svg`
- Create: `src/block-thumbnails/fixtures.tsx`
- Create: `src/block-thumbnails/BlockThumbnailPreviewStage.tsx`
- Create: `src/app/(block-thumbnails)/layout.tsx`
- Create: `src/app/(block-thumbnails)/block-thumbnail-previews/[slug]/page.tsx`
- Test: `tests/int/block-thumbnail-fixtures.int.spec.ts`

**Interfaces:**

- Consumes: `BlockThumbnailSlug`, `getBlockThumbnailDefinition`, the eleven production block components, and local `/block-thumbnail-assets/*` URLs.
- Produces: `blockThumbnailFixtures`, `getBlockThumbnailFixture(slug)`, a fixed `[data-block-thumbnail-canvas]`, and `[data-block-thumbnail-ready="true"]`.

- [x] **Step 1: Write failing fixture coverage and render tests**

Create `tests/int/block-thumbnail-fixtures.int.spec.ts` and assert:

```ts
expect(Object.keys(blockThumbnailFixtures).toSorted()).toEqual(
  blockThumbnailDefinitions.map(({ slug }) => slug).toSorted(),
)

for (const definition of blockThumbnailDefinitions) {
  const html = renderToStaticMarkup(getBlockThumbnailFixture(definition.slug))
  expect(html.length).toBeGreaterThan(100)
  expect(html).not.toContain('Replace this file')
}
```

Also verify every declared media URL begins with `/block-thumbnail-assets/` and does not begin with `http://` or `https://`.

- [x] **Step 2: Run the fixture test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/int/block-thumbnail-fixtures.int.spec.ts --config ./vitest.config.mts
```

Expected: FAIL because fixture rendering and local media assets do not exist.

- [x] **Step 3: Add local fixture media**

Create four optimized SVG assets using only local gradients and vector shapes:

- `editorial-landscape.svg`: a neutral architectural landscape for Hero Institutional;
- `collaboration.svg`: an editorial collaboration scene for Feature Spotlight;
- `portrait.svg`: a neutral profile portrait for FAQ;
- `brand-mark.svg`: a simple geometric logo for Header and Footer.

Each SVG must include a `viewBox`, descriptive `<title>`, no scripts, no embedded remote URLs, and a restrained palette that remains legible with the default light theme.

- [x] **Step 4: Implement all production-component fixtures**

Create `src/block-thumbnails/fixtures.tsx`. Export:

```ts
export const blockThumbnailAssetPaths = [
  '/block-thumbnail-assets/editorial-landscape.svg',
  '/block-thumbnail-assets/collaboration.svg',
  '/block-thumbnail-assets/portrait.svg',
  '/block-thumbnail-assets/brand-mark.svg',
] as const

export const blockThumbnailFixtures = {
  announcement: <AnnouncementBlockComponent appearance={{ background: 'accent' }} displayMode="vertical" label="Latest" items={[{ title: 'New', description: 'Explore the latest programs and resources.' }]} />,
  heroInstitutional: <HeroInstitutionalBlockComponent backgroundImage={{ alt: 'Abstract architectural landscape', url: blockThumbnailAssetPaths[0] }} buttons={[{ label: 'Explore programs', linkType: 'custom', url: '/programs', variant: 'default' }, { label: 'Plan a visit', linkType: 'custom', url: '/visit', variant: 'outline' }]} description="Practical learning, thoughtful teaching, and spaces designed for discovery." eyebrow="Learning without limits" height="compact" horizontalAlignment="left" overlayStyle="light" themeMode="auto" title="A place to learn, connect, and grow." />,
  featureSpotlight: <FeatureSpotlightBlockComponent actionMode="link" actions={[{ label: 'Explore the experience', linkType: 'custom', url: '/experience' }]} description="Flexible spaces and collaborative programs help ideas move from discussion to practice." eyebrow="Built for collaboration" image={{ alt: 'Abstract collaboration scene', url: blockThumbnailAssetPaths[1] }} layoutMode="split" mediaFillMode="containedFill" mediaPosition="left" size="compact" title="Designed around the way people learn." />,
  statsStrip: <StatsStripBlockComponent animationEnabled={false} appearance={{ background: 'muted', border: 'horizontal' }} items={[{ value: 48, suffix: '+', label: 'Programs' }, { value: 92, suffix: '%', label: 'Positive outcomes' }, { value: 24, suffix: '/7', label: 'Digital access' }, { value: 18, label: 'Community partners' }]} />,
  faq: <FaqBlockComponent defaultOpenFirst description="Clear answers to common questions about programs, visits, and support." heading="Frequently asked questions" items={faqFixtureItems} layoutMode="fullWidth" size="compact" />,
  reviewSubmission: <ReviewSubmissionBlockComponent description="Share what stood out and help others understand the experience." eyebrow="Your perspective matters" form={reviewFormFixture} size="compact" title="Tell us about your experience." />,
  headerNavbar12: <HeaderNavbar12BlockComponent blockType="headerNavbar12" ctaButtons={[{ label: 'Get started', linkType: 'custom', url: '/start', variant: 'default' }]} logoMode="siteDefault" menuItems={headerMenuFixture} siteLogo={{ alt: 'Sample brand', url: blockThumbnailAssetPaths[3] }} siteName="Northstar" size="compact" />,
  footer56: <Footer56BlockComponent blockType="footer56" copyrightText="© 2026 Northstar" linkGroups={footerGroupsFixture} logoMode="siteDefault" siteAddress="100 Market Street" siteEmail="hello@example.com" siteLogo={{ alt: 'Sample brand', url: blockThumbnailAssetPaths[3] }} siteName="Northstar" sitePhone="+1 555 0100" />,
  system404: <System404BlockComponent blockType="system404" badge="404" heading="We couldn't find that page" description="The page may have moved or the address may be incorrect." />,
  systemMaintenance: <SystemMaintenanceBlockComponent blockType="systemMaintenance" badge="Maintenance" heading="We'll be back shortly" description="Scheduled improvements are underway." />,
  systemComingSoon: <SystemComingSoonBlockComponent blockType="systemComingSoon" badge="Coming soon" heading="Something thoughtful is taking shape" description="We are preparing a new experience." />,
} satisfies Record<BlockThumbnailSlug, React.ReactNode>
```

Define `faqFixtureItems`, `reviewFormFixture`, `headerMenuFixture`, and `footerGroupsFixture` immediately above the map with complete neutral values required by their production component types. Export `getBlockThumbnailFixture(slug)` and throw `Unknown block thumbnail fixture: ${slug}` when missing.

- [x] **Step 5: Implement the fixed capture stage**

Create a client component `BlockThumbnailPreviewStage` with props `{ alignment: 'center' | 'top'; children: React.ReactNode; label: string }`. It must:

- render a fixed `h-[900px] w-[1600px] overflow-hidden bg-background p-20` canvas;
- render content at exactly 1440 CSS pixels wide;
- wait for `document.fonts.ready` and every descendant image;
- reject broken images by throwing an error from the effect;
- measure natural content height after two animation frames;
- compute `Math.min(1, availableHeight / contentHeight)`;
- use `transform: translate(-50%, -50%) scale(...)` for center alignment and a top-safe equivalent for top alignment;
- set `data-block-thumbnail-ready="true"` only after measurement;
- apply capture-only reduced motion without changing component colors or typography.

- [x] **Step 6: Add the isolated development-only route**

Create `src/app/(block-thumbnails)/layout.tsx` as a minimal root layout importing `src/styles/globals.css`. Render:

```tsx
<html
  className="light"
  data-color-scheme="light"
  data-theme-color={defaultWebsiteTheme}
  lang="en"
  style={{ colorScheme: 'light' }}
>
  <body className="m-0 overflow-hidden bg-background">{children}</body>
</html>
```

Create `src/app/(block-thumbnails)/block-thumbnail-previews/[slug]/page.tsx`. Resolve the Next 16 async `params`, call `notFound()` unless `isBlockThumbnailPreviewEnabled(process.env.NODE_ENV)` and the slug is valid, then render the definition's fixture in `BlockThumbnailPreviewStage`.

- [x] **Step 7: Run fixture and focused render verification**

Run:

```bash
pnpm exec prettier --check src/block-thumbnails public/block-thumbnail-assets 'src/app/(block-thumbnails)' tests/int/block-thumbnail-fixtures.int.spec.ts
pnpm exec eslint src/block-thumbnails 'src/app/(block-thumbnails)' tests/int/block-thumbnail-fixtures.int.spec.ts
pnpm exec vitest run tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/faq-render.int.spec.ts tests/int/review-submission-render.int.spec.ts tests/int/header-navbar-render.int.spec.ts --config ./vitest.config.mts
```

Expected: fixture coverage and component render tests pass without a database or remote network request.

### Task 3: Add the self-starting Playwright generator and replace placeholders

**Files:**

- Create: `scripts/generate-block-thumbnails.ts`
- Modify: `package.json`
- Modify: `public/block-thumbnails/README.md`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Generate: all eleven `public/block-thumbnails/*.jpg` files

**Interfaces:**

- Consumes: `blockThumbnailDefinitions`, `/block-thumbnail-previews/[slug]`, Playwright Chromium, Sharp, and `pnpm exec next dev`.
- Produces: `pnpm generate:block-thumbnails`, eleven exact 1600×900 JPEGs, and non-zero exit status on any capture failure.

- [x] **Step 1: Extend the failing contract test for the package command and outputs**

In `tests/int/block-thumbnails.int.spec.ts`, read `package.json` and assert:

```ts
expect(packageJson.scripts['generate:block-thumbnails']).toBe(
  'tsx scripts/generate-block-thumbnails.ts',
)
```

For every definition, resolve `public/block-thumbnails/${filename}`, assert it exists, read it with Sharp, and assert:

```ts
expect(metadata.format).toBe('jpeg')
expect(metadata.width).toBe(1600)
expect(metadata.height).toBe(900)
```

Also assert definition filenames and URLs are unique.

- [x] **Step 2: Run the contract test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts --config ./vitest.config.mts
```

Expected: FAIL because the package command and FAQ/Review images do not exist.

- [x] **Step 3: Implement the generator**

Create `scripts/generate-block-thumbnails.ts`. It must:

- use `spawn` without a shell to run `pnpm exec next dev --hostname 127.0.0.1 --port ${port}`;
- default to port `3199` and allow `BLOCK_THUMBNAIL_PORT` override;
- poll the first preview URL until it returns HTTP 200 or a 60-second timeout expires;
- launch Playwright Chromium with a 1600×900 viewport;
- create a fresh page for each definition;
- collect `pageerror` and console `error` events;
- navigate with `waitUntil: 'load'` and rely on the explicit preview-ready marker for fonts, images, and layout rather than waiting on the development HMR connection;
- wait up to 30 seconds for `[data-block-thumbnail-ready="true"]`;
- screenshot the viewport as JPEG at quality 90 to the definition's output path;
- verify the output with Sharp and reject non-1600×900 JPEGs;
- continue through all entries to report every result;
- close browser and terminate only its child process in `finally`;
- set `process.exitCode = 1` when any entry fails.

- [x] **Step 4: Add the package command and documentation**

Add to `package.json`:

```json
"generate:block-thumbnails": "tsx scripts/generate-block-thumbnails.ts"
```

Replace the placeholder README with instructions covering the command, 1600×900 output, canonical light theme, local fixture assets, stable filenames, manifest/config requirements for new blocks, and the focused verification command.

- [x] **Step 5: Generate and visually inspect every thumbnail**

Run:

```bash
pnpm generate:block-thumbnails
```

Expected: eleven success lines and eleven 1600×900 JPEGs. Build a temporary contact sheet outside the repository or inspect the files individually. Confirm every preview shows the real block, has safe margins, contains no clipped essential content, uses the light default theme, and contains no placeholder instructions.

- [x] **Step 6: Run final verification**

Run:

```bash
pnpm exec prettier --check package.json scripts/generate-block-thumbnails.ts src/block-thumbnails 'src/app/(block-thumbnails)' src/blocks tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
pnpm exec eslint scripts/generate-block-thumbnails.ts src/block-thumbnails 'src/app/(block-thumbnails)' src/blocks tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/global-header.int.spec.ts tests/int/global-footer.int.spec.ts tests/int/system-page-blocks.int.spec.ts --config ./vitest.config.mts
pnpm run generate:types
git diff --check
git status --short
```

Expected: formatting, lint, focused integration tests, Payload type generation, and diff checks pass; every output is 1600×900 JPEG; no existing frontend behavior test regresses; all new work remains unstaged.
