# Program Matrix Split Layout and Card Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive stacked/split section layout to Program Matrix and replace its visible legacy link controls with one optional, independently styled Link or Button action per card while preserving existing saved content.

**Architecture:** Extend the Payload block schema with explicit layout fields and a shared single-row `cardAction` array. Keep the old item-link and block-wide action fields registered but hidden, then normalize new and legacy data into one `ResolvedCmsAction` per item in the renderer. Keep the introduction before the matrix in the DOM, using large-breakpoint grid placement only to display a right-side introduction.

**Tech Stack:** Payload CMS 3, React 19, Next.js 15, TypeScript, Tailwind CSS 4, Vitest, pnpm

## Global Constraints

- Follow `.agents/skills/project-context/SKILL.md` for every task and complete its update/check loop after implementation.
- Follow `.agents/skills/payload/SKILL.md` and its block reference for schema and renderer changes.
- Treat `docs/superpowers/specs/2026-08-20-program-matrix-split-layout-per-card-actions-design.md` as the approved product contract.
- Do not edit or remove the unrelated user-owned changes in `skills-lock.json` or `.agents/skills/content-research-writer/`.
- Do not migrate or delete the legacy `linkType`, `page`, `url`, `openInNewTab`, `actionMode`, `actionVariant`, or `itemActionLabel` fields. Existing documents must continue rendering.
- Only the explicit action control is interactive; never wrap a Program Matrix card in an anchor.
- Preserve compact order as introduction, matrix, then footer actions. Preserve introduction-before-matrix document and focus order in both split positions.
- Use test-first steps: write a failing contract, run it to see the expected failure, implement the smallest change, and rerun to green.
- Use `apply_patch` for handwritten file changes. Run generators only for generated artifacts.
- Commit only files related to this feature. Never stage with `git add .` or `git add -A`.

---

## Task 1: Add the Payload layout and per-card action schema

**Files:**

- Modify: `tests/int/program-matrix.int.spec.tsx`
- Modify: `src/blocks/ProgramMatrix/config.ts`

- [ ] **Step 1: Extend the schema test helpers to inspect fields at the correct nesting level**

Add a small typed helper beside `findNamedField` so the test can distinguish the new nested action fields from the hidden legacy fields with the same names:

```ts
type AdminField = Field & {
  admin?: {
    condition?: (data: unknown, siblingData: Record<string, unknown>) => boolean
    hidden?: boolean
  }
}

const getTabFields = (tabsField: TabsField, label: string): Field[] =>
  tabsField.tabs.find((tab) => tab.label === label)?.fields ?? []
```

- [ ] **Step 2: Replace the old schema expectations with the approved editor contract**

In `ProgramMatrixBlock schema`, assert all of the following directly rather than relying only on recursive lookup:

```ts
const blockTabs = ProgramMatrixBlock.fields.find((field) => field.type === 'tabs') as TabsField
const themeFields = getTabFields(blockTabs, 'Theme Settings')
const itemsField = findNamedField(ProgramMatrixBlock.fields, 'items') as ArrayField
const itemTabs = itemsField.fields[0] as TabsField
const itemContentFields = getTabFields(itemTabs, 'Content')

const cardAction = itemContentFields.find(
  (field) => 'name' in field && field.name === 'cardAction',
) as ArrayField

expect(cardAction).toMatchObject({
  label: 'Card Action',
  type: 'array',
  maxRows: 1,
})

expect(findNamedField(cardAction.fields, 'label')).toMatchObject({
  type: 'text',
  required: true,
})
expect(findNamedField(cardAction.fields, 'mode')).toMatchObject({
  type: 'select',
  defaultValue: 'link',
})
expect(findNamedField(cardAction.fields, 'variant')).toMatchObject({ type: 'select' })
expect(findNamedField(cardAction.fields, 'showArrow')).toMatchObject({ type: 'checkbox' })

for (const legacyName of ['linkType', 'page', 'url', 'openInNewTab']) {
  const field = itemContentFields.find(
    (candidate) => 'name' in candidate && candidate.name === legacyName,
  ) as AdminField
  expect(field.admin?.hidden).toBe(true)
}

for (const legacyName of ['actionMode', 'actionVariant', 'itemActionLabel']) {
  const field = themeFields.find(
    (candidate) => 'name' in candidate && candidate.name === legacyName,
  ) as AdminField
  expect(field.admin?.hidden).toBe(true)
}
```

