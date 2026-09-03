# News & Events System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (§- [ ]§) syntax for tracking.

**Goal:** Build a governed News & Events collection, a live News & Events Highlights page block, a server-filtered archive at §/news-events§, and complete News/Event detail pages.

**Architecture:** One typed Payload collection owns News and Event records. Server-only query modules serialize narrow public view models for a route-owned Blog 37 archive, Blogpost 2-inspired detail view, and Blog 13-inspired Highlights presentation; authenticated Page Live Preview receives a server-created Highlights snapshot so Payload and Node-only modules never enter the client graph.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16.2.10 App Router, React 19.2.7 Server Components, TypeScript 5.7, Tailwind CSS 4, shadcn/ui, shadcnblocks, Lexical, Vitest, Playwright.

## Global Constraints

- Canonical collection slug: §news-events§; global slug: §news-events-settings§; block slug: §newsEventsHighlights§.
- Public routes are §/news-events§ and §/news-events/[slug]§.
- Only published entries are public.
- Past Events remain public in archive/detail routes but are excluded from Highlights.
- An Event remains current until §eventEnd ?? eventStart§ is in the past.
- Archive filtering and pagination are server-rendered and URL-backed; never serialize the complete collection to the browser.
- News & Events Feed and News & Event Story are route-owned and must not be registered as Page blocks.
- Reuse shared Categories, Tags, Media, workflow, SEO, Content Actions, Button, Appearance, spacing, and thumbnail infrastructure.
- Use semantic theme tokens and the normalized regular-block font scale; do not introduce raw light/dark colors.
- Keep all Payload and Node-only imports outside client-reachable modules.
- Retain stable mobile image aspect ratios and explicit width constraints for iPhone Safari and Chrome.
- Keep every implementation change unstaged and uncommitted unless the user explicitly requests otherwise.

---

## File Structure

### New files

- §src/collections/NewsEvents.ts§ — collection schema, access, workflow, validation, preview URL, and hooks.
- §src/hooks/normalizeNewsEventFields.ts§ — clears Event-only fields when an entry becomes News.
- §src/globals/NewsEventsSettings.ts§ — archive content, appearance, pagination, and SEO settings.
- §src/lib/newsEventsShared.ts§ — client-safe DTOs, constants, date formatting, object-position mapping, pagination parsing, and interleaving.
- §src/lib/newsEvents.ts§ — server-only Payload queries and public serialization.
- §src/lib/newsEventsMetadata.ts§ — archive/detail metadata and JSON-LD builders.
- §src/lib/newsEventsPreviewShared.ts§ — client-safe Page Live Preview snapshot contract.
- §src/lib/newsEventsPreviewSnapshot.ts§ — server-only snapshot loader.
- §src/blocks/NewsEventsHighlights/config.ts§ — Payload block schema.
- §src/blocks/NewsEventsHighlights/Component.tsx§ — normal server-backed block adapter.
- §src/blocks/NewsEventsHighlights/Presentation.tsx§ — client-safe presentation adapter.
- §src/blocks/NewsEventsHighlights/PreviewComponent.tsx§ — snapshot-backed live-preview adapter.
- §src/components/news-events/NewsEventsHighlights.tsx§ — Blog 13-inspired card grid.
- §src/components/news-events/NewsEventsFeed.tsx§ — Blog 37-inspired archive presentation.
- §src/components/news-events/NewsEventStory.tsx§ — Blogpost 2-inspired detail presentation.
- §src/components/live-preview/NewsEventLivePreview.tsx§ — authenticated unsaved entry preview.
- §src/app/(frontend)/news-events/page.tsx§ — archive route.
- §src/app/(frontend)/news-events/[slug]/page.tsx§ — public/detail and authenticated preview route.
- §tests/int/news-events-collection.int.spec.ts§ — schema, validation, capabilities, global, and registration.
- §tests/int/news-events-data.int.spec.ts§ — serializers, query filters, sorting, pagination, and Highlights mixing.
- §tests/int/news-events-highlights.int.spec.tsx§ — block schema and presentation.
- §tests/int/news-events-preview.int.spec.tsx§ — snapshot loading, preview rendering, and import boundary.
- §tests/int/news-events-routes.int.spec.tsx§ — archive/detail rendering, metadata, JSON-LD, and URL parsing.

### Modified files

- §src/access/adminCapabilities.ts§ and §src/access/editorialRoles.ts§ — management/publishing capabilities and role defaults.
- §src/collections/Categories.ts§ and §src/collections/Tags.ts§ — News & Events access and admin descriptions.
- §src/collections/Pages.ts§ — register Highlights only.
- §src/payload.config.ts§ — register collection and global.
- §src/blocks/renderPageBlocks.tsx§ and §src/blocks/renderLivePreviewPageBlocks.tsx§ — normal and preview rendering.
- §src/app/(frontend)/preview/page/[id]/page.tsx§, §src/components/live-preview/PageLivePreview.tsx§ — pass the News & Events snapshot.
- §src/lib/mediaUsage.ts§ — featured/OG media references.
- §src/app/sitemap.ts§ — archive and published detail URLs.
- §src/block-thumbnails/definitions.ts§ and §src/block-thumbnails/fixtures.tsx§ — selectable block thumbnail.
- §tests/int/adminCapabilities.int.spec.ts§, §tests/int/page-blocks.int.spec.ts§, §tests/int/live-preview-import-boundary.int.spec.ts§, §tests/int/sitemap.int.spec.ts§, §tests/int/media-governance.int.spec.ts§, §tests/int/block-thumbnails.int.spec.ts§ — extend existing contracts.
- §src/payload-types.ts§ and §src/app/(payload)/admin/importMap.js§ — generated output.
- §public/block-thumbnails/news-events-highlights.jpg§ — deterministic 1600×900 thumbnail.

### Registry files

- Keep new §src/components/ui/badge.tsx§ and §src/components/ui/pagination.tsx§ if the registry adds them.
- Remove the unadapted generated §src/components/blog37.tsx§ after its structure has been transferred to the canonical archive component.
- Do not overwrite the project's customized Button, Card, or Separator primitives.

---

### Task 1: Capture the Blog 37 Registry Baseline

**Files:**
- Create if missing: §src/components/ui/badge.tsx§
- Create if missing: §src/components/ui/pagination.tsx§
- Temporary: §src/components/blog37.tsx§

**Interfaces:**
- Consumes: existing shadcn configuration in §components.json§.
- Produces: Badge and Pagination primitives plus a local Blog 37 reference for Task 7.

- [ ] **Step 1: Inspect the registry payload without writing files**

Run:

§§§bash
pnpm dlx shadcn@latest view @shadcnblocks/blog37
pnpm dlx shadcn@latest view pagination
§§§

Expected: Blog 37 reports a filtered row archive and the Pagination registry item reports its component dependencies.

- [ ] **Step 2: Add the requested registry block and pagination primitive**

Run:

§§§bash
pnpm dlx shadcn@latest add @shadcnblocks/blog37 pagination -y
git status --short
§§§

