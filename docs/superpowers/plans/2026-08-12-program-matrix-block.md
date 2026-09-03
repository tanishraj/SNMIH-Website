# Program Matrix Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a theme-aware Program Matrix block with a seamless responsive matrix, flexible Lucide icons, and optional section and item actions.

**Architecture:** Keep Program Matrix independent from Program Grid. A Payload config owns editor validation, a React server component normalizes and renders content, and a focused resolver converts human-friendly CMS icon strings into Lucide component objects without shipping the registry to a client component.

**Tech Stack:** Payload CMS 3, Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, shadcn Button, Lucide React, Vitest, pnpm

## Global Constraints

- Use slug programMatrix, label Program Matrix, and interface ProgramMatrixBlock.
- Keep Program Grid unchanged and do not migrate existing content.
- Register the block in Pages, Reusable Sections, production rendering, live preview, thumbnails, and documentation.
- Render one column below md and two equal columns from md upward.
- Use one outer border, no gaps, non-doubled dividers, and theme radius only on the outer frame.
- Keep cells left-aligned; contentAlignment affects only the section introduction and section actions.
- Accept case, space, hyphen, underscore, and optional Icon-suffix variations of Lucide names.
- Invalid icons render nothing, never a fallback.
- Use semantic theme classes only.
- Item destinations render as explicit Button or Link Text controls, never whole-cell links.
- Add no client state, animation, filtering, pagination, images, badges, or programme collection.
- Do not stage or commit implementation changes unless the user explicitly requests it.

## File Map

- Create src/blocks/shared/resolveLucideIcon.ts for icon normalization.
- Create src/blocks/ProgramMatrix/config.ts for the Payload schema.
- Create src/blocks/ProgramMatrix/Component.tsx for server rendering.
- Create tests/int/program-matrix.int.spec.tsx for contracts.
- Modify src/collections/Pages.ts and src/collections/ReusableSections.ts for authoring.
- Modify src/blocks/renderPageBlocks.tsx and src/blocks/renderLivePreviewPageBlocks.tsx for renderer parity.
- Modify src/block-thumbnails/definitions.ts and src/block-thumbnails/fixtures.tsx for previews.
- Create public/block-thumbnails/program-matrix.jpg through the generator.
- Regenerate src/payload-types.ts.
- Modify docs/architecture/feature-inventory.md and docs/guides/blocks.md.

---

### Task 1: Flexible Lucide Resolver

**Files:**

- Create: src/blocks/shared/resolveLucideIcon.ts
- Create: tests/int/program-matrix.int.spec.tsx

**Interfaces:**

- Consumes: icons and LucideIcon from lucide-react.
- Produces: resolveLucideIcon(name?: string | null): LucideIcon | undefined.

- [ ] **Step 1: Write the failing resolver test**

```tsx
import { GraduationCap, Hospital, Users } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { resolveLucideIcon } from '@/blocks/shared/resolveLucideIcon'

describe('resolveLucideIcon', () => {
  it.each([
    ['Hospital', Hospital],
    ['hospital', Hospital],
    [' hospital ', Hospital],
    ['GraduationCap', GraduationCap],
    ['graduation-cap', GraduationCap],
    ['graduation_cap', GraduationCap],
    ['graduation cap icon', GraduationCap],
    ['users', Users],
  ])('resolves %s', (name, expectedIcon) => {
    expect(resolveLucideIcon(name)).toBe(expectedIcon)
  })

  it('omits empty and invalid names', () => {
    expect(resolveLucideIcon()).toBeUndefined()
    expect(resolveLucideIcon('')).toBeUndefined()
    expect(resolveLucideIcon('not-a-real-lucide-icon')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Prove it fails**

Run:

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the resolver module is absent.

- [ ] **Step 3: Implement the resolver**

```ts
import { icons, type LucideIcon } from 'lucide-react'

