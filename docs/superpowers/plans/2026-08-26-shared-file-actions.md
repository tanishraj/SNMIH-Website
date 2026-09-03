# Shared File Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let every block using the shared content-action field render Page, Custom URL, File View, or File Download destinations without changing its established Button/Link appearance.

**Architecture:** Extend `createContentActionsField` once, then resolve all destination behavior in `cmsLinks.ts`. `ContentActions` remains the canonical row renderer, while composition-specific renderers consume a shared anchor-props helper so download, target, and rel semantics cannot drift.

**Tech Stack:** Payload CMS 3, React 19, Next.js 15, TypeScript, Vitest, React DOM static rendering.

## Global Constraints

- Existing Page, Custom URL, reusable Navigation Link, Button/Link mode, variant, arrow, alignment, and theme behavior remain unchanged.
- File accepts any Media asset.
- File View defaults to a new tab; File Download never opens a new tab.
- Missing labels or unresolved destinations render no action.
- No content migration script is required.
- Specialized Download List, Fee Structure, Calendar, and Annual Calendar panels remain separate.
- Do not commit unless the user explicitly asks.

## File Structure

- `src/blocks/shared/contentActionsFields.ts`: shared Payload action schema.
- `src/lib/cmsLinks.ts`: canonical destination resolution and anchor semantics.
- `src/components/ContentActions.tsx`: canonical action-row renderer.
- `src/blocks/Services21/Component.tsx`: specialized service CTA.
- `src/blocks/ProgramMatrix/Component.tsx`: specialized programme CTA.
- `src/blocks/MediaCarousel/MediaCarouselClient.tsx`: specialized carousel CTA.
- `src/blocks/HeroBanner/Component.tsx`: specialized overlay CTA.
- `src/blocks/HeroCarousel/HeroCarouselClient.tsx`: specialized slide CTA.
- `tests/int/content-action-presentation.int.spec.tsx`: schema, resolver, renderer, and parity tests.
- `src/payload-types.ts`: regenerated Payload types.
- `.agents/skills/project-context/references/block-system.md`: maintained action contract.

---

### Task 1: Shared File Destination Fields

**Files:**
- Modify: `src/blocks/shared/contentActionsFields.ts`
- Test: `tests/int/content-action-presentation.int.spec.tsx`

**Interfaces:**
- Produces fields `file`, `fileBehavior`, and `openFileInNewTab` when `linkType === 'file'`.
- Keeps `openInNewTab` exclusive to Page and Custom URL destinations.

- [x] **Step 1: Write failing schema tests**

Extend `TestField` with `options?: Array<{ label: string; value: string }>` and `relationTo?: string`, then add:

```tsx
it('offers Page, Custom URL, and File destinations', () => {
  const fields = getActionTabs(true).find((tab) => tab.label === 'Content')?.fields ?? []
  const linkType = fields.find((field) => field.name === 'linkType')

  expect(linkType?.options?.map((option) => option.value)).toEqual(['page', 'custom', 'file'])
  expect(fields.find((field) => field.name === 'file')).toMatchObject({
    relationTo: 'media',
    type: 'upload',
  })
  expect(fields.find((field) => field.name === 'fileBehavior')).toMatchObject({
    defaultValue: 'view',
    type: 'select',
  })
  expect(fields.find((field) => field.name === 'openFileInNewTab')).toMatchObject({
    defaultValue: true,
    type: 'checkbox',
  })
})

it('shows destination controls only for matching action data', () => {
  const fields = getActionTabs(true).find((tab) => tab.label === 'Content')?.fields ?? []
  const condition = (name: string) =>
    fields.find((field) => field.name === name)?.admin?.condition as
      | ((_data: unknown, siblings: Record<string, unknown>) => boolean)
      | undefined

  expect(condition('page')?.({}, { linkType: 'page' })).toBe(true)
  expect(condition('url')?.({}, { linkType: 'custom' })).toBe(true)
  expect(condition('file')?.({}, { linkType: 'file' })).toBe(true)
  expect(condition('openInNewTab')?.({}, { linkType: 'file' })).toBe(false)
  expect(condition('openFileInNewTab')?.({}, { fileBehavior: 'view', linkType: 'file' })).toBe(true)
  expect(
    condition('openFileInNewTab')?.({}, { fileBehavior: 'download', linkType: 'file' }),
  ).toBe(false)
})
```

