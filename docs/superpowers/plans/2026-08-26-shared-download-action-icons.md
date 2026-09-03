# Shared Download Action Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give shared File Download actions a configurable animated Lucide `ArrowDown` on the left or right while preserving existing navigation-arrow behavior everywhere else.

**Architecture:** The shared Payload field factory owns download-icon visibility and position. `cmsLinks.ts` resolves those editor values into one renderer-neutral indicator contract, and the existing action primitives render either the established animated right arrow, an equivalent animated down arrow, or no indicator.

**Tech Stack:** Payload CMS 3, React 19, Lucide React, TypeScript, Vitest, React DOM static rendering.

## Global Constraints

- File Download defaults to showing a Lucide `ArrowDown` on the left.
- Editors may hide the download icon or place it on the right.
- Download never renders the navigation arrow beside the download icon.
- Page, Custom URL, and File View retain current right-arrow behavior.
- Button and Link modes use the same resolved indicator contract.
- Icons are decorative, theme-neutral, and hidden from assistive technology.
- Reduced-motion visitors see a static icon.
- Existing saved content requires no migration.
- Do not commit unless the user explicitly asks.

## File Structure

- Modify `src/blocks/shared/contentActionsFields.ts` — download-only editor controls and conditions.
- Modify `src/lib/cmsLinks.ts` — shared indicator resolution types and defaults.
- Modify `src/components/ActionArrow.tsx` — right/down animated Lucide arrow primitive.
- Modify `src/components/ActionButtonContent.tsx` — Button label/icon composition and position.
- Modify `src/components/ContentLink.tsx` — Link label/icon composition and position.
- Modify `src/components/ContentActions.tsx` — canonical resolved-indicator forwarding.
- Modify `src/blocks/Services21/Component.tsx` — specialized resolved-action forwarding.
- Modify `src/blocks/ProgramMatrix/Component.tsx` — specialized resolved-action forwarding.
- Modify `src/blocks/MediaCarousel/MediaCarouselClient.tsx` — specialized resolved-action forwarding.
- Modify `src/blocks/HeroBanner/Component.tsx` — direct shared-link adapter and renderer forwarding.
- Modify `src/blocks/HeroCarousel/Component.tsx` — direct shared-link adapter forwarding.
- Modify `src/blocks/HeroCarousel/HeroCarouselClient.tsx` — slide action forwarding.
- Modify `tests/int/content-action-presentation.int.spec.tsx` — schema, resolver, markup, animation, and parity coverage.
- Regenerate `src/payload-types.ts`.
- Update `.agents/skills/project-context/references/block-system.md` and deterministic inventory.

---

### Task 1: Download Indicator Schema and Resolution

**Files:**

- Modify: `src/blocks/shared/contentActionsFields.ts`
- Modify: `src/lib/cmsLinks.ts`
- Test: `tests/int/content-action-presentation.int.spec.tsx`

**Interfaces:**

- Produces CMS values `showFileIcon?: boolean | null` and `fileIconPosition?: 'left' | 'right' | null`.
- Produces `CmsActionIndicator = 'download' | 'none'` and `CmsActionIndicatorPosition = 'left' | 'right'`.
- Extends resolved links/actions with optional `indicator` and `indicatorPosition`.

- [x] **Step 1: Write failing field-condition tests**

Add to `tests/int/content-action-presentation.int.spec.tsx`:

```tsx
it('exposes download-only icon controls with semantic defaults', () => {
  const fields = getActionTabs(true).flatMap((tab) => tab.fields)

  expect(fields.find((field) => field.name === 'showFileIcon')).toMatchObject({
    defaultValue: true,
    label: 'Show Download Icon',
    type: 'checkbox',
  })
  expect(fields.find((field) => field.name === 'fileIconPosition')).toMatchObject({
    defaultValue: 'left',
    label: 'Download Icon Position',
    type: 'select',
  })
})

it('hides the normal arrow for downloads and reveals position only with an icon', () => {
  const fields = getActionTabs(true).flatMap((tab) => tab.fields)
  const condition = (name: string) =>
    fields.find((field) => field.name === name)?.admin?.condition as
      ((_data: unknown, siblings: Record<string, unknown>) => boolean) | undefined

  const download = { fileBehavior: 'download', linkType: 'file', mode: 'button' }
  expect(condition('showArrow')?.({}, download)).toBe(false)
  expect(condition('showFileIcon')?.({}, download)).toBe(true)
  expect(condition('fileIconPosition')?.({}, { ...download, showFileIcon: true })).toBe(true)
  expect(condition('fileIconPosition')?.({}, { ...download, showFileIcon: false })).toBe(false)
  expect(
    condition('showArrow')?.({}, { fileBehavior: 'view', linkType: 'file', mode: 'button' }),
  ).toBe(true)
})
```

- [x] **Step 2: Write failing resolver tests**

