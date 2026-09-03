# News & Events Tabs Admin Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `News & Events Tabs` block's classification tabs addable, removable, renameable, and reorderable in Payload while keeping `All` mandatory and first.

**Architecture:** Store editor-controlled classification rows as a bounded Payload array and keep `All` outside that array. A block-owned resolver normalizes legacy, malformed, and explicit empty values into the ordered tab list used in production and live preview. The existing grouped query and card presentation remain unchanged.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16.2.10, React 19.2.7, TypeScript 5.7.3, Vitest 4.0.18, Testing Library, Tailwind CSS 4.

## Global Constraints

- `All` is always first and cannot be removed or reordered.
- Editors can add, remove, rename, and reorder the seven supported classification tabs.
- Each classification may appear at most once.
- Existing blocks without saved configuration render the current full tab set.
- An explicitly empty configured array renders only `All`.
- Do not change News Grid, collection classifications, card visuals, section settings, or grouped queries.
- Do not regenerate the block thumbnail because the default output is unchanged.
- Do not stage or commit any files.

---

## File Structure

- `src/blocks/NewsEventsTabs/newsEventsTabsShared.ts`: configured/resolved tab types, defaults, validation, and normalization.
- `src/blocks/NewsEventsTabs/config.ts`: Payload Admin fields.
- `src/blocks/NewsEventsTabs/Presentation.tsx`: resolves stored values once.
- `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`: renders and navigates resolved tabs.
- `src/payload-types.ts`: generated schema types.
- `tests/int/news-events-tabs.int.spec.tsx`: schema, resolver, presentation, and interaction contracts.
- `docs/guides/news-events.md`, `docs/guides/blocks.md`, and `.agents/skills/project-context/references/block-system.md`: operator and architecture documentation.

### Task 1: Add Safe Tab Defaults, Validation, and Resolution

**Files:**
- Modify: `src/blocks/NewsEventsTabs/newsEventsTabsShared.ts`
- Test: `tests/int/news-events-tabs.int.spec.tsx`

**Interfaces:**
- Consumes: `NEWS_EVENT_CLASSIFICATIONS`, `NewsEventClassification`, and `NewsEventClassificationTab`.
- Produces: `NewsEventsTabsConfiguredTab`, `NewsEventsTabsResolvedTab`, `NEWS_EVENTS_TABS_DEFAULT_CONFIGURED_TABS`, `validateNewsEventsTabsConfiguredTabs(value): true | string`, and `resolveNewsEventsTabs(allTabLabel, tabs): NewsEventsTabsResolvedTab[]`.

- [ ] **Step 1: Write failing resolver and validation tests**

Extend the shared-helper import in `tests/int/news-events-tabs.int.spec.tsx`:

```tsx
import {
  getNewsEventsTabsGridClasses,
  NEWS_EVENTS_TABS_DEFAULT_CONFIGURED_TABS,
  normalizeNewsEventsTabsCardsPerRow,
  normalizeNewsEventsTabsItemsPerTab,
  resolveNewsEventsTabs,
  validateNewsEventsTabsConfiguredTabs,
} from '@/blocks/NewsEventsTabs/newsEventsTabsShared'
```

Add:

```tsx
it('resolves legacy, custom, and explicitly empty tab configuration', () => {
  expect(resolveNewsEventsTabs(null, undefined)).toEqual([
    { label: 'All', value: 'all' },
    ...NEWS_EVENTS_TABS_DEFAULT_CONFIGURED_TABS.map(({ classification, label }) => ({
      label,
      value: classification,
    })),
  ])

  expect(
    resolveNewsEventsTabs(' Everything ', [
      { classification: 'holiday', label: ' Breaks ' },
      { classification: 'news', label: 'Latest' },
      { classification: 'holiday', label: 'Repeated' },
      { classification: 'invalid', label: 'Invalid' },
      { classification: 'notice', label: '   ' },
    ]),
  ).toEqual([
    { label: 'Everything', value: 'all' },
    { label: 'Breaks', value: 'holiday' },
    { label: 'Latest', value: 'news' },
  ])

  expect(resolveNewsEventsTabs('All updates', [])).toEqual([
    { label: 'All updates', value: 'all' },
  ])
})

it('rejects duplicate configured classifications', () => {
  expect(
    validateNewsEventsTabsConfiguredTabs([
      { classification: 'news', label: 'News' },
      { classification: 'news', label: 'Latest' },
    ]),
  ).toBe('Each classification can only be added once.')

  expect(
    validateNewsEventsTabsConfiguredTabs([
      { classification: 'news', label: 'News' },
      { classification: 'event', label: 'Events' },
    ]),
  ).toBe(true)
})
```

