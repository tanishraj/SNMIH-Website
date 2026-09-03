# News & Event Classifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` task-by-task. Do not commit or stage changes; the user explicitly requested an uncommitted implementation.

**Goal:** Replace hardcoded News & Events classifications with centrally managed Payload records while preserving existing entries, tabs, URLs, Story/Event behavior, previews, and pagination.

**Architecture:** Add a public taxonomy-style `news-event-classifications` collection and relate each News & Events entry and Tabs block to those records. Keep hidden legacy fields for local compatibility and let editors update relationships manually. Public adapters carry a resolved classification and use its `behavior`, never its slug, to choose Story/Event behavior.

**Tech Stack:** Payload CMS 3, Next.js App Router, React, TypeScript, Vitest, pnpm.

## Global Constraints

- Each entry belongs to exactly one classification; Topics and Tags remain independent.
- All is always first and contains only classifications selected by that block.
- Central classification titles are tab labels; there are no per-block label overrides.
- `behavior: 'story' | 'event'` controls validation, ordering, cards, details, and JSON-LD.
- Existing `/news-events/[slug]` URLs and slugs do not change.
- Keep hidden legacy entry and block fields for one compatibility release.
- This is a local-only project: do not add a migration engine, CLI, or startup mutation.
- Do not commit or stage any files.

## File Structure

**Create:**

- `src/collections/NewsEventClassifications.ts` — collection schema.
- `src/hooks/resolveNewsEventClassification.ts` — relationship/legacy resolution and Event validation.
- `src/hooks/preventReferencedNewsEventClassificationDelete.ts` — entry/block deletion guard.
- `tests/int/news-event-classifications.int.spec.ts` — schema/resolver/guard tests.

**Modify:**

- `src/payload.config.ts`, `src/collections/NewsEvents.ts`, `src/lib/newsEventClassifications.ts`, `src/hooks/normalizeNewsEventFields.ts`.
- `src/lib/newsEvents.ts`, `src/lib/newsEventsShared.ts`, `src/lib/newsEventsMetadata.ts`.
- `src/blocks/NewsEventsTabs/config.ts`, `newsEventsTabsShared.ts`, `Component.tsx`, `Presentation.tsx`, `NewsEventsTabsClient.tsx`, and `PreviewComponent.tsx`.
- `src/app/api/news-events-tabs/route.ts`, preview snapshot helpers, badge/highlights/grid/detail/feed consumers.
- `src/hooks/revalidateCmsContent.ts`, focused tests, generated Payload artifacts, documentation, and project context.

---

### Task 1: Add the Central Classification Collection

**Files:**

- Create: `src/collections/NewsEventClassifications.ts`
- Create: `src/hooks/preventReferencedNewsEventClassificationDelete.ts`
- Modify: `src/lib/newsEventClassifications.ts`
- Modify: `src/payload.config.ts`
- Test: `tests/int/news-event-classifications.int.spec.ts`
- Modify: `tests/int/admin-information-architecture.int.spec.ts`
- Modify: `tests/int/project-slug-field.int.spec.ts`

**Interfaces:**

- Produces `NEWS_EVENT_CLASSIFICATION_DEFAULTS`, `NewsEventClassificationBehavior`, `ResolvedNewsEventClassification`, `normalizeNewsEventClassificationRecord(value)`, reference detection/change guards, and `NewsEventClassifications`.
- Tasks 2–5 consume those exact exports.

- [ ] **Step 1: Write failing schema and normalizer tests**

Assert the collection slug/group/title, public read, `manage_news_events` mutation access, project slug, and fields. Use this exact behavior fixture:

```ts
expect(findNamedField(NewsEventClassifications.fields, 'behavior')).toMatchObject({
  defaultValue: 'story',
  options: [
    { label: 'Story', value: 'story' },
    { label: 'Event', value: 'event' },
  ],
  required: true,
  type: 'select',
})

expect(
  normalizeNewsEventClassificationRecord({
    active: true,
    badgeLabel: 'Event',
    behavior: 'event',
    id: 'classification-1',
    slug: 'events',
    title: 'Events',
  }),
).toEqual({
  active: true,
  badgeLabel: 'Event',
  behavior: 'event',
  id: 'classification-1',
  slug: 'events',
  title: 'Events',
})
```