Also assert the new layout fields and their conditional behavior:

```ts
const headerLayout = themeFields.find(
  (field) => 'name' in field && field.name === 'headerLayout',
)
expect(headerLayout).toMatchObject({
  type: 'select',
  defaultValue: 'stacked',
  required: true,
  options: [
    { label: 'Stacked', value: 'stacked' },
    { label: 'Split', value: 'split' },
  ],
})

const headerPosition = themeFields.find(
  (field) => 'name' in field && field.name === 'headerPosition',
) as AdminField
expect(headerPosition).toMatchObject({
  type: 'select',
  defaultValue: 'left',
  required: true,
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ],
})
expect(headerPosition.admin?.condition?.({}, { headerLayout: 'split' })).toBe(true)
expect(headerPosition.admin?.condition?.({}, { headerLayout: 'stacked' })).toBe(false)
```

- [ ] **Step 3: Run the focused test and confirm it fails for the missing contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: FAIL because `cardAction`, `headerLayout`, and `headerPosition` do not exist and the legacy fields are not hidden.

- [ ] **Step 4: Add the new fields and hide, but retain, all legacy fields**

In `src/blocks/ProgramMatrix/config.ts`:

1. Remove the `createContentActionModeField` import.
2. Remove `ProgrammeItemSiblingData`, `isPageLink`, `isCustomLink`, and `hasLink`.
3. Add this layout condition near the imports:

```ts
type ProgramMatrixLayoutSiblingData = {
  headerLayout?: 'split' | 'stacked' | null
}

const isSplitHeader = (_data: unknown, siblingData: ProgramMatrixLayoutSiblingData) =>
  siblingData?.headerLayout === 'split'
```

4. Insert the shared action field immediately after each item description:

```ts
createContentActionsField({
  name: 'cardAction',
  label: 'Card Action',
  maxRows: 1,
}),
```

5. Keep the four legacy item fields exactly named and typed, but replace their conditional admin UI with `admin: { hidden: true }`.
6. Replace the visible block-wide action controls with compatible hidden fields:

```ts
{
  name: 'actionMode',
  label: 'Programme Action Style',
  type: 'select',
  defaultValue: 'link',
  options: [
    { label: 'Link', value: 'link' },
    { label: 'Button', value: 'button' },
  ],
  admin: { hidden: true },
} satisfies SelectField,
{
  name: 'actionVariant',
  label: 'Programme Button Variant',
  type: 'select',
  defaultValue: 'default',
  options: buttonVariantOptions,
  admin: {
    description: buttonVariantDescription,
    hidden: true,
  },
} satisfies SelectField,
{
  name: 'itemActionLabel',
  label: 'Programme Action Label',
  type: 'text',
  defaultValue: 'Learn More',
  admin: { hidden: true },
},
```

7. Add these visible controls before `contentAlignment`:

```ts
{
  name: 'headerLayout',
  label: 'Section Header Layout',
  type: 'select',
  defaultValue: 'stacked',
  required: true,
  options: [
    { label: 'Stacked', value: 'stacked' },
    { label: 'Split', value: 'split' },
  ],
} satisfies SelectField,
{
  name: 'headerPosition',
  label: 'Section Header Position',
  type: 'select',
  defaultValue: 'left',
  required: true,
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ],
  admin: {
    condition: isSplitHeader,
    description: 'Choose which side contains the section introduction on large screens.',
  },
} satisfies SelectField,
```

- [ ] **Step 5: Rerun the focused test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the schema contract**

```bash
git add src/blocks/ProgramMatrix/config.ts tests/int/program-matrix.int.spec.tsx
git commit -m "feat(program-matrix): add layout action fields"
```

---

## Task 2: Render stacked and 40/60 split layouts accessibly

**Files:**

- Modify: `tests/int/program-matrix.int.spec.tsx`
- Modify: `src/blocks/ProgramMatrix/Component.tsx`

- [ ] **Step 1: Add failing layout rendering tests**

Add tests that cover default normalization, left split, right split, and compact fallback. Use stable data attributes to verify structure and class contracts:

```ts
it('defaults invalid layout values to a stacked left introduction', () => {
  const html = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      headerLayout={'invalid' as never}
      headerPosition={'invalid' as never}
      items={baseItems}
      title="Programmes"
    />,
  )

  expect(html).toContain('data-program-matrix-layout="stacked"')
  expect(html).toContain('data-program-matrix-header-position="left"')
  expect(html).not.toContain('lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')
})

it('renders a 40/60 split with the introduction on the left', () => {
  const html = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      headerLayout="split"
      headerPosition="left"
      items={baseItems}
      title="Programmes"
    />,
  )

  expect(html).toContain('data-program-matrix-layout="split"')
  expect(html).toContain('data-program-matrix-header-position="left"')
  expect(html).toContain('lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')
  expect(html).not.toContain('lg:col-start-2 lg:row-start-1')
})

it('places a right-side split introduction visually without changing DOM order', () => {
  const html = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      headerLayout="split"
      headerPosition="right"
      items={baseItems}
      title="Programmes"
    />,
  )

  expect(html).toContain('lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]')
  expect(html).toContain('lg:col-start-2 lg:row-start-1')
  expect(html).toContain('lg:col-start-1 lg:row-start-1')
  expect(html.indexOf('data-program-matrix-intro="true"')).toBeLessThan(
    html.indexOf('data-program-matrix="true"'),
  )
})
```

Retain the existing `md:grid-cols-2` assertion to prove the matrix itself remains one column below `md` and two columns at `md` and above.

- [ ] **Step 2: Run the focused test and confirm the new tests fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: FAIL because the component has no layout props, data attributes, or split grid classes.

- [ ] **Step 3: Add normalized layout props and a shared content grid**

Extend `ProgramMatrixBlockLike`:

```ts
headerLayout?: 'split' | 'stacked' | null
headerPosition?: 'left' | 'right' | null
```

Destructure both props with schema-compatible defaults and normalize runtime input:

```ts
const resolvedHeaderLayout = headerLayout === 'split' ? 'split' : 'stacked'
const resolvedHeaderPosition = headerPosition === 'right' ? 'right' : 'left'
const usesSplitHeader = resolvedHeaderLayout === 'split'
```

Keep the existing outer container so the footer stays last. Wrap only the introduction and matrix in this inner grid:

```tsx
<div
  className={cn(
    'grid gap-10 md:gap-12',
    usesSplitHeader &&
      resolvedHeaderPosition === 'left' &&
      'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-16',
    usesSplitHeader &&
      resolvedHeaderPosition === 'right' &&
      'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-16',
  )}
  data-program-matrix-header-position={resolvedHeaderPosition}
  data-program-matrix-layout={resolvedHeaderLayout}
>
```

Add these properties to the existing introduction wrapper without moving it after the matrix in JSX:

```tsx
usesSplitHeader && resolvedHeaderPosition === 'right' && 'lg:col-start-2 lg:row-start-1'
data-program-matrix-intro="true"
```

Add this class to the existing matrix wrapper:

```tsx
usesSplitHeader && resolvedHeaderPosition === 'right' && 'lg:col-start-1 lg:row-start-1'
```

Close the inner grid immediately after the matrix, then render `BlockFooterActions` exactly where it is now. This preserves compact stacking and semantic reading order.

- [ ] **Step 4: Rerun layout tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the responsive layout**

```bash
git add src/blocks/ProgramMatrix/Component.tsx tests/int/program-matrix.int.spec.tsx
git commit -m "feat(program-matrix): render split header layout"
```

---

## Task 3: Resolve one independent action per card with legacy fallback

**Files:**

- Modify: `tests/int/program-matrix.int.spec.tsx`
- Modify: `src/blocks/ProgramMatrix/Component.tsx`

- [ ] **Step 1: Replace broad legacy-only action coverage with explicit precedence tests**

Add focused cases for all action contracts:

1. A card with `cardAction` mode `link` renders `ContentLink`.
2. A second card with mode `button`, variant `secondary`, and `showArrow: true` renders a small Button and its arrow.
3. A third card without an action renders no anchor or Button.
4. A valid new action wins when both new and legacy data exist.
5. An incomplete new action falls back to a valid legacy destination and the old block-wide label/style.
6. Invalid runtime mode and variant values normalize to `link` and `default` without throwing.
7. Page relationships still resolve hierarchical paths; custom new-tab links retain `target="_blank"` and `rel="noreferrer"`.
8. No `<article>` is wrapped in an anchor.

