# Editorial Reasons Three-Column Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in Editorial Reasons presentation that renders each reason as number, title, and description columns on desktop while preserving compact responsive behavior and all existing layouts.

**Architecture:** Expand the existing `numberLayout` schema union with `columns`, then isolate its responsive row markup inside `EditorialReasonsBlockComponent`. Three Columns resolves the outer reasons grid to one column while preserving the stored `listColumns` value for Stacked and Inline, and it reuses the existing shared typography, link, surface, divider, action, and spacing contracts.

**Tech Stack:** Payload CMS 3.85, React 19 server rendering, TypeScript 5.7, Tailwind CSS 4, Vitest 4, project thumbnail and context generators

## Global Constraints

- Extend the existing `editorialReasons` block; do not create a new block or Icon Grid variant.
- Add `columns` as an opt-in `numberLayout` value labelled `Three Columns (number + title + description)`.
- Keep `stacked` as the default and preserve current Stacked and Inline output.
- When Three Columns is selected, hide `listColumns` in the Admin and resolve the outer list grid to one column without deleting its stored value.
- Desktop rows render `number | title | description`; below `lg`, the description sits below and aligns with the title.
- Rows without descriptions remain valid and let the title span the remaining large-screen content width.
- Preserve generated numbering, semantic heading order, Page/custom links, safe new-tab attributes, actions, sticky introduction behavior, border styles, appearance, and spacing.
- Reuse `contentItemMetadataClasses`, `contentItemTitleClasses`, `contentItemLinkClasses`, and `contentItemDescriptionClasses` without changing their definitions.
- Do not modify `src/styles/themes/theme-snmih.css` or introduce new theme tokens or component-local colors.
- Regenerate only `public/block-thumbnails/editorial-reasons.jpg`.
- Refresh generated Payload types and maintained project context.
- Do not stage or commit any change.

---

### Task 1: Expand the Payload presentation contract

**Files:**

- Modify: `tests/int/editorial-reasons.int.spec.tsx:90-210`
- Modify: `src/blocks/EditorialReasons/config.ts:11-16,171-197`

**Interfaces:**

- Consumes: the existing `numberLayout` and `listColumns` sibling fields in the Editorial Reasons Theme Settings tab.
- Produces: `numberLayout: 'stacked' | 'inline' | 'columns'` with the unchanged `stacked` default.
- Produces: `supportsOuterListColumns(_data, siblingData): boolean`, returning `false` only when `numberLayout === 'columns'`.

- [ ] **Step 1: Extend the focused schema test with the new option and field condition**

In `defines reason links and approved theme controls`, replace the `numberLayout` expectation with:

```tsx
expect(numberLayout).toMatchObject({
  type: 'select',
  defaultValue: 'stacked',
  required: true,
  options: [
    { label: 'Stacked (number above title)', value: 'stacked' },
    { label: 'Inline (number beside title)', value: 'inline' },
    {
      label: 'Three Columns (number + title + description)',
      value: 'columns',
    },
  ],
})
```

Immediately after the existing `listColumns` expectation, add:

```tsx
expect(listColumns.admin?.condition?.({}, { numberLayout: 'stacked' }, {} as never)).toBe(true)
expect(listColumns.admin?.condition?.({}, { numberLayout: 'inline' }, {} as never)).toBe(true)
expect(listColumns.admin?.condition?.({}, { numberLayout: 'columns' }, {} as never)).toBe(false)
```

- [ ] **Step 2: Run the schema test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/editorial-reasons.int.spec.tsx -t "defines reason links and approved theme controls" --reporter=dot
```

Expected: FAIL because the config does not expose `columns` and does not conditionally hide
`listColumns`.

- [ ] **Step 3: Extend the sibling-data type and add the Admin condition**

Replace `EditorialReasonsLayoutSiblingData` in `src/blocks/EditorialReasons/config.ts` with:

```ts
type EditorialReasonsLayoutSiblingData = {
  layoutProportion?: 'balanced' | 'fullWidth' | 'introFocus' | 'listFocus' | null
  numberLayout?: 'columns' | 'inline' | 'stacked' | null
}
```

Add this condition beside `isSplitLayout`:

```ts
const supportsOuterListColumns = (_data: unknown, siblingData: EditorialReasonsLayoutSiblingData) =>
  siblingData?.numberLayout !== 'columns'
```

- [ ] **Step 4: Apply the condition to `listColumns` and add the new option**

Update the existing `listColumns.admin` object to:

```ts
admin: {
  condition: supportsOuterListColumns,
  description:
    'Sets the desktop list layout. Two to four columns collapse responsively on smaller screens. Three Columns number layout uses one full-width list column.',
},
```

Append this option after Inline in `numberLayout.options`:

```ts
{
  label: 'Three Columns (number + title + description)',
  value: 'columns',
},
```

Do not change `defaultValue: 'stacked'` or `required: true`.

- [ ] **Step 5: Run the focused schema contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/editorial-reasons.int.spec.tsx -t "defines reason links and approved theme controls" --reporter=dot
```

