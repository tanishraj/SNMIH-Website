# Q&A Accordion Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the FAQ block with the canonical Q&A Accordion identity while preserving all three local Home-page blocks and every stored page version.

**Architecture:** Perform a clean rename across the Payload schema, React renderer, thumbnails, tests, and generated types with no runtime alias. After the new schema is ready, run one direct local MongoDB rewrite against `pages.layout` and `_pages_versions.version.layout`, including `faqPlacement` to `accordionPlacement`, then verify the frontend and database contain only the new identity.

**Tech Stack:** Payload CMS 3.85, React 19, Next.js 16, TypeScript 5.7, MongoDB, Vitest.

## Global Constraints

- Canonical slug is `qaAccordion`.
- Canonical type names are `QaAccordionBlock` and `QaAccordionBlockComponent`.
- Canonical placement field is `accordionPlacement`.
- Admin labels are `Q&A Accordion` and `Q&A Accordions`.
- Thumbnail identity is `qa-accordion.jpg` and `qaAccordion`.
- No `faq` runtime alias, compatibility branch, or persistent migration file is allowed.
- Preserve all block IDs, content, order, appearance, layout, actions, draft state, and published state.
- Update both `pages.layout` and `_pages_versions.version.layout` in the local database.
- Historical design documents may retain descriptive FAQ prose; runtime source, generated types, tests, and thumbnail assets may not retain the old block identity.
- Do not stage or commit any files.

---

### Task 1: Establish the canonical test contract

**Files:**
- Move: `tests/int/faq-render.int.spec.ts` → `tests/int/qa-accordion.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `tests/int/block-thumbnails.int.spec.ts`

**Interfaces:**
- Produces: failing expectations for `qaAccordion`, `QaAccordionBlock`, `QaAccordionBlockComponent`, `accordionPlacement`, `data-qa-accordion-*`, and `qa-accordion.jpg`.

- [ ] **Step 1: Rename the focused render test and its identifiers**

```ts
import { QaAccordionBlockComponent } from '@/blocks/QaAccordion/Component'

describe('Q&A Accordion block', () => {
  createElement(QaAccordionBlockComponent, {
    accordionPlacement: 'right',
    heading: 'Frequently asked questions',
    items: [{ answer: createRichText('Answer'), question: 'Question?' }],
  })
})
```

Apply these exact replacements throughout the moved test: `FaqBlockComponent` → `QaAccordionBlockComponent`, `faqPlacement` → `accordionPlacement`, `data-faq-` → `data-qa-accordion-`, and `faq block` → `Q&A Accordion block`.

- [ ] **Step 2: Change schema and registration expectations**

```ts
const { QaAccordionBlock } = await import('@/blocks/QaAccordion/config')
expect(layoutField?.blocks?.map((block) => block.slug)).toContain('qaAccordion')
expect(layoutField?.blocks?.map((block) => block.slug)).not.toContain('faq')
```

Assert the placement field name is `accordionPlacement`. Update the system-page exclusion list from `faq` to `qaAccordion`.

- [ ] **Step 3: Change thumbnail expectations**

```ts
expect(getBlockThumbnailDefinition('qaAccordion')).toMatchObject({
  filename: 'qa-accordion.jpg',
  label: 'Q&A Accordion',
  slug: 'qaAccordion',
})
```

Assert no `faq` thumbnail definition remains.

- [ ] **Step 4: Run the renamed tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/qa-accordion.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/system-page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts
```

Expected: fail because the Q&A Accordion source identity is not implemented yet.

### Task 2: Rename the Payload block and renderer

**Files:**
- Move: `src/blocks/Faq/config.ts` → `src/blocks/QaAccordion/config.ts`
- Move: `src/blocks/Faq/Component.tsx` → `src/blocks/QaAccordion/Component.tsx`
- Modify: `src/collections/Pages.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`

**Interfaces:**
- Produces: `QaAccordionBlock`, `QaAccordionBlockComponent`, and the only renderer case `qaAccordion`.
- Consumes: existing fields and render behavior without visual changes.

- [ ] **Step 1: Rename the config identity**

