# Image Mosaic Optional Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Image Mosaic's required `Image Link / No Link` selector with an optional, single-row image action that can render through the website's shared Link or Button behavior.

**Architecture:** Extend the shared content-action field factory with an opt-in per-action display mode while leaving all existing consumers unchanged. Image Mosaic items use that shared optional action schema, the server adapter resolves one action plus its mode, and the presentation component delegates rendering to the existing `ContentActions` component.

**Tech Stack:** Payload CMS 3.85, Next.js 16 RSC, React 19, TypeScript, shadcn/ui Button, shared `ContentActions`, Vitest.

## Global Constraints

- Preserve the currently staged Image Mosaic snapshot; do not stage or commit this revision.
- Remove the direct item fields `linkType`, `linkLabel`, `page`, `url`, and `openInNewTab` without backward compatibility.
- Add optional item field `action`, an array with `maxRows: 1` and no `minRows`.
- Reuse the shared action Content fields: label, page/custom URL, and open in new tab.
- Add opt-in per-action Layout & Theme fields: display mode (`link` or `button`) and standard button variant (`default`, `secondary`, or `outline`).
- Existing blocks using `createContentActionsField()` must retain their current schema and rendering.
- No action row means no link or button is rendered.
- `showImageOverlays={false}` hides the title and action together.
- Only the visible link or button is interactive; the image surface remains non-interactive.

---

### Task 1: Add opt-in per-action mode to the shared action field factory

**Files:**

- Modify: `src/blocks/shared/contentActionsFields.ts`
- Modify: `tests/int/image-mosaic.int.spec.tsx`

**Interfaces:**

- Extends: `createContentActionsField(options)` with `includeDisplayMode?: boolean`.
- Produces when enabled: row-level `mode: 'link' | 'button'`, defaulting to `link`.
- Preserves when disabled: the existing action row schema exactly.

- [ ] **Step 1: Add a failing shared-factory assertion**

In `tests/int/image-mosaic.int.spec.tsx`, import the factory and add a test that compares default and opt-in layouts:

```tsx
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

it('adds per-action display mode only when explicitly requested', () => {
  const defaultField = createContentActionsField()
  const imageActionField = createContentActionsField({
    includeDisplayMode: true,
    label: 'Action',
    maxRows: 1,
    name: 'action',
  })

  const getLayoutNames = (field: typeof defaultField) => {
    const tabsField = field.fields[0]
    if (tabsField.type !== 'tabs') return []
    return (
      tabsField.tabs
        .find(({ label }) => label === 'Layout & Theme')
        ?.fields.flatMap((item) => ('name' in item ? [item.name] : [])) ?? []
    )
  }

  expect(getLayoutNames(defaultField)).toEqual(['variant'])
  expect(getLayoutNames(imageActionField)).toEqual(['mode', 'variant'])

  const tabsField = imageActionField.fields[0]
  if (tabsField.type !== 'tabs') throw new Error('Expected action tabs')
  const layoutFields = tabsField.tabs.find(({ label }) => label === 'Layout & Theme')?.fields ?? []
  const modeField = layoutFields.find((field) => 'name' in field && field.name === 'mode')

  expect(imageActionField).toMatchObject({ maxRows: 1, name: 'action', type: 'array' })
  expect(modeField).toMatchObject({
    defaultValue: 'link',
    required: true,
    type: 'select',
  })
})
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/image-mosaic.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because `includeDisplayMode` is not accepted and the mode field is absent.

- [ ] **Step 3: Extend the field factory without changing default consumers**

In `src/blocks/shared/contentActionsFields.ts`, extend the options type:

```ts
type CreateContentActionsFieldOptions = {
  includeDisplayMode?: boolean
  label?: string
  maxRows?: number
  name?: string
}
```

Add an action-row sibling type and condition:

```ts
type ActionLayoutSiblingData = {
  mode?: 'button' | 'link' | null
}

const isButtonMode = (_data: unknown, siblingData: ActionLayoutSiblingData) =>
  siblingData?.mode === 'button'