Add:

```tsx
it('resolves the default download indicator on the left', () => {
  expect(
    resolveCmsActions([{ file, fileBehavior: 'download', label: 'Download', linkType: 'file' }])[0],
  ).toMatchObject({ indicator: 'download', indicatorPosition: 'left' })
})

it('resolves right-positioned and hidden download indicators', () => {
  expect(
    resolveCmsActions([
      {
        file,
        fileBehavior: 'download',
        fileIconPosition: 'right',
        label: 'Download',
        linkType: 'file',
      },
    ])[0],
  ).toMatchObject({ indicator: 'download', indicatorPosition: 'right' })

  expect(
    resolveCmsActions([
      {
        file,
        fileBehavior: 'download',
        label: 'Download',
        linkType: 'file',
        showFileIcon: false,
      },
    ])[0],
  ).toMatchObject({ indicator: 'none', indicatorPosition: 'left' })
})

it('does not assign a download indicator to File View', () => {
  expect(
    resolveCmsActions([{ file, fileBehavior: 'view', label: 'View', linkType: 'file' }])[0],
  ).toMatchObject({ indicator: undefined, indicatorPosition: undefined })
})
```

- [x] **Step 3: Run tests to verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-action-presentation.int.spec.tsx
```

Expected: FAIL because icon fields and resolved indicators do not exist.

- [x] **Step 4: Add Payload fields and conditions**

Extend the sibling type:

```ts
type ActionLayoutSiblingData = LinkSiblingData & {
  mode?: 'button' | 'link' | null
  showFileIcon?: boolean | null
}
```

Add:

```ts
const isFileDownload = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'file' && siblingData?.fileBehavior === 'download'

const isNotFileDownload = (_data: unknown, siblingData: LinkSiblingData) =>
  !isFileDownload(_data, siblingData)

const isButtonWithoutDownloadIndicator = (_data: unknown, siblingData: ActionLayoutSiblingData) =>
  siblingData?.mode === 'button' && !isFileDownload(_data, siblingData)

const showsFileIcon = (_data: unknown, siblingData: ActionLayoutSiblingData) =>
  isFileDownload(_data, siblingData) && siblingData?.showFileIcon !== false
```

Use `isButtonWithoutDownloadIndicator` for `showArrow` when `includeDisplayMode` is true and `isNotFileDownload` when it is false. Then append to Theme Settings:

```ts
{
  name: 'showFileIcon',
  label: 'Show Download Icon',
  type: 'checkbox',
  defaultValue: true,
  admin: {
    condition: isFileDownload,
    description: 'Shows an animated down arrow for this file download.',
  },
} satisfies CheckboxField,
{
  name: 'fileIconPosition',
  label: 'Download Icon Position',
  type: 'select',
  defaultValue: 'left',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ],
  admin: { condition: showsFileIcon },
} satisfies SelectField,
```

- [x] **Step 5: Resolve the renderer-neutral indicator**

Add to `src/lib/cmsLinks.ts`:

```ts
export type CmsActionIndicator = 'download' | 'none'
export type CmsActionIndicatorPosition = 'left' | 'right'

export type CmsLinkValue = {
  fileIconPosition?: CmsActionIndicatorPosition | null
  showFileIcon?: boolean | null
  file?: string | number | Media | null
  fileBehavior?: 'download' | 'view' | null
  link?: string | number | NavigationLink | null
  linkType?: 'page' | 'custom' | 'file' | null
  openFileInNewTab?: boolean | null
  openInNewTab?: boolean | null
  page?: string | number | Page | null
  url?: string | null
}

export type ResolvedCmsLink = {
  download?: string | true
  href?: string
  indicator?: CmsActionIndicator
  indicatorPosition?: CmsActionIndicatorPosition
  openInNewTab?: boolean
}
```

For File Download, return:

```ts
indicator: value.showFileIcon === false ? 'none' : 'download',
indicatorPosition: value.fileIconPosition === 'right' ? 'right' : 'left',
```

Carry `indicator` and `indicatorPosition` into `ResolvedCmsAction`. File View and existing destinations leave both undefined.

- [x] **Step 6: Re-run targeted tests**

Run the Step 3 command. Expected: PASS.

---

### Task 2: Shared Animated Down Arrow and Composition

**Files:**

- Modify: `src/components/ActionArrow.tsx`
- Modify: `src/components/ActionButtonContent.tsx`
- Modify: `src/components/ContentLink.tsx`
- Modify: `src/components/ContentActions.tsx`
- Test: `tests/int/content-action-presentation.int.spec.tsx`

**Interfaces:**

- `ActionArrow` consumes `direction?: 'down' | 'right'` and defaults to `right`.
- `ActionButtonContent` consumes `indicator?: CmsActionIndicator` and `indicatorPosition?: CmsActionIndicatorPosition`.
- `ContentLink` consumes the same indicator props; undefined preserves the existing right arrow, while `none` renders no icon.

- [x] **Step 1: Write failing indicator markup tests**

Add:

```tsx
it('renders an animated Lucide down arrow before a download Button label', () => {
  const html = renderToStaticMarkup(
    createElement(ContentActions, {
      actions: [
        {
          download: 'guide.pdf',
          href: '/guide.pdf',
          indicator: 'download',
          indicatorPosition: 'left',
          label: 'Download guide',
          mode: 'button',
          showArrow: true,
          variant: 'default',
        },
      ],
    }),
  )

  expect(html).toContain('data-action-indicator="download"')
  expect(html).toContain('lucide-arrow-down')
  expect(html.indexOf('data-action-indicator="download"')).toBeLessThan(
    html.indexOf('Download guide'),
  )
  expect(html).not.toContain('lucide-arrow-right')
})