Expected: the generated Blog 37 reference and any missing primitives appear. Existing customized UI files may appear modified and must be reviewed before proceeding.

- [ ] **Step 3: Preserve customized shared primitives**

Run:

§§§bash
git diff -- src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/separator.tsx
§§§

Expected: no changes to existing customized primitives. If the CLI changed one, restore only that generated overwrite with an §apply_patch§ edit using the pre-command diff; retain Badge and Pagination.

- [ ] **Step 4: Verify the registry baseline compiles cleanly**

Run:

§§§bash
pnpm exec eslint src/components/blog37.tsx src/components/ui/badge.tsx src/components/ui/pagination.tsx
§§§

Expected: PASS.

- [ ] **Step 5: Review checkpoint**

Run §git diff --check§. Leave all files unstaged.

---

### Task 2: Add News & Events Capabilities and Collection

**Files:**
- Create: §src/collections/NewsEvents.ts§
- Create: §src/hooks/normalizeNewsEventFields.ts§
- Modify: §src/access/adminCapabilities.ts§
- Modify: §src/access/editorialRoles.ts§
- Modify: §src/collections/Categories.ts§
- Modify: §src/collections/Tags.ts§
- Modify: §src/payload.config.ts§
- Modify generated: §src/payload-types.ts§
- Test: §tests/int/news-events-collection.int.spec.ts§
- Test: §tests/int/adminCapabilities.int.spec.ts§

**Interfaces:**
- Produces collection slug §news-events§ and generated §NewsEvent§ type.
- Produces capabilities §manage_news_events§ and §publish_news_events§.
- Produces §normalizeNewsEventFields§ as a Payload before-change hook.

- [ ] **Step 1: Write the failing collection contract**

Create §tests/int/news-events-collection.int.spec.ts§ with:

§§§ts
import { describe, expect, it } from 'vitest'

import { NewsEvents } from '@/collections/NewsEvents'
import { normalizeNewsEventFields } from '@/hooks/normalizeNewsEventFields'

const getTabs = () => {
  const tabs = NewsEvents.fields.find((field) => field.type === 'tabs')
  return tabs?.type === 'tabs' ? tabs.tabs : []
}

describe('News & Events collection', () => {
  it('defines the canonical typed editorial schema', () => {
    expect(NewsEvents.slug).toBe('news-events')
    expect(NewsEvents.labels).toEqual({
      plural: 'News & Events',
      singular: 'News & Event Entry',
    })
    expect(NewsEvents.admin?.defaultColumns).toEqual([
      'title',
      'contentType',
      'workflowState',
      'eventStart',
      'updatedAt',
    ])

    const schema = JSON.stringify(getTabs())
    for (const name of [
      'contentType',
      'primaryCategory',
      'categories',
      'tags',
      'excerpt',
      'featuredImage',
      'featuredImagePosition',
      'authorName',
      'body',
      'eventStart',
      'eventEnd',
      'eventLocation',
      'eventRegistrationAction',
      'metaTitle',
      'workflowState',
    ]) {
      expect(schema).toContain('"name":"' + name + '"')
    }
  })

  it('clears stale Event fields when an entry becomes News', async () => {
    const result = await normalizeNewsEventFields({
      data: {
        contentType: 'news',
        eventEnd: '2026-08-02T12:00:00.000Z',
        eventLocation: 'Campus Hall',
        eventRegistrationAction: [{ label: 'Register' }],
        eventStart: '2026-08-02T10:00:00.000Z',
      },
    } as never)

    expect(result).toMatchObject({
      contentType: 'news',
      eventEnd: null,
      eventLocation: null,
      eventRegistrationAction: [],
      eventStart: null,
    })
  })

  it('limits callers without management capability to published workflow entries', async () => {
    const read = NewsEvents.access?.read
    expect(typeof read).toBe('function')
    const result = await (typeof read === 'function'
      ? read({ req: { user: null } } as never)
      : read)
    expect(result).toEqual({
      and: [
        { _status: { equals: 'published' } },
        { workflowState: { equals: 'published' } },
      ],
    })
  })
})
§§§

Extend §tests/int/adminCapabilities.int.spec.ts§ to expect both new values in all-capability lists and role maps.

- [ ] **Step 2: Run the tests to verify they fail**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-collection.int.spec.ts tests/int/adminCapabilities.int.spec.ts
§§§

Expected: FAIL because the collection, hook, and capability values do not exist.

- [ ] **Step 3: Implement the normalization hook**

Create §src/hooks/normalizeNewsEventFields.ts§:

§§§ts
import type { CollectionBeforeChangeHook } from 'payload'

export const normalizeNewsEventFields: CollectionBeforeChangeHook = async ({ data }) => {
  if (!data || data.contentType !== 'news') {
    return data
  }

  data.eventStart = null
  data.eventEnd = null
  data.eventLocation = null
  data.eventRegistrationAction = []

  return data
}
§§§

- [ ] **Step 4: Add capabilities and role defaults**

In §src/access/adminCapabilities.ts§:

- add §{ label: 'News & Events', value: 'manage_news_events' }§ beside Articles and Reviews;
- add §{ label: 'Publish News & Events', value: 'publish_news_events' }§ in Publishing;
- add §canPublishNewsEvents(user)§ using §hasAdminCapability(user, 'publish_news_events')§;
- add this constrained public-read helper:

§§§ts
export const allowPublishedReadOrCapability =
  (capability: AdminCapability | AdminCapability[]): Access =>
  ({ req }) => {
    const user = req.user as AdminUserLike | null | undefined
    const allowed = toCapabilitiesArray(capability).some((currentCapability) =>
      hasAdminCapability(user, currentCapability),
    )

    return allowed
      ? true
      : {
          and: [
            { _status: { equals: 'published' } },
            { workflowState: { equals: 'published' } },
          ],
        }
  }
§§§

In §src/access/editorialRoles.ts§ add both values to §allCapabilityValues§, §withCapabilities§, Content Manager defaults, and Site Manager defaults. This mirrors existing Article management/publishing behavior.

- [ ] **Step 5: Implement the collection**

Create §src/collections/NewsEvents.ts§ by composing the existing Article workflow pattern with these exact decisions:

§§§ts
export const NewsEvents: CollectionConfig = {
  slug: 'news-events',
  labels: { plural: 'News & Events', singular: 'News & Event Entry' },
  admin: {
    group: 'Website Content',
    hidden: hideFromUsersWithoutCapability('manage_news_events'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'contentType', 'workflowState', 'eventStart', 'updatedAt'],
    listSearchableFields: ['title', 'slug', 'authorName', 'eventLocation'],
    description: 'Published news stories and scheduled events for the public website.',
    livePreview: {
      breakpoints: [...previewBreakpoints],
      url: ({ data }) => {
        if (typeof data?.slug !== 'string' || !data.slug.trim()) return null
        const appURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
        return appURL + '/news-events/' + data.slug + '?preview=true'
      },
    },
  },
  access: {
    create: requireCapability('manage_news_events'),
    delete: requireCapability('manage_news_events'),
    read: allowPublishedReadOrCapability('manage_news_events'),
    readVersions: requireCapability('manage_news_events'),
    update: requireCapability('manage_news_events'),
  },
  versions: { drafts: true },
  timestamps: true,
  hooks: {
    beforeChange: [
      normalizeNewsEventFields,
      syncPrimaryCategoryMembership,
      validateSEOContract(),
      enforceEditorialWorkflow('publish_news_events', 'news-events'),
    ],
    afterChange: [
      createWorkflowQueueHook({
        sourceAdminPathPrefix: '/admin/collections/news-events',
        sourceCollection: 'news-events',
        states: [
          {
            queueType: 'approval',
            reasonCode: 'news-event-review-required',
            summary: (_doc, title) => title + ' is awaiting editorial approval.',
            workflowState: 'in_review',
          },
          {
            priority: () => 'high',
            queueType: 'approval',
            reasonCode: 'news-event-scheduled-publication',
            summary: (_doc, title) => title + ' is scheduled and requires publication oversight.',
            workflowState: 'scheduled',
          },
        ],
        titleField: 'title',
      }),
      createCollectionAuditHook({
        entityType: 'news_event',
        getSummary: ({ doc, previousDoc }) =>
          'Workflow moved from ' +
          (previousDoc?.workflowState ?? 'draft') +
          ' to ' +
          doc.workflowState +
          '.',
        titleField: 'title',
      }),
    ],
  },
  fields: collectionFields,
}
§§§

Define §collectionFields§ with title and generated slug before these tabs:

- Content: §contentType§, excerpt, optional author, and required Lexical body;
- Classification: primary category, supporting categories, and tags;
- Event Details: start, optional end, location, and registration action, all using §admin.condition: (data) => data?.contentType === 'event'§;
- Presentation: required featured image and required image position defaulting to Center;
- field validators that require start/location for Events and reject §eventEnd < eventStart§;
- SEO tab from §buildSEOFields()§;
- Workflow tab copied from Articles with the same visibility rules and publication metadata.

Use §createContentActionsField({ includeDisplayMode: true, label: 'Registration Action', maxRows: 1, name: 'eventRegistrationAction' })§ for the optional registration control.

- [ ] **Step 6: Extend taxonomy access and registration**

In Categories and Tags:

- include §manage_news_events§ and §publish_news_events§ in read capability arrays;
- update descriptions to mention News & Events.

Import and add §NewsEvents§ to the Website Content section of §src/payload.config.ts§.

- [ ] **Step 7: Generate types and run focused tests**

Run:

§§§bash
pnpm generate:types
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-collection.int.spec.ts tests/int/adminCapabilities.int.spec.ts tests/int/taxonomy.int.spec.ts
§§§

Expected: PASS and §src/payload-types.ts§ contains §export interface NewsEvent§.

- [ ] **Step 8: Review checkpoint**

Run §git diff --check§ and §git status --short§. Leave all changes unstaged.

---

### Task 3: Add the News & Events Settings Global

**Files:**
- Create: §src/globals/NewsEventsSettings.ts§
- Modify: §src/payload.config.ts§
- Modify generated: §src/payload-types.ts§
- Test: §tests/int/news-events-collection.int.spec.ts§

**Interfaces:**
- Produces global slug §news-events-settings§ and generated §NewsEventsSetting§ type.
- Consumes §manage_news_events§ and shared Appearance/SEO field factories.

- [ ] **Step 1: Add the failing global assertions**

Append:

§§§ts
import { NewsEventsSettings } from '@/globals/NewsEventsSettings'

it('organizes archive settings into Content, Layout & Theme, and SEO tabs', () => {
  expect(NewsEventsSettings.slug).toBe('news-events-settings')
  expect(NewsEventsSettings.label).toBe('News & Events Settings')

  const tabs = NewsEventsSettings.fields.find((field) => field.type === 'tabs')
  expect(tabs?.type === 'tabs' ? tabs.tabs.map((tab) => tab.label) : []).toEqual([
    'Content',
    'Layout & Theme',
    'SEO',
  ])

  const schema = JSON.stringify(tabs)
  for (const name of [
    'eyebrow',
    'title',
    'description',
    'allLabel',
    'newsLabel',
    'eventsLabel',
    'upcomingEventsLabel',
    'pastEventsLabel',
    'readMoreLabel',
    'emptyStateTitle',
    'emptyStateDescription',
    'entriesPerPage',
    'appearance',
    'size',
    'metaTitle',
  ]) {
    expect(schema).toContain('"name":"' + name + '"')
  }
})
§§§

- [ ] **Step 2: Verify the assertion fails**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-collection.int.spec.ts
§§§

Expected: FAIL because the global does not exist.

- [ ] **Step 3: Implement and register the global**

Create §src/globals/NewsEventsSettings.ts§ with:

§§§ts
export const NewsEventsSettings: GlobalConfig = {
  slug: 'news-events-settings',
  label: 'News & Events Settings',
  admin: {
    group: 'Site Settings',
    hidden: hideFromUsersWithoutCapability('manage_news_events'),
  },
  access: {
    read: allowPublicReadOrCapability('manage_news_events'),
    readVersions: requireCapability('manage_news_events'),
    update: requireCapability('manage_news_events'),
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [
      createGlobalAuditHook({
        entityType: 'news_events_settings',
        title: 'News & Events Settings',
        getSummary: () => 'News & Events archive settings were updated.',
      }),
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'title', type: 'text', defaultValue: 'News & Events', required: true },
            { name: 'description', type: 'textarea' },
            { name: 'allLabel', type: 'text', defaultValue: 'All', required: true },
            { name: 'newsLabel', type: 'text', defaultValue: 'News', required: true },
            { name: 'eventsLabel', type: 'text', defaultValue: 'Events', required: true },
            {
              name: 'upcomingEventsLabel',
              type: 'text',
              defaultValue: 'Upcoming Events',
              required: true,
            },
            {
              name: 'pastEventsLabel',
              type: 'text',
              defaultValue: 'Past Events',
              required: true,
            },
            { name: 'readMoreLabel', type: 'text', defaultValue: 'Read More', required: true },
            {
              name: 'emptyStateTitle',
              type: 'text',
              defaultValue: 'No entries found',
              required: true,
            },
            { name: 'emptyStateDescription', type: 'textarea' },
            {
              name: 'entriesPerPage',
              type: 'number',
              defaultValue: 9,
              min: 3,
              max: 24,
              required: true,
              validate: validateEntriesPerPage,
            },
          ],
        },
        {
          label: 'Layout & Theme',
          fields: [
            createBlockAppearanceFields({ includeTextOverride: false }),
            sizeField,
          ],
        },
        { label: 'SEO', fields: [...buildSEOFields()] },
      ],
    },
  ],
}
§§§

§validateEntriesPerPage§ accepts whole numbers from 3 through 24. §sizeField§ uses Compact, Default, Comfortable with Default selected.