```

Replace the static layout array with a factory:

```ts
const createActionLayoutFields = (includeDisplayMode: boolean): Field[] => [
  ...(includeDisplayMode
    ? [
        {
          name: 'mode',
          label: 'Display As',
          type: 'select',
          defaultValue: 'link',
          options: [
            { label: 'Link', value: 'link' },
            { label: 'Button', value: 'button' },
          ],
          required: true,
        } satisfies SelectField,
      ]
    : []),
  {
    name: 'variant',
    label: 'Button Variant',
    type: 'select',
    defaultValue: 'default',
    options: [
      { label: 'Primary', value: 'default' },
      { label: 'Secondary', value: 'secondary' },
      { label: 'Outline', value: 'outline' },
    ],
    required: true,
    ...(includeDisplayMode ? { admin: { condition: isButtonMode } } : {}),
  } satisfies SelectField,
]
```

Destructure `includeDisplayMode = false` in `createContentActionsField` and use `createActionLayoutFields(includeDisplayMode)` in the nested Layout & Theme tab. Existing calls omit the option and retain only `variant`.

- [ ] **Step 4: Run the focused test**

Expected: the shared-factory assertion passes and all existing Image Mosaic tests compile.

---

### Task 2: Replace direct image-link fields with the optional action row

**Files:**

- Modify: `src/blocks/ImageMosaic/config.ts`
- Modify: `tests/int/image-mosaic.int.spec.tsx`

**Interfaces:**

- Removes item-level direct link fields.
- Produces item field `action` using `createContentActionsField({ includeDisplayMode: true, maxRows: 1, name: 'action' })`.

- [ ] **Step 1: Change the schema expectations first**

Update the Image Mosaic schema test so the item field names are exactly:

```tsx
expect(itemsField?.fields?.map(({ name }) => name)).toEqual([
  'image',
  'imagePosition',
  'title',
  'action',
])

const actionField = getField(itemsField?.fields ?? [], 'action')
expect(actionField).toMatchObject({ maxRows: 1, type: 'array' })
expect(actionField?.minRows).toBeUndefined()
expect(getField(itemsField?.fields ?? [], 'linkType')).toBeUndefined()
expect(getField(itemsField?.fields ?? [], 'linkLabel')).toBeUndefined()
```

- [ ] **Step 2: Run the test and verify the old schema fails**

Expected: FAIL because the direct `Image Link` fields still exist and `action` is absent.

- [ ] **Step 3: Simplify the Image Mosaic item schema**

In `src/blocks/ImageMosaic/config.ts`:

- Remove `ItemLinkSiblingData` and all three link conditions.
- Remove direct item fields `linkType`, `linkLabel`, `page`, `url`, and `openInNewTab`.
- Remove Payload field type imports that become unused.
- Add after the optional title:

```ts
createContentActionsField({
  includeDisplayMode: true,
  label: 'Action',
  maxRows: 1,
  name: 'action',
}),
```

- [ ] **Step 4: Run the focused test**

Expected: schema and shared-factory tests pass; Payload presents an Add Action control instead of a required No Link select.

---

### Task 3: Resolve and render one shared image action

**Files:**

- Modify: `src/blocks/ImageMosaic/Component.tsx`
- Modify: `src/components/image-mosaic.tsx`
- Modify: `tests/int/image-mosaic.int.spec.tsx`

**Interfaces:**

- Consumes item `action?: ImageMosaicActionValue[] | null`.
- Produces presentation action `{ href, label, mode, openInNewTab, variant }`.
- Delegates link/button markup to `ContentActions`.

- [ ] **Step 1: Update presentation fixtures and add mode assertions**

Replace each test `ImageMosaicItem.link` with:

```tsx
action: {
  href: `/stories/${index + 1}`,
  label: 'Explore',
  mode: 'link',
  variant: 'default',
},
```

Add a button-mode rendering test:

```tsx
it('renders image actions through the shared link and button behavior', () => {
  const html = renderToStaticMarkup(
    <ImageMosaic
      items={[
        mosaicItems[0],
        {
          ...mosaicItems[1],
          action: {
            href: '/apply',
            label: 'Apply now',
            mode: 'button',
            variant: 'outline',
          },
        },
        { ...mosaicItems[2], action: undefined },
      ]}
      title="Gallery"
    />,
  )

  expect(html).toContain('data-action-mode="link"')
  expect(html).toContain('data-action-mode="button"')
  expect(html).toContain('data-action-variant="outline"')
  expect(html).toContain('href="/apply"')
  expect(html.match(/data-image-mosaic-item-action=/g)).toHaveLength(2)
})
```

Update adapter test inputs from direct link fields to:

```tsx
action: [
  {
    label: 'Explore the space',
    linkType: 'custom',
    mode: 'button',
    url: '/spaces',
    variant: 'outline',
  },
],
```

Represent an incomplete action as `action: [{ label: 'Incomplete', linkType: 'custom', mode: 'link' }]`. Add an item with no `action` row and assert no corresponding action label renders.

- [ ] **Step 2: Run the focused test and verify type/render failures**

Expected: FAIL because the adapter and presentation still expect `link` and direct item link fields.

- [ ] **Step 3: Change the server adapter to resolve one action**

Use these types in `src/blocks/ImageMosaic/Component.tsx`:

```ts
type ImageMosaicActionValue = CmsActionValue & {
  mode?: 'button' | 'link' | null
}

type ImageMosaicItemValue = {
  action?: ImageMosaicActionValue[] | null
  image?: unknown
  imagePosition?: ImageMosaicImagePosition | null
  title?: string | null
}
```

Inside item mapping, replace direct destination resolution with:

```ts
const actionValue = item.action?.[0]
const resolvedAction = resolveCmsActions(actionValue ? [actionValue] : [])[0]
```

Return:

```ts
action: resolvedAction
  ? {
      ...resolvedAction,
      mode: actionValue?.mode ?? 'link',
    }
  : undefined,
