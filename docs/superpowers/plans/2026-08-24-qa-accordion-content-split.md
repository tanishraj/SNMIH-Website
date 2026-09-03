# Q&A Accordion Section Content Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Q&A Accordion split modes place section content in one column and accordion items in the other, while preserving mobile reading order and existing saved content.

**Architecture:** Keep the existing Payload field names and option values, but clarify their Admin labels. Refactor the block renderer into two explicit regions: a section-content region containing the introduction and optional Profile/Contact Prompt, and a Q&A-only region. Let `layoutMode` own the grid independently of optional supporting content; let `accordionPlacement` change desktop visual order only.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16, React 19, Radix UI Accordion, Tailwind CSS 4, TypeScript, Vitest.

## Global Constraints

- Do not rename Payload fields or option values and do not add a migration.
- Preserve `layoutMode` values `fiftyFifty`, `oneThird`, and `fullWidth`.
- Preserve `accordionPlacement` values `left` and `right`.
- Keep section content first and Q&A second in DOM/mobile order.
- Apply `contentAlignment` only to the section introduction; Q&A rows and optional Profile/Contact content stay left-aligned.
- Hide Profile and Contact Prompt at runtime in Full Width mode, matching the existing Admin condition.
- Keep Footer Actions after the complete content/Q&A composition.
- Preserve the existing appearance, spacing, accordion state, media, action, and diagnostic contracts unless this plan explicitly changes one.
- Generated Payload types must remain structurally unchanged.
- Preserve unrelated working-tree changes.

---

### Task 1: Clarify the split controls without changing saved data

**Files:**

- Modify: `tests/int/qa-accordion.int.spec.ts`
- Modify: `src/blocks/QaAccordion/config.ts`

**Interfaces:**

- Consumes: `QaAccordionBlock.fields`, `layoutMode`, `accordionPlacement`, and the existing `hasSplitLayout` Admin condition.
- Produces: clearer editor-facing labels with the same defaults, field names, option values, and visibility conditions.

- [ ] **Step 1: Add config traversal helpers to the focused test**

Extend the imports in `tests/int/qa-accordion.int.spec.ts`:

```ts
import type { Field, SelectField, Tab } from 'payload'

import { QaAccordionBlockComponent } from '@/blocks/QaAccordion/Component'
import { QaAccordionBlock } from '@/blocks/QaAccordion/config'
```

Add these helpers after `createRichText`:

```ts
const getTabs = () => {
  const tabsField = QaAccordionBlock.fields[0]

  if (tabsField?.type !== 'tabs' || typeof tabsField.tabs === 'function') {
    throw new Error('Expected Q&A Accordion to use static tabs')
  }

  return tabsField.tabs as Tab[]
}

const getNamedField = (fields: Field[], name: string) => {
  const field = fields.find((candidate) => 'name' in candidate && candidate.name === name)

  if (!field || !('name' in field)) {
    throw new Error(`Expected Q&A Accordion field: ${name}`)
  }

  return field
}
```

- [ ] **Step 2: Add a failing Admin contract test**

Add this test before the render tests:

```ts
it('describes section-content split controls without changing their stored values', () => {
  const tabs = getTabs()
  const contentTab = tabs.find((tab) => tab.label === 'Content')
  const themeTab = tabs.find((tab) => tab.label === 'Theme Settings')

  if (!contentTab || !themeTab) {
    throw new Error('Expected Q&A Accordion Content and Theme Settings tabs')
  }

  const layoutMode = getNamedField(themeTab.fields, 'layoutMode') as SelectField
  const placement = getNamedField(themeTab.fields, 'accordionPlacement') as SelectField
  const sideColumn = getNamedField(contentTab.fields, 'sideColumn')

  expect(layoutMode.defaultValue).toBe('fiftyFifty')
  expect(layoutMode.options).toEqual([
    { label: '50 / 50', value: 'fiftyFifty' },
    { label: 'One-Third Content / Two-Thirds Q&A', value: 'oneThird' },
    { label: 'Full Width', value: 'fullWidth' },
  ])
  expect(placement.label).toBe('Q&A Placement')
  expect(placement.defaultValue).toBe('right')
  expect(placement.options).toEqual([
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ])

  const placementCondition = placement.admin?.condition
  const sideColumnCondition = 'admin' in sideColumn ? sideColumn.admin?.condition : undefined

  expect(placementCondition?.({}, { layoutMode: 'fiftyFifty' }, {} as never)).toBe(true)
  expect(placementCondition?.({}, { layoutMode: 'oneThird' }, {} as never)).toBe(true)
  expect(placementCondition?.({}, { layoutMode: 'fullWidth' }, {} as never)).toBe(false)
  expect(sideColumnCondition?.({}, { layoutMode: 'fiftyFifty' }, {} as never)).toBe(true)
  expect(sideColumnCondition?.({}, { layoutMode: 'oneThird' }, {} as never)).toBe(true)
  expect(sideColumnCondition?.({}, { layoutMode: 'fullWidth' }, {} as never)).toBe(false)
})
```