const normalizeLucideIconName = (value: string) =>
  value
    .trim()
    .replace(/icon$/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()

const iconLookup = new Map<string, LucideIcon>(
  Object.entries(icons).map(([name, Icon]) => [normalizeLucideIconName(name), Icon as LucideIcon]),
)

export function resolveLucideIcon(name?: string | null): LucideIcon | undefined {
  if (typeof name !== 'string') return undefined
  const normalizedName = normalizeLucideIconName(name)
  return normalizedName ? iconLookup.get(normalizedName) : undefined
}
```

- [ ] **Step 4: Run the focused test**

Expected: PASS for all resolver cases.

---

### Task 2: Payload Schema

**Files:**

- Create: src/blocks/ProgramMatrix/config.ts
- Modify: tests/int/program-matrix.int.spec.tsx

**Interfaces:**

- Consumes: shared appearance fields, content action fields, icon field, and thumbnail admin metadata.
- Produces: ProgramMatrixBlock: Block.

- [ ] **Step 1: Add failing schema assertions**

Use a recursive findNamedField(fields, name) helper and assert:

```tsx
expect(ProgramMatrixBlock).toMatchObject({
  slug: 'programMatrix',
  interfaceName: 'ProgramMatrixBlock',
  labels: { singular: 'Program Matrix', plural: 'Program Matrices' },
})
expect(findNamedField(ProgramMatrixBlock.fields, 'title')).toMatchObject({
  type: 'text',
  required: true,
})
expect(findNamedField(ProgramMatrixBlock.fields, 'items')).toMatchObject({
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 24,
})
expect(findNamedField(ProgramMatrixBlock.fields, 'actionMode')).toMatchObject({
  type: 'select',
  defaultValue: 'link',
  required: true,
})
expect(findNamedField(ProgramMatrixBlock.fields, 'itemActionLabel')).toMatchObject({
  type: 'text',
  defaultValue: 'Learn More',
})
expect(findNamedField(ProgramMatrixBlock.fields, 'contentAlignment')).toMatchObject({
  defaultValue: 'left',
  required: true,
})
expect(findNamedField(ProgramMatrixBlock.fields, 'size')).toMatchObject({
  defaultValue: 'default',
  required: true,
})
```

- [ ] **Step 2: Prove schema assertions fail**

Run the focused Vitest command. Expected: FAIL because the config is absent.

- [ ] **Step 3: Create the config**

Use admin getBlockThumbnailAdmin('programMatrix') and two tabs.

Content tab fields:

```ts
;[
  { name: 'eyebrow', type: 'text' },
  { name: 'title', type: 'text', required: true },
  { name: 'description', type: 'textarea' },
  createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
  {
    name: 'items',
    label: 'Programmes',
    type: 'array',
    required: true,
    minRows: 1,
    maxRows: 24,
    admin: { initCollapsed: true },
    fields: [
      createIconField({
        description:
          'Lucide icon name, such as Hospital, hospital, GraduationCap, or graduation-cap.',
      }),
      { name: 'title', type: 'text', required: true },
      {
        name: 'metadata',
        type: 'text',
        admin: { description: 'Short detail such as 4.5 Years + 1 Year Internship.' },
      },
      { name: 'description', type: 'textarea' },
      {
        name: 'linkType',
        label: 'Link',
        type: 'radio',
        defaultValue: 'none',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Page', value: 'page' },
          { label: 'Custom URL', value: 'custom' },
        ],
        admin: { layout: 'horizontal' },
      },
      {
        name: 'page',
        type: 'relationship',
        relationTo: 'pages',
        admin: { condition: isPageLink },
      },
      {
        name: 'url',
        label: 'Custom URL',
        type: 'text',
        admin: { condition: isCustomLink },
      },
      {
        name: 'openInNewTab',
        type: 'checkbox',
        defaultValue: false,
        admin: { condition: hasLink },
      },
    ],
  },
]
```

Layout & Theme tab fields:

```ts
;[
  createBlockAppearanceFields(),
  createContentActionModeField(),
  {
    name: 'actionVariant',
    label: 'Programme Button Variant',
    type: 'select',
    defaultValue: 'default',
    options: [
      { label: 'Primary', value: 'default' },
      { label: 'Secondary', value: 'secondary' },
      { label: 'Outline', value: 'outline' },
    ],
    admin: { condition: (_, siblingData) => siblingData?.actionMode === 'button' },
  },
  {
    name: 'itemActionLabel',
    label: 'Programme Action Label',
    type: 'text',
    defaultValue: 'Learn More',
  },
  {
    name: 'contentAlignment',
    label: 'Section Content Alignment',
    type: 'select',
    defaultValue: 'left',
    required: true,
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
    ],
  },
  {
    name: 'size',
    label: 'Section Padding',
    type: 'select',
    defaultValue: 'default',
    required: true,
    options: [
      { label: 'None', value: 'none' },
      { label: 'Compact', value: 'compact' },
      { label: 'Default', value: 'default' },
      { label: 'Comfortable', value: 'comfortable' },
    ],
  },
]
```

Define typed isPageLink, isCustomLink, and hasLink conditions like Program Grid. Use Payload satisfies annotations for radio, checkbox, select, and tabs fields.

- [ ] **Step 4: Verify schema**

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx --config ./vitest.config.mts
pnpm exec eslint src/blocks/ProgramMatrix/config.ts tests/int/program-matrix.int.spec.tsx
```

Expected: both exit 0.

---

### Task 3: Server Renderer And Matrix Layout

**Files:**

- Create: src/blocks/ProgramMatrix/Component.tsx
- Modify: tests/int/program-matrix.int.spec.tsx

**Interfaces:**