Register the global in §payload.config.ts§ after Page Settings.

- [ ] **Step 4: Generate types and verify**

Run:

§§§bash
pnpm generate:types
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-collection.int.spec.ts
§§§

Expected: PASS and generated types contain §NewsEventsSetting§.

- [ ] **Step 5: Review checkpoint**

Run §git diff --check§. Leave all changes unstaged.

---

### Task 4: Build Client-Safe DTOs and Server Queries

**Files:**
- Create: §src/lib/newsEventsShared.ts§
- Create: §src/lib/newsEvents.ts§
- Test: §tests/int/news-events-data.int.spec.ts§

**Interfaces:**
- Produces §PublicNewsEventCard§, §PublicNewsEventDetail§, §PublicNewsEventsPage§, §NewsEventsArchiveQuery§.
- Produces §normalizeHighlightsItemCount§, §parseNewsEventsSearchParams§, §interleaveNewsEvents§, §toPublicNewsEventCard§.
- Produces server functions §getNewsEventsHighlights§, §getNewsEventsArchivePage§, §getUpcomingEventsPage§, §getPastEventsPage§, §getNewsEventBySlug§, §getNewsEventsSettings§, and §getNewsEventCategories§.

- [ ] **Step 1: Write failing shared-behavior tests**

Create tests for:

§§§ts
expect(normalizeHighlightsItemCount(undefined)).toBe(3)
expect(normalizeHighlightsItemCount(0)).toBe(1)
expect(normalizeHighlightsItemCount(9)).toBe(6)

expect(
  parseNewsEventsSearchParams({
    category: 'campus',
    page: '2',
    type: 'news',
  }),
).toEqual({
  category: 'campus',
  page: 2,
  pastPage: 1,
  type: 'news',
  upcomingPage: 1,
})

expect(
  interleaveNewsEvents(
    [{ id: 'news-1' }, { id: 'news-2' }] as PublicNewsEventCard[],
    [{ id: 'event-1' }] as PublicNewsEventCard[],
    3,
  ).map(({ id }) => id),
).toEqual(['news-1', 'event-1', 'news-2'])
§§§

Add server-query tests with a mocked §find§ method that assert:

- News where clause includes §contentType=news§, §_status=published§, and §workflowState=published§;
- current/upcoming Event where clause includes §eventEnd >= now§ or missing end plus §eventStart >= now§;
- past Event where clause is the inverse effective-end boundary;
- sort values are §-publishedAt§, §eventStart§, and §-eventStart§;
- selected fields exclude workflow notes and private relationships;
- item mixing deduplicates and backfills.

- [ ] **Step 2: Run the tests to verify they fail**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-data.int.spec.ts
§§§

Expected: FAIL because the shared and server query modules do not exist.

- [ ] **Step 3: Implement the client-safe contracts**

Create §src/lib/newsEventsShared.ts§ with these exported shapes:

§§§ts
export const NEWS_EVENTS_DEFAULT_PAGE_SIZE = 9
export const NEWS_EVENTS_MAX_PAGE_SIZE = 24
export const NEWS_EVENTS_DEFAULT_HIGHLIGHT_COUNT = 3
export const NEWS_EVENTS_MAX_HIGHLIGHT_COUNT = 6

export type NewsEventContentType = 'event' | 'news'
export type NewsEventImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'

export type PublicNewsEventImage = {
  alt: string
  height?: number
  position: NewsEventImagePosition
  src: string
  width?: number
}

export type PublicNewsEventCard = {
  category?: { id: number | string; slug: string; title: string }
  contentType: NewsEventContentType
  dateISO: string
  dateLabel: string
  excerpt: string
  href: string
  id: string
  image?: PublicNewsEventImage
  isPastEvent: boolean
  slug: string
  title: string
}

export type PublicNewsEventsPage = {
  docs: PublicNewsEventCard[]
  hasNextPage: boolean
  hasPrevPage: boolean
  page: number
  totalPages: number
}

export type NewsEventsArchiveQuery = {
  category?: string
  page: number
  pastPage: number
  type: 'all' | NewsEventContentType
  upcomingPage: number
}
§§§

Also export:

- deterministic UTC §Intl.DateTimeFormat§ instances for cards and event detail;
- §newsEventObjectPositionClasses§ mapping Center/Top/Bottom/Left/Right to Tailwind classes;
- positive-integer parsing that falls back to page 1;
- category-slug normalization that allows lowercase letters, numbers, and hyphens only;
- §interleaveNewsEvents§ using a Set of IDs and News-first alternation.

- [ ] **Step 4: Implement server-only queries**

Start §src/lib/newsEvents.ts§ with:

§§§ts
import 'server-only'

import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { cache } from 'react'
§§§

Define §NewsEventsPayload = Pick<Payload, 'find' | 'findGlobal' | 'logger'>§ and pure fetch functions that accept it for tests.

Use these effective-end filters:

§§§ts
const currentOrUpcomingEventWhere = (nowISO: string) => ({
  or: [
    { eventEnd: { greater_than_equal: nowISO } },
    {
      and: [
        {
          or: [
            { eventEnd: { exists: false } },
            { eventEnd: { equals: null } },
          ],
        },
        { eventStart: { greater_than_equal: nowISO } },
      ],
    },
  ],
})

const pastEventWhere = (nowISO: string) => ({
  or: [
    { eventEnd: { less_than: nowISO } },
    {
      and: [
        {
          or: [
            { eventEnd: { exists: false } },
            { eventEnd: { equals: null } },
          ],
        },
        { eventStart: { less_than: nowISO } },
      ],
    },
  ],
})
§§§

Every public collection query includes:

§§§ts
{ _status: { equals: 'published' } }
{ workflowState: { equals: 'published' } }
§§§

Use §overrideAccess: true§ only inside these explicitly public, filtered serializers. Use §select§ for card queries and §depth: 1§ for media/taxonomy. Detail lookup uses §depth: 2§ and returns §null§ when missing.

Log and rethrow server failures from cached public wrappers. Components decide whether to render stable empty fallbacks.

- [ ] **Step 5: Verify query behavior**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-data.int.spec.ts
§§§

Expected: PASS.

- [ ] **Step 6: Verify the server boundary**

Run:

§§§bash
rg -n "payload|@payload-config|getPayload" src/lib/newsEventsShared.ts
head -n 1 src/lib/newsEvents.ts
§§§

Expected: no output for the shared file and §import 'server-only'§ for the server file.

- [ ] **Step 7: Review checkpoint**

Run §git diff --check§. Leave all changes unstaged.

---

### Task 5: Implement and Register News & Events Highlights

