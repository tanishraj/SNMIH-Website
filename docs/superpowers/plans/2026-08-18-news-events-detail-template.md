# News & Events Detail Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one administrator-configurable global template for every News & Events detail page, with a fixed Page Header, automatic Breadcrumb, non-overlay featured image, polished Lexical article body, and right-hand metadata/share sidebar.

**Architecture:** Register a versioned `news-events-detail-template` Payload global, normalize it through a client-safe model, and load its published value through a cached server adapter. Compose the existing Page Header and Breadcrumb presentations with a focused News & Events story component; keep only share/copy interactions client-side, and feed the same presentation from production and authenticated live preview.

**Tech Stack:** Payload CMS 3.85, Next.js 16 App Router, React 19, TypeScript, Payload Lexical, Tailwind CSS 4, shadcn UI primitives, Vitest, Testing Library.

## Global Constraints

- Keep News & Events entry data collection-owned; do not add per-entry layout overrides.
- The fixed global Page Header is the only eyebrow on detail pages.
- Render Breadcrumb below Page Header and above the dynamic entry introduction.
- Render entry title and excerpt above the featured image; never overlay content on that image.
- Keep the metadata sidebar on the right at desktop widths and stack it after the article on smaller screens.
- Use `Management, SNMIH` as the default configurable global author label.
- Hide, retain, and publicly ignore legacy per-entry Byline values; do not migrate or delete stored values.
- Reuse semantic appearance, spacing, Page Header, Breadcrumb, media-overlay, and card-surface contracts.
- Use theme tokens and existing typography scales; do not add hardcoded palette values.
- Do not add dependencies.
- Do not modify News Grid or News & Events Tabs.
- Do not stage or commit any files unless the user explicitly requests it later.
- Preserve unrelated staged and unstaged work in the existing dirty worktree.

---

## File Structure

### Create

- `src/globals/NewsEventsDetailTemplate.ts` — Payload global schema, access, versions, defaults, and cache invalidation.
- `src/lib/newsEventDetailTemplateShared.ts` — client-safe template types, defaults, and defensive normalization.
- `src/lib/newsEventDetailTemplate.ts` — Payload-backed published global loader and cache boundary.
- `src/components/news-events/NewsEventDetailPage.tsx` — fixed-header, breadcrumb, and story composition shared by production and preview.
- `src/components/news-events/NewsEventShareActions.tsx` — client-only native-share/copy-link behavior.
- `tests/int/news-events-detail-template.int.spec.tsx` — global schema, normalization, loader, composition, and fallback contracts.
- `tests/int/news-event-share-actions.int.spec.tsx` — browser share/copy behavior and accessibility.

### Modify

- `src/payload.config.ts` — explicitly register the new global under Configuration.
- `src/collections/NewsEvents.ts` — hide the legacy Byline and remove it from searchable fields.
- `src/lib/mediaUsage.ts` — protect the global Page Header background image from unsafe deletion.
- `src/lib/newsEventsShared.ts` — stop projecting legacy `authorName` into the public detail model.
- `src/lib/newsEventsMetadata.ts` — accept the global author label for NewsArticle JSON-LD.
- `src/components/news-events/NewsEventStory.tsx` — implement the entry introduction, image, article grid, rich typography, metadata cards, and right sidebar.
- `src/components/live-preview/NewsEventLivePreview.tsx` — render the shared detail composition with the resolved template.
- `src/app/(frontend)/news-events/[slug]/page.tsx` — load entry/template together and render the shared detail page.
- `src/payload-types.ts` — regenerate after the schema change.
- `tests/int/news-events-collection.int.spec.ts` — assert the retired Byline admin/search contract and global registration.
- `tests/int/news-event-story.int.spec.tsx` — assert layout order, no overlay, sidebar content, Lexical styling, and responsive classes.
- `tests/int/news-events-metadata.int.spec.ts` — assert global Organization author JSON-LD.
- `tests/int/news-events-metadata-routes.int.spec.ts` — assert production route/template composition while preserving metadata loading.
- `tests/int/media-governance.int.spec.ts` — assert global header-image usage detection.
- `tests/int/admin-information-architecture.int.spec.ts` — assert global label/group/visibility.
- `tests/int/project-context-lib.int.spec.ts` — update the expected global count from eight to nine.
- `docs/guides/news-events.md` — document operator workflow and global template controls.
- `docs/architecture/feature-inventory.md` — document the ninth global and dynamic detail template.
- `.agents/skills/project-context/references/architecture.md` — document route/template loading and presentation ownership.
- `.agents/skills/project-context/references/payload-model.md` — document the new global and global author ownership.
- `.agents/skills/project-context/references/project-inventory.json` — regenerate through the project-context updater.

---

### Task 1: Register the News & Events Detail Template global

**Files:**