- [ ] **Step 2: Run the focused test and confirm it fails on missing exports**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-tabs.int.spec.tsx
```

Expected: FAIL because the new shared exports do not exist.

- [ ] **Step 3: Implement the shared contract**

Add this import to `newsEventsTabsShared.ts`:

```ts
import {
  NEWS_EVENT_CLASSIFICATIONS,
  type NewsEventClassification,
  type NewsEventClassificationTab,
} from '@/lib/newsEventClassifications'
```

Add above the existing item-count constants:

```ts
export type NewsEventsTabsConfiguredTab = {
  classification?: string | null
  label?: string | null
}

export type NewsEventsTabsResolvedTab = {
  label: string
  value: NewsEventClassificationTab
}

export const NEWS_EVENTS_TABS_DEFAULT_CONFIGURED_TABS = NEWS_EVENT_CLASSIFICATIONS.map(
  ({ tabLabel, value }) => ({ classification: value, label: tabLabel }),
) satisfies Array<{ classification: NewsEventClassification; label: string }>

const classificationValues = new Set<string>(
  NEWS_EVENT_CLASSIFICATIONS.map(({ value }) => value),
)

function isNewsEventClassification(value: unknown): value is NewsEventClassification {
  return typeof value === 'string' && classificationValues.has(value)
}

export function validateNewsEventsTabsConfiguredTabs(value: unknown): true | string {
  if (!Array.isArray(value)) return true
  const seen = new Set<string>()

  for (const row of value) {
    if (!row || typeof row !== 'object') continue
    const classification = (row as NewsEventsTabsConfiguredTab).classification
    if (!classification) continue
    if (seen.has(classification)) return 'Each classification can only be added once.'
    seen.add(classification)
  }

  return true
}

export function resolveNewsEventsTabs(
  allTabLabel?: string | null,
  tabs?: NewsEventsTabsConfiguredTab[] | null,
): NewsEventsTabsResolvedTab[] {
  const resolved: NewsEventsTabsResolvedTab[] = [
    { label: allTabLabel?.trim() || 'All', value: 'all' },
  ]
  const configured = tabs == null ? NEWS_EVENTS_TABS_DEFAULT_CONFIGURED_TABS : tabs
  const seen = new Set<NewsEventClassification>()

  for (const tab of configured) {
    const classification = tab?.classification
    const label = tab?.label?.trim()
    if (!isNewsEventClassification(classification) || !label || seen.has(classification)) continue
    seen.add(classification)
    resolved.push({ label, value: classification })
  }

  return resolved
}
```

- [ ] **Step 4: Run the focused test and inspect the diff**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-tabs.int.spec.tsx
git diff --check -- src/blocks/NewsEventsTabs/newsEventsTabsShared.ts tests/int/news-events-tabs.int.spec.tsx
git status --short -- src/blocks/NewsEventsTabs/newsEventsTabsShared.ts tests/int/news-events-tabs.int.spec.tsx
```

Expected: tests pass, no whitespace errors, and only intended files appear. Do not stage or commit.

### Task 2: Expose the Ordered Tabs in Payload Admin

**Files:**
- Modify: `src/blocks/NewsEventsTabs/config.ts`
- Modify: `src/payload-types.ts` via generator
- Test: `tests/int/news-events-tabs.int.spec.tsx`

**Interfaces:**
- Consumes: the default rows and validator from Task 1 plus `NEWS_EVENT_CLASSIFICATIONS`.
- Produces: `allTabLabel?: string | null` and `tabs?: Array<{ classification; label; id? }> | null` on generated `NewsEventsTabsBlock` values.

- [ ] **Step 1: Add failing schema assertions**

Add to the existing schema test:

```tsx
expect(findNamedField(NewsEventsTabsBlock.fields, 'allTabLabel')).toMatchObject({
  defaultValue: 'All',
  type: 'text',
})
expect(findNamedField(NewsEventsTabsBlock.fields, 'tabs')).toMatchObject({
  defaultValue: NEWS_EVENTS_TABS_DEFAULT_CONFIGURED_TABS,
  maxRows: 7,
  type: 'array',
})
expect(findNamedField(NewsEventsTabsBlock.fields, 'classification')).toMatchObject({
  options: [
    { label: 'News', value: 'news' },
    { label: 'Events', value: 'event' },
    { label: 'Notice', value: 'notice' },
    { label: 'Holiday', value: 'holiday' },
    { label: 'Achievements', value: 'achievement' },
    { label: 'Announcement', value: 'announcement' },
    { label: 'Others', value: 'other' },
  ],
  required: true,
  type: 'select',
})
```