- [x] **Step 2: Run the test and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-action-presentation.int.spec.tsx
```

Expected: FAIL because File fields and conditions do not exist.

- [x] **Step 3: Add shared schema fields**

Add the destination data and conditions:

```ts
type LinkSiblingData = {
  fileBehavior?: 'download' | 'view' | null
  linkType?: 'custom' | 'file' | 'page' | null
}

const isFileLink = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'file'

const isNavigationalLink = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'page' || siblingData?.linkType === 'custom'

const isFileView = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'file' && siblingData?.fileBehavior !== 'download'
```

Append `{ label: 'File', value: 'file' }` to `linkType.options`, condition the existing `openInNewTab` with `isNavigationalLink`, and add:

```ts
{
  name: 'file',
  label: 'File',
  type: 'upload',
  relationTo: 'media',
  admin: {
    condition: isFileLink,
    description: 'Choose the Media asset this action should view or download.',
  },
},
{
  name: 'fileBehavior',
  label: 'File Behavior',
  type: 'select',
  defaultValue: 'view',
  options: [
    { label: 'View', value: 'view' },
    { label: 'Download', value: 'download' },
  ],
  admin: { condition: isFileLink },
} satisfies SelectField,
{
  name: 'openFileInNewTab',
  label: 'Open View in New Tab',
  type: 'checkbox',
  defaultValue: true,
  admin: { condition: isFileView },
} satisfies CheckboxField,
```

- [x] **Step 4: Re-run the targeted test**

Run the Step 2 command. Expected: PASS.

---

### Task 2: Central View and Download Resolution

**Files:**
- Modify: `src/lib/cmsLinks.ts`
- Test: `tests/int/content-action-presentation.int.spec.tsx`

**Interfaces:**
- Consumes `getMediaAbsoluteUrl(media)` and populated `Media.filename`.
- Produces `ResolvedCmsAction.download?: string | true`.
- Produces `getCmsActionAnchorProps(action)` with `href`, `download`, `rel`, and `target`.

- [x] **Step 1: Write failing resolution tests**

Import `getCmsActionAnchorProps`, define a populated Media fixture, and add:

```tsx
const file = {
  id: 'media-1',
  alt: 'Programme handbook',
  filename: 'programme-handbook.pdf',
  mimeType: 'application/pdf',
  updatedAt: '2026-08-26T00:00:00.000Z',
  createdAt: '2026-08-26T00:00:00.000Z',
  url: '/api/media/file/programme-handbook.pdf',
} as const

it('resolves File View with its own new-tab preference', () => {
  expect(
    resolveCmsActions([
      {
        file,
        fileBehavior: 'view',
        label: 'View handbook',
        linkType: 'file',
        openFileInNewTab: true,
      },
    ]),
  ).toEqual([
    expect.objectContaining({
      download: undefined,
      href: '/api/media/file/programme-handbook.pdf',
      openInNewTab: true,
    }),
  ])
})

it('resolves File Download without opening another tab', () => {
  const [action] = resolveCmsActions([
    {
      file,
      fileBehavior: 'download',
      label: 'Download handbook',
      linkType: 'file',
      openFileInNewTab: true,
    },
  ])

  expect(action).toMatchObject({
    download: 'programme-handbook.pdf',
    href: '/api/media/file/programme-handbook.pdf',
    openInNewTab: false,
  })
  expect(getCmsActionAnchorProps(action)).toEqual({
    download: 'programme-handbook.pdf',
    href: '/api/media/file/programme-handbook.pdf',
    rel: undefined,
    target: undefined,
  })
})

it('omits unresolved File relationships', () => {
  expect(resolveCmsActions([{ file: 'media-1', label: 'Broken', linkType: 'file' }])).toEqual([])
})
```

- [x] **Step 2: Run the test and verify failure**

Run the Task 1 command. Expected: FAIL with unsupported File properties and missing helper.

- [x] **Step 3: Extend the shared types and resolver**

Use these contracts:

```ts
import type { Media, NavigationLink, Page } from '@/payload-types'
import { getMediaAbsoluteUrl, isMediaDoc } from './media'