- Create: `src/globals/NewsEventsDetailTemplate.ts`
- Modify: `src/payload.config.ts`
- Modify: `src/collections/NewsEvents.ts`
- Modify: `src/lib/mediaUsage.ts`
- Test: `tests/int/news-events-detail-template.int.spec.tsx`
- Test: `tests/int/news-events-collection.int.spec.ts`
- Test: `tests/int/media-governance.int.spec.ts`
- Test: `tests/int/admin-information-architecture.int.spec.ts`

**Interfaces:**

- Produces: Payload global slug `news-events-detail-template` and generated interface `NewsEventsDetailTemplate`.
- Produces nested groups named `header`, `breadcrumb`, and `article`.
- Keeps `NewsEvent.authorName` stored but hidden; later tasks must not consume it publicly.

- [ ] **Step 1: Write failing schema and registration tests**

Add these local helpers and assertions:

```ts
import { NewsEventsDetailTemplate } from '@/globals/NewsEventsDetailTemplate'

const getTabs = (fields: unknown[]) => {
  const tabs = fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'type' in field && field.type === 'tabs',
  ) as { tabs?: Array<{ fields: unknown[]; label: string }> } | undefined

  return tabs?.tabs ?? []
}

const findNamedField = (value: unknown, name: string): Record<string, unknown> | undefined => {
  if (Array.isArray(value)) {
    for (const child of value) {
      const match = findNamedField(child, name)
      if (match) return match
    }
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (record.name === name) return record
    for (const child of Object.values(record)) {
      const match = findNamedField(child, name)
      if (match) return match
    }
  }

  return undefined
}

it('registers a versioned News & Events detail template under Configuration', async () => {
  const resolvedConfig = await config

  expect(resolvedConfig.globals?.map(({ slug }) => slug)).toContain('news-events-detail-template')
  expect(NewsEventsDetailTemplate).toMatchObject({
    admin: { group: 'Configuration' },
    label: 'News & Events Detail Template',
    slug: 'news-events-detail-template',
    versions: { drafts: true },
  })
})

it('exposes three controlled template groups', () => {
  expect(getTabs(NewsEventsDetailTemplate.fields).map(({ label }) => label)).toEqual([
    'Page Header',
    'Breadcrumb',
    'Article Layout',
  ])
  expect(findNamedField(NewsEventsDetailTemplate.fields, 'title')).toMatchObject({
    defaultValue: 'Latest updates from SNMIH',
    required: true,
  })
  expect(findNamedField(NewsEventsDetailTemplate.fields, 'authorLabel')).toMatchObject({
    defaultValue: 'Management, SNMIH',
    required: true,
  })
})

it('retains but hides the legacy per-entry Byline', () => {
  const authorName = findNamedField(NewsEvents.fields, 'authorName')

  expect(authorName?.admin).toMatchObject({ hidden: true })
  expect(NewsEvents.admin?.listSearchableFields).not.toContain('authorName')
})
```

Extend the media-governance fixture so `findGlobal({ slug: 'news-events-detail-template' })`
returns `{ header: { backgroundImage: mediaID } }`, then expect a global usage reference with field
path `header.backgroundImage`.

- [ ] **Step 2: Run the focused tests and verify the contract fails**

Run:

```bash
pnpm exec vitest run tests/int/news-events-detail-template.int.spec.tsx tests/int/news-events-collection.int.spec.ts tests/int/media-governance.int.spec.ts tests/int/admin-information-architecture.int.spec.ts --config ./vitest.config.mts
```

Expected: FAIL because the global module/registration and retired-Byline admin contract do not exist.

- [ ] **Step 3: Create the controlled global schema**

Implement `NewsEventsDetailTemplate.ts` with these exact defaults and controls:

```ts
export const NewsEventsDetailTemplate: GlobalConfig = {
  slug: 'news-events-detail-template',
  label: 'News & Events Detail Template',
  admin: {
    group: 'Configuration',
    description: 'Configure the shared layout for every News & Events detail page.',
    hidden: hideFromUsersWithoutCapability(['manage_news_events', 'manage_page_settings']),
  },
  access: {
    read: allowPublicReadOrCapability(['manage_news_events', 'manage_page_settings']),
    readVersions: requireCapability(['manage_news_events', 'manage_page_settings']),
    update: requireCapability(['manage_news_events', 'manage_page_settings']),
  },
  versions: { drafts: true },
  hooks: { afterChange: [revalidateGlobalsCacheForGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        { label: 'Page Header', fields: [headerGroup] },
        { label: 'Breadcrumb', fields: [breadcrumbGroup] },
        { label: 'Article Layout', fields: [articleGroup] },
      ],
    },
  ],
}
```

Define the groups with these fields:

```ts
const headerGroup: GroupField = {
  name: 'header',
  type: 'group',
  fields: [
    { name: 'eyebrow', type: 'text', defaultValue: 'News & Events' },
    {
      name: 'title',
      type: 'text',
      defaultValue: 'Latest updates from SNMIH',
      required: true,
    },
    {
      name: 'subtitle',
      label: 'Description',
      type: 'textarea',
      defaultValue: 'Stay informed about news, events, notices, and announcements from SNMIH.',
    },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'minimal',
      required: true,
      options: [
        { label: 'Minimal', value: 'minimal' },
        { label: 'Banner', value: 'banner' },
      ],
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      admin: { condition: isBanner },
      filterOptions: { mimeType: { contains: 'image' } },
    },
    createBlockAppearanceFields(),
    createBannerContentAlignmentField(),
    createBannerContentWidthField(),
    createBannerThemeModeField(isBanner),
    createBannerOverlayStyleField(isBanner),
    createBannerOverlayDirectionField(isBanner),
    createMediaOverlayCoverageField({ condition: isBanner, required: false }),
    createBannerHeightField(),
    createBannerSectionPaddingField(),
  ],
}

const breadcrumbGroup: GroupField = {
  name: 'breadcrumb',
  type: 'group',
  fields: [
    createBlockAppearanceFields(),
    separatorField,
    sizeField,
    { name: 'showHome', type: 'checkbox', defaultValue: true },
    { name: 'showCurrentPage', type: 'checkbox', defaultValue: true },
    sectionPaddingField,
  ],
}

const articleGroup: GroupField = {
  name: 'article',
  type: 'group',
  fields: [
    {
      name: 'authorLabel',
      type: 'text',
      defaultValue: 'Management, SNMIH',
      required: true,
    },
    createBlockAppearanceFields(),
    articleSizeField,
    createCardBackgroundField({ name: 'sidebarCardBackground' }),
    { name: 'sidebarCardOutline', type: 'checkbox', defaultValue: true },
    {
      name: 'featuredImageRatio',
      type: 'select',
      defaultValue: 'wide',
      required: true,
      options: [
        { label: 'Wide (2:1)', value: 'wide' },
        { label: 'Video (16:9)', value: 'video' },
        { label: 'Standard (4:3)', value: 'standard' },
      ],
    },
  ],
}
```

Use the existing Breadcrumb field option values and regular block spacing values verbatim. Keep the
Banner-only field condition scoped to `header.variant` sibling data.

- [ ] **Step 4: Register the global and retire the Byline in admin**

Import and append `NewsEventsDetailTemplate` after `PageSettings` in the Configuration globals list.
Set `authorName.admin.hidden = true`, update its description to note legacy retention, and remove
`authorName` from `listSearchableFields`.

- [ ] **Step 5: Add header-image media usage protection**

Add this source to `globalSources`:

```ts
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

{
  slug: 'news-events-detail-template',
  sourceLabel: 'News & Events Detail Template',
  resolve: (doc, mediaID) => {
    const references: MediaUsageReference[] = []
    const header = asRecord(doc.header)

    pushIfMatched({
      mediaID,
      reference: createGlobalReference({
        documentLabel: 'News & Events Detail Template',
        fieldPath: 'header.backgroundImage',
        slug: 'news-events-detail-template',
      }),
      references,
      value: header.backgroundImage as RelationshipValue,
    })

    return references
  },
}
```

Keep `asRecord` local to `mediaUsage.ts`; do not cast a nullable group and read it unsafely.

- [ ] **Step 6: Generate Payload types and rerun focused tests**

Run:

```bash
pnpm generate:types
pnpm exec vitest run tests/int/news-events-detail-template.int.spec.tsx tests/int/news-events-collection.int.spec.ts tests/int/media-governance.int.spec.ts tests/int/admin-information-architecture.int.spec.ts --config ./vitest.config.mts
```

Expected: PASS. Confirm `NewsEventsDetailTemplate` exists in `src/payload-types.ts` and contains no
freeform layout field.

---

### Task 2: Build the template normalizer and published loader

**Files:**

- Create: `src/lib/newsEventDetailTemplateShared.ts`
- Create: `src/lib/newsEventDetailTemplate.ts`
- Modify: `tests/int/news-events-detail-template.int.spec.tsx`

**Interfaces:**

- Produces: `ResolvedNewsEventDetailTemplate`.
- Produces: `DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE`.
- Produces: `normalizeNewsEventDetailTemplate(value: unknown): ResolvedNewsEventDetailTemplate`.
- Produces: `fetchNewsEventDetailTemplate(payload: Pick<Payload, 'findGlobal' | 'logger'>): Promise<ResolvedNewsEventDetailTemplate>` for deterministic tests.
- Produces: cached `getNewsEventDetailTemplate(): Promise<ResolvedNewsEventDetailTemplate>` for routes.

- [ ] **Step 1: Write failing normalization and loader tests**

Cover exact defaults and invalid-value recovery:

```ts
expect(normalizeNewsEventDetailTemplate(null)).toEqual(DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE)

expect(
  normalizeNewsEventDetailTemplate({
    article: { authorLabel: '  Office of the Director  ', featuredImageRatio: 'invalid' },
    breadcrumb: { separator: 'invalid', showHome: false },
    header: { title: '  Campus Updates  ', variant: 'invalid' },
  }),
).toMatchObject({
  article: { authorLabel: 'Office of the Director', featuredImageRatio: 'wide' },
  breadcrumb: { separator: 'chevron', showHome: false },
  header: { title: 'Campus Updates', variant: 'minimal' },
})
```

Mock `payload.findGlobal` and assert:

```ts
expect(payload.findGlobal).toHaveBeenCalledWith({
  slug: 'news-events-detail-template',
  depth: 1,
  draft: false,
  overrideAccess: true,
})
```

Also assert a rejected lookup returns the default rather than failing the detail page.

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/int/news-events-detail-template.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the shared normalizer and loader do not exist.

- [ ] **Step 3: Implement the client-safe resolved model**

Define explicit presentation types without importing Payload server modules:

```ts
export type FeaturedImageRatio = 'standard' | 'video' | 'wide'

export type ResolvedNewsEventDetailTemplate = {
  article: {
    appearance: BlockAppearance
    authorLabel: string
    featuredImageRatio: FeaturedImageRatio
    sidebarCardBackground: CardSurfaceValue
    sidebarCardOutline: boolean
    size: RegularBlockSize
  }
  breadcrumb: {
    appearance: BlockAppearance
    sectionPadding: 'compact' | 'default' | 'none'
    separator: BreadcrumbSeparator
    showCurrentPage: boolean
    showHome: boolean
    size: BreadcrumbSize
  }
  header: {
    appearance: BlockAppearance
    backgroundImage?: Media | number | string | null
    contentAlignment: BannerContentAlignment
    contentWidth: BannerContentWidth
    eyebrow?: string
    height: BannerHeight
    overlayCoverage: BannerOverlayCoverage
    overlayDirection: BannerOverlayDirection
    overlayStyle: BannerOverlayStyle
    size: RegularBlockSize
    subtitle?: string
    themeMode: BannerThemeMode
    title: string
    variant: 'banner' | 'minimal'
  }
}
```

Normalize every select against an explicit allowed-value set. Trim strings. Require a non-empty
header title and author label by falling back to defaults. Normalize appearance backgrounds through
`normalizeBlockBackground`; normalize borders against `none`, `top`, `bottom`, and `topAndBottom`,
falling back to `none`.

- [ ] **Step 4: Implement the server loader**

Use a testable fetch function plus cached production wrapper:

```ts
export async function fetchNewsEventDetailTemplate(
  payload: Pick<Payload, 'findGlobal' | 'logger'>,
): Promise<ResolvedNewsEventDetailTemplate> {
  try {
    const value = await payload.findGlobal({
      slug: 'news-events-detail-template',
      depth: 1,
      draft: false,
      overrideAccess: true,
    })

    return normalizeNewsEventDetailTemplate(value)
  } catch (error) {
    payload.logger.error({
      err: error,
      msg: 'Failed to load the News & Events detail template.',
    })
    return normalizeNewsEventDetailTemplate(null)
  }
}

const loadPayload = cache(async () => getPayload({ config: configPromise }))

const loadTemplate = async () => fetchNewsEventDetailTemplate(await loadPayload())

export const getNewsEventDetailTemplate = unstable_cache(
  loadTemplate,
  ['news-events-detail-template'],
  { tags: [CMS_CACHE_TAGS.globals] },
)
```

Use a logger stub in loader tests and assert rejected lookups log once before returning defaults.

- [ ] **Step 5: Run normalization and loader tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-detail-template.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS.

---

### Task 3: Implement the composed detail page and rich article presentation

**Files:**

- Create: `src/components/news-events/NewsEventDetailPage.tsx`
- Modify: `src/components/news-events/NewsEventStory.tsx`
- Modify: `tests/int/news-event-story.int.spec.tsx`
- Modify: `tests/int/news-events-detail-template.int.spec.tsx`

**Interfaces:**

- Consumes: `ResolvedNewsEventDetailTemplate` from Task 2.
- Consumes: `PublicNewsEventDetail`.
- Produces: `NewsEventDetailPage({ entry, template })` shared by production and preview.
- Produces: `NewsEventStory({ article, entry })` for the dynamic entry region.

- [ ] **Step 1: Expand failing static-render tests**

Assert document order and absence of overlays:

```ts
const markup = renderToStaticMarkup(
  <NewsEventDetailPage entry={entry} template={DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE} />,
)

expect(markup.indexOf('data-page-header-variant')).toBeLessThan(
  markup.indexOf('data-breadcrumb-block="true"'),
)
expect(markup.indexOf('data-breadcrumb-block="true"')).toBeLessThan(
  markup.indexOf('data-news-event-introduction="true"'),
)
expect(markup.indexOf('data-news-event-introduction="true"')).toBeLessThan(
  markup.indexOf('data-news-event-featured-image="true"'),
)
expect(markup).not.toContain('data-news-event-image-overlay')
expect(markup).toContain('Home')
expect(markup).toContain('News &amp; Events')
expect(markup).toContain('Campus story')
```

Assert layout and sidebar contracts:

```ts
expect(markup).toContain('lg:grid-cols-[minmax(0,1fr)_20rem]')
expect(markup).toContain('lg:sticky lg:top-28')
expect(markup).toContain('data-news-event-story-details="true"')
expect(markup).toContain('Management, SNMIH')
expect(markup).toContain('Story Details')
expect(markup).toContain('Share This')
```

Use an Event fixture to assert date range, location, and registration action. Use a non-Event fixture
to assert those optional rows are absent.

Create a Lexical fixture containing H2–H4, ordered/unordered/check lists, blockquote, horizontal rule,
link, inline code, alignment, indentation, and upload nodes. Assert the article wrapper exposes one
stable `data-news-event-rich-text="true"` contract and contains semantic prose variables, responsive
media/overflow classes, and focus-visible link styling.

- [ ] **Step 2: Run the story/template tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/news-event-story.int.spec.tsx tests/int/news-events-detail-template.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the shared composition and new layout are not implemented.

- [ ] **Step 3: Implement the outer detail-page composition**

Compose existing presentation components rather than duplicating them:

```tsx
export function NewsEventDetailPage({
  entry,
  template,
}: {
  entry: PublicNewsEventDetail
  template: ResolvedNewsEventDetailTemplate
}) {
  const breadcrumbs: ResolvedPageBreadcrumb[] = [
    { label: 'Home', url: '/' },
    { label: 'News & Events', url: '/news-events' },
    { label: entry.title },
  ]

  return (
    <>
      <PageHeaderBlockComponent {...template.header} topContent="eyebrow" />
      <BreadcrumbBlockComponent
        {...template.breadcrumb}
        automaticBreadcrumbs={breadcrumbs}
        breadcrumbMode="automatic"
      />
      <NewsEventStory article={template.article} entry={entry} />
    </>
  )
}
```

Do not pass entry title/excerpt into Page Header. Do not add a second eyebrow to `NewsEventStory`.

- [ ] **Step 4: Implement the entry introduction and featured image**

Within the article section and regular container:

```tsx
;<header className="flex max-w-5xl flex-col gap-4" data-news-event-introduction="true">
  <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
    {entry.title}
  </h1>
  <p className="text-base leading-7 text-current/70 sm:text-lg">{entry.excerpt}</p>
</header>

{
  entry.image ? (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius)] border border-border bg-muted',
        featuredImageRatioClasses[article.featuredImageRatio],
      )}
      data-news-event-featured-image="true"
    >
      <Image
        fill
        alt={entry.image.alt}
        className={cn('object-cover', newsEventObjectPositionClasses[entry.image.position])}
        sizes="(max-width: 1024px) 100vw, 90vw"
        src={entry.image.src}
      />
    </div>
  ) : null
}
```

Use these ratio classes:

```ts
const featuredImageRatioClasses = {
  wide: 'aspect-[2/1]',
  video: 'aspect-video',
  standard: 'aspect-[4/3]',
} as const
```

There must be no absolute copy container or media-overlay element in this image wrapper.

- [ ] **Step 5: Implement the article grid, semantic cards, and event metadata**

Use:

```tsx
<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
  <div className="min-w-0" data-news-event-rich-text="true">
    <RichText data={entry.body} />
  </div>
  <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-28">
    <StoryDetailsCard article={article} entry={entry} />
    <ShareCard entry={entry} />
  </aside>
</div>
```

Resolve the sidebar surface with `resolveCardSurface(article.sidebarCardBackground,
article.appearance?.background)`. Apply its class, secondary text, icon, divider, link, and button
contracts. Add `border` plus the resolved surface's `divider` class only when
`sidebarCardOutline` is true.

Story Details rows:

- Author — `article.authorLabel`.
- Date — `entry.dateLabel`; Events use the existing formatted start/end range.
- Category — primary category title when present, otherwise the classification label.
- Event location — only when present.
- Registration action — only when resolved for an Event.

Use semantic definition-list markup or clearly associated label/value groups. Empty values produce no
row.

- [ ] **Step 6: Add the complete Lexical article class contract**

Apply one readable, theme-aware wrapper:

```ts
export const newsEventArticleRichTextClasses = cn(
  'prose max-w-none text-current',
  '[--tw-prose-body:currentColor] [--tw-prose-headings:currentColor]',
  '[--tw-prose-links:var(--primary)] [--tw-prose-bold:currentColor]',
  '[--tw-prose-counters:color-mix(in_oklch,currentColor_70%,transparent)]',
  '[--tw-prose-bullets:var(--border)] [--tw-prose-hr:var(--border)]',
  '[--tw-prose-quotes:currentColor] [--tw-prose-quote-borders:var(--border)]',
  '[--tw-prose-code:currentColor] [--tw-prose-pre-code:var(--card-foreground)]',
  '[--tw-prose-pre-bg:var(--card)]',
  'prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-balance',
  'prose-h2:mt-12 prose-h2:text-3xl prose-h3:mt-10 prose-h3:text-2xl prose-h4:mt-8 prose-h4:text-xl',
  'prose-p:leading-8 prose-li:my-1.5 prose-li:leading-7',
  'prose-blockquote:rounded-r-[var(--radius)] prose-blockquote:bg-muted/60 prose-blockquote:py-2 prose-blockquote:pr-5',
  '[&_a]:break-words [&_a]:underline [&_a]:underline-offset-4',
  '[&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring',
  '[&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-[var(--radius)] [&_img]:border [&_img]:border-border',
  '[&_figure]:max-w-full [&_figcaption]:text-sm [&_figcaption]:text-current/65',
  '[&_pre]:max-w-full [&_pre]:overflow-x-auto [&_code]:break-words',
  '[&_ul]:pl-6 [&_ol]:pl-6 [&_[role=checkbox]]:accent-primary',
)
```

Adjust selectors to the actual HTML emitted by Payload's Lexical renderer, verified by the test
fixture. Do not add selectors for unsupported editor features.

- [ ] **Step 7: Run the story/template tests**

Run:

```bash
pnpm exec vitest run tests/int/news-event-story.int.spec.tsx tests/int/news-events-detail-template.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS.

---

### Task 4: Add accessible Share and Copy Link controls

**Files:**

- Create: `src/components/news-events/NewsEventShareActions.tsx`
- Create: `tests/int/news-event-share-actions.int.spec.tsx`
- Modify: `src/components/news-events/NewsEventStory.tsx`

**Interfaces:**

- Produces: `NewsEventShareActions({ title, url })`.
- Share uses `navigator.share` when available, otherwise the copy fallback.
- Copy uses `navigator.clipboard.writeText` and announces success/failure.

- [ ] **Step 1: Write failing interaction tests**

Test all branches:

```tsx
it('uses native sharing when available', async () => {
  const share = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'share', { configurable: true, value: share })

  render(<NewsEventShareActions title="Campus story" url="https://example.test/story" />)
  await userEvent.click(screen.getByRole('button', { name: 'Share' }))

  expect(share).toHaveBeenCalledWith({
    title: 'Campus story',
    url: 'https://example.test/story',
  })
})

it('copies when native sharing is unavailable', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })

  render(<NewsEventShareActions title="Campus story" url="https://example.test/story" />)
  await userEvent.click(screen.getByRole('button', { name: 'Share' }))

  expect(writeText).toHaveBeenCalledWith('https://example.test/story')
  expect(screen.getByRole('status')).toHaveTextContent('Link copied')
})
```

Also test Copy Link directly, native-share rejection without error noise, and Clipboard rejection
with an accessible `Unable to copy link` status.

- [ ] **Step 2: Run the share test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/int/news-event-share-actions.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the client component does not exist.

- [ ] **Step 3: Implement the client-only control**

Use the existing `Button` primitive and keep the live status visually compact:

```tsx
'use client'

export function NewsEventShareActions({ title, url }: { title: string; url: string }) {
  const [status, setStatus] = useState('')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setStatus('Link copied')
    } catch {
      setStatus('Unable to copy link')
    }
  }

  const share = async () => {
    if (!navigator.share) return copy()

    try {
      await navigator.share({ title, url })
      setStatus('Shared')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setStatus('Unable to share')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={share}>
          Share
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          Copy Link
        </Button>
      </div>
      <p aria-live="polite" className="min-h-5 text-xs text-current/65" role="status">
        {status}
      </p>
    </div>
  )
}
```

Pass an absolute URL constructed from the entry path with `toAbsoluteSiteUrl`; do not read
`window.location` during server rendering.

- [ ] **Step 4: Integrate the controls into Share This and rerun tests**

Run:

```bash
pnpm exec vitest run tests/int/news-event-share-actions.int.spec.tsx tests/int/news-event-story.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS.

---

### Task 5: Integrate production, live preview, and global author JSON-LD

**Files:**

- Modify: `src/app/(frontend)/news-events/[slug]/page.tsx`
- Modify: `src/components/live-preview/NewsEventLivePreview.tsx`
- Modify: `src/lib/newsEventsShared.ts`
- Modify: `src/lib/newsEventsMetadata.ts`
- Modify: `tests/int/news-events-metadata.int.spec.ts`
- Modify: `tests/int/news-events-metadata-routes.int.spec.ts`
- Modify: `tests/int/news-event-story.int.spec.tsx`
- Test: `tests/int/news-events-detail-template.int.spec.tsx`