- [ ] **Step 2: Run the test and confirm the new fields are missing**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-tabs.int.spec.tsx
```

Expected: FAIL on `allTabLabel`, `tabs`, or nested `classification`.

- [ ] **Step 3: Add the Payload fields**

Update the Payload import:

```ts
import type { ArrayField, Block, RadioField, SelectField, TabsField } from 'payload'
```

Add:

```ts
import {
  NEWS_EVENTS_TABS_DEFAULT_CONFIGURED_TABS,
  validateNewsEventsTabsConfiguredTabs,
} from '@/blocks/NewsEventsTabs/newsEventsTabsShared'
import { NEWS_EVENT_CLASSIFICATIONS } from '@/lib/newsEventClassifications'
```

Insert after `footerActions` and before `itemsPerTab`:

```ts
{
  name: 'allTabLabel',
  label: 'All Tab Label',
  type: 'text',
  defaultValue: 'All',
  admin: { description: 'The mandatory first tab. Leave blank to use “All”.' },
},
{
  name: 'tabs',
  label: 'Classification Tabs',
  type: 'array',
  defaultValue: NEWS_EVENTS_TABS_DEFAULT_CONFIGURED_TABS,
  maxRows: NEWS_EVENT_CLASSIFICATIONS.length,
  labels: { singular: 'Tab', plural: 'Tabs' },
  validate: validateNewsEventsTabsConfiguredTabs,
  admin: {
    description:
      'Add, remove, rename, or drag tabs into order. Each classification can be used once; All is always first.',
    initCollapsed: true,
  },
  fields: [
    {
      name: 'classification',
      label: 'Category',
      type: 'select',
      options: NEWS_EVENT_CLASSIFICATIONS.map(({ adminLabel, value }) => ({
        label: adminLabel,
        value,
      })),
      required: true,
    } satisfies SelectField,
    {
      name: 'label',
      label: 'Display Label',
      type: 'text',
      required: true,
      admin: { description: 'Visitor-facing label for this tab.' },
    },
  ],
} satisfies ArrayField,
```

- [ ] **Step 4: Verify the schema and regenerate types**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-tabs.int.spec.tsx
pnpm generate:types
rg -n "allTabLabel|classification|NewsEventsTabsBlock" src/payload-types.ts
```

Expected: tests and generation pass; generated block and select types contain both fields.

- [ ] **Step 5: Inspect the unstaged task diff**

```bash
git diff --check -- src/blocks/NewsEventsTabs/config.ts src/payload-types.ts tests/int/news-events-tabs.int.spec.tsx
git status --short -- src/blocks/NewsEventsTabs/config.ts src/payload-types.ts tests/int/news-events-tabs.int.spec.tsx
```

Expected: no whitespace errors; no files are staged or committed.

### Task 3: Render and Navigate the Configured Tab List

**Files:**
- Modify: `src/blocks/NewsEventsTabs/Presentation.tsx`
- Modify: `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`
- Test: `tests/int/news-events-tabs.int.spec.tsx`

**Interfaces:**
- Consumes: `resolveNewsEventsTabs(allTabLabel, tabs)` and `NewsEventsTabsConfiguredTab` from Task 1.
- Produces: client prop `tabs: readonly NewsEventsTabsResolvedTab[]`; filtering and keyboard traversal use that list.

- [ ] **Step 1: Update test setup and add failing dynamic-list tests**

Add the default list to `baseClientProps`:

```tsx
const baseClientProps = {
  cardsPerRow: '3' as const,
  emptyStateMessage: 'No entries in this classification.',
  eventActionLabel: 'View details',
  groups,
  newsActionLabel: 'Read update',
  tabs: resolveNewsEventsTabs(null, undefined),
}
```

Rename the fixed-tabs test to `renders the default tabs and filters the visible panel`, then add:

```tsx
it('renders configured labels and order while keeping All first', () => {
  render(
    <NewsEventsTabsClient
      {...baseClientProps}
      tabs={resolveNewsEventsTabs('Everything', [
        { classification: 'notice', label: 'Campus notices' },
        { classification: 'holiday', label: 'Closures' },
      ])}
    />,
  )

  expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
    'Everything',
    'Campus notices',
    'Closures',
  ])
  fireEvent.click(screen.getByRole('tab', { name: 'Campus notices' }))
  expect(screen.getByRole('tabpanel').textContent).toContain('Research notice')
  expect(screen.getByRole('tabpanel').textContent).not.toContain('Campus holiday')
})

it('supports an explicit All-only configuration', () => {
  render(
    <NewsEventsTabsClient
      {...baseClientProps}
      tabs={resolveNewsEventsTabs('All updates', [])}
    />,
  )

  expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['All updates'])
  expect(screen.getByRole('tabpanel').textContent).toContain('Current update')
})

it('uses configured order for keyboard navigation', () => {
  render(
    <NewsEventsTabsClient
      {...baseClientProps}
      tabs={resolveNewsEventsTabs(null, [
        { classification: 'holiday', label: 'Holiday' },
        { classification: 'notice', label: 'Notice' },
      ])}
    />,
  )

  const all = screen.getByRole('tab', { name: 'All' })
  fireEvent.keyDown(all, { key: 'ArrowLeft' })
  expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Notice' }))
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Notice' }), { key: 'Home' })
  expect(document.activeElement).toBe(all)
})
```

- [ ] **Step 2: Run the test and confirm the client prop contract fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-tabs.int.spec.tsx
```

Expected: FAIL because the client does not yet consume `tabs`.

- [ ] **Step 3: Make the client consume the resolved list**

Replace its fixed classification import with:

```ts
import type { NewsEventClassificationTab } from '@/lib/newsEventClassifications'
```

Add the resolved type to the block-owned import and props:

```ts
import {
  getNewsEventsTabsGridClasses,
  type NewsEventsTabsCardsPerRow,
  type NewsEventsTabsResolvedTab,
} from '@/blocks/NewsEventsTabs/newsEventsTabsShared'

type NewsEventsTabsClientProps = {
  cardsPerRow?: NewsEventsTabsCardsPerRow | null
  emptyStateMessage: string
  eventActionLabel: string
  groups: PublicNewsEventGroups
  newsActionLabel: string
  tabs: readonly NewsEventsTabsResolvedTab[]
}
```

Destructure `tabs`. Replace fixed-list state and traversal with:

```ts
const [activeTab, setActiveTab] = useState<NewsEventClassificationTab>('all')
const resolvedActiveTab = tabs.some(({ value }) => value === activeTab) ? activeTab : 'all'
const activeItems = groups[resolvedActiveTab] ?? []

const selectTab = (index: number) => {
  const tab = tabs[index]
  if (!tab) return
  setActiveTab(tab.value)
  tabRefs.current[index]?.focus()
}

const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
  const lastIndex = tabs.length - 1
  let nextIndex: number | undefined
  if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1
  if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = lastIndex
  if (nextIndex === undefined) return
  event.preventDefault()
  selectTab(nextIndex)
}
```

Render `tabs.map`, compare active state with `resolvedActiveTab`, and use `resolvedActiveTab` in the tabpanel's `aria-labelledby` and `id`.

- [ ] **Step 4: Resolve stored values in the presentation layer**

Use this import in `Presentation.tsx`:

```ts
import {
  resolveNewsEventsTabs,
  type NewsEventsTabsCardsPerRow,
  type NewsEventsTabsConfiguredTab,
} from '@/blocks/NewsEventsTabs/newsEventsTabsShared'
```

Add to `NewsEventsTabsBlockLike`:

```ts
allTabLabel?: string | null
tabs?: NewsEventsTabsConfiguredTab[] | null
```

Destructure both values, resolve them with:

```ts
const resolvedTabs = resolveNewsEventsTabs(allTabLabel, tabs)
```

Pass the result without changing other client props:

```tsx
<NewsEventsTabsClient
  cardsPerRow={cardsPerRow}
  emptyStateMessage={emptyStateMessage?.trim() || 'No entries in this classification.'}
  eventActionLabel={eventActionLabel?.trim() || 'View details'}
  groups={groups ?? createEmptyNewsEventGroups()}
  newsActionLabel={newsActionLabel?.trim() || 'Read update'}
  tabs={resolvedTabs}