it('positions or hides the download indicator for editorial Links', () => {
  const right = renderToStaticMarkup(
    createElement(ContentActions, {
      actions: [
        {
          download: 'guide.pdf',
          href: '/guide.pdf',
          indicator: 'download',
          indicatorPosition: 'right',
          label: 'Download guide',
          mode: 'link',
          showArrow: false,
          variant: 'default',
        },
      ],
    }),
  )
  const hidden = renderToStaticMarkup(
    createElement(ContentActions, {
      actions: [
        {
          download: 'guide.pdf',
          href: '/guide.pdf',
          indicator: 'none',
          indicatorPosition: 'left',
          label: 'Download guide',
          mode: 'link',
          showArrow: false,
          variant: 'default',
        },
      ],
    }),
  )

  expect(right.indexOf('Download guide')).toBeLessThan(
    right.indexOf('data-action-indicator="download"'),
  )
  expect(hidden).not.toContain('data-action-indicator')
  expect(hidden).not.toContain('lucide-arrow-right')
})

it('keeps navigation Links on the existing animated right arrow', () => {
  const html = renderToStaticMarkup(
    createElement(ContentLink, { href: '/programmes', label: 'View programmes' }),
  )
  expect(html).toContain('lucide-arrow-right')
  expect(html).not.toContain('lucide-arrow-down')
})
```

- [x] **Step 2: Run the targeted test to verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-action-presentation.int.spec.tsx
```

Expected: FAIL because indicator props and the animated down-arrow state do not exist.

- [x] **Step 3: Extend the arrow primitive**

In `ActionArrow.tsx`, import `ArrowDown` beside `ArrowRight`, add `direction`, and select direction-specific icon/classes. Keep the existing right-arrow classes unchanged. Down uses:

```tsx
const Icon = direction === 'down' ? ArrowDown : ArrowRight

const outgoingClassName =
  direction === 'down'
    ? 'absolute left-0 top-0 size-4 transition-all duration-200 ease-out motion-reduce:transition-none group-hover/button:translate-y-1 group-hover/button:opacity-0 group-focus-visible/button:translate-y-1 group-focus-visible/button:opacity-0'
    : 'absolute left-0 top-0 size-4 rotate-[-35deg] transition-all duration-200 ease-out motion-reduce:transition-none group-hover/button:translate-x-1 group-hover/button:opacity-0 group-hover/button:rotate-0 group-focus-visible/button:translate-x-1 group-focus-visible/button:opacity-0 group-focus-visible/button:rotate-0'

const incomingClassName =
  direction === 'down'
    ? 'absolute left-0 top-0 size-4 -translate-y-[70%] opacity-0 transition-all duration-200 ease-out motion-reduce:transition-none group-hover/button:translate-y-0 group-hover/button:opacity-100 group-focus-visible/button:translate-y-0 group-focus-visible/button:opacity-100'
    : 'absolute left-0 top-0 size-4 translate-x-[-70%] opacity-0 transition-all duration-200 ease-out motion-reduce:transition-none group-hover/button:translate-x-0 group-hover/button:opacity-100 group-focus-visible/button:translate-x-0 group-focus-visible/button:opacity-100'
```

Both SVGs retain `strokeWidth={2.5}` and the wrapper retains `aria-hidden="true"`.

- [x] **Step 4: Compose indicators around labels**

In `ActionButtonContent.tsx`, create one indicator node:

```tsx
const indicatorNode =
  indicator === 'download' ? (
    <ActionArrow
      data-action-indicator="download"
      data-icon={indicatorPosition === 'left' ? 'inline-start' : 'inline-end'}
      direction="down"
    />
  ) : indicator === 'none' || !showArrow ? null : (
    <ActionArrow data-action-arrow="true" data-icon="inline-end" />
  )
```

Render it before the label only when `indicatorPosition === 'left'`; otherwise render it after.

In `ContentLink.tsx`, use `download` when requested, no node for `none`, and the existing right arrow when `indicator` is undefined. Keep the underline span around only the label.