The core independent-action case should be:

```ts
const html = renderToStaticMarkup(
  <ProgramMatrixBlockComponent
    items={[
      {
        cardAction: [{ label: 'View programme', linkType: 'custom', mode: 'link', url: '/mbbs' }],
        title: 'MBBS',
      },
      {
        cardAction: [
          {
            label: 'Apply now',
            linkType: 'custom',
            mode: 'button',
            showArrow: true,
            url: '/apply/nursing',
            variant: 'secondary',
          },
        ],
        title: 'Nursing',
      },
      { title: 'Allied Health' },
    ]}
    title="Programmes"
  />,
)

expect(html.match(/data-program-matrix-item-action="true"/g)).toHaveLength(2)
expect(html).toContain('href="/mbbs"')
expect(html).toContain('data-content-link="true"')
expect(html).toContain('href="/apply/nursing"')
expect(html).toContain('data-slot="button"')
expect(html).toContain('data-variant="secondary"')
expect(html).toContain('data-action-arrow="true"')
expect(html).not.toContain('<a href="/mbbs"><article')
```

For precedence, provide `cardAction` URL `/new-action` and legacy URL `/legacy-action`; assert only `/new-action` renders. For fallback, provide a `cardAction` row with an empty label plus a valid legacy URL and assert the legacy URL, label, button mode, and variant render.

- [ ] **Step 2: Run the focused test and confirm the action cases fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: FAIL because the component does not read `cardAction` and still applies one block-wide action presentation to every legacy-linked card.

- [ ] **Step 3: Normalize new and legacy actions into `ResolvedCmsAction`**

Update imports in `Component.tsx`:

```ts
import { ActionButtonContent } from '@/components/ActionButtonContent'
import {
  resolveCmsActions,
  type CmsActionValue,
  type CmsActionVariant,
  type ResolvedCmsAction,
} from '@/lib/cmsLinks'
```

Add `cardAction?: CmsActionValue[] | null` to `ProgramMatrixItem`. Replace `href` and `openInNewTab` in `ResolvedProgramMatrixItem` with:

```ts
action?: ResolvedCmsAction
```

Add explicit runtime normalization and precedence helpers above the component:

```ts
const programmeActionVariants = new Set<CmsActionVariant>([
  'default',
  'outline',
  'primary',
  'secondary',
  'white',
  'whiteOutline',
])

const normalizeProgrammeAction = (
  action?: ResolvedCmsAction,
): ResolvedCmsAction | undefined =>
  action
    ? {
        ...action,
        mode: action.mode === 'button' ? 'button' : 'link',
        variant: programmeActionVariants.has(action.variant) ? action.variant : 'default',
      }
    : undefined

const resolveProgrammeAction = (
  item: ProgramMatrixItem,
  legacyMode: 'button' | 'link',
  legacyVariant: CmsActionVariant,
  legacyLabel: string,
): ResolvedCmsAction | undefined => {
  const authoredAction = normalizeProgrammeAction(resolveCmsActions(item.cardAction)[0])
  if (authoredAction) return authoredAction

  if (item.linkType !== 'page' && item.linkType !== 'custom') return undefined

  return normalizeProgrammeAction(
    resolveCmsActions([
      {
        label: legacyLabel,
        linkType: item.linkType,
        mode: legacyMode,
        openInNewTab: item.openInNewTab,
        page: item.page,
        url: item.url,
        variant: legacyVariant,
      },
    ])[0],
  )
}
```

Normalize legacy block values before resolving items:

```ts
const resolvedLegacyActionMode = actionMode === 'button' ? 'button' : 'link'
const resolvedLegacyActionVariant = programmeActionVariants.has(actionVariant as CmsActionVariant)
  ? (actionVariant as CmsActionVariant)
  : 'default'
const resolvedLegacyActionLabel = itemActionLabel?.trim() || 'Learn More'
```

Move these values before the item mapping and set each resolved item's `action` with `resolveProgrammeAction`. Remove the manual `getPageHref` branch and its unused import.

- [ ] **Step 4: Render only the resolved explicit action**

Change `ProgrammeActionProps` to accept a single action object plus surface classes:

```ts
type ProgrammeActionProps = {
  action: ResolvedCmsAction
  buttonClassName?: string
  linkClassName?: string
}
```

