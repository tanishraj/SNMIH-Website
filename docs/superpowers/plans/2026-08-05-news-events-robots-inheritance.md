# News & Events Robots Inheritance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make News & Events archive and detail metadata inherit the global robots policy when their route-level value is `default`.

**Architecture:** Add one cached server-only global robots loader, pass its result explicitly into pure metadata builders, and load it concurrently with route data.

**Tech Stack:** Payload CMS 3, Next.js 15 metadata API, TypeScript, Vitest

## Global Constraints

- Do not stage or commit changes.
- Explicit `index` and `noindex` values override the global policy.
- Do not change sitemap, canonical, social metadata, or structured-data behavior.
- Use `CMS_CACHE_TAGS.globals` for invalidation.

---

### Task 1: Lock The Robots Resolution Contract

**Files:**
- Create: `tests/int/news-events-metadata.int.spec.ts`
- Modify: `src/lib/newsEventsMetadata.ts`

**Interfaces:**
- `getNewsEventsArchiveMetadata(settings, inheritedRobots): Metadata`
- `getNewsEventDetailMetadata(entry, inheritedRobots): Metadata`

- [ ] **Step 1: Write failing inheritance and override tests**

Create fixtures containing the fields read by each metadata helper. Assert:

```ts
expect(getNewsEventsArchiveMetadata(
  { robotsMode: 'default', title: 'News & Events' } as NewsEventsSetting,
  'noindex,nofollow',
).robots).toEqual({ index: false, follow: false })

expect(getNewsEventDetailMetadata(
  detailFixture({ robotsMode: 'default' }),
  'index,nofollow',
).robots).toEqual({ index: true, follow: false })

expect(getNewsEventsArchiveMetadata(
  { robotsMode: 'index', title: 'News & Events' } as NewsEventsSetting,
  'noindex,nofollow',
).robots).toEqual({ index: true, follow: true })

expect(getNewsEventDetailMetadata(
  detailFixture({ robotsMode: 'noindex' }),
  'index,follow',
).robots).toEqual({ index: false, follow: true })
```

- [ ] **Step 2: Run the test and verify TypeScript/runtime failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-metadata.int.spec.ts
```

- [ ] **Step 3: Require and apply the inherited value**

Import `RobotsFieldValue` from `@/lib/seo`. Add the required second parameter to both metadata
functions and call:

```ts
robots: resolveRobotsMode({
  inheritedRobots,
  robotsMode: settings.robotsMode,
})
```

Use `entry.robotsMode` in the detail helper.

- [ ] **Step 4: Re-run the focused test**

Expected: all four resolution assertions pass.

### Task 2: Load Global Robots And Wire Routes

**Files:**
- Modify: `src/lib/newsEvents.ts`
- Modify: `src/app/(frontend)/news-events/page.tsx`
- Modify: `src/app/(frontend)/news-events/[slug]/page.tsx`
- Modify: `tests/int/news-events-metadata.int.spec.ts`

**Interfaces:**
- Produces: `getNewsEventsInheritedRobots(): Promise<SeoSetting['robots']>`
- Consumes: the metadata signatures from Task 1

- [ ] **Step 1: Add a failing loader test**

Mock `next/cache.unstable_cache` as an identity wrapper and Payload `findGlobal`. Dynamically
import `newsEvents.ts`, call `getNewsEventsInheritedRobots()`, and assert:

```ts
expect(payloadMocks.findGlobal).toHaveBeenCalledWith({
  depth: 0,
  slug: 'seo-settings',
})
expect(result).toBe('noindex,follow')
```

- [ ] **Step 2: Add the cached server helper**

Import `SeoSetting` and add:

```ts
const _getNewsEventsInheritedRobots = async (): Promise<SeoSetting['robots']> => {
  const payload = await loadPayload()
  const settings = await payload.findGlobal({ slug: 'seo-settings', depth: 0 })
  return settings.robots
}

export const getNewsEventsInheritedRobots = unstable_cache(
  _getNewsEventsInheritedRobots,
  ['news-events-inherited-robots'],
  { tags: [CMS_CACHE_TAGS.globals], revalidate: false },
)
```

- [ ] **Step 3: Wire archive and detail metadata concurrently**

Archive:

```ts
const [settings, inheritedRobots] = await Promise.all([
  getNewsEventsSettings(),
  getNewsEventsInheritedRobots(),
])
return getNewsEventsArchiveMetadata(settings, inheritedRobots)
```

Detail:

```ts
const [entry, inheritedRobots] = await Promise.all([
  getNewsEventBySlug(slug, new Date().toISOString()),
  getNewsEventsInheritedRobots(),
])
return entry ? getNewsEventDetailMetadata(entry, inheritedRobots) : {}
```

- [ ] **Step 4: Run tests, lint, and TypeScript**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-metadata.int.spec.ts
pnpm exec eslint src/lib/newsEvents.ts src/lib/newsEventsMetadata.ts \
  'src/app/(frontend)/news-events/page.tsx' \
  'src/app/(frontend)/news-events/[slug]/page.tsx' \
  tests/int/news-events-metadata.int.spec.ts
pnpm exec tsc --noEmit --pretty false
```

### Task 3: Update Documentation And Verify

**Files:**
- Modify: `docs/guides/news-events.md`
- Modify: `docs/guides/news-events-settings.md`
- Modify: `docs/architecture/feature-inventory.md`

- [ ] **Step 1: Document inheritance and overrides**

State that `Default` inherits the global SEO & Metadata robots policy and explicit `Index` or
`No index` values override it for the archive or entry.

- [ ] **Step 2: Remove only the resolved robots limitation**

Delete:

```markdown
- News & Events metadata does not consistently inherit global robots defaults
```

- [ ] **Step 3: Run combined regression checks**

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-events-metadata.int.spec.ts \
  tests/int/news-events-data.int.spec.ts \
  tests/int/dashboard-capability-filtering.int.spec.tsx \
  tests/int/admin-documentation.int.spec.ts
git diff --check
git status --short
```

Expected: all selected tests and static checks pass; all work remains uncommitted.