export type CmsLinkValue = {
  file?: string | number | Media | null
  fileBehavior?: 'download' | 'view' | null
  link?: string | number | NavigationLink | null
  linkType?: 'page' | 'custom' | 'file' | null
  openFileInNewTab?: boolean | null
  openInNewTab?: boolean | null
  page?: string | number | Page | null
  url?: string | null
}

export type ResolvedCmsAction = {
  download?: string | true
  href: string
  label: string
  mode: CmsActionMode
  openInNewTab?: boolean
  showArrow: boolean
  variant: CmsActionVariant
}
```

Resolve File before existing reusable-link/Page/URL logic:

```ts
if (value.linkType === 'file') {
  const href = getMediaAbsoluteUrl(value.file)
  if (!href) return {}

  const downloadsFile = value.fileBehavior === 'download'
  const filename = isMediaDoc(value.file) ? value.file.filename?.trim() : undefined

  return {
    download: downloadsFile ? filename || true : undefined,
    href,
    openInNewTab: downloadsFile ? false : (value.openFileInNewTab ?? true),
  }
}
```

Forward `destination.download` from `resolveCmsActions`, and export:

```ts
export const getCmsActionAnchorProps = (
  action: Pick<ResolvedCmsAction, 'download' | 'href' | 'openInNewTab'>,
) => ({
  download: action.download,
  href: action.href,
  rel: action.openInNewTab ? ('noreferrer' as const) : undefined,
  target: action.openInNewTab ? ('_blank' as const) : undefined,
})
```

- [x] **Step 4: Re-run the targeted test**

Run the Task 1 command. Expected: PASS.

---

### Task 3: Render File Semantics on Every Shared Action Surface

**Files:**
- Modify: `src/components/ContentActions.tsx`
- Modify: `src/blocks/Services21/Component.tsx`
- Modify: `src/blocks/ProgramMatrix/Component.tsx`
- Modify: `src/blocks/MediaCarousel/MediaCarouselClient.tsx`
- Modify: `src/blocks/HeroBanner/Component.tsx`
- Modify: `src/blocks/HeroCarousel/HeroCarouselClient.tsx`
- Test: `tests/int/content-action-presentation.int.spec.tsx`

**Interfaces:**
- Consumes `getCmsActionAnchorProps` and `ResolvedCmsAction.download` from Task 2.
- Produces identical View/Download semantics for canonical and specialized renderers.

- [x] **Step 1: Write failing rendering and parity tests**

```tsx
it('renders downloads for shared Button and Link actions', () => {
  const html = renderToStaticMarkup(
    createElement(ContentActions, {
      actions: [
        {
          download: 'button.pdf',
          href: '/button.pdf',
          label: 'Download button',
          mode: 'button',
          openInNewTab: false,
          showArrow: false,
          variant: 'default',
        },
        {
          download: 'link.pdf',
          href: '/link.pdf',
          label: 'Download link',
          mode: 'link',
          openInNewTab: false,
          showArrow: false,
          variant: 'default',
        },
      ],
    }),
  )

  expect(html).toMatch(/<a(?=[^>]*href="\/button\.pdf")(?=[^>]*download="button\.pdf")[^>]*>/)
  expect(html).toMatch(/<a(?=[^>]*href="\/link\.pdf")(?=[^>]*download="link\.pdf")[^>]*>/)
  expect(html).not.toContain('target="_blank"')
})

it.each([
  'src/blocks/Services21/Component.tsx',
  'src/blocks/ProgramMatrix/Component.tsx',
  'src/blocks/MediaCarousel/MediaCarouselClient.tsx',
  'src/blocks/HeroBanner/Component.tsx',
  'src/blocks/HeroCarousel/HeroCarouselClient.tsx',
])('forwards Button file-action semantics in %s', (file) => {
  const source = readFileSync(file, 'utf8')
  expect(source).toContain('getCmsActionAnchorProps')
  expect(source).toContain('download=')
})

```

- [x] **Step 2: Run the targeted test and verify failure**

Run the Task 1 command. Expected: FAIL because renderers do not forward `download`.

- [x] **Step 3: Update `ContentActions`**

Import `getCmsActionAnchorProps`. Render Buttons with:

```tsx
<a {...getCmsActionAnchorProps(action)}>
  <ActionButtonContent label={action.label} showArrow={action.showArrow} />