Mock delete-hook queries and prove referenced IDs throw status 409 while unused IDs pass.

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-event-classifications.int.spec.ts tests/int/admin-information-architecture.int.spec.ts tests/int/project-slug-field.int.spec.ts
```

Expected: FAIL because the collection and dynamic normalizer do not exist.

- [ ] **Step 3: Implement the shared model**

Retain the seven-value array as legacy data, rename its type to `LegacyNewsEventClassification`, and add:

```ts
export const NEWS_EVENT_CLASSIFICATION_DEFAULTS = [
  { badgeLabel: 'News', behavior: 'story', slug: 'news', title: 'News' },
  { badgeLabel: 'Event', behavior: 'event', slug: 'event', title: 'Events' },
  { badgeLabel: 'Notice', behavior: 'story', slug: 'notice', title: 'Notice' },
  { badgeLabel: 'Holiday', behavior: 'story', slug: 'holiday', title: 'Holiday' },
  { badgeLabel: 'Achievement', behavior: 'story', slug: 'achievement', title: 'Achievements' },
  { badgeLabel: 'Announcement', behavior: 'story', slug: 'announcement', title: 'Announcement' },
  { badgeLabel: 'Other', behavior: 'story', slug: 'other', title: 'Others' },
] as const

export type NewsEventClassificationBehavior = 'event' | 'story'
export type ResolvedNewsEventClassification = {
  active: boolean
  badgeLabel: string
  behavior: NewsEventClassificationBehavior
  id: string
  legacyValue?: LegacyNewsEventClassification
  slug: string
  title: string
}
```

Every seeded default also carries its matching immutable `legacyValue`; custom records leave it empty. The normalizer returns `null` for ID-only/unusable input, trims strings, falls back `badgeLabel` to `title`, normalizes unknown behavior to Story, and treats only `active === false` as archived.

- [ ] **Step 4: Implement and register the collection**

Use fields `title`, `projectSlugField({ useAsSlug: 'title' })`, `badgeLabel`, `behavior`, `description`, required `active` defaulting true, and hidden optional unique/indexed `legacyValue`. Put it in Content; allow anonymous reads plus authenticated `manage_news_events`, `manage_pages`, or `manage_page_settings` reads; keep create/update/delete behind `manage_news_events`; disable drafts; and register it immediately before `NewsEvents`.

Exclude `news-event-classifications` from the repository-wide Trash plugin so Admin delete cannot bypass `beforeDelete` through a `deletedAt` update. The reference detector must cover current and legacy local records: paginate current/draft News Events and recursively inspect both relationship IDs and legacy `contentType`; inspect Page and Reusable Section layouts for new relationship selections and legacy tab rows; and inspect the News & Events Detail Page global layout. If referenced, throw:

```ts
new APIError('Archive this classification before removing its references.', 409)
```

Add a `beforeChange` guard: normal create requests cannot set `legacyValue`. A non-empty original `legacyValue` is immutable, and `behavior` cannot change while any entry or block/global references the record. Extract one shared recursive reference detector for both guards and test current, legacy, global, and pagination cases.

- [ ] **Step 5: Rerun Step 2; expect PASS**

---

### Task 2: Relate Entries and Enforce Behavior

**Files:**

- Create: `src/hooks/resolveNewsEventClassification.ts`
- Modify: `src/collections/NewsEvents.ts`
- Modify: `src/hooks/normalizeNewsEventFields.ts`
- Modify: `src/lib/newsEventsShared.ts`
- Test: `tests/int/news-events-collection.int.spec.ts`
- Test: `tests/int/news-event-classifications.int.spec.ts`

**Interfaces:**

- Produces `resolveNewsEventClassification({ data, originalDoc, req })`, behavior-aware normalization, and public `classification`/`behavior` fields.

- [ ] **Step 1: Write failing relationship and validation tests**

Assert:

```ts
expect(findNamedField(NewsEvents.fields, 'classification')).toMatchObject({
  relationTo: 'news-event-classifications',
  required: true,
  type: 'relationship',
})
expect(findNamedField(NewsEvents.fields, 'contentType')).toMatchObject({
  admin: { hidden: true },
  type: 'select',
})
```

Mock Payload and prove: Event behavior requires start/location; Story clears event-only fields; ID-only relationships resolve; an existing unmigrated update can resolve its original legacy `event`; a new create without a relationship fails instead of silently defaulting to News; unknown legacy values fail; inactive classification selection is rejected on create/change; an unchanged archived relationship remains valid.

- [ ] **Step 2: Run tests and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-collection.int.spec.ts tests/int/news-event-classifications.int.spec.ts
```