- Consumes: resolver, appearance/spacing helpers, getPageHref, resolveCmsActions, ContentActions, ContentLink, and Button.
- Produces: ProgramMatrixBlockComponent.

- [ ] **Step 1: Add failing renderer cases**

Render static markup and assert:

- h2/h3 hierarchy and data-program-matrix.
- md:grid-cols-2 plus four data-program-matrix-item values.
- hospital and graduation-cap Lucide classes.
- invalid icons omitted with no Star fallback.
- blank-title rows omitted.
- Link Text and Button actions render as explicit descendants.
- external new-tab actions use target blank and noopener noreferrer.
- three items expose data-left-column and data-last-desktop-row hooks.
- missing block title or no valid rows returns empty markup.
- section actions receive configured alignment and action mode.

Use these representative items:

```tsx
;[
  { icon: 'hospital', title: 'MBBS', metadata: '4.5 Years + 1 Year Internship' },
  { icon: 'graduation-cap', title: 'Postgraduate MD / MS', metadata: '3 Years' },
  { icon: 'heart-pulse', title: 'GNM & B.Sc Nursing', metadata: '3–4 Years' },
  { icon: 'microscope', title: 'Allied Health Sciences', metadata: '2–3 Years' },
]
```

- [ ] **Step 2: Prove renderer cases fail**

Run the focused Vitest command. Expected: FAIL because the component is absent.

- [ ] **Step 3: Normalize content**

Define local types matching the config. Trim text, omit blank titles, use getPageHref for Page links, trim Custom URLs, resolve icons through resolveLucideIcon, resolve section actions through resolveCmsActions, and return null without a title or valid items.

- [ ] **Step 4: Render the introduction**

Apply regularBlockMobilePaddingClasses[size] and resolved appearance to section. Use regularBlockContainerClasses inside. Render mono uppercase primary eyebrow, serif h2, muted description, and ContentActions with alignment and mode passed explicitly.

- [ ] **Step 5: Render exact matrix dividers**

```tsx
const isLastItem = index === resolvedItems.length - 1
const isLeftColumn = index % 2 === 0
const lastDesktopRowStart = resolvedItems.length - (resolvedItems.length % 2 || 2)
const isLastDesktopRow = index >= lastDesktopRowStart
```

Use this frame and article class contract:

```tsx
<div
  className="grid overflow-hidden rounded-[var(--radius)] border border-border bg-card text-card-foreground md:grid-cols-2"
  data-program-matrix="true"
>
  <article
    className={cn(
      'flex min-w-0 flex-col p-6 text-left sm:p-8 md:p-10',
      !isLastItem && 'border-b border-border',
      isLastDesktopRow && 'md:border-b-0',
      isLeftColumn && 'md:border-r md:border-border',
    )}
    data-last-desktop-row={isLastDesktopRow ? 'true' : undefined}
    data-left-column={isLeftColumn ? 'true' : undefined}
    data-program-matrix-item="true"
  />
</div>
```

Inside each article:

- render a valid icon with aria-hidden, focusable false, size-6, and text-primary;
- render title as serif h3;
- render metadata as mono uppercase muted text;
- render description as readable muted text;
- render an intrinsic-width action after content with mt-auto pt-6.

Button mode uses Button asChild, size sm, and actionVariant. Link mode uses ContentLink. Neither mode wraps article.

- [ ] **Step 6: Verify rendering**

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx --config ./vitest.config.mts
pnpm exec eslint src/blocks/ProgramMatrix/Component.tsx tests/int/program-matrix.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: all exit 0.

---

### Task 4: Registrations And Generated Types

**Files:**

- Modify: src/collections/Pages.ts
- Modify: src/collections/ReusableSections.ts
- Modify: src/blocks/renderPageBlocks.tsx
- Modify: src/blocks/renderLivePreviewPageBlocks.tsx
- Modify: src/payload-types.ts
- Modify: tests/int/program-matrix.int.spec.tsx

**Interfaces:**

- Consumes: ProgramMatrixBlock and ProgramMatrixBlockComponent.
- Produces: authoring, production/live-preview parity, and generated types.

- [ ] **Step 1: Add failing registration assertions**

Read the five affected sources and assert:

```tsx
expect(pagesSource).toContain('ProgramMatrixBlock')
expect(reusableSectionsSource).toContain('ProgramMatrixBlock')
expect(pageRendererSource).toContain("case 'programMatrix':")
expect(livePreviewRendererSource).toContain("case 'programMatrix':")
expect(payloadTypesSource).toContain('export interface ProgramMatrixBlock')
expect(payloadTypesSource).toContain("blockType: 'programMatrix'")
```

- [ ] **Step 2: Prove the assertions fail**

Run the focused test. Expected: FAIL for every missing registration.

- [ ] **Step 3: Register the schema**

Import ProgramMatrixBlock in Pages and Reusable Sections and add it immediately after ProgramGridBlock in both arrays.

