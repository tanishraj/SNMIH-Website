# News Grid All-Classifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make News Grid show every published News & Events classification in newest-published order while continuing to exclude expired Events.

**Architecture:** Keep the existing single collection query and expand its non-event branch to all six non-event classifications. Reuse the canonical classification-label helper in presentation, preserve stored field names for backward compatibility, and update only the Admin copy that describes the shared non-event CTA.

**Tech Stack:** Payload CMS Local API, Next.js/React Server Components, TypeScript, Vitest, React DOM server rendering.

## Global Constraints

- Admit News, Event, Notice, Holiday, Achievement, Announcement, and Other.
- Require both Payload `_status: published` and editorial `workflowState: published`.
- Keep only current or upcoming Events under the existing Event Start/Event End predicate.
- Sort by `publishedAt`, then `createdAt`, then `id`, all descending.
- Preserve the stored `newsActionLabel` field and use it as the default non-event CTA.
- Keep `eventActionLabel` Event-specific.
- Preserve feature-card slotting and empty-state behavior.
- Do not stage or commit changes.

---

### Task 1: Expand and reorder the News Grid collection query

**Files:**

- Modify: `tests/int/news-grid.int.spec.tsx`
- Modify: `src/lib/newsEvents.ts`

**Interfaces:**

- Consumes: `nonEventClassifications`, `publishedWhere`, and `currentOrUpcomingEventWhere(nowISO)` from `src/lib/newsEvents.ts`.
- Produces: unchanged `fetchNewsGridItems(payload, { limit, nowISO }): Promise<PublicNewsEventCard[]>` with expanded eligibility and publication ordering.

- [ ] **Step 1: Write the failing query-contract test**

Replace the existing News Grid query test with:

```tsx
it('loads every published classification in newest-published order while excluding past events', async () => {
  const find = vi.fn().mockResolvedValue({ docs: [] })

  await fetchNewsGridItems({ find } as never, {
    limit: 4,
    nowISO: '2026-08-14T00:00:00.000Z',
  })

  expect(find).toHaveBeenCalledTimes(1)
  expect(find).toHaveBeenCalledWith(
    expect.objectContaining({
      collection: 'news-events',
      limit: 4,
      sort: ['-publishedAt', '-createdAt', '-id'],
      where: {
        and: expect.arrayContaining([
          { _status: { equals: 'published' } },
          { workflowState: { equals: 'published' } },
          {
            or: [
              {
                contentType: {
                  in: ['news', 'notice', 'holiday', 'achievement', 'announcement', 'other'],
                },
              },
              {
                and: [
                  { contentType: { equals: 'event' } },
                  expect.objectContaining({ or: expect.any(Array) }),
                ],
              },
            ],
          },
        ]),
      },
    }),
  )
})
```

- [ ] **Step 2: Run the test and verify the old contract fails**

Run:

```bash
pnpm exec vitest run tests/int/news-grid.int.spec.tsx
```

Expected: FAIL because the current query sorts by `-updatedAt` and admits only News in its non-event branch.

- [ ] **Step 3: Implement the unified eligibility and ordering query**

Update `fetchNewsGridItems` to use:

```ts
sort: ['-publishedAt', '-createdAt', '-id'],
where: {
  and: [
    ...publishedWhere,
    {
      or: [
        { contentType: { in: nonEventClassifications } },
        {
          and: [{ contentType: { equals: 'event' } }, currentOrUpcomingEventWhere(nowISO)],
        },
      ],
    },
  ],
},
```

- [ ] **Step 4: Run the focused query test**

Run:

```bash
pnpm exec vitest run tests/int/news-grid.int.spec.tsx
```

Expected: PASS.

### Task 2: Render canonical badges and compatible CTA labels

**Files:**

- Modify: `tests/int/news-grid.int.spec.tsx`
- Modify: `src/blocks/NewsGrid/Presentation.tsx`
- Modify: `src/blocks/NewsGrid/config.ts`
- Generate: `src/payload-types.ts`

**Interfaces:**

- Consumes: `getNewsEventClassificationLabel(value?: string | null): string` and `PublicNewsEventCard.contentType`.
- Produces: canonical badge labels; `newsActionLabel` remains the default non-event CTA; `eventActionLabel` remains Event-only.

- [ ] **Step 1: Add failing presentation and Admin compatibility tests**

Add a helper that creates non-event cards:

```tsx
const createClassificationCard = (
  contentType: PublicNewsEventCard['contentType'],
  id: string,
): PublicNewsEventCard => ({
  ...newsCard,
  contentType,
  href: `/news-events/${contentType}`,
  id,
  slug: contentType,
  title: `${contentType} update`,
})
```

Assert canonical labels and shared/default CTA behavior in two renders so the six-card cap does not hide the Event fixture:

```tsx
it('renders canonical labels and the default CTA for every non-event classification', () => {
  const cards = ['news', 'notice', 'holiday', 'achievement', 'announcement', 'other'].map(
    (contentType, index) =>
      createClassificationCard(contentType as PublicNewsEventCard['contentType'], `${index}`),
  )
  const html = renderToStaticMarkup(
    <NewsGridBlockPresentation
      items={cards}
      newsActionLabel="Read update"
      title="Updates"
      totalCards={6}
    />,
  )

  for (const label of ['News', 'Notice', 'Holiday', 'Achievement', 'Announcement', 'Other']) {
    expect(html).toContain(`>${label}</p>`)
  }
  expect(html.match(/Read update/g)).toHaveLength(6)

  const eventHTML = renderToStaticMarkup(
    <NewsGridBlockPresentation
      eventActionLabel="View event"
      items={[eventCard]}
      newsActionLabel="Read update"
      title="Updates"
    />,
  )
  expect(eventHTML).toContain('>Event</p>')
  expect(eventHTML).toContain('View event')
  expect(eventHTML).not.toContain('Read update')
})
```

Assert the Admin field keeps its stored key while presenting the new label:

```tsx
it('presents the stored News CTA field as the default non-event label', () => {
  expect(findNamedField(NewsGridBlock.fields, 'newsActionLabel')).toMatchObject({
    label: 'Default Action Label',
    type: 'text',
  })
  expect(findNamedField(NewsGridBlock.fields, 'eventActionLabel')).toMatchObject({
    label: 'Event Action Label',
    type: 'text',
  })
})
```

- [ ] **Step 2: Run the focused test and verify the presentation contract fails**

Run:

```bash
pnpm exec vitest run tests/int/news-grid.int.spec.tsx
```

Expected: FAIL because every non-event card currently renders the News label and the Admin field says `News Action Label`.

- [ ] **Step 3: Render the shared canonical label and CTA fallback**

Import:

```ts
import { getNewsEventClassificationLabel } from '@/lib/newsEventClassifications'
```

Resolve the compatible stored prop as:

```ts
const resolvedDefaultActionLabel = newsActionLabel?.trim() || 'Read update'
```

Render:

```tsx
<SectionEyebrow surface={surface}>
  {getNewsEventClassificationLabel(item.contentType)}
</SectionEyebrow>
```

and:

```tsx
<ContentLink
  href={item.href}
  label={item.contentType === 'event' ? resolvedEventLabel : resolvedDefaultActionLabel}
/>
```

- [ ] **Step 4: Update only the Admin-facing field copy**

Keep `name: 'newsActionLabel'` and change the field to:

```ts
{
  name: 'newsActionLabel',
  label: 'Default Action Label',
  type: 'text',
  defaultValue: 'Read update',
  admin: {
    description: 'Used by every non-event classification.',
  },
},
```

- [ ] **Step 5: Run the focused test**

Run:

```bash
pnpm exec vitest run tests/int/news-grid.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 6: Regenerate Payload types after the Admin field-description change**

Run:

```bash
pnpm generate:types
```

Expected: the `newsActionLabel` type remains `string | null`; its generated JSDoc records the new
non-event usage description.

### Task 3: Update operator contracts and verify the complete change

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Generated if required: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the implemented News Grid behavior from Tasks 1 and 2.
- Produces: current operator guidance and project-context verification.

- [ ] **Step 1: Update the block guide**

Document this exact behavior:

```md
News Grid automatically shows all published News & Events classifications in newest-published order
while excluding expired Events. It supports 2–4 desktop columns and can reserve the final slot for an
optional feature card. Default Action Label applies to non-event records; Event Action Label applies
only to Events.
```

- [ ] **Step 2: Update the maintained block-system reference**

Add this contract to the existing News Grid paragraph:

```md
News Grid loads all published classifications in published-date order, retains the current/upcoming
Event predicate, uses canonical classification labels, and preserves the stored `newsActionLabel`
field as the Admin-facing Default Action Label for non-event records.
```

- [ ] **Step 3: Run focused and static verification**

Run:

```bash
pnpm exec vitest run tests/int/news-grid.int.spec.tsx tests/int/news-events-data.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/lib/newsEvents.ts src/blocks/NewsGrid/Presentation.tsx src/blocks/NewsGrid/config.ts tests/int/news-grid.int.spec.tsx
pnpm exec prettier --check src/lib/newsEvents.ts src/blocks/NewsGrid/Presentation.tsx src/blocks/NewsGrid/config.ts tests/int/news-grid.int.spec.tsx docs/guides/blocks.md .agents/skills/project-context/references/block-system.md
git diff --check
```

Expected: all tests and checks pass.

- [ ] **Step 4: Run the required project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current; a pre-existing stale knowledge-graph warning is acceptable.

- [ ] **Step 5: Review scope without staging or committing**

Run `git status --short`, then inspect the focused diff for the files listed in this plan. Confirm that only the approved query, presentation, Admin copy, tests, documentation, and required generated context inventory changed. Do not stage or commit them.