Render a button only when `action.mode === 'button' && action.variant !== 'link'`. Use:

```tsx
<ActionButtonContent label={action.label} showArrow={action.showArrow} />
```

Keep `size="sm"`, surface-specific `buttonClassName`, safe new-tab attributes, and `ContentLink` for link mode. In each card use the action's own variant:

```ts
const buttonClassName = item.action ? surface.button[item.action.variant] : undefined
```

Replace the legacy `item.href` render condition with:

```tsx
{item.action ? (
  <div className="mt-auto pt-6" data-program-matrix-item-action="true">
    <ProgrammeAction
      action={item.action}
      buttonClassName={buttonClassName}
      linkClassName={surface.link}
    />
  </div>
) : null}
```

- [ ] **Step 5: Rerun the focused action suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: PASS, including all new action precedence and compatibility cases.

- [ ] **Step 6: Run the shared button-variant contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/button-primary-variant.int.spec.tsx
```

Expected: PASS. The hidden legacy `actionVariant` field remains registered, so the historical schema contract is preserved.

- [ ] **Step 7: Commit the action renderer**

```bash
git add src/blocks/ProgramMatrix/Component.tsx tests/int/program-matrix.int.spec.tsx
git commit -m "feat(program-matrix): render per-card actions"
```

---

## Task 4: Refresh the fixture, generated types, thumbnail, and documentation

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `src/payload-types.ts` (generated)
- Modify: `public/block-thumbnails/program-matrix.jpg` (generated)
- Modify: `tests/int/program-matrix.int.spec.tsx`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Possibly modify: `.agents/skills/project-context/project-inventory.json` (generated only if the context updater detects factual changes)

- [ ] **Step 1: Update catalog tests before their sources**

Replace fixture assertions for block-wide action props with:

```ts
expect(thumbnailFixturesSource).toContain('headerLayout="split"')
expect(thumbnailFixturesSource).toContain('headerPosition="left"')
expect(thumbnailFixturesSource).toContain('cardAction:')
expect(thumbnailFixturesSource).toContain("label: 'View programme'")
expect(thumbnailFixturesSource).toContain("label: 'Apply now'")
expect(thumbnailFixturesSource).toContain("url: '/programmes/mbbs'")
```

Extend the generated-type assertions:

```ts
expect(payloadTypesSource).toContain('cardAction?:')
expect(payloadTypesSource).toContain("headerLayout: 'stacked' | 'split'")
expect(payloadTypesSource).toContain("headerPosition: 'left' | 'right'")
```

Replace the old guide wording assertions with:

```ts
expect(blocksGuideSource).toContain('stacked or 40/60 split introduction')
expect(blocksGuideSource).toContain('one optional per-card Link or Button action')
expect(featureInventorySource).toContain('introduction remains first in document order')
```

- [ ] **Step 2: Run the focused test and confirm artifact assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: FAIL on the fixture, generated types, and documentation assertions.

- [ ] **Step 3: Update the representative thumbnail fixture**

In the `programMatrix` fixture:

- Add `headerLayout="split"` and `headerPosition="left"`.
- Remove `actionMode` and `itemActionLabel` props.
- Replace the MBBS legacy link fields with:

```ts
cardAction: [
  {
    label: 'View programme',
    linkType: 'custom',
    mode: 'link',
    url: '/programmes/mbbs',
  },
],
```

- Add this action to the Postgraduate card:

```ts
cardAction: [
  {
    label: 'Apply now',
    linkType: 'custom',
    mode: 'button',
    showArrow: true,
    url: '/admissions',
    variant: 'secondary',
  },
],
```

- Leave the Nursing and Allied Health cards without actions so the preview demonstrates optionality.

- [ ] **Step 4: Update current operator and architecture documentation**

Change the Program Matrix row in `docs/guides/blocks.md` to:

```md
| Program Matrix | Stacked or 40/60 split introduction beside a seamless one/two-column matrix, with flexible Lucide icons, semantic card backgrounds, and one optional per-card Link or Button action |
```

Add this paragraph after the block inventory description in `docs/architecture/feature-inventory.md`:

```md
Program Matrix supports a stacked introduction or a 40/60 split at large breakpoints, with the introduction on either visual side. The introduction remains first in document order, and every programme card can independently expose one optional Link or Button action.
```

Add the same behavioral contract, without duplicating editor prose, to the Program Matrix subsection of `.agents/skills/project-context/references/block-system.md`:

```md
- Program Matrix keeps its introduction before the matrix and footer actions in document order. Editors can use a stacked layout or a large-screen 40/60 split with the introduction on either visual side. Each card owns at most one optional Link or Button action; hidden legacy link and block-wide action fields remain registered only for saved-content compatibility.
```

- [ ] **Step 5: Generate Payload types and inspect the exact interface**

Run:

```bash
pnpm generate:types
rg -n "interface ProgramMatrixBlock|cardAction|headerLayout|headerPosition|actionMode|itemActionLabel" src/payload-types.ts
```

Expected: `ProgramMatrixBlock` contains `cardAction`, `headerLayout`, and `headerPosition`; it still contains the hidden legacy fields. No import-map generation is required because this change adds no custom Admin component.

- [ ] **Step 6: Regenerate and visually inspect the Program Matrix thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=programMatrix pnpm generate:block-thumbnails
```