**Interfaces:**

- Consumes: cached `getNewsEventDetailTemplate()` from Task 2.
- Consumes: shared `NewsEventDetailPage` from Task 3.
- Changes: `getNewsEventStructuredData(entry, authorLabel)`.
- Changes: `PublicNewsEventDetail` no longer exposes `authorName`.

- [ ] **Step 1: Write failing route/metadata/preview contracts**

Update metadata tests:

```ts
expect(getNewsEventStructuredData(detailFixture('default'), 'Management, SNMIH')).toMatchObject({
  '@type': 'NewsArticle',
  author: {
    '@type': 'Organization',
    name: 'Management, SNMIH',
  },
})
```

Assert Event JSON-LD remains `Event` without a NewsArticle author field. Extend
`news-events-metadata-routes.int.spec.ts` with hoisted mocks for `getNewsEventDetailTemplate` and
`NewsEventDetailPage`, import the default detail route, and add:

```ts
it('loads the shared detail template for a published entry', async () => {
  const entry = { href: '/news-events/example', title: 'Example' }
  const template = { article: { authorLabel: 'Management, SNMIH' } }
  mocks.getNewsEventBySlug.mockResolvedValue(entry)
  mocks.getNewsEventDetailTemplate.mockResolvedValue(template)

  const element = await NewsEventEntryPage({
    params: Promise.resolve({ slug: 'example' }),
    searchParams: Promise.resolve({}),
  })

  expect(mocks.getNewsEventDetailTemplate).toHaveBeenCalledTimes(1)
  expect(mocks.getNewsEventStructuredData).toHaveBeenCalledWith(entry, 'Management, SNMIH')
  expect(findElementByType(element, mocks.NewsEventDetailPage)?.props).toMatchObject({
    entry,
    template,
  })
})
```

Define `findElementByType` locally with `React.Children.toArray` recursion so the assertion locates
the mocked detail component inside the route fragment without depending on child indexes.

- [ ] **Step 2: Run focused integration tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/news-events-metadata.int.spec.ts tests/int/news-event-story.int.spec.tsx tests/int/news-events-detail-template.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because structured data and route composition still use the old contracts.

- [ ] **Step 3: Remove the legacy author from the public detail adapter**

Delete `authorName?: string` from `PublicNewsEventDetail` and remove this mapping from
`toPublicNewsEventDetail`:

```ts
authorName: entry.authorName?.trim() || undefined,
```

Do not delete the Payload collection field or stored database value.

- [ ] **Step 4: Update NewsArticle structured data**

Change the function signature and author branch:

```ts
export function getNewsEventStructuredData(entry: PublicNewsEventDetail, authorLabel: string) {
  if (entry.contentType === 'event') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      description: entry.excerpt,
      endDate: entry.eventEnd,
      image: entry.image?.src,
      location: entry.eventLocation ? { '@type': 'Place', name: entry.eventLocation } : undefined,
      name: entry.title,
      startDate: entry.eventStart,
      url: toAbsoluteSiteUrl(entry.href),
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    author: { '@type': 'Organization', name: authorLabel },
    dateModified: entry.updatedAt,
    datePublished: entry.publishedAt,
    description: entry.excerpt,
    headline: entry.title,
    image: entry.image?.src,
    mainEntityOfPage: toAbsoluteSiteUrl(entry.href),
    url: toAbsoluteSiteUrl(entry.href),
  }
}
```

- [ ] **Step 5: Load the template in production and preview**

In the public branch, load both resources in parallel:

```ts
const [entry, template] = await Promise.all([
  getNewsEventBySlug(slug, nowISO),
  getNewsEventDetailTemplate(),
])

if (!entry) notFound()

const structuredData = getNewsEventStructuredData(entry, template.article.authorLabel)
```

Render:

```tsx
<NewsEventDetailPage entry={entry} template={template} />
```

In preview, load the template on the server before returning the client boundary:

```tsx
<NewsEventLivePreview
  initialData={draftEntry}
  nowISO={nowISO}
  template={await getNewsEventDetailTemplate()}
/>
```

Update `NewsEventLivePreview` to render:

```tsx
<NewsEventDetailPage entry={toPublicNewsEventDetail(data, nowISO)} template={template} />
```

Keep authentication, `RefreshRouteOnSave`, draft depth, and route refresh behavior unchanged.