If Payload's `Tab` type is not exported in the installed version, infer the return type from the static `tabsField.tabs` value rather than weakening the helper to `any`.

- [ ] **Step 3: Run the focused test and verify the label failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/qa-accordion.int.spec.ts
```

Expected: the new test fails because the current labels are `One-Third Side Column` and `Accordion Placement`.

- [ ] **Step 4: Update only the editor-facing labels**

In `src/blocks/QaAccordion/config.ts`, change the One-Third option to:

```ts
{ label: 'One-Third Content / Two-Thirds Q&A', value: 'oneThird' },
```

Change the placement field label to:

```ts
label: 'Q&A Placement',
```

Do not change field names, option values, defaults, or conditions.

- [ ] **Step 5: Re-run the focused test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/qa-accordion.int.spec.ts
```

Expected: the Admin contract passes; existing renderer assertions may still fail only after the Task 2 test expectations are introduced.

---

### Task 2: Separate section content from Q&A and preserve authored split layouts

**Files:**

- Modify: `tests/int/qa-accordion.int.spec.ts`
- Modify: `src/blocks/QaAccordion/Component.tsx`

**Interfaces:**

- Consumes: `layoutMode`, `accordionPlacement`, `contentAlignment`, `sideColumn.profile`, and `sideColumn.contact`.
- Produces: a content-first DOM with `data-qa-accordion-section-content="true"`, a Q&A-only `data-qa-accordion-main="true"` region, and a grid selected solely by the normalized authored layout.

- [ ] **Step 1: Update the existing render expectations for the new responsibilities**

In the One-Third/right test, replace the old order assertions with:

```ts
expect(html).toContain('data-qa-accordion-section-content="true"')
expect(html).toContain('order-1 lg:order-1')
expect(html).toContain('data-qa-accordion-main="true"')
expect(html).toContain('order-2 lg:order-2 lg:col-span-2')
```

Keep the Profile/Contact assertions, including `data-qa-accordion-side-column="true"`, to prove they moved under section content rather than disappearing.

In the Full Width test, add:

```ts
expect(html).toContain('data-qa-accordion-section-content="true"')
expect(html.indexOf('data-qa-accordion-section-content="true"')).toBeLessThan(
  html.indexOf('data-qa-accordion-main="true"'),
)
```

In the 50/50/left test, replace the old order assertions with:

```ts
expect(html).toContain('data-qa-accordion-section-content="true"')
expect(html).toContain('order-1 lg:order-2')
expect(html).toContain('data-qa-accordion-main="true"')
expect(html).toContain('order-2 lg:order-1')
```

- [ ] **Step 2: Add the critical empty-support split regression**

Add:

```ts
it('keeps an authored 50/50 split when Profile and Contact Prompt are empty', () => {
  const html = renderToStaticMarkup(
    createElement(QaAccordionBlockComponent, {
      accordionPlacement: 'right',
      description: 'Core information remains in the content column.',
      items: [
        {
          answer: createRichText('The Q&A remains in its own column.'),
          question: 'Does the split depend on supporting content?',
        },
      ],
      layoutMode: 'fiftyFifty',
      title: 'Independent split layout',
    }),
  )

  expect(html).toContain('data-qa-accordion-layout="fiftyFifty"')
  expect(html).toContain('data-qa-accordion-has-side-column="false"')
  expect(html).toContain('grid grid-cols-1 gap-8 lg:grid-cols-2')
  expect(html).toContain('data-qa-accordion-section-content="true"')
  expect(html).toContain('data-qa-accordion-main="true"')
  expect(html.indexOf('data-qa-accordion-section-content="true"')).toBeLessThan(
    html.indexOf('data-qa-accordion-main="true"'),
  )
})
```