**Files:**
- Create: §src/blocks/NewsEventsHighlights/config.ts§
- Create: §src/blocks/NewsEventsHighlights/Component.tsx§
- Create: §src/blocks/NewsEventsHighlights/Presentation.tsx§
- Create: §src/components/news-events/NewsEventsHighlights.tsx§
- Modify: §src/block-thumbnails/definitions.ts§
- Modify: §src/block-thumbnails/fixtures.tsx§
- Modify: §src/collections/Pages.ts§
- Modify: §src/blocks/renderPageBlocks.tsx§
- Modify generated: §src/payload-types.ts§
- Create generated: §public/block-thumbnails/news-events-highlights.jpg§
- Test: §tests/int/news-events-highlights.int.spec.tsx§
- Test: §tests/int/page-blocks.int.spec.ts§
- Test: §tests/int/block-thumbnails.int.spec.ts§
- Test: §tests/int/block-thumbnail-fixtures.int.spec.ts§

**Interfaces:**
- Produces §NewsEventsHighlightsBlock§ config and §NewsEventsHighlightsBlockComponent§.
- Presentation consumes §PublicNewsEventCard[]§ and never queries Payload.

- [ ] **Step 1: Write failing schema and render tests**

Assert:

§§§tsx
expect(NewsEventsHighlightsBlock.slug).toBe('newsEventsHighlights')
expect(NewsEventsHighlightsBlock.interfaceName).toBe('NewsEventsHighlightsBlock')
expect(tabs.map((tab) => tab.label)).toEqual(['Content', 'Layout & Theme'])
expect(itemCountField).toMatchObject({ defaultValue: 3, max: 6, min: 1, required: true })
expect(actionsField.maxRows).toBe(1)
expect(actionModeField.defaultValue).toBe('link')
§§§

Render §NewsEventsHighlightsBlockPresentation§ with three cards and expect:

- §data-news-events-highlights="true"§;
- eyebrow/title/description;
- News and Event labels;
- three detail hrefs;
- configured Read More label;
- semantic theme classes;
- no raw §dark:§ class.

Update the expected Pages block order by inserting §newsEventsHighlights§ after §contentHighlights§.
Update the thumbnail tests to expect:

§§§ts
expect(getBlockThumbnailDefinition('newsEventsHighlights')).toMatchObject({
  filename: 'news-events-highlights.jpg',
  label: 'News & Events Highlights',
  slug: 'newsEventsHighlights',
  stageAlignment: 'top',
})
§§§

- [ ] **Step 2: Verify tests fail**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-highlights.int.spec.tsx tests/int/page-blocks.int.spec.ts
§§§

Expected: FAIL because the block is not implemented or registered.

- [ ] **Step 3: Implement the block config**

First add the canonical thumbnail definition so §getBlockThumbnailAdmin§ is type-safe:

§§§ts
defineThumbnail({
  alt: 'News & Events Highlights block preview',
  filename: 'news-events-highlights.jpg',
  label: 'News & Events Highlights',
  slug: 'newsEventsHighlights',
  stageAlignment: 'top',
})
§§§

Use:

§§§ts
export const NewsEventsHighlightsBlock: Block = {
  slug: 'newsEventsHighlights',
  interfaceName: 'NewsEventsHighlightsBlock',
  admin: getBlockThumbnailAdmin('newsEventsHighlights'),
  labels: {
    singular: 'News & Events Highlights',
    plural: 'News & Events Highlights',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Action', maxRows: 1 }),
            itemCountField,
            { name: 'emptyStateMessage', type: 'text' },
          ],
        },
        {
          label: 'Layout & Theme',
          fields: [
            createBlockAppearanceFields({ includeTextOverride: false }),
            createContentActionModeField(),
            sizeField,
          ],
        },
      ],
    },
  ],
}
§§§

§itemCountField§ validates integer 1–6. §sizeField§ uses the shared three-size vocabulary.

- [ ] **Step 4: Implement the Blog 13-inspired presentation**

§NewsEventsHighlights.tsx§ accepts:

§§§ts
type NewsEventsHighlightsProps = {
  actions?: ReactNode
  appearance?: BlockAppearance | null
  description?: string
  emptyStateMessage?: string
  eyebrow?: string
  items: PublicNewsEventCard[]
  readMoreLabel?: string
  size?: RegularBlockSize
  title: string
}
§§§

Use:

- §regularBlockMobilePaddingClasses[size]§ and §regularBlockContainerClasses§;
- §resolveBlockAppearanceClasses§;
- intro classes matching Content Highlights;
- §grid gap-6 md:grid-cols-2 lg:grid-cols-3§;
- image wrapper §aspect-[4/3] overflow-hidden rounded-md border border-border§;
- image §h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]§ plus mapped object position;
- metadata as deterministic §time§ plus Badge;
- card title §text-lg leading-tight font-semibold sm:text-xl§;
- excerpt §text-sm leading-6 text-current/70§;
- §ContentLink§ for Read More.

No Client Component directive is needed.

- [ ] **Step 5: Implement adapters**

§Presentation.tsx§ trims CMS copy, resolves one shared action with §resolveCmsActions§ and §ContentActions§, and passes supplied items to the visual component.

§Component.tsx§ is async, normalizes item count, calls §getNewsEventsHighlights§, catches query failure to an empty array, and invokes Presentation. It must be the only Highlights block file that imports §@/lib/newsEvents§.

- [ ] **Step 6: Register, add the deterministic fixture, and generate types**

Add the block to Pages and §renderPageBlocks.tsx§. Run:

Add a §blockThumbnailFixtures.newsEventsHighlights§ entry using
§NewsEventsHighlightsBlockPresentation§ with three static §PublicNewsEventCard§ values and
repository-local SVG assets. The fixture must never import the server-backed Component.

Generate the thumbnail and types:

§§§bash
pnpm generate:types
BLOCK_THUMBNAIL_SLUG=newsEventsHighlights pnpm generate:block-thumbnails
§§§

Expected: §public/block-thumbnails/news-events-highlights.jpg§ is a 1600×900 JPEG.

- [ ] **Step 7: Run block and thumbnail tests**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-highlights.int.spec.tsx tests/int/page-blocks.int.spec.ts
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
§§§

Expected: PASS.

- [ ] **Step 8: Review checkpoint**

Run §git diff --check§. Leave all changes unstaged.

---

### Task 6: Add Snapshot-Backed Page Live Preview

**Files:**
- Create: §src/lib/newsEventsPreviewShared.ts§
- Create: §src/lib/newsEventsPreviewSnapshot.ts§
- Create: §src/blocks/NewsEventsHighlights/PreviewComponent.tsx§
- Modify: §src/app/(frontend)/preview/page/[id]/page.tsx§
- Modify: §src/components/live-preview/PageLivePreview.tsx§
- Modify: §src/blocks/renderLivePreviewPageBlocks.tsx§
- Modify: §tests/int/live-preview-import-boundary.int.spec.ts§
- Test: §tests/int/news-events-preview.int.spec.tsx§

**Interfaces:**
- Produces §NewsEventsPreviewSnapshot = { highlightsByCount: Record<string, PublicNewsEventCard[]> }§.
- Produces §loadNewsEventsPreviewSnapshot(layout)§.
- Preview renderer consumes both existing Review and new News & Events snapshots.

- [ ] **Step 1: Write failing snapshot tests**