</a>
```

Render Links with:

```tsx
<ContentLink
  className={linkClassName}
  download={action.download}
  href={action.href}
  label={action.label}
  openInNewTab={action.openInNewTab}
/>
```

- [x] **Step 4: Update the specialized renderers**

For every file listed in Task 3:

1. Import `getCmsActionAnchorProps` from `@/lib/cmsLinks`.
2. Replace Button-anchor `href`, `rel`, and `target` with `<a {...getCmsActionAnchorProps(action)}>` using the local action variable.
3. Add `download={action.download}` to each `ContentLink` receiving a resolved shared action.

Use these exact local expressions:

| File | Anchor helper argument | ContentLink download value |
| --- | --- | --- |
| `src/blocks/Services21/Component.tsx` | `action` | `action.download` |
| `src/blocks/ProgramMatrix/Component.tsx` | `action` | `action.download` |
| `src/blocks/MediaCarousel/MediaCarouselClient.tsx` | `item.action` | `item.action.download` |
| `src/blocks/HeroBanner/Component.tsx` | `action` | `action.download` |
| `src/blocks/HeroCarousel/HeroCarouselClient.tsx` | `button` | `button.download` |

For example, Hero Banner's branches become:

```tsx
<ContentLink
  className={cn('w-full sm:w-auto', mediaOverlay.text.link)}
  download={action.download}
  href={action.href}
  label={action.label}
  openInNewTab={action.openInNewTab}
/>

<a {...getCmsActionAnchorProps(action)}>
  <ActionButtonContent label={action.label} showArrow={action.showArrow} />
</a>
```

Do not alter classes, sizes, variants, layout, or arrow behavior.

- [x] **Step 5: Re-run the targeted test**

Run the Task 1 command. Expected: PASS.

---

### Task 4: Generate Types, Document, and Verify

**Files:**
- Regenerate: `src/payload-types.ts`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Update: generated project-context artifacts selected by `project-context:update`
- Test: `tests/int/content-action-presentation.int.spec.tsx`

**Interfaces:**
- Consumes the completed schema and runtime contract.
- Produces current generated action types and maintained project knowledge.

- [x] **Step 1: Generate Payload types**

```bash
pnpm generate:types
```

Expected: exit 0; generated action rows include File fields.

- [x] **Step 2: Add a generated-type regression test**

```tsx
it('keeps generated action rows aligned with File destinations', () => {
  const source = readFileSync('src/payload-types.ts', 'utf8')
  expect(source).toContain("linkType?: ('page' | 'custom' | 'file') | null")
  expect(source).toContain("fileBehavior?: ('view' | 'download') | null")
  expect(source).toContain('openFileInNewTab?: boolean | null')
})
```

- [x] **Step 3: Document the maintained block contract**

Add this to the shared-action section of `.agents/skills/project-context/references/block-system.md`:

```markdown
- Shared content actions support Page, Custom URL, and Media File destinations. File actions choose View or Download independently from Button/Link presentation; View has a file-specific new-tab preference, while Download forwards the Media filename through the anchor `download` attribute. Keep schema changes in `src/blocks/shared/contentActionsFields.ts`, destination resolution in `src/lib/cmsLinks.ts`, and rendering semantics in `src/components/ContentActions.tsx` plus the guarded specialized consumers.
```

- [x] **Step 4: Run focused and full verification**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-action-presentation.int.spec.tsx tests/int/button-primary-variant.int.spec.tsx tests/int/download-list.int.spec.tsx
pnpm exec tsc --noEmit
pnpm lint
pnpm test:int
```

Expected: tests and TypeScript pass. Lint may report only documented pre-existing warnings; changed files introduce none.

- [x] **Step 5: Refresh and check project context**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both exit 0. A clearly marked optional knowledge-graph warning may remain non-blocking.

- [x] **Step 6: Review the uncommitted diff**

```bash
git status --short
git diff --check
git diff --stat
```

Expected: only planned source, test, generated type, design/plan, and project-context files changed; no whitespace errors. Leave all work uncommitted.