```

Remove `resolveCmsLink` and all obsolete link-value fields and imports.

- [ ] **Step 4: Render the resolved action through `ContentActions`**

In `src/components/image-mosaic.tsx`, replace `link` with:

```ts
action?: ResolvedCmsAction & {
  mode: 'button' | 'link'
}
```

Import `ContentActions` and `ResolvedCmsAction`. Determine overlay presence with `resolvedTitle || item.action`. Replace the old `ContentLink` render with:

```tsx
{
  item.action ? (
    <ContentActions
      actions={[item.action]}
      alignment="left"
      data-image-mosaic-item-action="true"
      mode={item.action.mode}
    />
  ) : null
}
```

Remove the direct `ContentLink` import. The surrounding tile remains a non-interactive element.

- [ ] **Step 5: Run the focused tests**

Expected: optional, link-mode, button-mode, incomplete, hidden-overlay, and absent-action cases pass.

---

### Task 4: Update Payload types and thumbnail fixture

**Files:**

- Modify: `src/payload-types.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/image-mosaic.jpg`
- Modify: `tests/int/block-thumbnails.int.spec.ts`

**Interfaces:**

- Regenerates Image Mosaic item type with optional `action` array and row-level `mode`.
- Keeps the existing block thumbnail metadata and dimensions.

- [ ] **Step 1: Update the thumbnail fixture to the optional action shape**

For each fixture item, replace direct link fields with an optional action row:

```tsx
action: [
  {
    label: 'Explore',
    linkType: 'custom',
    mode: 'link',
    url: '/spaces',
    variant: 'default',
  },
],
```

Use one `mode: 'button'` item with `variant: 'outline'` so the real-render fixture covers both action modes. Leave one item without `action` to verify optional behavior visually.

- [ ] **Step 2: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `ImageMosaicBlock.items` contains optional `action`, and no longer contains direct `linkType`, `linkLabel`, `page`, `url`, or `openInNewTab` fields.

- [ ] **Step 3: Regenerate only the Image Mosaic thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=imageMosaic pnpm generate:block-thumbnails
```

Expected: only `public/block-thumbnails/image-mosaic.jpg` is rewritten and remains a 1600×900 JPEG.

- [ ] **Step 4: Run thumbnail tests**

Run:

```bash
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts --config ./vitest.config.mts
```

Expected: all thumbnail tests pass.

---

### Task 5: Verify the unstaged revision

**Files:**

- Verify all files modified in Tasks 1–4.

- [ ] **Step 1: Format and lint the touched files**

Run:

```bash
pnpm exec prettier --write \
  src/blocks/shared/contentActionsFields.ts \
  src/blocks/ImageMosaic/config.ts \
  src/blocks/ImageMosaic/Component.tsx \
  src/components/image-mosaic.tsx \
  src/block-thumbnails/fixtures.tsx \
  tests/int/image-mosaic.int.spec.tsx

pnpm exec eslint \
  src/blocks/shared/contentActionsFields.ts \
  src/blocks/ImageMosaic/config.ts \
  src/blocks/ImageMosaic/Component.tsx \
  src/components/image-mosaic.tsx \
  src/block-thumbnails/fixtures.tsx \
  tests/int/image-mosaic.int.spec.tsx
```

Expected: formatting completes and ESLint reports zero errors.

- [ ] **Step 2: Run focused regression tests**

Run:

```bash
pnpm exec vitest run \
  tests/int/image-mosaic.int.spec.tsx \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  --config ./vitest.config.mts \
  -t "Image Mosaic|block thumbnail metadata|registers a general layout blocks field on Pages"
```

Expected: all selected tests pass.

- [ ] **Step 3: Run source-only TypeScript validation**

Create a temporary scoped tsconfig using `apply_patch`, include the shared action factory and Image Mosaic source files, run `pnpm exec tsc -p tsconfig.image-mosaic-actions.json --noEmit`, and delete the temporary file with `apply_patch` immediately after the successful check.

Expected: zero TypeScript errors from the revision.

- [ ] **Step 4: Verify link and button behavior in the browser**

On the Image Mosaic thumbnail preview, verify:

- A link-mode action uses the shared animated text-link treatment.
- A button-mode action uses the selected standard shadcn variant.
- A tile without an action has no link or button.
- The tile surface is not an anchor.
- Touch/coarse-pointer overlays remain visible.
- No hydration or console errors appear.

- [ ] **Step 5: Audit staged versus unstaged state**

Run:

```bash
git diff --check
git diff --name-status
git diff --cached --name-status
```

Expected: this optional-action revision appears only in the unstaged working-tree diff. The previously staged Image Mosaic snapshot remains intact and is not modified in the index.