Assert that layouts with counts 3, 3, and 9 request only normalized counts 3 and 6; layouts without Highlights do not query; one failed query returns an empty array for only that count.

Use:

§§§ts
expect(getNewsEventsPreviewRequirements(layout)).toEqual({ itemCounts: [3, 6] })
expect(snapshot).toEqual({
  highlightsByCount: {
    '3': cardsFor(3),
    '6': cardsFor(6),
  },
})
§§§

Extend import-boundary assertions to reject:

- §src/lib/newsEvents.ts§;
- §src/lib/newsEventsPreviewSnapshot.ts§;
- §src/blocks/NewsEventsHighlights/Component.tsx§.

- [ ] **Step 2: Verify failures**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-preview.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
§§§

Expected: FAIL because snapshot modules and preview adapter do not exist.

- [ ] **Step 3: Implement shared requirements**

§newsEventsPreviewShared.ts§ must import only client-safe types and §Page§ as a type:

§§§ts
export type NewsEventsPreviewSnapshot = {
  highlightsByCount: Record<string, PublicNewsEventCard[]>
}

export const EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT: NewsEventsPreviewSnapshot = {
  highlightsByCount: {},
}

export function getNewsEventsPreviewRequirements(
  layout?: Page['layout'] | null,
): { itemCounts: number[] } {
  const counts = new Set<number>()
  for (const block of layout ?? []) {
    if (block.blockType === 'newsEventsHighlights') {
      counts.add(normalizeHighlightsItemCount(block.itemCount))
    }
  }
  return { itemCounts: [...counts].sort((left, right) => left - right) }
}
§§§

- [ ] **Step 4: Implement the server loader and preview adapter**

§newsEventsPreviewSnapshot.ts§ starts with §import 'server-only'§ and loads each unique count in parallel through §getNewsEventsHighlights§.

§PreviewComponent.tsx§ normalizes the block count and passes:

§§§tsx
items={snapshot.highlightsByCount[String(resolvedCount)] ?? []}
§§§

to §NewsEventsHighlightsBlockPresentation§.

- [ ] **Step 5: Thread the snapshot through Page Live Preview**

In the authenticated preview route, load Review and News snapshots with §Promise.all§.

Update:

§§§tsx
type Props = {
  initialData: Page
  newsEventsSnapshot: NewsEventsPreviewSnapshot
  reviewSnapshot: ReviewPreviewSnapshot
}
§§§

Pass both snapshots into §renderLivePreviewPageBlocks§. Add the §newsEventsHighlights§ switch case using the Preview component.

- [ ] **Step 6: Run preview tests**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-preview.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
§§§

Expected: PASS and the client graph cannot reach Payload config or News/Event server modules.

- [ ] **Step 7: Review checkpoint**

Run §git diff --check§. Leave all changes unstaged.

---

### Task 7: Implement the Server-Rendered Blog 37 Archive

**Files:**
- Create: §src/components/news-events/NewsEventsFeed.tsx§
- Create: §src/app/(frontend)/news-events/page.tsx§
- Create: §src/lib/newsEventsMetadata.ts§
- Delete: §src/components/blog37.tsx§
- Test: §tests/int/news-events-routes.int.spec.tsx§

**Interfaces:**
- §NewsEventsFeed§ consumes settings, categories, one All/News page or two Event pages, and normalized query state.
- §getNewsEventsArchiveMetadata§ produces route metadata.

- [ ] **Step 1: Add failing archive assertions**

Begin §tests/int/news-events-routes.int.spec.tsx§ with the registry-adaptation contract:

§§§tsx
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('News & Events registry adaptation', () => {
  it('keeps the required shadcn primitives and removes the demo identity', () => {
    expect(existsSync('src/components/ui/badge.tsx')).toBe(true)
    expect(existsSync('src/components/ui/pagination.tsx')).toBe(true)
    expect(existsSync('src/components/blog37.tsx')).toBe(false)

    const source = readFileSync('src/components/news-events/NewsEventsFeed.tsx', 'utf8')
    expect(source).toContain("from '@/components/ui/badge'")
    expect(source).toContain("from '@/components/ui/pagination'")
  })
})
§§§

Render the feed with:

- active News filter;
- one category;
- one published card;
- page 2 of 3.

Assert:

§§§tsx
expect(html).toContain('data-news-events-feed="true"')
expect(html).toContain('aria-current="page"')
expect(html).toContain('type=news')
expect(html).toContain('category=campus')
expect(html).toContain('/news-events/example-story')
expect(html).not.toContain('overflow-x-auto')
§§§

Add an Event case that contains separate Upcoming and Past headings and preserves §upcomingPage§/§pastPage§ independently.

- [ ] **Step 2: Verify the archive tests fail**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-routes.int.spec.tsx
§§§

Expected: FAIL because the canonical feed and route do not exist.

- [ ] **Step 3: Implement the canonical Blog 37 adaptation**

Create §NewsEventsFeed.tsx§ with this prop contract:

§§§ts
export type NewsEventsFeedProps = {
  appearance?: BlockAppearance | null
  categories: Array<{ slug: string; title: string }>
  description?: string
  emptyStateDescription?: string
  emptyStateTitle: string
  eyebrow?: string
  labels: {
    all: string
    events: string
    news: string
    pastEvents: string
    readMore: string
    upcomingEvents: string
  }
  page?: PublicNewsEventsPage
  pastEventsPage?: PublicNewsEventsPage
  query: NewsEventsArchiveQuery
  size: RegularBlockSize
  title: string
  upcomingEventsPage?: PublicNewsEventsPage
}
§§§

Preserve Blog 37's filter/sidebar and horizontal-row character while using:

- semantic shadcn Badge, Button, Card, Separator, Pagination;
- real Next §Link§ controls that build query strings;
- §aria-current="page"§ for active type/category/page;
- §grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]§;
- row §grid min-w-0 gap-5 sm:grid-cols-[12rem_minmax(0,1fr)]§;
- mobile image §aspect-[16/10] w-full§;
- §min-w-0§ and §overflow-hidden§ at every image/text boundary;
- no client state and no §'use client'§.

When §query.type === 'event'§, render Upcoming and Past as two sections with their own Pagination links. Otherwise render §page§.

- [ ] **Step 4: Implement archive metadata**

In §newsEventsMetadata.ts§:

- start with §import 'server-only'§;
- build archive title/description/canonical/robots/Open Graph/Twitter values from News & Events Settings with SEO Settings fallbacks;
- canonicalize filtered/paginated variants to §/news-events§ unless the project's SEO policy explicitly indexes filters;
- export §buildNewsEventJsonLd§ for Task 8.

- [ ] **Step 5: Implement the route**

§src/app/(frontend)/news-events/page.tsx§:

§§§tsx
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return getNewsEventsArchiveMetadata()
}