- [ ] **Step 3: Run the focused test and verify the layout failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/qa-accordion.int.spec.ts
```

Expected: the new/updated render assertions fail because the introduction is still inside the accordion region and a split without optional side content collapses to Full Width.

- [ ] **Step 4: Normalize layout independently of optional content**

In `QaAccordionBlockComponent`, replace the current `hasSideColumn`, `resolvedSplitLayoutMode`, and fallback-based `resolvedLayoutMode` calculations with:

```ts
const resolvedLayoutMode =
  configuredLayoutMode === 'fullWidth' || configuredLayoutMode === 'oneThird'
    ? configuredLayoutMode
    : 'fiftyFifty'
const isSplitLayout = resolvedLayoutMode !== 'fullWidth'
const hasProfile =
  isSplitLayout && Boolean(profileImage || profile?.name?.trim() || profile?.title?.trim())
const hasContact =
  isSplitLayout &&
  Boolean(contact?.title?.trim() || contact?.description?.trim() || contactActions.length > 0)
const hasSideColumn = hasProfile || hasContact
```

Delete `resolvedSplitLayoutMode`. Use `resolvedLayoutMode` directly wherever the authored layout is reported.

- [ ] **Step 5: Build the section-content region first in the DOM**

Extract the existing title/accent title, description, and Section Actions markup from `accordionContent` into a new `sectionContent` node. Give its outer element this contract:

```tsx
<div
  className={cn(
    'order-1',
    isSplitLayout ? sidePlacementClasses[resolvedAccordionPlacement] : 'w-full',
  )}
  data-qa-accordion-section-content="true"
>
```

Inside it:

1. Render the current introduction wrapper with `contentAlignmentClasses[resolvedContentAlignment]`.
2. In split mode, render the current Profile markup and Contact Prompt markup immediately after that introduction.
3. Keep Profile and Contact Prompt left-aligned.
4. Preserve `data-qa-accordion-contact-actions="true"` and the existing action variants/classes.
5. Do not render either optional support element when `isSplitLayout` is false.

Apply the large separation below the introduction only when it precedes a Q&A region in the same column. In the new composition, use `mb-8` on the introduction when Profile/Contact follows it, and let the outer grid gap separate the section-content and Q&A columns. In Full Width mode, retain the current `mb-8 lg:mb-16` gap before Q&A.

- [ ] **Step 6: Make the main region Q&A-only**

Remove the introduction markup from `accordionContent`, leaving only `QaAccordion`. Change the outer Q&A region to:

```tsx
<div
  className={cn(
    'order-2',
    isSplitLayout ? accordionPlacementClasses[resolvedAccordionPlacement] : 'w-full',
    isSplitLayout && resolvedLayoutMode === 'oneThird' ? 'lg:col-span-2' : undefined,
  )}
  data-qa-accordion-main="true"
>
```

Do not pass `contentAlignment` into accordion rows. Preserve the current `text-left` trigger and answer classes.

- [ ] **Step 7: Render the grid from `layoutMode`, not `hasSideColumn`**

Replace the current composition branch with:

```tsx
{isSplitLayout ? (
  <div
    className={cn(
      'grid grid-cols-1 gap-8',
      gridLayoutClasses[resolvedLayoutMode],
    )}
  >
    {sectionContent}
    {accordionContent}
  </div>
) : (
  <div>
    {sectionContent}
    {accordionContent}
  </div>
)}
```

Because TypeScript cannot index `gridLayoutClasses` with `fullWidth`, narrow the expression before indexing or introduce a `resolvedSplitLayoutMode` only inside the `isSplitLayout` branch. Do not restore any dependency on `hasSideColumn`.

Keep `BlockFooterActions` after this branch.

- [ ] **Step 8: Preserve and update diagnostic attributes**

On the section root:

- keep `data-qa-accordion-has-side-column` based on actual Profile/Contact presence;
- keep `data-qa-accordion-side-column` with the same boolean diagnostic value;
- set `data-qa-accordion-layout={resolvedLayoutMode}`;
- preserve `data-qa-accordion-placement`, content alignment, background, border, and size attributes.

The new `data-qa-accordion-section-content="true"` and existing `data-qa-accordion-main="true"` must identify the two content responsibilities.

- [ ] **Step 9: Re-run the focused renderer contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/qa-accordion.int.spec.ts
```