- [x] **Step 5: Forward resolved props in `ContentActions`**

Pass both values to Button and Link branches:

```tsx
<ActionButtonContent
  indicator={action.indicator}
  indicatorPosition={action.indicatorPosition}
  label={action.label}
  showArrow={action.showArrow}
/>

<ContentLink
  indicator={action.indicator}
  indicatorPosition={action.indicatorPosition}
  // existing props remain
/>
```

- [x] **Step 6: Re-run the targeted test**

Run the Step 2 command. Expected: PASS.

---

### Task 3: Specialized Renderer Parity

**Files:**

- Modify: `src/blocks/Services21/Component.tsx`
- Modify: `src/blocks/ProgramMatrix/Component.tsx`
- Modify: `src/blocks/MediaCarousel/MediaCarouselClient.tsx`
- Modify: `src/blocks/HeroBanner/Component.tsx`
- Modify: `src/blocks/HeroCarousel/Component.tsx`
- Modify: `src/blocks/HeroCarousel/HeroCarouselClient.tsx`
- Test: `tests/int/content-action-presentation.int.spec.tsx`

**Interfaces:**

- Consumes the resolved indicator fields and updated Button/Link primitives from Tasks 1–2.
- Ensures every renderer that bypasses `ContentActions` forwards the same indicator contract.

- [x] **Step 1: Add failing parity assertions**

Strengthen the existing source-contract test:

```tsx
it.each([
  'src/blocks/Services21/Component.tsx',
  'src/blocks/ProgramMatrix/Component.tsx',
  'src/blocks/MediaCarousel/MediaCarouselClient.tsx',
  'src/blocks/HeroBanner/Component.tsx',
  'src/blocks/HeroCarousel/HeroCarouselClient.tsx',
])('forwards resolved action indicators in %s', (filePath) => {
  const source = readFileSync(filePath, 'utf8')
  expect(source).toContain('indicator=')
  expect(source).toContain('indicatorPosition=')
})

it.each(['src/blocks/HeroBanner/Component.tsx', 'src/blocks/HeroCarousel/Component.tsx'])(
  'carries resolved link indicators through %s',
  (filePath) => {
    const source = readFileSync(filePath, 'utf8')
    expect(source).toContain('indicator: link.indicator')
    expect(source).toContain('indicatorPosition: link.indicatorPosition')
  },
)
```

- [x] **Step 2: Run the test to verify failure**

Run the Task 2 Step 2 command. Expected: FAIL on specialized consumers.

- [x] **Step 3: Forward indicator props through every specialized consumer**

At each `ActionButtonContent` and `ContentLink` call receiving a resolved shared action, add:

```tsx
indicator={action.indicator}
indicatorPosition={action.indicatorPosition}
```

Use `item.action` in Media Carousel and `button` in Hero Carousel. In both Hero server adapters, copy `link.indicator` and `link.indicatorPosition` into their serializable action objects and extend local action types with the shared indicator types.

- [x] **Step 4: Re-run targeted tests and TypeScript**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-action-presentation.int.spec.tsx tests/int/carousel-blocks.int.spec.tsx tests/int/hero-banner-render.int.spec.ts
pnpm exec tsc --noEmit
```

Expected: all tests and TypeScript pass.

---

### Task 4: Generated Types, Documentation, and Full Verification

**Files:**

- Regenerate: `src/payload-types.ts`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Update: `.agents/skills/project-context/references/project-inventory.json`
- Test: `tests/int/content-action-presentation.int.spec.tsx`

**Interfaces:**

- Produces current generated Payload types and maintained project knowledge.

- [x] **Step 1: Generate Payload types**

```bash
pnpm generate:types
```

Expected: generated shared actions contain `showFileIcon` and `fileIconPosition`.

- [x] **Step 2: Extend the generated-type regression test**

```tsx
expect(source).toContain('showFileIcon?: boolean | null')
expect(source).toContain("fileIconPosition?: ('left' | 'right') | null")
```

- [x] **Step 3: Update maintained documentation**

Amend the shared-action paragraph in `block-system.md` to state that File Download defaults to an animated Lucide `ArrowDown`, can hide it, and can place it left or right without affecting View/navigation arrows.

- [x] **Step 4: Run focused and full verification**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-action-presentation.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/button-primary-variant.int.spec.tsx tests/int/download-list.int.spec.tsx
pnpm exec tsc --noEmit
pnpm lint
pnpm exec vitest run --config ./vitest.config.mts --reporter=dot
```

Expected: all tests and TypeScript pass. Lint may report only the documented pre-existing Google Tag Manager warning.

- [x] **Step 5: Refresh and check project context**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current; the optional stale knowledge-graph warning may remain.

- [x] **Step 6: Review the uncommitted diff**

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors and no commit created.
