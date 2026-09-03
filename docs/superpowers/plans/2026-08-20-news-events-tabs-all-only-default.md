# News & Events Tabs All-Only Default Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the News & Events Tabs block's legacy hard-coded tab fallback so an empty classification selection renders only All while All still loads every active classification.

**Architecture:** The block schema and shared tab resolver become relationship-only. Production, pagination, and live-preview loaders interpret an empty classification scope as “all active classifications” for All data, without turning those classifications into named tabs. A non-empty selection retains its saved order and scopes All to only those selected records.

**Tech Stack:** Payload CMS 3, Next.js App Router, React, TypeScript, Vitest.

## Global Constraints

- “All” is always the first visible tab.
- No selected classifications means only “All” is visible.
- In All-only mode, All loads published entries from every active classification.
- A non-empty selection renders All plus the selected active classifications in saved order.
- Remove only the Tabs block's legacy rows and hard-coded tab fallback; retain entry-level `contentType` compatibility.
- Do not add a migration engine, CLI, startup mutation, dependency, or new endpoint.
- Do not stage or commit any files.

---

### Task 1: Remove the block-level legacy schema and resolver

**Files:**

- Modify: `src/blocks/NewsEventsTabs/config.ts`
- Modify: `src/blocks/NewsEventsTabs/newsEventsTabsShared.ts`
- Modify: `src/hooks/newsEventClassificationReferences.ts`
- Test: `tests/int/news-events-tabs.int.spec.tsx`
- Test: `tests/int/news-event-classifications.int.spec.ts`

**Interfaces:**

- Consumes: `NewsEventClassification` relationship values and `normalizeNewsEventClassificationRecord(value)`.
- Produces: `resolveNewsEventsTabs(allTabLabel, classifications)` returning All plus valid selected relationship records, or All alone for an empty selection.

- [ ] **Step 1: Write schema and resolver tests that reject the legacy contract**

Update `tests/int/news-events-tabs.int.spec.tsx` so the block contract requires the relationship field but no `tabs` field:

```ts
expect(findNamedField(NewsEventsTabsBlock.fields, 'classifications')).toMatchObject({
  filterOptions: { active: { equals: true } },
  hasMany: true,
  maxRows: NEWS_EVENTS_TABS_MAX_CLASSIFICATIONS,
  relationTo: 'news-event-classifications',
  type: 'relationship',
})
expect(findNamedField(NewsEventsTabsBlock.fields, 'tabs')).toBeUndefined()
```

Replace the legacy resolver expectations with:

```ts
expect(resolveNewsEventsTabs(null, [])).toEqual([{ label: 'All', value: 'all' }])
expect(resolveNewsEventsTabs(' Everything ', undefined)).toEqual([
  { label: 'Everything', value: 'all' },
])

expect(
  resolveNewsEventsTabs('Everything', [
    holidayClassification,
    newsClassification,
    holidayClassification,
    { ...noticeClassification, active: false },
  ]),
).toEqual([
  { label: 'Everything', value: 'all' },
  {
    classification: holidayClassification,
    label: 'Closures',
    value: holidayClassification.id,
  },
  {
    classification: newsClassification,
    label: 'News',
    value: newsClassification.id,
  },
])
```

Delete imports and assertions for `NEWS_EVENTS_TABS_DEFAULT_CONFIGURED_TABS`, `validateNewsEventsTabsConfiguredTabs`, and legacy block-row validation. Add a reference-guard assertion proving a stored `tabs` row alone no longer counts as a block relationship, while entry-level `contentType` compatibility still does.

- [ ] **Step 2: Run the focused tests and confirm the old behavior fails**

Run:

```bash
pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx tests/int/news-event-classifications.int.spec.ts --reporter=dot
```

Expected: failures show the legacy `tabs` field still exists and empty relationships still produce fixed legacy tabs.

- [ ] **Step 3: Remove legacy schema, normalization, and block reference traversal**

In `src/blocks/NewsEventsTabs/config.ts`:

- remove `ArrayField` from Payload type imports;
- remove `validateNewsEventsTabsConfiguredTabs` and `NEWS_EVENT_CLASSIFICATIONS` imports;
- remove the complete hidden `tabs` array field;
- retain the optional sortable `classifications` relationship and its 50-row limit;
- update its description to `Select and drag classifications into visitor tab order. Leave empty to show only All.`;
- remove `validate` if it only enforces a non-empty selection.

