# News & Events Detail Image Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present every News & Events detail entry with its classification and title over a configurable featured-image overlay, followed by its excerpt and Lexical body beside the existing metadata sidebar.

**Architecture:** Extend the global-only `newsEventsContent` block with the project's shared media-overlay fields and normalize them alongside its existing presentation settings. Keep entry content collection-owned and render the overlay inside `NewsEventStory`, using the bundled SNMIH image when an entry has no usable image. Production and live preview continue sharing the same dynamic block component, so the new presentation does not introduce another query or a second rendering contract.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16.2.10 App Router, React 19.2.7, TypeScript 5.7.3, Tailwind CSS 4.3.2, Vitest 4.0.18.

## Global Constraints

- The News & Events collection remains the sole source of entry classification, title, excerpt, image, Lexical body, dates, location, registration, and taxonomy.
- Overlay controls live on the global-only `newsEventsContent` block; no per-entry controls, relationship, slug, source selector, or manual content fields are added.
- Overlay defaults are Dark tone, Darker strength, Bottom-to-Top direction, and Full coverage.
- Classification and title remain fixed at the bottom-left of the image.
- Missing entry images use `/images/snmih-news-events-default.png`.
- The main column order is image/overlay, excerpt, then Lexical body; the right sidebar retains metadata, registration, and optional sharing.
- Existing section appearance, padding, image ratio, sidebar surface/outline, author, share, responsive, and live-preview behavior remain compatible.
- Preserve the News Event live-preview client/server import boundary and do not add a client-side Payload/template query.
- Preserve unrelated staged and unstaged work.
- Do not stage or commit changes unless the user explicitly requests it.

---

## File Structure

### Modify

- `src/blocks/NewsEventsContent/config.ts` — add the four shared overlay fields to Theme Settings.
- `src/lib/newsEventDetailTemplateShared.ts` — normalize and type the overlay settings and add them to the default dynamic block.
- `src/components/news-events/NewsEventStory.tsx` — render the image overlay, fallback image, excerpt/body order, and existing sidebar.
- `src/payload-types.ts` — regenerate the global block contract.
- `tests/int/news-events-detail-template.int.spec.tsx` — cover schema exposure and normalization defaults/valid values.
- `tests/int/news-event-story.int.spec.tsx` — cover overlay content, ordering, fallback image, contrast, and retained sidebar behavior.
- `docs/guides/news-events.md` — explain the detail image/overlay workflow.
- `docs/guides/blocks.md` — document the dynamic block's overlay controls.
- `.agents/skills/project-context/references/block-system.md` — record the global-only block's final presentation contract.
- `.agents/skills/project-context/references/payload-model.md` — record the overlay settings owned by the template global.
- `.agents/skills/project-context/references/architecture.md` — record shared production/live-preview presentation and fallback behavior.
- `.agents/skills/project-context/references/project-inventory.json` — regenerate through the project-context update.

---

### Task 1: Add and normalize shared overlay settings

**Files:**

- Modify: `src/blocks/NewsEventsContent/config.ts`
- Modify: `src/lib/newsEventDetailTemplateShared.ts`
- Modify: `tests/int/news-events-detail-template.int.spec.tsx`
- Modify: `tests/int/news-event-story.int.spec.tsx`
- Regenerate: `src/payload-types.ts`

**Interfaces:**

- Consumes: `createMediaOverlayToneField`, `createMediaOverlayStrengthField`, `createMediaOverlayDirectionField`, and `createMediaOverlayCoverageField`.
- Produces: generated `NewsEventsContentBlock.themeMode`, `.overlayStyle`, `.overlayDirection`, and `.overlayCoverage` fields.
- Produces: `ResolvedNewsEventsContentSettings` with normalized `tone`, `strength`, `direction`, and `coverage` values suitable for `resolveMediaOverlay`.

- [ ] **Step 1: Add failing schema and normalization assertions**

In `tests/int/news-events-detail-template.int.spec.tsx`, extend the schema test by locating the four named fields inside `NewsEventsContentBlock.fields` and asserting their defaults:

```ts
import { NewsEventsContentBlock } from '@/blocks/NewsEventsContent/config'

expect(findNamedField(NewsEventsContentBlock.fields, 'themeMode')).toMatchObject({
  defaultValue: 'dark',
  type: 'select',
})
expect(findNamedField(NewsEventsContentBlock.fields, 'overlayStyle')).toMatchObject({
  defaultValue: 'darker',
  type: 'select',
})
expect(findNamedField(NewsEventsContentBlock.fields, 'overlayDirection')).toMatchObject({
  defaultValue: 'bottomToTop',
  type: 'select',
})
expect(findNamedField(NewsEventsContentBlock.fields, 'overlayCoverage')).toMatchObject({
  defaultValue: 'full',
  type: 'select',
})
```