- [ ] **Step 4: Register both renderers**

Import ProgramMatrixBlockComponent in both renderers and add:

```tsx
case 'programMatrix':
  return <ProgramMatrixBlockComponent key={block.id ?? index} {...block} />
```

Retain each renderer's current key-variable convention.

- [ ] **Step 5: Generate types**

```bash
pnpm generate:types
```

Expected: src/payload-types.ts contains ProgramMatrixBlock and the programMatrix discriminant.

- [ ] **Step 6: Verify registration parity**

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx --config ./vitest.config.mts
pnpm exec tsc --noEmit
```

Expected: all exit 0.

---

### Task 5: Thumbnail And Documentation

**Files:**

- Modify: src/block-thumbnails/definitions.ts
- Modify: src/block-thumbnails/fixtures.tsx
- Create: public/block-thumbnails/program-matrix.jpg
- Modify: docs/architecture/feature-inventory.md
- Modify: docs/guides/blocks.md
- Modify: tests/int/program-matrix.int.spec.tsx

**Interfaces:**

- Consumes: ProgramMatrixBlockComponent and the thumbnail generator.
- Produces: picker preview, representative fixture, and documented operator catalog.

- [ ] **Step 1: Add failing catalog assertions**

Assert definition contains filename program-matrix.jpg and slug programMatrix, fixture contains programMatrix and ProgramMatrixBlockComponent, feature inventory says Normal Pages register 40 choices and contains Program Matrix, and the guide contains a Program Matrix table row.

- [ ] **Step 2: Prove the assertions fail**

Run the focused test. Expected: FAIL for missing catalog entries.

- [ ] **Step 3: Add thumbnail definition**

```ts
defineThumbnail({
  alt: 'Program Matrix block preview',
  filename: 'program-matrix.jpg',
  label: 'Program Matrix',
  slug: 'programMatrix',
  stageAlignment: 'top',
}),
```

Place it immediately after Program Grid.

- [ ] **Step 4: Add fixture**

Import ProgramMatrixBlockComponent and add programMatrix immediately after programGrid. Use muted appearance, compact size, eyebrow Academics, title Programmes offered, the approved section description, and these items:

```tsx
;[
  {
    icon: 'stethoscope',
    title: 'MBBS',
    metadata: '4.5 Years + 1 Year Internship',
    description: '150 seats approved by the National Medical Commission.',
  },
  {
    icon: 'graduation-cap',
    title: 'Postgraduate MD / MS',
    metadata: '3 Years',
    description: 'Residencies across medicine, surgery, paediatrics, and radiology.',
  },
  {
    icon: 'heart-pulse',
    title: 'GNM & B.Sc Nursing',
    metadata: '3–4 Years',
    description: 'Recognised nursing programmes with supervised hospital rotations.',
  },
  {
    icon: 'microscope',
    title: 'Allied Health Sciences',
    metadata: '2–3 Years',
    description: 'Diploma and degree tracks in clinical support disciplines.',
  },
]
```

- [ ] **Step 5: Generate the 1600×900 JPEG**

```bash
BLOCK_THUMBNAIL_SLUG=programMatrix pnpm generate:block-thumbnails
```

Expected: public/block-thumbnails/program-matrix.jpg is created and the command exits 0.

- [ ] **Step 6: Update docs**

Change 39 to 40 in the feature inventory and insert Program Matrix after Program Grid. Add this guide row immediately after Program Grid:

```markdown
| Program Matrix | Academic programmes or structured offerings | Seamless one/two-column matrix with flexible Lucide icons and optional Button or Link Text actions |
```

- [ ] **Step 7: Verify catalog parity**

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts --config ./vitest.config.mts
```

Expected: all pass, including one definition and fixture for Program Matrix.

---

### Task 6: Complete Verification

**Files:**

- Verify only the files from Tasks 1–5.

**Interfaces:**

- Consumes: complete Program Matrix change.
- Produces: build-ready evidence.

- [ ] **Step 1: Check patch integrity**

```bash
git diff --check
```

Expected: exit 0 with no output.

- [ ] **Step 2: Run integration tests**

```bash
pnpm run test:int
```

Expected: exit 0.

- [ ] **Step 3: Run lint and TypeScript**

```bash
pnpm run lint
pnpm exec tsc --noEmit
```

Expected: both exit 0 without errors.

- [ ] **Step 4: Run production build**

```bash
pnpm run build
```

Expected: Next.js compiles, type checks, prerenders, and exits 0. The existing middleware-to-proxy warning is non-blocking.

- [ ] **Step 5: Review scope**

```bash
git status --short
git diff --check
git diff --stat
```

Expected: only the approved Program Matrix implementation, shared resolver, generated types, thumbnail, tests, plan/spec, and docs are present; Program Grid is untouched.