```ts
type QaAccordionBlockSiblingData = {
  layoutMode?: 'fiftyFifty' | 'fullWidth' | 'oneThird' | null
}

export const QaAccordionBlock: Block = {
  slug: 'qaAccordion',
  interfaceName: 'QaAccordionBlock',
  admin: getBlockThumbnailAdmin('qaAccordion'),
  labels: {
    singular: 'Q&A Accordion',
    plural: 'Q&A Accordions',
  },
}
```

Rename the items field label to `Q&A Items`, rename `faqPlacement` to `accordionPlacement`, and rename local FAQ-specific symbols to Q&A Accordion terminology.

- [ ] **Step 2: Rename the component identity and DOM contract**

```ts
type QaAccordionBlockLike = {
  accordionPlacement?: 'left' | 'right' | null
}

export function QaAccordionBlockComponent(props: QaAccordionBlockLike) {}
```

Apply these exact symbol replacements without altering JSX structure or class strings: `FaqBlockLike` → `QaAccordionBlockLike`, `FaqAccordion` → `QaAccordion`, `FaqAccordionItem` → `QaAccordionItem`, `FaqAccordionTrigger` → `QaAccordionTrigger`, `FaqAccordionContent` → `QaAccordionContent`, `faqPlacementClasses` → `accordionPlacementClasses`, `faqPlacement` → `accordionPlacement`, `resolvedFaqPlacement` → `resolvedAccordionPlacement`, `faqContent` → `accordionContent`, and `data-faq-` → `data-qa-accordion-`.

- [ ] **Step 3: Register and render only the new block**

```ts
import { QaAccordionBlock } from '@/blocks/QaAccordion/config'

// Pages layout list
QaAccordionBlock

// renderPageBlocks switch
case 'qaAccordion':
  return <QaAccordionBlockComponent key={block.id ?? `${block.blockType}-${index}`} {...block} />
```

- [ ] **Step 4: Run schema and render tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/qa-accordion.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/system-page-blocks.int.spec.ts
```

Expected: block schema and render tests pass; thumbnail tests remain pending.

### Task 3: Rename the thumbnail identity and asset

**Files:**
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Move: `public/block-thumbnails/faq.jpg` → `public/block-thumbnails/qa-accordion.jpg`
- Test: `tests/int/block-thumbnails.int.spec.ts`

**Interfaces:**
- Produces: preview slug `qaAccordion`, fixture key `qaAccordion`, and exact asset `qa-accordion.jpg`.

- [ ] **Step 1: Replace the thumbnail definition**

```ts
defineThumbnail({
  alt: 'Q&A Accordion block preview',
  filename: 'qa-accordion.jpg',
  label: 'Q&A Accordion',
  slug: 'qaAccordion',
  stageAlignment: 'top',
})
```

- [ ] **Step 2: Rename the fixture key and component**

```tsx
qaAccordion: (
  <QaAccordionBlockComponent
    heading="Questions and answers"
    items={qaAccordionFixtureItems}
    layoutMode="fiftyFifty"
    sideActionMode="link"
    size="compact"
  />
)
```

Rename `faqFixtureItems` to `qaAccordionFixtureItems`; preserve the existing descriptions, actions, profile, and item values.

- [ ] **Step 3: Rename the existing JPEG asset**

Move `public/block-thumbnails/faq.jpg` to `public/block-thumbnails/qa-accordion.jpg` without changing its binary contents.

- [ ] **Step 4: Run thumbnail tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts`

Expected: the manifest, fixture, preview identity, and exact thumbnail file contract pass.

### Task 4: Regenerate Payload types

**Files:**
- Modify: `src/payload-types.ts`

**Interfaces:**
- Consumes: `QaAccordionBlock` schema.
- Produces: `QaAccordionBlock`, `QaAccordionBlockSelect`, and `blockType: 'qaAccordion'` generated types.

- [ ] **Step 1: Generate types**

Run: `pnpm run generate:types`

Expected: command succeeds and rewrites `src/payload-types.ts`.

- [ ] **Step 2: Verify generated identity**

Run:

```bash
rg -n "QaAccordionBlock|qaAccordion|accordionPlacement" src/payload-types.ts
rg -n "FaqBlock|blockType: 'faq'|faqPlacement" src/payload-types.ts
```