Expected: PASS.

---

### Task 2: Render responsive three-column reason rows

**Files:**

- Modify: `tests/int/editorial-reasons.int.spec.tsx:450-535`
- Modify: `src/blocks/EditorialReasons/Component.tsx:37-47,129-163,165-224,303-372`
- Verify unchanged: `src/blocks/shared/contentStyles.ts`
- Verify unchanged: `src/styles/themes/theme-snmih.css`

**Interfaces:**

- Consumes: `numberLayout?: 'columns' | 'inline' | 'stacked' | null` and the resolved reasons array.
- Produces: `resolveNumberLayout(value): 'columns' | 'inline' | 'stacked'` with the existing `stacked` fallback.
- Produces: `data-editorial-reason-number-layout="columns"`, `data-editorial-reason-title="true"`, and `data-editorial-reason-description="true"` hooks for the new presentation.
- Preserves: the existing HTML emitted for Stacked and Inline titles, descriptions, links, and number spacing.

- [ ] **Step 1: Add a failing renderer contract for columns, responsive flow, links, and missing descriptions**

Add this test after the existing Stacked/Inline number-layout test:

```tsx
it('renders three-column rows responsively and forces one outer list column', () => {
  const html = renderToStaticMarkup(
    <EditorialReasonsBlockComponent
      listColumns="4"
      numberLayout="columns"
      reasons={[
        {
          description: 'Maintain high standards of teaching and assessment.',
          title: 'Academic Excellence',
        },
        {
          linkType: 'custom',
          openInNewTab: true,
          title: 'Student Development',
          url: 'https://example.edu/student-development',
        },
      ]}
      title="What shapes the learning environment"
    />,
  )

  expect(html).toContain('data-editorial-reasons-columns="1"')
  expect(html).toContain('grid-cols-1')
  expect(html).not.toContain('xl:grid-cols-4')
  expect(html.match(/data-editorial-reason-number-layout="columns"/g)).toHaveLength(2)
  expect(html.match(/data-editorial-reason-title="true"/g)).toHaveLength(2)
  expect(html.match(/data-editorial-reason-description="true"/g)).toHaveLength(1)
  expect(html).toContain('grid-cols-[3.5rem_minmax(0,1fr)]')
  expect(html).toContain('sm:grid-cols-[4.5rem_minmax(0,1fr)]')
  expect(html).toContain('lg:grid-cols-[4.5rem_minmax(0,1.1fr)_minmax(0,1fr)]')
  expect(html).toContain('col-start-2 lg:col-start-3 lg:row-start-1')
  expect(html).toContain('lg:col-span-2')
  expect(html.indexOf('>01<')).toBeLessThan(html.indexOf('data-editorial-reason-title="true"'))
  expect(html.indexOf('data-editorial-reason-title="true"')).toBeLessThan(
    html.indexOf('data-editorial-reason-description="true"'),
  )
  expect(html).toContain('href="https://example.edu/student-development"')
  expect(html).toContain('target="_blank"')
  expect(html).toContain('rel="noreferrer"')
})
```

- [ ] **Step 2: Run the new renderer test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/editorial-reasons.int.spec.tsx -t "renders three-column rows responsively" --reporter=dot
```

Expected: FAIL because `columns` is not accepted or rendered and `listColumns="4"` is not overridden.

- [ ] **Step 3: Expand the component type and safe resolver**

Change the number-layout type alias to:

```ts
type EditorialReasonsNumberLayout = 'columns' | 'inline' | 'stacked'
```

Change the allowed-value set to:

```ts
const numberLayoutValues = new Set<EditorialReasonsNumberLayout>(['stacked', 'inline', 'columns'])
```

Keep `resolveNumberLayout` falling back to `stacked` for missing or stale values.

- [ ] **Step 4: Resolve Three Columns before resolving the outer list grid**

Replace the current list-column and number-layout resolution order with:

```ts
const resolvedNumberLayout = resolveNumberLayout(numberLayout)
const resolvedListColumns =
  resolvedNumberLayout === 'columns' ? '1' : resolveListColumns(listColumns)