Then inspect `public/block-thumbnails/program-matrix.jpg` with the workspace image viewer. Verify at 1600×900 that:

- the introduction occupies the left two-fifths and the matrix occupies the right three-fifths;
- all four programme cards remain legible with intact dividers;
- the first card shows a text link, the second shows a button, and the remaining cards show no action;
- no text or action is clipped.

- [ ] **Step 7: Rerun the focused test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 8: Update and verify generated project context**

Run:

```bash
pnpm project-context:update
git diff -- .agents/skills/project-context/project-inventory.json .agents/skills/project-context/references/block-system.md
pnpm project-context:check
```

Expected: context check PASS. Preserve the handwritten `block-system.md` contract. Commit `project-inventory.json` only when the updater produces a factual diff; unchanged block registration and paths may make the generated inventory a no-op.

- [ ] **Step 9: Commit artifacts and documentation**

Stage the exact files that changed:

```bash
git add src/block-thumbnails/fixtures.tsx src/payload-types.ts public/block-thumbnails/program-matrix.jpg tests/int/program-matrix.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/project-inventory.json
git commit -m "docs(program-matrix): refresh block artifacts"
```

---

## Task 5: Run final quality and impact checks

**Files:**

- Verify only; modify feature files only when a check exposes a defect

- [ ] **Step 1: Run focused and neighboring block contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx tests/int/button-primary-variant.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/card-block-theme-contract.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
```

Expected: all selected test files PASS.

- [ ] **Step 2: Run lint and type checking for the touched implementation**

Run:

```bash
pnpm exec eslint src/blocks/ProgramMatrix/config.ts src/blocks/ProgramMatrix/Component.tsx src/block-thumbnails/fixtures.tsx tests/int/program-matrix.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: both commands exit 0 with no errors.

- [ ] **Step 3: Run the final project-context check**

Run:

```bash
pnpm project-context:check
```

Expected: PASS.

- [ ] **Step 4: Audit the final diff against the approved design and user-owned changes**

Run:

```bash
git status --short
git diff 4a28967..HEAD -- src/blocks/ProgramMatrix tests/int/program-matrix.int.spec.tsx src/block-thumbnails/fixtures.tsx src/payload-types.ts public/block-thumbnails/program-matrix.jpg docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context
```

Confirm:

- stacked is the default and malformed layouts normalize safely;
- split begins only at `lg` and uses a 40/60 ratio;
- right-side visual placement does not alter DOM order;
- each card has zero or one independently configured action;
- invalid new actions allow valid legacy fallback;
- hidden legacy fields remain in schema and generated types;
- the card itself is not clickable;
- footer actions remain below the matrix;
- `skills-lock.json` and `.agents/skills/content-research-writer/` remain untouched by feature commits.

- [ ] **Step 5: Commit only if verification required a repair**

If a check required a feature-file repair, rerun the failed check plus the focused Program Matrix test, then commit only that repair:

```bash
git add src/blocks/ProgramMatrix/config.ts src/blocks/ProgramMatrix/Component.tsx tests/int/program-matrix.int.spec.tsx src/block-thumbnails/fixtures.tsx src/payload-types.ts public/block-thumbnails/program-matrix.jpg docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md
git commit -m "fix(program-matrix): satisfy final contracts"
```

Expected: no repair commit when every prior task is green.