In `src/blocks/NewsEventsTabs/newsEventsTabsShared.ts`, reduce the resolver to the relationship-only contract:

```ts
export function resolveNewsEventsTabs(
  allTabLabel?: string | null,
  classifications?: unknown,
): NewsEventsTabsResolvedTab[] {
  const resolved: NewsEventsTabsResolvedTab[] = [
    { label: allTabLabel?.trim() || 'All', value: 'all' },
  ]
  const seen = new Set<string>()

  for (const value of Array.isArray(classifications) ? classifications : []) {
    const classification = normalizeNewsEventClassificationRecord(value)

    if (
      !classification ||
      !classification.active ||
      !classification.title.trim() ||
      seen.has(classification.id)
    ) {
      continue
    }

    seen.add(classification.id)
    resolved.push({
      classification,
      label: classification.title,
      value: classification.id,
    })
  }

  return resolved
}
```

Delete `NewsEventsTabsConfiguredTab`, `NEWS_EVENTS_TABS_DEFAULT_CONFIGURED_TABS`, the fixed-value set/type guard, legacy-row helpers, and `validateNewsEventsTabsConfiguredTabs`. Change `alignNewsEventsTabsGroups` to use only `groups[tab.value]` and the empty page fallback.

In `src/hooks/newsEventClassificationReferences.ts`, remove `legacyTabsInclude` and stop reading `value.tabs`. Preserve `legacyValue` handling for old News & Events entries.

- [ ] **Step 4: Run the focused tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx tests/int/news-event-classifications.int.spec.ts --reporter=dot
```

Expected: both files pass, with empty configuration resolving to one All tab.

---

### Task 2: Make empty All scopes load every active classification

**Files:**

- Modify: `src/lib/newsEvents.ts`
- Modify: `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`
- Modify: `src/app/api/news-events-tabs/route.ts` only if its call signature changes
- Test: `tests/int/news-events-data.int.spec.ts`
- Test: `tests/int/news-events-tabs-route.int.spec.ts`
- Test: `tests/int/news-events-tabs.int.spec.tsx`

**Interfaces:**

- Consumes: `resolveAllActiveNewsEventClassifications(payload)` and existing selected-scope resolution.
- Produces: `getNewsEventGroups([], limit, nowISO)` and `getNewsEventPage('all', [], page, limit, nowISO)` as public all-active queries.

- [ ] **Step 1: Add failing all-active empty-scope tests**

In `tests/int/news-events-data.int.spec.ts`, add coverage proving an empty scope resolves all active classifications before loading groups and pages:

```ts
const page = await fetchNewsEventPageForScope(payload, {
  classification: 'all',
  classificationIDs: [],
  limit: 6,
  nowISO,
  page: 2,
})

expect(payload.find).toHaveBeenCalledWith(
  expect.objectContaining({
    collection: 'news-event-classifications',
    sort: ['title', 'id'],
    where: { active: { equals: true } },
  }),
)
expect(page.page).toBe(2)
```

In `tests/int/news-events-tabs-route.int.spec.ts`, replace the rejected missing-scope case with:

```ts
const response = await GET(
  new Request('http://localhost/api/news-events-tabs?classification=all&page=2&limit=6'),
)

expect(response.status).toBe(200)
expect(getNewsEventPageMock).toHaveBeenCalledWith(
  'all',
  [],
  2,
  6,
  expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
)
```

Keep a negative test proving a named classification without a selected scope returns `400`.

In the client test, assert All-only Load More requests omit `classifications`:

```ts
expect(fetchMock).toHaveBeenCalledWith(
  expect.stringMatching(/^\/api\/news-events-tabs\?classification=all&limit=6&page=2$/),
  expect.any(Object),
)
```

- [ ] **Step 2: Run the data, route, and client tests and confirm failure**

Run:

```bash
pnpm exec vitest run tests/int/news-events-data.int.spec.ts tests/int/news-events-tabs-route.int.spec.ts tests/int/news-events-tabs.int.spec.tsx --reporter=dot
```

Expected: the parser rejects the missing scope, the loader resolves zero classifications, and the client emits `classifications=`.

- [ ] **Step 3: Implement the empty-scope server contract**

In `src/lib/newsEvents.ts`, allow a missing scope only for All:

```ts
const rawClassificationIDs = searchParams.get('classifications')
const classificationIDs =
  requestedClassification === 'all' && !rawClassificationIDs
    ? []
    : normalizeRequestedClassificationIDs(rawClassificationIDs)