export default async function NewsEventsArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = parseNewsEventsSearchParams(await searchParams)
  const settings = await getNewsEventsSettings()
  const pageSize = normalizeNewsEventsPageSize(settings.entriesPerPage)
  const now = new Date()

  const [categories, archiveData] = await Promise.all([
    getNewsEventCategories(),
    query.type === 'event'
      ? Promise.all([
          getUpcomingEventsPage(query, pageSize, now),
          getPastEventsPage(query, pageSize, now),
        ])
      : getNewsEventsArchivePage(query, pageSize),
  ])

  return renderNewsEventsFeed({ archiveData, categories, query, settings })
}
§§§

Keep §renderNewsEventsFeed§ local and explicit so the Event tuple and regular page cannot be confused.

- [ ] **Step 6: Remove the generated demo and run tests**

Delete §src/components/blog37.tsx§ with §apply_patch§ after the canonical feed is complete.

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-routes.int.spec.tsx
§§§

Expected: PASS, including the registry-adaptation assertion from Task 1.

- [ ] **Step 7: Review checkpoint**

Run §git diff --check§. Leave all changes unstaged.

---

### Task 8: Implement News/Event Detail, Preview, Metadata, and JSON-LD

**Files:**
- Create: §src/components/news-events/NewsEventStory.tsx§
- Create: §src/components/live-preview/NewsEventLivePreview.tsx§
- Create: §src/app/(frontend)/news-events/[slug]/page.tsx§
- Modify: §src/lib/newsEvents.ts§
- Modify: §src/lib/newsEventsMetadata.ts§
- Test: §tests/int/news-events-routes.int.spec.tsx§

**Interfaces:**
- §NewsEventStory§ consumes §PublicNewsEventDetail§.
- §NewsEventLivePreview§ consumes initial §NewsEvent§ and renders client-safe presentation.
- Detail route supports normal published reads and authenticated §?preview=true§.

- [ ] **Step 1: Add failing News and Event detail tests**

Render a News detail and assert title, author, publication time, image, rich text, categories, and tags.

Render an Event detail and assert start/end, location, optional registration action, and a visible Past Event label when effective end precedes the supplied server time.

Add JSON-LD assertions:

§§§ts
expect(buildNewsEventJsonLd(newsDetail)['@type']).toBe('NewsArticle')
expect(buildNewsEventJsonLd(eventDetail)).toMatchObject({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: eventDetail.title,
  startDate: eventDetail.eventStart,
})
§§§

- [ ] **Step 2: Verify detail tests fail**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-routes.int.spec.tsx
§§§

Expected: FAIL because story presentation and detail metadata are incomplete.

- [ ] **Step 3: Extend the detail DTO**

Add to §newsEventsShared.ts§:

§§§ts
export type PublicNewsEventDetail = PublicNewsEventCard & {
  authorName?: string
  body: NewsEvent['body']
  categories: Array<{ id: number | string; slug: string; title: string }>
  eventEnd?: string
  eventLocation?: string
  eventRegistrationAction?: ResolvedCmsAction
  eventRegistrationMode?: 'button' | 'link'
  eventStart?: string
  publishedAt?: string
  tags: Array<{ id: number | string; slug: string; title: string }>
  updatedAt: string
}
§§§

Use only type imports from generated types and client-safe action types. Export a pure §toPublicNewsEventDetail§ serializer that both server data and live preview can call.

- [ ] **Step 4: Implement the Blogpost 2-inspired story**

§NewsEventStory.tsx§ renders:

- back link to §/news-events§;
- content-type/category metadata;
- one §h1§ with editorial title sizing;
- deterministic §time§ elements;
- excerpt;
- featured image with §rounded-md border border-border§ and stable aspect ratio;
- Event information panel when appropriate;
- shared registration Content Link or Button according to saved mode;
- Lexical §RichText§ body inside the project's prose classes;
- categories/tags as semantic links back to filtered archive URLs.

Do not add related entries.

- [ ] **Step 5: Implement authenticated live preview**

§NewsEventLivePreview.tsx§ receives the server's stable preview timestamp:

§§§tsx
'use client'

export function NewsEventLivePreview({
  initialData,
  nowISO,
}: {
  initialData: NewsEvent
  nowISO: string
}) {
  const { data } = useLivePreview<NewsEvent>({
    depth: 2,
    initialData,
    serverURL,
  })

  return <NewsEventStory entry={toPublicNewsEventDetail(data, nowISO)} />
}
§§§

The route creates §nowISO§ once on the server and passes it to the Client Component. The
client-safe serializer must not call §Date.now()§, §new Date()§ without an input, or
locale-dependent formatting from the browser; it preserves ISO values and uses deterministic UTC
formatters only.

- [ ] **Step 6: Implement route behavior**

The detail route:

- normal mode calls §getNewsEventBySlug§ and §notFound()§ for missing/unpublished entries;
- preview mode authenticates request headers exactly like Page preview, then queries §draft: true§ by slug;
- unauthenticated preview mode returns §notFound()§;
- authenticated preview mode renders §NewsEventLivePreview§ with a server-created §nowISO§;
- §generateMetadata§ uses published detail metadata and returns empty metadata for missing entries;
- render JSON-LD with §JSON.stringify(data).replace(/</g, '\\u003c')§.

- [ ] **Step 7: Run focused tests**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-data.int.spec.ts tests/int/news-events-routes.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
§§§

Expected: PASS with no client reachability to §newsEvents.ts§, Payload config, Sharp, or Node built-ins.

- [ ] **Step 8: Review checkpoint**

Run §git diff --check§. Leave all changes unstaged.

---

### Task 9: Complete SEO, Sitemap, Taxonomy, Media Governance, and Operations

**Files:**
- Modify: §src/app/sitemap.ts§
- Modify: §src/lib/mediaUsage.ts§
- Modify: §tests/int/sitemap.int.spec.ts§
- Modify: §tests/int/media-governance.int.spec.ts§
- Modify: §tests/int/editorial-workflow.int.spec.ts§
- Modify: §tests/int/work-queue.int.spec.ts§
- Modify: §tests/int/operational-audit.int.spec.ts§

**Interfaces:**
- Sitemap includes archive plus published/indexable entries.
- Media governance recognizes featured and OG images.
- Existing workflow/queue/audit tests recognize §news-events§.

- [ ] **Step 1: Extend failing governance tests**

Add mocked News/Event documents:

§§§ts
{
  id: 30,
  includeInSitemap: 'default',
  robotsMode: 'index',
  slug: 'campus-open-day',
  updatedAt: '2026-07-20T00:00:00.000Z',
}
§§§

Expect:

§§§ts
expect(urls).toContain('http://localhost:3000/news-events')
expect(urls).toContain('http://localhost:3000/news-events/campus-open-day')
§§§

Add a no-index entry and assert exclusion. Add Media usage expectations for §featuredImage§ and §ogImage§ with source label News & Events.

- [ ] **Step 2: Verify failures**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/sitemap.int.spec.ts tests/int/media-governance.int.spec.ts tests/int/editorial-workflow.int.spec.ts tests/int/work-queue.int.spec.ts tests/int/operational-audit.int.spec.ts
§§§

Expected: FAIL on missing News & Events integration.

- [ ] **Step 3: Extend sitemap**