/>
```

- [ ] **Step 5: Run focused behavior tests and typecheck**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-tabs.int.spec.tsx tests/int/news-events-data.int.spec.ts
pnpm exec tsc --noEmit --pretty false
```

Expected: tests and TypeScript pass. Group initialization still uses the shared fixed classification constant; only block presentation is configurable.

- [ ] **Step 6: Inspect the unstaged task diff**

```bash
git diff --check -- src/blocks/NewsEventsTabs/Presentation.tsx src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx tests/int/news-events-tabs.int.spec.tsx
git status --short -- src/blocks/NewsEventsTabs/Presentation.tsx src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx tests/int/news-events-tabs.int.spec.tsx
```

Expected: no whitespace errors and only intended modifications; do not stage or commit.

### Task 4: Update Documentation and Complete Verification

**Files:**
- Modify: `docs/guides/news-events.md`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Update if generated facts change: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: the approved schema and runtime behavior from Tasks 1–3.
- Produces: current editor guidance, maintained architecture context, and a verified uncommitted implementation.

- [ ] **Step 1: Update the News & Events editor guide**

Replace its fixed-tabs paragraph with:

```markdown
- `News & Events Tabs` is the separate text-only directory block. `All` is always first; editors
  can add, remove, rename, and reorder the News, Events, Notice, Holiday, Achievements,
  Announcement, and Others tabs, with each classification used at most once. The block loads 3, 6,
  9, or 12 entries per tab, supports 2–4 desktop columns, and retains the shared section appearance,
  optional header, header actions, footer actions, spacing, action labels, and empty-state controls.
```

- [ ] **Step 2: Update the Page block guide**

Change the catalog behavior to:

```markdown
Text-only cards under configurable classification tabs; All stays first, with 2–4 desktop columns and shared section settings
```

Replace the detailed fixed-order paragraph with:

```markdown
News Grid retains its established mixed grid, feature-card option, and title requirement. Use the
separate News & Events Tabs block for a configurable directory. All always renders first; editors
can add, remove, rename, and reorder the seven supported classification tabs without changing the
classification assigned to each entry. Editors choose 3, 6, 9, or 12 entries per tab and 2, 3, or
4 desktop columns. The section header is optional; shared appearance, header actions, footer
actions, alignment, spacing, empty-state, and action-label controls remain available. Its cards are
text-only and use semantic theme surfaces.
```

- [ ] **Step 3: Update maintained block-system knowledge**

Replace the fixed-tab statement with:

```markdown
News Grid retains its legacy grid and optional feature card. The separate News & Events Tabs block
renders text-only cards with a mandatory first All tab and an editor-ordered subset of the seven
classification tabs. Editors can rename classification tab labels, while duplicate classifications
are rejected. Legacy blocks fall back to the complete tab set. The block loads 3, 6, 9, or 12
server-loaded entries per tab, retains shared appearance, alignment, spacing, header actions, and
footer actions, and uses only semantic theme surfaces.
```

- [ ] **Step 4: Run focused integration coverage**

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-events-tabs.int.spec.tsx \
  tests/int/news-events-data.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/system-page-blocks.int.spec.ts \
  tests/int/admin-documentation.int.spec.ts
```

Expected: all selected tests pass.

- [ ] **Step 5: Complete the project-context update loop**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both commands exit 0. Keep generated inventory changes only if facts changed. A stale knowledge-graph warning is non-blocking under the project-context skill.

- [ ] **Step 6: Run final static validation**

```bash
pnpm generate:types
pnpm exec tsc --noEmit --pretty false
pnpm lint
```

Expected: generation and TypeScript pass. Lint passes or reports only a pre-existing warning unrelated to touched files.

- [ ] **Step 7: Run the complete integration suite**

```bash
pnpm test:int
```

Expected: all integration tests pass. If the existing SNMIH decimal-format assertion remains the sole failure, confirm it is unchanged from baseline and report it rather than editing theme values outside this task.

- [ ] **Step 8: Perform final scope and diff review**

```bash
git diff --check
git diff -- src/blocks/NewsEventsTabs src/payload-types.ts tests/int/news-events-tabs.int.spec.tsx docs/guides/news-events.md docs/guides/blocks.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
git status --short
```

Expected: no whitespace errors. News Grid, card visuals, theme CSS, collection classifications, and thumbnails have no new task-specific changes. Preserve unrelated worktree changes and leave this implementation uncommitted and unstaged.