if (!classificationIDs) {
  return { message: 'Select at least one classification.', ok: false }
}
```

Resolve an empty All scope through all active records:

```ts
const classifications =
  requestedIDs.length > 0
    ? await resolveActiveNewsEventClassifications(payload, requestedIDs)
    : classification === 'all'
      ? await resolveAllActiveNewsEventClassifications(payload)
      : []
```

Retain exact-count validation only for a non-empty requested scope. A named classification with no scope remains invalid. Update `getNewsEventGroups` similarly:

```ts
const classifications =
  classificationIDs.length > 0
    ? await resolveActiveNewsEventClassifications(payload, classificationIDs)
    : await resolveAllActiveNewsEventClassifications(payload)
```

In `NewsEventsTabsClient.tsx`, construct Load More parameters without an empty relationship parameter:

```ts
const params = new URLSearchParams({
  classification,
  limit: String(itemsPerTab),
  page: String(currentPage.page + 1),
})

if (selectedIDs.length > 0) {
  params.set('classifications', selectedIDs.join(','))
}
```

- [ ] **Step 4: Run the focused data, route, and client tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-data.int.spec.ts tests/int/news-events-tabs-route.int.spec.ts tests/int/news-events-tabs.int.spec.tsx --reporter=dot
```

Expected: all files pass; selected scopes remain validated and All-only pagination uses every active classification.

---

### Task 3: Align production and live-preview rendering

**Files:**

- Modify: `src/blocks/NewsEventsTabs/Component.tsx`
- Modify: `src/blocks/NewsEventsTabs/Presentation.tsx`
- Modify: `src/blocks/NewsEventsTabs/PreviewComponent.tsx`
- Modify: `src/lib/newsEventsPreviewShared.ts`
- Modify: `src/lib/newsEventsPreviewSnapshot.ts`
- Test: `tests/int/news-events-tabs.int.spec.tsx`
- Test: `tests/int/live-preview-renderer.int.spec.tsx`
- Test: `tests/int/live-preview-import-boundary.int.spec.ts`

**Interfaces:**

- Consumes: empty relationship IDs as the stable All-only scope key `JSON.stringify([limit])`.
- Produces: identical All-only initial data in production and live preview without importing server-only code into the client graph.

- [ ] **Step 1: Add failing production and preview scope tests**

Add assertions that:

```ts
expect(
  getNewsEventsTabsPreviewClassificationIDs({
    blockType: 'newsEventsTabs',
    classifications: [],
  }),
).toEqual([])

expect(
  getNewsEventsTabsPreviewGroupScopes([
    { blockType: 'newsEventsTabs', classifications: [], itemsPerTab: '6' },
  ] as never),
).toEqual([
  {
    classificationIDs: [],
    key: JSON.stringify([6]),
    limit: 6,
  },
])
```

Render `NewsEventsTabsPreviewBlockComponent` with an empty relationship selection and a snapshot at `JSON.stringify([6])`; assert one visible All tab and the supplied All entry. Delete the old `legacy:notice` preview-scope assertion.

- [ ] **Step 2: Run preview and import-boundary tests and confirm failure**

Run:

```bash
pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts --reporter=dot
```

Expected: empty blocks currently produce no preview scope and the legacy-scope assertions remain active.

- [ ] **Step 3: Remove legacy preview discovery and retain empty scopes**

In `src/lib/newsEventsPreviewShared.ts`:

- remove `NewsEventsTabsConfiguredTab` and `normalizeLegacyNewsEventClassification` imports;
- delete `getLegacyClassificationIDs`;
- make `getNewsEventsTabsPreviewClassificationIDs` return relationship IDs only;
- always register a News & Events Tabs preview scope, including `classificationIDs: []`.

The scope branch becomes:

```ts
if (record.blockType === 'newsEventsTabs') {
  const classificationIDs = getNewsEventsTabsPreviewClassificationIDs(record)
  const limit = normalizeNewsEventsTabsItemsPerTab(record.itemsPerTab as string | number)
  const key = getNewsEventsTabsPreviewGroupKey(classificationIDs, limit)

  scopes.set(key, { classificationIDs, key, limit })
}
```

In `src/lib/newsEventsPreviewSnapshot.ts`, continue loading the empty-key group through `getNewsEventGroups([], ...)`. No classification metadata is required for named tabs because an empty selection intentionally renders only All.