- [ ] **Step 3: Add the relationship and hidden legacy field**

```ts
{
  name: 'classification',
  label: 'Entry Classification',
  type: 'relationship',
  relationTo: 'news-event-classifications',
  required: true,
  filterOptions: { active: { equals: true } },
  admin: {
    allowCreate: true,
    description: 'Controls the public badge, tab, date behavior, and detail metadata.',
  },
}
```

Keep the old select/options as optional, with no default and `admin.hidden: true`; replace it with `classification` in default columns. Remove every Event Details tab/field `admin.condition` and legacy field validator, keep the tab/fields visible, and explain they apply only to Event-behavior records.

- [ ] **Step 4: Implement request-aware resolution and validation**

In `beforeValidate`: resolve the submitted relationship ID through `findByID`; otherwise, only for an update whose `originalDoc` already stores resolvable legacy data, use the local compatibility mapping. Write the resolved ID to `data.classification`. Fail with an `APIError` if unresolved. Reject a newly chosen inactive record but allow the unchanged archived original relationship. Require valid start/location and ordered end for Event behavior; clear start/end/location/registration for Story behavior.

- [ ] **Step 5: Normalize public cards/details**

Add:

```ts
classification: ResolvedNewsEventClassification
behavior: NewsEventClassificationBehavior
/** @deprecated Remove with compatibility fields. */
contentType: string
```

Prefer populated relationship data and synthesize a default only for legacy input. Derive dates/event fields from `behavior`; expose classification slug as deprecated `contentType` during compatibility.

- [ ] **Step 6: Rerun Step 2; expect PASS**

---

### Task 3: Make the Tabs Block Relationship-Driven

**Files:**

- Modify: `src/blocks/NewsEventsTabs/config.ts`
- Modify: `src/blocks/NewsEventsTabs/newsEventsTabsShared.ts`
- Modify: `src/blocks/NewsEventsTabs/Component.tsx`
- Modify: `src/blocks/NewsEventsTabs/Presentation.tsx`
- Modify: `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`
- Modify: `src/blocks/NewsEventsTabs/PreviewComponent.tsx`
- Test: `tests/int/news-events-tabs.int.spec.tsx`

**Interfaces:**

- Produces `NewsEventsTabsResolvedTab { classification, label, value }`, where `value` is `all` or a classification ID.

- [ ] **Step 1: Write failing dynamic-tab tests**

Assert `classifications` is a has-many relationship with compatibility validation and old `tabs` is a hidden array without a default. Prove All is first, relationship titles are labels, saved order is preserved, duplicates/inactive/unusable values are dropped, and legacy rows are used only when relationships are empty. Prove an existing legacy-only block remains valid while a new empty block fails. Update client expectations so All pagination carries selected IDs.

- [ ] **Step 2: Run and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-tabs.int.spec.tsx
```

- [ ] **Step 3: Add the visible relationship and hide legacy rows**

```ts
{
  name: 'classifications',
  label: 'Classification Tabs',
  type: 'relationship',
  relationTo: 'news-event-classifications',
  hasMany: true,
  filterOptions: { active: { equals: true } },
  admin: {
    allowCreate: true,
    description: 'Select and drag classifications into visitor tab order. All is always first.',
    isSortable: true,
  },
}
```

Keep the old array/options/validation but remove its default and hide it so Payload preserves old documents. Add block validation requiring either a non-empty new relationship list or non-empty stored legacy rows during compatibility; defer strict `required: true` to the cleanup release.

- [ ] **Step 4: Resolve dynamic tabs**

```ts
export type NewsEventsTabsResolvedTab = {
  classification?: ResolvedNewsEventClassification
  label: string
  value: 'all' | string
}