- [ ] **Step 6: Run all affected News & Events tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-detail-template.int.spec.tsx tests/int/news-event-share-actions.int.spec.tsx tests/int/news-event-story.int.spec.tsx tests/int/news-events-metadata.int.spec.ts tests/int/news-events-metadata-routes.int.spec.ts tests/int/news-events-data.int.spec.ts tests/int/news-events-collection.int.spec.ts tests/int/live-preview-import-boundary.int.spec.ts tests/int/media-governance.int.spec.ts --config ./vitest.config.mts
```

Expected: PASS.

---

### Task 6: Update maintained documentation and generated project knowledge

**Files:**

- Modify: `docs/guides/news-events.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Modify: `.agents/skills/project-context/references/payload-model.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json`
- Modify: `tests/int/project-context-lib.int.spec.ts`
- Modify: `src/payload-types.ts`

**Interfaces:**

- Documents the new global as the ninth registered global.
- Keeps historical files under `docs/superpowers/**` unchanged except this implementation plan and
  its approved design specification.

- [ ] **Step 1: Update documentation contracts before generated inventory**

Document these operator facts in `docs/guides/news-events.md`:

- Entries own editorial content; the global owns detail presentation.
- How to configure fixed header, breadcrumb, author, article appearance, featured-image ratio, and
  sidebar card surface.
- Sidebar is always right on desktop and stacks after content on small screens.
- Legacy Byline is no longer editable or public.
- The feature image never contains an overlay.

Update `feature-inventory.md` and project-context references to register the ninth global and the
production/preview data flow. Do not rewrite historical plans to reflect the final product state.

- [ ] **Step 2: Update source-derived test expectations**

Change the generated inventory expectation:

```ts
expect(inventory.payload.globals).toHaveLength(9)
expect(inventory.payload.globals).toContainEqual(
  expect.objectContaining({ slug: 'news-events-detail-template' }),
)
```

Update admin-information-architecture and starter-productization assertions only where the new
explicit global changes their current registered list.

- [ ] **Step 3: Regenerate Payload types and project inventory**

Run:

```bash
pnpm generate:types
pnpm project-context:update
```

If the sandbox blocks `.agents` writes, rerun only `pnpm project-context:update` with the required
workspace approval. Do not hand-edit the generated inventory.

- [ ] **Step 4: Run documentation and project-context tests**

Run:

```bash
pnpm exec vitest run tests/int/admin-documentation.int.spec.ts tests/int/admin-information-architecture.int.spec.ts tests/int/project-context-lib.int.spec.ts tests/int/project-context-repository.int.spec.ts tests/int/starter-productization.int.spec.ts --config ./vitest.config.mts
pnpm project-context:check
```

Expected: PASS. A stale knowledge-graph commit warning is non-blocking when project-context reports
that the deterministic inventory is current.

---

### Task 7: Final regression and safety audit

**Files:**

- Review all files listed above.
- Do not change unrelated dirty-worktree files.

**Interfaces:**

- Confirms the schema, production route, preview route, presentation, client interaction, metadata,
  media governance, generated types, and maintained docs agree.

- [ ] **Step 1: Format only touched TypeScript/TSX files**

Run `pnpm exec prettier --write` with an explicit list of touched TypeScript and TSX paths. Do not
format whole Markdown files or the whole repository because the worktree contains unrelated changes.

- [ ] **Step 2: Run TypeScript and lint**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: TypeScript PASS; lint has zero errors. Report existing unrelated warnings separately.

- [ ] **Step 3: Run the full integration suite**

Run:

```bash
pnpm test:int
```

If MongoMemoryServer is blocked from binding a local port, rerun only the affected Mongo suites with
the necessary local-process approval. Do not treat the known unrelated SNMIH precision assertion
(`0.013730` expected versus `0.01373` actual) as caused by this feature.

- [ ] **Step 4: Re-run the required project-context check**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `Project context is current.` A stale knowledge-graph warning may remain.

- [ ] **Step 5: Audit the final diff**

Run:

```bash
git diff --check
git diff --name-only
git diff -- src/globals/NewsEventsDetailTemplate.ts src/lib/newsEventDetailTemplateShared.ts src/lib/newsEventDetailTemplate.ts src/components/news-events src/components/live-preview/NewsEventLivePreview.tsx 'src/app/(frontend)/news-events/[slug]/page.tsx' src/collections/NewsEvents.ts src/lib/newsEventsShared.ts src/lib/newsEventsMetadata.ts src/lib/mediaUsage.ts src/payload.config.ts src/payload-types.ts tests/int docs/guides/news-events.md docs/architecture/feature-inventory.md .agents/skills/project-context/references
```

Confirm:

- No `NewsGrid` or `NewsEventsTabs` implementation file changed.
- No content overlay exists in the featured-image wrapper.
- No dynamic entry eyebrow exists.
- The sidebar is right-only at desktop widths.
- The legacy Byline remains stored but hidden and publicly ignored.
- Generated types and inventory are current.
- No files were staged or committed by this implementation.

- [ ] **Step 6: Report the implementation outcome**

Report changed behavior, important files, test/type/lint/context results, any unrelated baseline
failure, and explicitly state that no staging or commit occurred.