Expected: every Q&A Accordion config and render test passes, including the split-without-support regression and both desktop placements.

---

### Task 3: Verify types, render boundaries, and maintained project knowledge

**Files:**

- Modify: `.agents/skills/project-context/references/block-system.md`
- Generated if source inventory changes: `.agents/skills/project-context/references/project-inventory.json`
- Verify unchanged: `src/payload-types.ts`
- Verify: `src/blocks/QaAccordion/config.ts`
- Verify: `src/blocks/QaAccordion/Component.tsx`
- Verify: `tests/int/qa-accordion.int.spec.ts`

- [ ] **Step 1: Regenerate Payload types and confirm structural compatibility**

Run:

```bash
pnpm generate:types
git diff --exit-code -- src/payload-types.ts
```

Expected: generation succeeds and `src/payload-types.ts` is unchanged because only editor-facing labels and renderer composition changed.

- [ ] **Step 2: Run focused renderer-boundary tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/qa-accordion.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/live-preview-renderer.int.spec.tsx \
  tests/int/block-thumbnail-fixtures.int.spec.ts
```

If one of the listed parity test filenames has been renamed, locate the current equivalent with `rg --files tests/int | rg 'page-blocks|live-preview|thumbnail'` and run the matching file. Do not skip renderer parity coverage.

- [ ] **Step 3: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/QaAccordion/Component.tsx src/blocks/QaAccordion/config.ts tests/int/qa-accordion.int.spec.ts
git diff --check
```

Expected: every command passes without new errors or warnings.

- [ ] **Step 4: Document the maintained block behavior**

Add this concise contract to the Q&A-related section of `.agents/skills/project-context/references/block-system.md`:

```md
Q&A Accordion split modes separate the section introduction and optional Profile/Contact Prompt from the Q&A list. `fiftyFifty` uses equal desktop columns; `oneThird` gives section content one track and Q&A two tracks. Q&A Placement swaps desktop sides while DOM/mobile order remains section content first. Full Width stacks the introduction above Q&A and hides optional supporting content. An authored split never depends on Profile or Contact Prompt being populated.
```

- [ ] **Step 5: Complete the project-context update/check loop**

Run:

```bash
pnpm project-context:update
```

Inspect `.agents/skills/project-context/references/change-impact-map.md` and the generated inventory diff. Then run:

```bash
pnpm project-context:check
```

Expected: maintained project context is current. If the optional knowledge graph is reported as stale, record it as a warning; do not broaden this change to regenerate that separate artifact unless required by the check.

- [ ] **Step 6: Run the full integration suite**

Run:

```bash
pnpm test:int
```

Expected: all repository integration tests pass. If MongoMemoryServer cannot bind inside the sandbox, rerun only those affected suites with the required execution permission and distinguish environment failures from assertions.

- [ ] **Step 7: Review the final diff for scope and placeholders**

Run:

```bash
git diff -- src/blocks/QaAccordion/Component.tsx src/blocks/QaAccordion/config.ts tests/int/qa-accordion.int.spec.ts .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json docs/superpowers/plans/2026-08-24-qa-accordion-content-split.md
rg -n "TODO|FIXME|placeholder|existing markup|similar" src/blocks/QaAccordion tests/int/qa-accordion.int.spec.ts
git status --short
```

Confirm:

- Full Width still hides saved Profile/Contact content.
- Split layouts remain split without optional support content.
- section content precedes Q&A in source/DOM order.
- Q&A Placement affects desktop visual order only.
- One-Third always gives Q&A two tracks.
- no stored Payload contract changed.
- no unrelated file is staged.

- [ ] **Step 8: Commit the cohesive implementation**

Stage only the reviewed paths:

```bash
git add src/blocks/QaAccordion/Component.tsx src/blocks/QaAccordion/config.ts tests/int/qa-accordion.int.spec.ts .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json docs/superpowers/plans/2026-08-24-qa-accordion-content-split.md
git commit -m "feat(qa): split content from accordion"
```

If `project-context:update` does not change `project-inventory.json`, omit that path from `git add`.