In `Component.tsx`, call `resolveNewsEventsTabs(props.allTabLabel, classifications)` without legacy rows and load groups from the original `selectedIDs`. This distinction is required: an originally empty selection means all active classifications, while a non-empty selection whose records are now missing or inactive must remain an empty selected scope instead of widening unexpectedly.

```ts
const groups = await getNewsEventGroups(selectedIDs, itemCount, new Date().toISOString())
```

In `Presentation.tsx`, remove `tabs` from `NewsEventsTabsBlockLike`, component destructuring, and resolver calls. In `PreviewComponent.tsx`, preserve `[]` for empty selections and read the `JSON.stringify([limit])` snapshot group.

- [ ] **Step 4: Run production/preview focused tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts --reporter=dot
```

Expected: all pass; production and preview expose only All while rendering all-active initial data.

---

### Task 4: Regenerate types, update maintained context, and verify the complete contract

**Files:**

- Modify: `src/payload-types.ts`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/payload-model.md` if its block-level compatibility wording changes
- Modify: `.agents/skills/project-context/references/project-inventory.json`
- Modify: `docs/superpowers/plans/2026-08-19-news-event-classifications.md` only where it still instructs workers to retain legacy Tabs rows
- Test: `tests/int/news-events-detail-template.int.spec.tsx`
- Test: `tests/int/block-thumbnails.int.spec.tsx`

**Interfaces:**

- Consumes: the final relationship-only Payload block schema.
- Produces: generated `NewsEventsTabsBlock` types without a `tabs` property and current project knowledge.

- [ ] **Step 1: Generate Payload types**

Run:

```bash
pnpm generate:types
pnpm exec prettier --write src/payload-types.ts
```

Expected: `NewsEventsTabsBlock` retains optional `classifications` and no longer contains `tabs`.

- [ ] **Step 2: Update type/schema assertions and maintained documentation**

Add a generated-type assertion that slices `NewsEventsTabsBlock` and verifies:

```ts
expect(newsEventsTabsInterface).toContain(
  'classifications?: (string | NewsEventClassification)[] | null',
)
expect(newsEventsTabsInterface).not.toContain('tabs?:')
```

Update `block-system.md` so the Tabs paragraph states:

```md
An empty relationship selection renders only All and scopes that All group to every active classification. A non-empty selection renders All plus the selected active records in saved order and scopes All to only those records. The block has no hidden legacy tab rows or fixed tab-name fallback.
```

Remove contrary legacy Tabs instructions from the older implementation plan while preserving its local-only/no-migration history.

- [ ] **Step 3: Run the complete focused verification**

Run:

```bash
pnpm exec vitest run tests/int/news-event-classifications.int.spec.ts tests/int/news-events-collection.int.spec.ts tests/int/news-events-data.int.spec.ts tests/int/news-events-tabs.int.spec.tsx tests/int/news-events-tabs-route.int.spec.ts tests/int/news-events-detail-template.int.spec.tsx tests/int/block-thumbnails.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts --reporter=dot
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/blocks/NewsEventsTabs src/lib/newsEvents.ts src/lib/newsEventsPreviewShared.ts src/lib/newsEventsPreviewSnapshot.ts src/hooks/newsEventClassificationReferences.ts tests/int/news-events-tabs.int.spec.tsx tests/int/news-events-tabs-route.int.spec.ts tests/int/news-events-data.int.spec.ts
pnpm exec prettier --check src/blocks/NewsEventsTabs src/lib/newsEvents.ts src/lib/newsEventsPreviewShared.ts src/lib/newsEventsPreviewSnapshot.ts src/hooks/newsEventClassificationReferences.ts tests/int/news-events-tabs.int.spec.tsx tests/int/news-events-tabs-route.int.spec.ts tests/int/news-events-data.int.spec.ts src/payload-types.ts docs/superpowers/specs/2026-08-19-news-event-classifications-design.md docs/superpowers/plans/2026-08-20-news-events-tabs-all-only-default.md
git diff --check
```

Expected: all commands pass.

- [ ] **Step 4: Refresh and check project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current; the known stale knowledge-graph warning may remain informational.

- [ ] **Step 5: Confirm no migration, staging, or commit artifacts were introduced**

Run:

```bash
rg -n "migrate-news-event-classifications|NewsEventClassificationMigration|NEWS_EVENT_CLASSIFICATION_MIGRATION_CONTEXT" . --glob '!node_modules/**' --glob '!.git/**'
git diff --cached --name-only
git status --short
```

Expected: no migration implementation references, no staged files, and only the intended uncommitted worktree changes.