In §sitemap.ts§:

- query published §news-events§ alongside Articles and Reviews;
- add §/news-events§ once using the settings global update time when available;
- add each eligible §/news-events/[slug]§;
- keep past published Events eligible;
- apply existing robots/sitemap inclusion logic;
- include News/Event category IDs in taxonomy usage only if a public category archive URL is actually emitted. Since this design uses query-filtered archive URLs rather than separate taxonomy routes, do not add duplicate category sitemap URLs.

- [ ] **Step 4: Extend media usage**

Add §'news-events': 'News & Events'§ to source labels and a collection source that reports:

- §featuredImage§;
- §ogImage§.

Use document fallback §Untitled News & Event Entry§.

- [ ] **Step 5: Verify workflow, queue, and audit contracts**

Extend existing tests to assert:

- §enforceEditorialWorkflow('publish_news_events', 'news-events')§ is present;
- in-review and scheduled states create News/Event queue conditions;
- audit entity type is §news_event§;
- global settings audit entity type is §news_events_settings§.

- [ ] **Step 6: Run governance tests**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/sitemap.int.spec.ts tests/int/media-governance.int.spec.ts tests/int/editorial-workflow.int.spec.ts tests/int/work-queue.int.spec.ts tests/int/operational-audit.int.spec.ts
§§§

Expected: PASS.

- [ ] **Step 7: Review checkpoint**

Run §git diff --check§. Leave all changes unstaged.

---

### Task 10: Add Route-Level E2E Coverage

**Files:**
- Modify: §tests/e2e/frontend.e2e.spec.ts§
- Modify: §tests/helpers/seedHomepage.ts§

**Interfaces:**
- Verifies archive filtering, responsive rows, detail navigation, and Event metadata against a running app.

- [ ] **Step 1: Add deterministic seed entries**

Seed:

- one published News entry;
- one published future Event;
- one published past Event;
- one draft News entry;
- News & Events Settings with a small page size.

Use §2035-08-15T10:00:00.000Z§ for the future Event and §2020-08-15T10:00:00.000Z§
for the past Event. Do not use §Math.random()§ in rendered content.

- [ ] **Step 2: Add archive/detail E2E scenarios**

Add tests that:

1. open §/news-events§ and see published entries but not the draft;
2. select News and verify §type=news§ in the URL;
3. select Events and see separate Upcoming/Past headings;
4. follow Read More and verify exactly one §h1§;
5. verify an Event detail shows date and location;
6. set a 390×844 viewport and assert §document.documentElement.scrollWidth === window.innerWidth§.

- [ ] **Step 3: Run the focused browser tests**

Run:

§§§bash
pnpm run test:e2e -- --grep "News & Events"
§§§

Expected: PASS in Chromium with no horizontal overflow.

- [ ] **Step 4: Review checkpoint**

Run §git diff --check§. Leave all changes unstaged.

---

### Task 11: Final Generation and Verification

**Files:**
- Modify generated: §src/payload-types.ts§
- Modify generated: §src/app/(payload)/admin/importMap.js§
- All News & Events implementation files.

**Interfaces:**
- Produces a buildable, lint-clean, type-safe, fully registered feature.

- [ ] **Step 1: Regenerate Payload outputs**

Run:

§§§bash
pnpm generate:types
pnpm generate:importmap
§§§

Expected: generated types include NewsEvents collection/global/block contracts and the admin import map is current.

- [ ] **Step 2: Format changed source and tests**

Run Prettier only on changed text files:

§§§bash
pnpm exec prettier --write \
  src/access/adminCapabilities.ts \
  src/access/editorialRoles.ts \
  src/app/'(frontend)'/news-events \
  src/app/'(frontend)'/preview/page/'[id]'/page.tsx \
  src/app/sitemap.ts \
  src/block-thumbnails \
  src/blocks/NewsEventsHighlights \
  src/blocks/renderLivePreviewPageBlocks.tsx \
  src/blocks/renderPageBlocks.tsx \
  src/collections/Categories.ts \
  src/collections/NewsEvents.ts \
  src/collections/Pages.ts \
  src/collections/Tags.ts \
  src/components/live-preview \
  src/components/news-events \
  src/globals/NewsEventsSettings.ts \
  src/hooks/normalizeNewsEventFields.ts \
  src/lib/newsEvents.ts \
  src/lib/newsEventsMetadata.ts \
  src/lib/newsEventsPreviewShared.ts \
  src/lib/newsEventsPreviewSnapshot.ts \
  src/lib/newsEventsShared.ts \
  src/lib/mediaUsage.ts \
  src/payload.config.ts \
  tests/int/news-events-collection.int.spec.ts \
  tests/int/news-events-data.int.spec.ts \
  tests/int/news-events-highlights.int.spec.tsx \
  tests/int/news-events-preview.int.spec.tsx \
  tests/int/news-events-routes.int.spec.tsx
§§§

Expected: files format successfully.

- [ ] **Step 3: Run focused integration tests**

Run:

§§§bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-events-collection.int.spec.ts \
  tests/int/news-events-data.int.spec.ts \
  tests/int/news-events-highlights.int.spec.tsx \
  tests/int/news-events-preview.int.spec.tsx \
  tests/int/news-events-routes.int.spec.tsx \
  tests/int/adminCapabilities.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/live-preview-import-boundary.int.spec.ts \
  tests/int/live-preview-renderer.int.spec.tsx \
  tests/int/sitemap.int.spec.ts \
  tests/int/media-governance.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts
§§§

Expected: PASS.

- [ ] **Step 4: Run repository validation**

Run:

§§§bash
pnpm run lint
pnpm run build
git diff --check
§§§

Expected: lint and production build pass; no whitespace errors; the build has no §child_process§, hydration mismatch, or client/server import error.

- [ ] **Step 5: Inspect final scope**

Run:

§§§bash
git status --short
git diff --stat
git diff -- src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/separator.tsx
§§§

Expected:

- only News & Events feature files, required generated outputs, the approved design/spec plan, and missing shadcn primitives are changed;
- no unadapted §blog37§ component remains;
- customized Button/Card/Separator files are unchanged;
- all changes remain unstaged.

---

## Completion Criteria

- Editors can create, preview, review, schedule, and publish typed News/Event entries.
- Event validation and effective-end behavior are correct.
- Highlights alternates live News and current/upcoming Events, backfills shortages, and excludes past Events.
- Page Live Preview displays a serializable server snapshot without importing Payload into the client graph.
- §/news-events§ filters and paginates on the server and matches the Blog 37 structure.
- Event archive pagination keeps Upcoming and Past sections independently ordered.
- §/news-events/[slug]§ renders complete News or Event content, metadata, and structured data.
- Archive/detail SEO and sitemap behavior exclude drafts/no-index entries while retaining published past Events.
- Theme, font, actions, borders, radius, spacing, media, and mobile behavior match existing blocks.
- The selectable block has a deterministic real-render thumbnail.
- Focused tests, lint, production build, and diff checks pass.
- Nothing is staged or committed.