```

Remove the later duplicate `resolvedNumberLayout` declaration. This changes only the effective outer
grid for the new presentation; the `listColumns` prop and stored Payload value are not mutated.

- [ ] **Step 5: Prepare one title node without changing existing link behavior**

At the start of the `resolvedReasons.map` callback, before returning the article, define:

```tsx
const reasonTitle = reason.href ? (
  <h3>
    <a
      className={cn(contentItemTitleClasses, contentItemLinkClasses)}
      href={reason.href}
      rel={reason.openInNewTab ? 'noreferrer' : undefined}
      target={reason.openInNewTab ? '_blank' : undefined}
    >
      {reason.title}
    </a>
  </h3>
) : (
  <h3 className={contentItemTitleClasses}>{reason.title}</h3>
)
```

Use this node in both the new Columns branch and the existing Stacked/Inline branch. Do not change
the existing title classes or external-link attributes.

- [ ] **Step 6: Add the isolated Columns article layout**

Update the article layout branch to:

```tsx
className={cn(
  'min-w-0 border-b border-current/15 px-6 py-7 sm:py-8',
  resolvedNumberLayout === 'columns'
    ? 'grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-5 gap-y-2 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-x-6 lg:grid-cols-[4.5rem_minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-x-8'
    : resolvedNumberLayout === 'inline'
      ? 'grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-5 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-6'
      : 'flex flex-col',
)}
```

Update the number spacing branch so Inline and Columns share the compact rail placement:

```tsx
resolvedNumberLayout === 'stacked' ? 'mb-6 tabular-nums' : 'pt-1 tabular-nums'
```

Replace the current title/description container with:

```tsx
{
  resolvedNumberLayout === 'columns' ? (
    <>
      <div
        className={cn('min-w-0', !reason.description && 'lg:col-span-2')}
        data-editorial-reason-title="true"
      >
        {reasonTitle}
      </div>
      {reason.description ? (
        <p
          className={cn(contentItemDescriptionClasses, 'col-start-2 lg:col-start-3 lg:row-start-1')}
          data-editorial-reason-description="true"
        >
          {reason.description}
        </p>
      ) : null}
    </>
  ) : (
    <div className="min-w-0">
      {reasonTitle}
      {reason.description ? (
        <p className={cn(contentItemDescriptionClasses, 'mt-2')}>{reason.description}</p>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 7: Run the focused renderer and regression contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/editorial-reasons.int.spec.tsx -t "number rail|three-column rows|responsive list columns|list border style|filters invalid rows" --reporter=dot
```

Expected: PASS. The existing Stacked/Inline, list-column, border, filtering, and link tests remain green.

- [ ] **Step 8: Run typography and theme-boundary checks**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/editorial-reasons.int.spec.tsx tests/int/content-style-parity.int.spec.ts tests/int/card-block-theme-contract.int.spec.ts --reporter=dot
git diff --exit-code -- src/blocks/shared/contentStyles.ts src/styles/themes/theme-snmih.css
```

Expected: all tests PASS and both shared typography definitions and the SNMIH theme have no diff.

---

### Task 3: Refresh generated types, operator guidance, and the block preview

**Files:**

- Modify through generation: `src/payload-types.ts`
- Modify: `tests/int/editorial-reasons.int.spec.tsx:716-750`
- Modify: `docs/guides/blocks.md:74-82`
- Modify: `src/block-thumbnails/fixtures.tsx:587-616`
- Regenerate: `public/block-thumbnails/editorial-reasons.jpg`
- Verify unchanged: `src/block-thumbnails/definitions.ts`
- Verify unchanged: `docs/architecture/feature-inventory.md`

**Interfaces:**

- Produces: generated `EditorialReasonsBlock.numberLayout: 'stacked' | 'inline' | 'columns'`.
- Produces: an operator-guide recipe for the approved split layout.
- Produces: a 1600×900 Admin picker preview rendered by the production Editorial Reasons component.

- [ ] **Step 1: Add failing generated-contract, documentation, and fixture assertions**

In `is represented in generated Payload types`, add:

```tsx
expect(payloadTypesSource).toContain("numberLayout: 'stacked' | 'inline' | 'columns'")
```

In `has thumbnail definition and fixture coverage`, add:

```tsx
expect(thumbnailFixturesSource).toMatch(
  /editorialReasons:[\s\S]*listColumns="1"[\s\S]*numberLayout="columns"[\s\S]*cta39:/,
)
```

In the documentation test, add:

```tsx
expect(blocksGuideSource).toContain('Three Columns')
expect(blocksGuideSource).toContain('number, title, and description')
```

- [ ] **Step 2: Run the catalog/documentation tests and verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/editorial-reasons.int.spec.tsx -t "generated Payload types|thumbnail definition|operator documentation" --reporter=dot
```

Expected: FAIL because the generated union, fixture props, and guide copy do not yet include Three Columns.

- [ ] **Step 3: Regenerate Payload types from the updated schema**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` changes only where Payload records the expanded `numberLayout`
union or deterministic schema output. Do not hand-edit this generated file.

- [ ] **Step 4: Configure the Editorial Reasons fixture for the approved layout**

Add these props to the existing `editorialReasons` fixture in
`src/block-thumbnails/fixtures.tsx`:

```tsx
listColumns = '1'
numberLayout = 'columns'
```

Keep its existing introduction, four reasons, appearance, and compact section size.

- [ ] **Step 5: Document how editors recreate the reference composition**

Extend the Editorial Reasons paragraph in `docs/guides/blocks.md` with:

```markdown
Number Layout offers Stacked, Inline, and Three Columns. Three Columns places each generated
number, title, and description in separate desktop columns, then moves the description beneath the
title on smaller screens. It always uses one outer list column; choose List Focus, List Position
Right, Introduction Alignment Top, and Ruled borders to reproduce the reference-style composition.
```

Keep the existing Full Width, proportions, alignment, list-column, border-style, and divider guidance.

- [ ] **Step 6: Run the focused catalog and documentation suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/editorial-reasons.int.spec.tsx tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts --reporter=dot
```

Expected: PASS.

- [ ] **Step 7: Regenerate only the Editorial Reasons thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=editorialReasons pnpm generate:block-thumbnails
```

Expected: only `public/block-thumbnails/editorial-reasons.jpg` is regenerated at 1600×900. Inspect
the image once and confirm the left introduction/right ruled list composition, three aligned row
regions, shared typography, clean wrapping, and unchanged theme surface.

- [ ] **Step 8: Perform one bounded mobile visual check**

Open the local Editorial Reasons block preview, set the viewport to 390×844, and inspect once.
Confirm the introduction precedes the list, each number remains in its rail, each description aligns
under its title, dividers remain continuous, and there is no horizontal overflow. Fix all visible
layout defects in one batch and perform at most one confirmation pass.

---

### Task 4: Refresh project knowledge and verify the complete change

**Files:**

- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify through generation: `.agents/skills/project-context/references/project-inventory.json`
- Verify unchanged: `src/styles/themes/theme-snmih.css`
- Verify unchanged: `src/blocks/shared/contentStyles.ts`
- Verify unchanged: `src/block-thumbnails/definitions.ts`
- Verify unchanged: `docs/architecture/feature-inventory.md`

**Interfaces:**

- Produces: maintained block-system guidance recording the one-column outer-grid constraint.
- Produces: a deterministic project inventory matching the final uncommitted source tree.

- [ ] **Step 1: Record the new block-specific operator contract**

Add this paragraph under **Shared Configuration and Presentation** in
`.agents/skills/project-context/references/block-system.md`:

```markdown
Editorial Reasons supports Stacked, Inline, and Three Columns number layouts. Three Columns uses one
outer reasons column so each row can place its generated number, title, and description in separate
large-screen columns; compact screens place the description beneath the title. Selecting it hides
the outer List Columns control without deleting that stored value.
```

- [ ] **Step 2: Refresh and check maintained project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
pnpm test:project-context
```

Expected: the inventory hash refreshes, project context reports current, and project-context tests
PASS. A stale knowledge-graph commit warning is non-blocking because no architecture graph structure
changed.

- [ ] **Step 3: Run the final affected verification matrix**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/editorial-reasons.int.spec.tsx tests/int/content-style-parity.int.spec.ts tests/int/card-block-theme-contract.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/project-context-lib.int.spec.ts tests/int/project-context-repository.int.spec.ts --reporter=dot
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/EditorialReasons/Component.tsx src/blocks/EditorialReasons/config.ts tests/int/editorial-reasons.int.spec.tsx src/block-thumbnails/fixtures.tsx
pnpm exec prettier --check src/blocks/EditorialReasons/Component.tsx src/blocks/EditorialReasons/config.ts tests/int/editorial-reasons.int.spec.tsx src/block-thumbnails/fixtures.tsx docs/guides/blocks.md .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-17-editorial-reasons-three-column-rows-design.md docs/superpowers/plans/2026-08-17-editorial-reasons-three-column-rows.md
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/EditorialReasons/Component.tsx
pnpm project-context:check
git diff --check
```

Expected: all affected tests and static checks PASS, the layout detector returns `[]`, project
context is current, and the diff has no whitespace errors.

- [ ] **Step 4: Confirm generated files and protected files have the intended scope**

Run:

```bash
git diff --exit-code -- src/styles/themes/theme-snmih.css src/blocks/shared/contentStyles.ts src/block-thumbnails/definitions.ts docs/architecture/feature-inventory.md
git status --short
git diff --stat
```

Expected implementation changes are limited to:

- `src/blocks/EditorialReasons/config.ts`
- `src/blocks/EditorialReasons/Component.tsx`
- `tests/int/editorial-reasons.int.spec.tsx`
- `src/payload-types.ts`
- `src/block-thumbnails/fixtures.tsx`
- `public/block-thumbnails/editorial-reasons.jpg`
- `docs/guides/blocks.md`
- `.agents/skills/project-context/references/block-system.md`
- `.agents/skills/project-context/references/project-inventory.json`
- the approved design and implementation-plan documents

No file is staged or committed.