Expected: the first search finds generated declarations; the second returns no matches.

### Task 5: Rewrite local page documents and versions

**Files:**
- Modify external local state: MongoDB database `payload-cms-starter-kit`
- No migration file is created.

**Interfaces:**
- Consumes: `pages.layout` and `_pages_versions.version.layout` blocks with `blockType: 'faq'`.
- Produces: equivalent blocks with `blockType: 'qaAccordion'` and `accordionPlacement`.

- [ ] **Step 1: Capture and rewrite the matching layouts with rollback protection**

Run this logic through `pnpm exec tsx -e` with the local `DATABASE_URL` and a development `PAYLOAD_SECRET`:

```ts
import { getPayload } from 'payload'
import config from './src/payload.config.ts'

const payload = await getPayload({ config })
const database = (payload.db as any).connection.db
const targets = [
  { collection: 'pages', query: { 'layout.blockType': 'faq' }, versioned: false },
  {
    collection: '_pages_versions',
    query: { 'version.layout.blockType': 'faq' },
    versioned: true,
  },
]
const backups: Array<{
  collection: string
  id: unknown
  layout: Record<string, unknown>[]
  versioned: boolean
}> = []

const renameLayout = (layout: Record<string, unknown>[]) =>
  layout.map((block) => {
    if (block.blockType !== 'faq') return block
    const { faqPlacement, ...rest } = block
    return {
      ...rest,
      blockType: 'qaAccordion',
      ...(faqPlacement === undefined ? {} : { accordionPlacement: faqPlacement }),
    }
  })

try {
  for (const target of targets) {
    const collection = database.collection(target.collection)
    const documents = await collection.find(target.query).toArray()
    const operations = documents.map((document: any) => {
      const layout = target.versioned ? document.version.layout : document.layout
      backups.push({
        collection: target.collection,
        id: document._id,
        layout,
        versioned: target.versioned,
      })
      return {
        updateOne: {
          filter: { _id: document._id },
          update: {
            $set: {
              [target.versioned ? 'version.layout' : 'layout']: renameLayout(layout),
            },
          },
        },
      }
    })
    if (operations.length) await collection.bulkWrite(operations)
  }
} catch (error) {
  for (const backup of backups) {
    await database.collection(backup.collection).updateOne(
      { _id: backup.id },
      { $set: { [backup.versioned ? 'version.layout' : 'layout']: backup.layout } },
    )
  }
  throw error
}
```

Before the writes, record the three current block IDs and their question arrays from the `pages` document. The command must print collection document counts and those fingerprints before and after the rewrite.

- [ ] **Step 2: Verify the rewritten database**

Query both collections for:

```ts
{ 'layout.blockType': 'faq' }
{ 'version.layout.blockType': 'faq' }
{ 'layout.faqPlacement': { $exists: true } }
{ 'version.layout.faqPlacement': { $exists: true } }
```

Expected: every old query returns zero. Confirm the current Home page has three `qaAccordion` blocks with the same IDs and questions recorded before the rewrite.

### Task 6: Final runtime and repository verification

**Files:**
- Verify all files modified in Tasks 1–5.

**Interfaces:**
- Produces: evidence that Q&A Accordion is the sole runtime identity and content still renders.

- [ ] **Step 1: Run focused integration tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/qa-accordion.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/system-page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts
```

Expected: all focused tests pass.

- [ ] **Step 2: Run lint and diff checks**

Run ESLint on all renamed and modified TypeScript files, `git diff --check`, and `git diff --cached --name-only`.

Expected: no lint errors, no whitespace errors, and no staged files.

- [ ] **Step 3: Search for obsolete runtime identity**

Run:

```bash
rg -n "FaqBlock|FaqBlockComponent|@/blocks/Faq|./Faq|blockType: 'faq'|slug: 'faq'|faqPlacement|data-faq-|faq\.jpg" src tests public/block-thumbnails
```

Expected: no matches.

- [ ] **Step 4: Verify the frontend and thumbnail preview**

At the local Home page, confirm three `section[data-qa-accordion-size]` elements render. Confirm `/block-thumbnail-previews/qaAccordion` returns successfully and the old `/block-thumbnail-previews/faq` identity is unavailable.