Extend the settings test with valid values and a malformed fallback case:

```ts
expect(
  resolveNewsEventsContentSettings({
    themeMode: 'brand',
    overlayStyle: 'light',
    overlayDirection: 'rightToLeft',
    overlayCoverage: 'split',
  }),
).toMatchObject({
  coverage: 'split',
  direction: 'rightToLeft',
  strength: 'light',
  tone: 'brand',
})

expect(
  resolveNewsEventsContentSettings({
    themeMode: 'invalid',
    overlayStyle: 'invalid',
    overlayDirection: 'invalid',
    overlayCoverage: 'invalid',
  }),
).toMatchObject({
  coverage: 'full',
  direction: 'bottomToTop',
  strength: 'darker',
  tone: 'dark',
})
```

- [ ] **Step 2: Run the focused test and confirm the new assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-detail-template.int.spec.tsx
```

Expected: FAIL because the block schema and resolved settings do not yet expose overlay controls.

- [ ] **Step 3: Add the shared overlay fields to the block schema**

In `src/blocks/NewsEventsContent/config.ts`, import the shared factories:

```ts
import {
  createMediaOverlayCoverageField,
  createMediaOverlayDirectionField,
  createMediaOverlayStrengthField,
  createMediaOverlayToneField,
} from '@/blocks/shared/mediaOverlayFields'
```

Add these fields in the Theme Settings tab immediately after `featuredImageRatio`:

```ts
createMediaOverlayToneField({ defaultValue: 'dark' }),
createMediaOverlayStrengthField({ defaultValue: 'darker' }),
createMediaOverlayDirectionField({ defaultValue: 'bottomToTop' }),
createMediaOverlayCoverageField({ defaultValue: 'full' }),
```

Use the existing field names produced by the factories: `themeMode`, `overlayStyle`,
`overlayDirection`, and `overlayCoverage`.

- [ ] **Step 4: Extend the normalized settings contract**

In `src/lib/newsEventDetailTemplateShared.ts`, import the shared overlay types and normalizers:

```ts
import {
  normalizeMediaOverlayCoverage,
  normalizeMediaOverlayDirection,
  normalizeMediaOverlayStrength,
  normalizeMediaOverlayTone,
  type MediaOverlayCoverage,
  type MediaOverlayDirection,
  type MediaOverlayStrength,
  type MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
```

Add these properties to `ResolvedNewsEventsContentSettings`:

```ts
coverage: MediaOverlayCoverage
direction: MediaOverlayDirection
strength: MediaOverlayStrength
tone: MediaOverlayTone
```

Add the raw factory field names to `DEFAULT_NEWS_EVENTS_CONTENT_BLOCK`:

```ts
overlayCoverage: 'full',
overlayDirection: 'bottomToTop',
overlayStyle: 'darker',
themeMode: 'dark',
```

Resolve direction before coverage inside `resolveNewsEventsContentSettings`:

```ts
const direction = normalizeMediaOverlayDirection(trimmed(block.overlayDirection), 'bottomToTop')

return {
  // existing properties remain unchanged
  coverage: normalizeMediaOverlayCoverage(trimmed(block.overlayCoverage), direction),
  direction,
  strength: normalizeMediaOverlayStrength(trimmed(block.overlayStyle), 'darker'),
  tone: normalizeMediaOverlayTone(trimmed(block.themeMode), 'dark'),
}
```

Do not rename the stored Payload fields; the normalized names intentionally match
`resolveMediaOverlay` options.

- [ ] **Step 5: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: PASS. `NewsEventsContentBlock` contains the four generated overlay properties.

- [ ] **Step 6: Keep the generated block fixture type-safe**

In the `NewsEventsContentBlock` fixture constructed by
`tests/int/news-event-story.int.spec.tsx`, add the four now-required generated properties from the
resolved settings:

```ts
overlayCoverage: settings.coverage,
overlayDirection: settings.direction,
overlayStyle: settings.strength,
themeMode: settings.tone,
```

Do not add presentation assertions yet; Task 2 owns the render change and its red/green cycle.

- [ ] **Step 7: Run schema, normalization, story, and static checks**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-detail-template.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-event-story.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 8: Review checkpoint**

Inspect Task 1 files with `git diff --check` and verify the dynamic block remains absent from Pages
and Reusable Sections. Do not stage or commit.

---

### Task 2: Render the overlaid image and editorial content order

**Files:**

- Modify: `src/components/news-events/NewsEventStory.tsx`
- Modify: `tests/int/news-event-story.int.spec.tsx`

**Interfaces:**

- Consumes: `ResolvedNewsEventsContentSettings` from Task 1.
- Consumes: `resolveMediaOverlay({ coverage, direction, sectionBackground, strength, tone })`.
- Consumes: `getNewsEventClassificationLabel(entry.contentType)`.
- Produces: one main-column composition marked by `data-news-event-main-content="true"`.
- Produces: overlay markers and the bundled fallback-image marker used by focused tests.

- [ ] **Step 1: Replace the old unoverlaid-image assertion with failing layout assertions**

Replace the old introduction test with:

```ts
it('renders classification and title over the image before excerpt and Lexical content', () => {
  const markup = renderStory()
  const image = markup.indexOf('data-news-event-featured-image="true"')
  const eyebrow = markup.indexOf('data-news-event-overlay-eyebrow="true"')
  const title = markup.indexOf('data-news-event-overlay-title="true"')
  const excerpt = markup.indexOf('data-news-event-excerpt="true"')
  const body = markup.indexOf('data-news-event-rich-text="true"')

  expect(markup).toContain('data-news-event-image-overlay="true"')
  expect(markup).toContain('>News<')
  expect(markup).toContain('Campus story')
  expect(image).toBeLessThan(eyebrow)
  expect(eyebrow).toBeLessThan(title)
  expect(title).toBeLessThan(excerpt)
  expect(excerpt).toBeLessThan(body)
})
```

Add overlay and fallback coverage:

```ts
it('applies normalized overlay presentation and the bundled missing-image fallback', () => {
  const template = normalizeNewsEventDetailTemplate({
    layout: [
      {
        blockType: 'newsEventsContent',
        themeMode: 'light',
        overlayStyle: 'light',
        overlayDirection: 'rightToLeft',
        overlayCoverage: 'split',
      },
    ],
  })
  const markup = renderStory({ ...entry, image: undefined }, template)

  expect(markup).toContain('snmih-news-events-default.png')
  expect(markup).toContain('data-news-event-image-fallback="true"')
  expect(markup).toContain('data-overlay-tone="light"')
  expect(markup).toContain('data-overlay-strength="light"')
  expect(markup).toContain('data-overlay-direction="rightToLeft"')
  expect(markup).toContain('data-overlay-coverage="split"')
  expect(markup).toContain('text-black')
})
```

Retain the current tests for Story Details, sticky/right sidebar classes, Lexical classes, Event
details and registration, and optional Share actions.

- [ ] **Step 2: Run the story suite and confirm the new assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-event-story.int.spec.tsx
```

Expected: FAIL because the title/excerpt are still rendered in a separate introduction and images
do not yet receive overlays or the bundled fallback.

- [ ] **Step 3: Resolve overlay and image data in `NewsEventStory`**

Import the shared overlay resolver and eyebrow component:

```tsx
import { resolveMediaOverlay } from '@/blocks/shared/mediaOverlayPresentation'
import { SectionEyebrow } from '@/components/SectionEyebrow'
```

Inside `NewsEventStory`, derive the classification, image, fallback flag, and overlay:

```ts
const appearance = resolveBlockAppearanceClasses(article.appearance)
const cardSurface = resolveCardSurface(article.sidebarCardBackground, appearance.background)
const classificationLabel = getNewsEventClassificationLabel(entry.contentType)
const usesFallbackImage = !entry.image
const image = entry.image ?? {
  alt: '',
  position: 'center' as const,
  src: '/images/snmih-news-events-default.png',
}
const overlay = resolveMediaOverlay({
  coverage: article.coverage,
  direction: article.direction,
  sectionBackground: appearance.background,
  strength: article.strength,
  tone: article.tone,
})
```

The fallback image is decorative because the adjacent overlay already names the entry. Keep the
entry image's existing alt text and object-position behavior when it is present.

- [ ] **Step 4: Replace the introduction/image/body structure with the main-column composition**

Within the existing container, make the two-column grid the primary layout. Its first child is:

```tsx
<div className="flex min-w-0 flex-col gap-8" data-news-event-main-content="true">
  <div
    className={cn(
      'relative isolate overflow-hidden rounded-[var(--radius)] border border-border bg-muted',
      featuredImageRatioClasses[article.featuredImageRatio],
    )}
    data-news-event-featured-image="true"
  >
    <Image
      fill
      alt={image.alt}
      className={cn('-z-20 object-cover', newsEventObjectPositionClasses[image.position])}
      data-news-event-image-fallback={usesFallbackImage ? 'true' : undefined}
      priority
      sizes="(max-width: 1024px) 100vw, calc(100vw - 24rem)"
      src={image.src}
    />
    <div
      className={cn('absolute -z-10', overlay.frameClassName, overlay.className)}
      data-news-event-image-overlay="true"
      data-overlay-coverage={overlay.coverage}
      data-overlay-direction={overlay.direction}
      data-overlay-strength={overlay.strength}
      data-overlay-tone={overlay.tone}
    />
    <div
      className={cn(
        'absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-6 sm:p-8',
        overlay.text.title,
      )}
    >
      <SectionEyebrow data-news-event-overlay-eyebrow="true" surface={overlay.eyebrowSurface}>
        {classificationLabel}
      </SectionEyebrow>
      <h1
        className="max-w-4xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl"
        data-news-event-overlay-title="true"
      >
        {entry.title}
      </h1>
    </div>
  </div>

  <p className="text-base leading-7 text-current/70 sm:text-lg" data-news-event-excerpt="true">
    {entry.excerpt}
  </p>

  <div className={cn('min-w-0', newsEventArticleRichTextClasses)} data-news-event-rich-text="true">
    <RichText data={entry.body} />
  </div>
</div>
```

Keep the existing `<aside>` as the grid's second child. Do not change Story Details fields,
registration rendering, the share condition, card surface resolution, `lg:sticky lg:top-28`, or the
responsive `lg:grid-cols-[minmax(0,1fr)_20rem]` contract.

- [ ] **Step 5: Run story, detail-renderer, and live-preview tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/news-events-detail-template.int.spec.tsx \
  tests/int/live-preview-import-boundary.int.spec.ts \
  tests/int/live-preview-renderer.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: PASS. Production and live preview both consume `NewsEventsContentBlockComponent`, and the
live-preview client graph remains free of server-only modules.

- [ ] **Step 6: Review checkpoint**

Inspect Task 2 files with `git diff --check`. Confirm the title appears only once in the dynamic
article, the excerpt precedes Lexical content, the fallback path is correct, and the sidebar remains
the grid's second column. Do not stage or commit.

---

### Task 3: Regenerate contracts, document the editor workflow, and verify

**Files:**

- Regenerate: `src/payload-types.ts`
- Regenerate if changed: `src/app/(payload)/admin/importMap.js`
- Modify: `docs/guides/news-events.md`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/payload-model.md`
- Regenerate: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the completed schema, normalized settings, and shared production/live-preview story presentation.
- Produces: current generated Payload types, Admin import map, maintained operator documentation, and project-context knowledge.

- [ ] **Step 1: Update editor documentation**

In `docs/guides/news-events.md`, document that Configuration → News & Events Detail Page → News &
Events Content controls the shared overlay tone, strength, direction, coverage, image ratio, sidebar,
author, and share behavior. State that category/title/excerpt/body come from the current entry and a
missing image uses the bundled SNMIH fallback.

In `docs/guides/blocks.md`, update the `newsEventsContent` entry with the same global-only ownership,
default overlay values, fixed bottom-left content position, and main-column order.

- [ ] **Step 2: Regenerate Payload contracts**

Run:

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected: PASS. The import map may remain unchanged because no custom Admin component is introduced.

- [ ] **Step 3: Run the focused integration suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-events-detail-template.int.spec.tsx \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/news-events-metadata-routes.int.spec.ts \
  tests/int/news-events-metadata.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/regular-block-spacing.int.spec.tsx \
  tests/int/live-preview-import-boundary.int.spec.ts \
  tests/int/live-preview-renderer.int.spec.tsx \
  tests/int/admin-information-architecture.int.spec.ts \
  tests/int/media-governance.int.spec.ts
```

Expected: all focused suites PASS.

- [ ] **Step 4: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
git diff --check
```

Expected: all commands exit successfully. If unrelated dirty-worktree failures exist, record their
exact diagnostics and confirm none point to the files in this plan.

- [ ] **Step 5: Refresh maintained project knowledge**

Run:

```bash
pnpm project-context:update
```

Update the narrative references so they accurately describe:

- The block-built News & Events Detail Page global and its global-only dynamic block.
- Collection-owned entry content injected into production and client-safe live-preview renderers.
- Shared media-overlay settings and bundled missing-image fallback.
- Image/overlay, excerpt, Lexical body, and right-sidebar composition.

Then run:

```bash
pnpm project-context:check
```

Expected: PASS. The known stale knowledge-graph message remains a warning rather than a context-check failure.

- [ ] **Step 6: Final impact review**

Review the final diff against `.agents/skills/project-context/references/change-impact-map.md` and
confirm:

- `newsEventsContent` remains absent from Pages and Reusable Sections.
- Production and live preview share the dynamic article component.
- The live-preview import-boundary test passes.
- No route, URL, metadata, query-count, or manual-entry behavior changed.
- No files were staged or committed.