export function resolveNewsEventsTabs(
  allTabLabel: string | null | undefined,
  classifications: unknown,
  legacyTabs?: NewsEventsTabsConfiguredTab[] | null,
): NewsEventsTabsResolvedTab[]
```

The server component resolves selected IDs, restores selected order, omits inactive/missing records, and passes records to the data loader. Preview uses serialized snapshots and never imports server-only loaders.

- [ ] **Step 5: Update client state and pagination**

Use `Record<string, PublicNewsEventPage>`. Keep independent page/error/loading state by ID. Build requests with:

```ts
const params = new URLSearchParams({
  classification: resolvedActiveTab,
  classifications: selectedIDs.join(','),
  limit: String(itemsPerTab),
  page: String(currentPage.page + 1),
})
```

Keep keyboard navigation, Load More retry/dedupe, tab variants, layouts, actions, and empty states unchanged.

- [ ] **Step 6: Rerun Step 2; expect PASS**

---

### Task 4: Query Dynamic Classifications and Secure Load More

**Files:**

- Modify: `src/lib/newsEvents.ts`
- Modify: `src/app/api/news-events-tabs/route.ts`
- Modify: `src/lib/newsEventsPreviewShared.ts`
- Modify: `src/lib/newsEventsPreviewSnapshot.ts`
- Test: `tests/int/news-events-data.int.spec.ts`
- Test: `tests/int/news-events-tabs-route.int.spec.ts`

**Interfaces:**

- Produces ordered active-classification loading, relationship-based group/page queries, and parsed public pagination scope.

- [ ] **Step 1: Write failing query/parser tests**

Use custom slugs (`campus-update` Story and `cme` Event). Assert queries use `{ classification: { equals: id } }`; Event adds current/upcoming filtering and `eventStart` sort; Story uses `-publishedAt`. Cover ordered All IDs, duplicates, empty/unknown/inactive IDs, over 50 IDs, invalid page/limit, and generic errors.

- [ ] **Step 2: Run and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-data.int.spec.ts tests/int/news-events-tabs-route.int.spec.ts
```

- [ ] **Step 3: Resolve selected active records**

Fetch requested IDs with `pagination: false`, `overrideAccess: true`, and `active: { equals: true }`; de-duplicate and restore requested order from a map.

- [ ] **Step 4: Generalize groups and pages**

```ts
export async function fetchNewsEventGroups(
  payload: Pick<NewsEventsPayload, 'find'>,
  options: {
    classifications: ResolvedNewsEventClassification[]
    limit: number
    nowISO: string
  },
): Promise<PublicNewsEventGroups>
```

Specific tabs query the relationship ID and choose sorting/filtering by behavior. All splits selected IDs into Story/Event streams, queries only those IDs, and keeps the existing interleaving. Preserve published/workflow filters, paging shape, allowed limits, and tie-breakers.

- [ ] **Step 5: Parse and validate the endpoint scope**

Return `{ classification: 'all' | string, classificationIDs: string[], limit, ok: true, page }`. All requires at least one ID. A specific ID must be included in the selected scope. Reject malformed, unknown, inactive, or over-50 input before entry queries; resolve behavior server-side.

- [ ] **Step 6: Update preview discovery**

Discover relationship IDs from Page layouts, retain legacy default-key discovery only for hidden old rows, and load exactly those groups. Key preview snapshots by a stable signature of ordered classification IDs plus item limit (or block ID), not count alone. Recurse through populated Reusable Sections with the established depth/cycle guard. Add equal-count/different-selection and nested-reusable tests. Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-data.int.spec.ts tests/int/news-events-tabs-route.int.spec.ts tests/int/news-events-tabs.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: PASS.

---

### Task 5: Update Every Visitor-Facing Classification Consumer

**Files:**

- Modify: `src/components/news-events/NewsEventClassificationBadge.tsx`
- Modify: `src/lib/newsEventsMetadata.ts`
- Modify: highlights, News Grid, carousel, search API/page, detail OpenGraph, feed, story, thumbnail fixtures, and route consumers found by the scan below.
- Test: classification metadata, metadata, carousel, highlights, News Grid, feed, and story suites.

**Interfaces:**

- Consumes Task 2's public `classification` and `behavior` fields.

- [ ] **Step 1: Write failing dynamic presentation tests**

Use:

```ts
const classification = {
  active: true,
  badgeLabel: 'CME',
  behavior: 'event' as const,
  id: 'cme-id',
  slug: 'continuing-medical-education',
  title: 'Continuing Medical Education',
}
```

Prove badges show `CME`; Event action/date/JSON-LD comes from behavior; Story custom slugs produce `NewsArticle`; OpenGraph/feed labels use resolved metadata.

- [ ] **Step 2: Run and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-metadata.int.spec.ts tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/news-grid.int.spec.tsx tests/int/news-events-feed-route.int.spec.ts tests/int/news-event-story.int.spec.tsx
```

- [ ] **Step 3: Update the badge and all behavior branches**

The badge accepts `Pick<ResolvedNewsEventClassification, 'badgeLabel' | 'slug'>`, renders the badge label, and uses slug only for its data attribute. Everywhere else use `entry.behavior === 'event'` for Event branches and `entry.classification.badgeLabel/title` for copy. Presentation code must not infer behavior from a slug or ID. Explicitly update Highlights and News Grid loaders to resolve all active classifications and query Story/Event ID sets, plus search and OpenGraph depth/select clauses so normalized adapters receive populated classification data.

- [ ] **Step 4: Verify tests and remove fixed runtime branches**

Run Step 2, then:

```bash
rg -n "contentType === 'event'|contentType !== 'event'|isEventClassification\(" src --glob '!src/lib/newsEventClassifications.ts' --glob '!src/hooks/resolveNewsEventClassification.ts'
```

Expected: tests PASS; scan returns no query/presentation branches outside compatibility code.

---

### Task 6: Generate, Revalidate, and Verify

**Files:**

- Modify: `src/hooks/revalidateCmsContent.ts`
- Modify: `src/collections/NewsEventClassifications.ts`
- Generate: `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js`
- Update: project-context files identified by its update command.

- [ ] **Step 1: Add classification cache tests and hook**

Assert and implement classification after-change/delete invalidation of:

```ts
revalidateTag(CMS_CACHE_TAGS.newsEvents, 'max')
revalidateTag(CMS_CACHE_TAGS.pages, 'max')
```

- [ ] **Step 2: Generate Payload artifacts**

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected: types contain the new collection, `NewsEvent.classification`, and `NewsEventsTabsBlock.classifications`.

- [ ] **Step 3: Run focused and cross-cutting tests**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-event-classifications.int.spec.ts tests/int/news-events-collection.int.spec.ts tests/int/news-events-data.int.spec.ts tests/int/news-events-tabs.int.spec.tsx tests/int/news-events-tabs-route.int.spec.ts tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-metadata.int.spec.ts tests/int/news-events-metadata-routes.int.spec.ts tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/news-grid.int.spec.tsx tests/int/news-events-feed-route.int.spec.ts tests/int/news-event-story.int.spec.tsx tests/int/news-events-detail-template.int.spec.tsx tests/int/search-hierarchical-routes.int.spec.ts tests/int/block-thumbnails.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/admin-information-architecture.int.spec.ts tests/int/project-slug-field.int.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Run static checks**

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/collections/NewsEventClassifications.ts src/collections/NewsEvents.ts src/hooks/resolveNewsEventClassification.ts src/hooks/preventReferencedNewsEventClassificationDelete.ts src/lib/newsEventClassifications.ts src/lib/newsEvents.ts src/lib/newsEventsShared.ts src/blocks/NewsEventsTabs src/app/api/news-events-tabs/route.ts
pnpm exec prettier --check src/collections/NewsEventClassifications.ts src/collections/NewsEvents.ts src/hooks/resolveNewsEventClassification.ts src/hooks/preventReferencedNewsEventClassificationDelete.ts src/lib/newsEventClassifications.ts src/lib/newsEvents.ts src/lib/newsEventsShared.ts src/blocks/NewsEventsTabs src/app/api/news-events-tabs/route.ts
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 5: Update/check project context**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: current, allowing only the repository's pre-existing stale knowledge-graph warning.

- [ ] **Step 6: Review the uncommitted worktree**

```bash
git status --short
git diff --stat
git diff --check
```

Expected: only intended source, test, generated, documentation, and project-context files changed; nothing staged and no commit created.
