# Q&A Accordion Editorial Layout Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Q&A Accordion the same explicit Stacked/Split composition model as Editorial Reasons without rewriting existing CMS content.

**Architecture:** A small pure layout contract normalizes new and legacy serialized values without database writes. Payload configuration exposes the new editor controls, and the existing client component consumes the normalized contract to render Editorial Reasons-style proportions, order, spacing, and natural-height vertical alignment.

**Tech Stack:** Payload CMS 3.85.2, React 19, Next.js 16, Tailwind CSS 4, Radix Accordion, Vitest, TypeScript 5.7.

## Global Constraints

- Do not create or run a database/content migration; existing documents and version records are never rewritten by this change.
- Layout Mode is exactly `stacked | split`; default is `split`.
- Split Proportion is exactly `balanced | sectionFocus | qaFocus`; default is `balanced`.
- Q&A Position remains `left | right`; default is `right`.
- Section Content Vertical Alignment is `top | center | bottom`; default is `top`.
- Split-only controls and Supporting Content are hidden in Admin for Stacked mode and ignored by the renderer in Stacked mode.
- The section-content region stays first in DOM/mobile order; Q&A Position changes only large-screen visual order.
- Use `contentIntroClasses`, `contentSectionHeadingClasses`, `contentSectionDescriptionClasses`, and `gap-10 lg:gap-16`.
- Keep a non-mutating renderer fallback for `fullWidth`, `fiftyFifty`, and `oneThird` serialized values.
- Do not add sticky content, bottom-pinned section actions, new surfaces, or Q&A row interaction changes.
- Preserve action, appearance, padding, rich-text, default-open, profile, contact, footer-action, and diagnostic behavior not explicitly changed by the approved design.
- Complete the project-context update, impact review, and check loop required by `AGENTS.md`.

---

## File Structure

- Create `src/blocks/QaAccordion/layoutContract.ts`: new and legacy layout types plus non-mutating runtime normalization.
- Modify `src/blocks/QaAccordion/config.ts`: explicit editor fields and Split-only conditions.
- Modify `src/blocks/QaAccordion/Component.tsx`: Editorial Reasons-style composition and normalized diagnostics.
- Modify `tests/int/qa-accordion.int.spec.ts`: schema, rendering, responsive order, and legacy fallback contracts.
- Regenerate `src/payload-types.ts`: new Q&A schema types.
- Modify `docs/guides/blocks.md`: editor-facing layout description.
- Modify `.agents/skills/project-context/references/block-system.md`: maintained block-system contract.
- Regenerate `.agents/skills/project-context/references/project-inventory.json` if the updater detects the new module/export.

---

### Task 1: Pure non-mutating layout contract

**Files:**
- Create: `src/blocks/QaAccordion/layoutContract.ts`
- Modify: `tests/int/qa-accordion.int.spec.ts`

**Interfaces:**
- Produces: `QaAccordionLayoutMode`, `QaAccordionLegacyLayoutMode`, `QaAccordionSplitProportion`, `QaAccordionSectionVerticalAlignment`, `QaAccordionLayoutInput`, `ResolvedQaAccordionLayout`, and `resolveQaAccordionLayout(input)`.
- Consumes: no React, Payload, or database runtime.

- [ ] **Step 1: Write the failing compatibility tests**

Add to `tests/int/qa-accordion.int.spec.ts`:

```ts
import { resolveQaAccordionLayout } from '@/blocks/QaAccordion/layoutContract'

describe('Q&A Accordion layout compatibility', () => {
  it.each([
    ['fullWidth', 'stacked', 'balanced'],
    ['fiftyFifty', 'split', 'balanced'],
    ['oneThird', 'split', 'qaFocus'],
  ] as const)('normalizes legacy %s without rewriting content', (legacy, mode, proportion) => {
    const input = { layoutMode: legacy }
    expect(resolveQaAccordionLayout(input)).toEqual({
      layoutMode: mode,
      sectionVerticalAlignment: 'top',
      splitProportion: proportion,
    })
    expect(input).toEqual({ layoutMode: legacy })
  })

  it('defaults invalid values to Split, Balanced, and Top', () => {
    expect(resolveQaAccordionLayout({ layoutMode: 'invalid' })).toEqual({
      layoutMode: 'split',
      sectionVerticalAlignment: 'top',
      splitProportion: 'balanced',
    })
  })
})
```

- [ ] **Step 2: Run the test and confirm the missing module failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/qa-accordion.int.spec.ts -t "layout compatibility"
```

Expected: FAIL because `layoutContract.ts` does not exist.

- [ ] **Step 3: Implement the pure resolver**

Create `src/blocks/QaAccordion/layoutContract.ts`:

```ts
export type QaAccordionLayoutMode = 'split' | 'stacked'
export type QaAccordionLegacyLayoutMode = 'fiftyFifty' | 'fullWidth' | 'oneThird'
export type QaAccordionSplitProportion = 'balanced' | 'qaFocus' | 'sectionFocus'
export type QaAccordionSectionVerticalAlignment = 'bottom' | 'center' | 'top'

export type QaAccordionLayoutInput = {
  layoutMode?: QaAccordionLayoutMode | QaAccordionLegacyLayoutMode | string | null
  sectionVerticalAlignment?: QaAccordionSectionVerticalAlignment | string | null
  splitProportion?: QaAccordionSplitProportion | string | null
}

export type ResolvedQaAccordionLayout = {
  layoutMode: QaAccordionLayoutMode
  sectionVerticalAlignment: QaAccordionSectionVerticalAlignment
  splitProportion: QaAccordionSplitProportion
}

const splitProportions = new Set<QaAccordionSplitProportion>([
  'balanced',
  'qaFocus',
  'sectionFocus',
])
const verticalAlignments = new Set<QaAccordionSectionVerticalAlignment>([
  'bottom',
  'center',
  'top',
])

export function resolveQaAccordionLayout(
  input: QaAccordionLayoutInput,
): ResolvedQaAccordionLayout {
  const legacy =
    input.layoutMode === 'fullWidth'
      ? { layoutMode: 'stacked' as const, splitProportion: 'balanced' as const }
      : input.layoutMode === 'oneThird'
        ? { layoutMode: 'split' as const, splitProportion: 'qaFocus' as const }
        : input.layoutMode === 'fiftyFifty'
          ? { layoutMode: 'split' as const, splitProportion: 'balanced' as const }
          : undefined

  return {
    layoutMode: legacy?.layoutMode ?? (input.layoutMode === 'stacked' ? 'stacked' : 'split'),
    sectionVerticalAlignment: verticalAlignments.has(
      input.sectionVerticalAlignment as QaAccordionSectionVerticalAlignment,
    )
      ? (input.sectionVerticalAlignment as QaAccordionSectionVerticalAlignment)
      : 'top',
    splitProportion:
      legacy?.splitProportion ??
      (splitProportions.has(input.splitProportion as QaAccordionSplitProportion)
        ? (input.splitProportion as QaAccordionSplitProportion)
        : 'balanced'),
  }
}
```

- [ ] **Step 4: Run the focused test**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/blocks/QaAccordion/layoutContract.ts tests/int/qa-accordion.int.spec.ts
git commit -m "feat(qa): add layout compatibility"
```

---

### Task 2: Explicit Payload editor controls

**Files:**
- Modify: `src/blocks/QaAccordion/config.ts`
- Modify: `tests/int/qa-accordion.int.spec.ts`

**Interfaces:**
- Consumes: `QaAccordionLayoutMode` from `layoutContract.ts`.
- Produces: `layoutMode`, `splitProportion`, `accordionPlacement`, and `sectionVerticalAlignment`, plus the unchanged `sideColumn` stored group under the label “Supporting Content”.

- [ ] **Step 1: Replace the legacy schema test assertions**

Retrieve the four select fields and `sideColumn`, then assert:

```ts
expect(layoutMode.defaultValue).toBe('split')
expect(layoutMode.options).toEqual([
  { label: 'Stacked', value: 'stacked' },
  { label: 'Split', value: 'split' },
])
expect(splitProportion.defaultValue).toBe('balanced')
expect(splitProportion.options).toEqual([
  { label: 'Balanced (50 / 50)', value: 'balanced' },
  { label: 'Section Content Focus (60 / 40)', value: 'sectionFocus' },
  { label: 'Q&A Focus (40 / 60)', value: 'qaFocus' },
])
expect(placement.label).toBe('Q&A Position')
expect(placement.defaultValue).toBe('right')
expect(verticalAlignment.defaultValue).toBe('top')
expect(verticalAlignment.options).toEqual([
  { label: 'Top', value: 'top' },
  { label: 'Center', value: 'center' },
  { label: 'Bottom', value: 'bottom' },
])
expect('label' in supportingContent ? supportingContent.label : undefined).toBe(
  'Supporting Content',
)

for (const field of [splitProportion, placement, verticalAlignment, supportingContent]) {
  const condition = 'admin' in field ? field.admin?.condition : undefined
  expect(condition?.({}, { layoutMode: 'split' }, {} as never)).toBe(true)
  expect(condition?.({}, { layoutMode: 'stacked' }, {} as never)).toBe(false)
  expect(condition?.({}, { layoutMode: 'fiftyFifty' }, {} as never)).toBe(true)
  expect(condition?.({}, { layoutMode: 'oneThird' }, {} as never)).toBe(true)
  expect(condition?.({}, { layoutMode: 'fullWidth' }, {} as never)).toBe(false)
}
```

- [ ] **Step 2: Run the schema test and verify it fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/qa-accordion.int.spec.ts -t "explicit stacked and split"
```

Expected: FAIL because the config still exposes the combined legacy selector.

- [ ] **Step 3: Implement conditions and fields**

Use:

```ts
import type { QaAccordionLayoutMode } from './layoutContract'

type QaAccordionBlockSiblingData = {
  layoutMode?: QaAccordionLayoutMode | 'fiftyFifty' | 'fullWidth' | 'oneThird' | null
}

const hasSplitLayout = (_data: unknown, siblingData: QaAccordionBlockSiblingData) =>
  siblingData?.layoutMode !== 'stacked' && siblingData?.layoutMode !== 'fullWidth'
```

Rename `sideColumnField.label` to `Supporting Content`. Replace the old layout controls with:

```ts
{
  name: 'layoutMode', label: 'Layout Mode', type: 'select', defaultValue: 'split',
  options: [
    { label: 'Stacked', value: 'stacked' },
    { label: 'Split', value: 'split' },
  ], required: true,
} satisfies SelectField,
{
  name: 'splitProportion', label: 'Split Proportion', type: 'select',
  defaultValue: 'balanced',
  options: [
    { label: 'Balanced (50 / 50)', value: 'balanced' },
    { label: 'Section Content Focus (60 / 40)', value: 'sectionFocus' },
    { label: 'Q&A Focus (40 / 60)', value: 'qaFocus' },
  ], admin: { condition: hasSplitLayout }, required: true,
} satisfies SelectField,
{
  name: 'accordionPlacement', label: 'Q&A Position', type: 'select', defaultValue: 'right',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ], admin: { condition: hasSplitLayout }, required: true,
} satisfies SelectField,
{
  name: 'sectionVerticalAlignment', label: 'Section Content Vertical Alignment',
  type: 'select', defaultValue: 'top',
  options: [
    { label: 'Top', value: 'top' },
    { label: 'Center', value: 'center' },
    { label: 'Bottom', value: 'bottom' },
  ], admin: { condition: hasSplitLayout }, required: true,
} satisfies SelectField,
```

- [ ] **Step 4: Run the schema test**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/blocks/QaAccordion/config.ts tests/int/qa-accordion.int.spec.ts
git commit -m "feat(qa): clarify layout controls"
```

---

### Task 3: Editorial Reasons-style frontend composition

**Files:**
- Modify: `src/blocks/QaAccordion/Component.tsx`
- Modify: `tests/int/qa-accordion.int.spec.ts`

**Interfaces:**
- Consumes: the layout contract and `src/blocks/shared/contentStyles.ts`.
- Produces: normalized layout/proportion/alignment diagnostics and natural-height split composition.

- [ ] **Step 1: Add failing rendering tests**

Use table tests for the five representative position/proportion cases:

```ts
const splitCases = [
  ['right', 'balanced', 'lg:grid-cols-2', 'lg:order-1', 'lg:order-2'],
  ['right', 'sectionFocus', 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]', 'lg:order-1', 'lg:order-2'],
  ['right', 'qaFocus', 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]', 'lg:order-1', 'lg:order-2'],
  ['left', 'sectionFocus', 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]', 'lg:order-2', 'lg:order-1'],
  ['left', 'qaFocus', 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]', 'lg:order-2', 'lg:order-1'],
] as const
```

For each case, render one valid item and assert `grid gap-10 lg:gap-16`, the track class, large-screen orders, and that `data-qa-accordion-section-content` precedes `data-qa-accordion-main` in the HTML.

Add vertical-alignment cases:

```ts
const alignmentCases = [
  ['top', 'lg:self-start'],
  ['center', 'lg:self-center'],
  ['bottom', 'lg:self-end'],
] as const
```

Extract the section-content and supporting `<aside>` class attributes and assert the alignment class is present while `h-full`, `flex-1`, and `justify-between` are absent from those wrappers. Add a Stacked case that omits authored Profile/Contact Prompt and a legacy-value case for each of `fullWidth`, `fiftyFifty`, and `oneThird` that checks normalized diagnostics without changing the input object.

- [ ] **Step 2: Run the Q&A tests and verify the layout assertions fail**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/qa-accordion.int.spec.ts
```

Expected: FAIL on tracks, vertical alignment, shared spacing, and diagnostics.

- [ ] **Step 3: Normalize props and add layout maps**

Import the shared content classes and layout contract. Make `QaAccordionBlockLike` extend `QaAccordionLayoutInput`. Add:

```ts
const rightQaProportionClasses: Record<QaAccordionSplitProportion, string> = {
  balanced: 'lg:grid-cols-2',
  qaFocus: 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
  sectionFocus: 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
}
const leftQaProportionClasses: Record<QaAccordionSplitProportion, string> = {
  balanced: 'lg:grid-cols-2',
  qaFocus: 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
  sectionFocus: 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
}
const sectionVerticalAlignmentClasses: Record<QaAccordionSectionVerticalAlignment, string> = {
  bottom: 'lg:self-end', center: 'lg:self-center', top: 'lg:self-start',
}
```

Resolve once:

```ts
const resolvedLayout = resolveQaAccordionLayout({
  layoutMode,
  sectionVerticalAlignment,
  splitProportion,
})
const isSplitLayout = resolvedLayout.layoutMode === 'split'
const proportionClasses = resolvedAccordionPlacement === 'left'
  ? leftQaProportionClasses
  : rightQaProportionClasses
```

- [ ] **Step 4: Recompose section content in natural flow**

Preserve the existing profile/contact child markup, but use:

```tsx
<aside className="space-y-8 text-left lg:space-y-12" data-qa-accordion-side-column="true">
  <div className="space-y-8 lg:space-y-12">
    {hasProfile ? (
      <div className="flex items-start gap-3 sm:gap-4">
        {profileImage ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg sm:h-16 sm:w-16">
            <Image fill alt={profileImage.alt} className="object-cover" src={profileImage.src} sizes="64px" />
          </div>
        ) : null}
        <div className="min-w-0">
          {profile?.name?.trim() ? <p className="mb-1 text-sm font-semibold text-current sm:text-base">{profile.name.trim()}</p> : null}
          {profile?.title?.trim() ? <p className="text-sm text-current/70 sm:text-base">{profile.title.trim()}</p> : null}
        </div>
      </div>
    ) : null}
    {hasContact ? (
      <div className="space-y-4 lg:space-y-6">
        {contact?.title?.trim() ? <p className="text-lg leading-tight font-semibold text-current sm:text-xl">{contact.title.trim()}</p> : null}
        {contact?.description?.trim() ? <p className="text-sm leading-relaxed text-current/70 sm:text-base">{contact.description.trim()}</p> : null}
      </div>
    ) : null}
  </div>
  <ContentActions actions={contactActions} alignment="left" data-qa-accordion-contact-actions="true" />
</aside>
```

Use `order-1 flex flex-col gap-8 lg:gap-12` on section content, add the relevant `lg:self-*` class only in Split, and use `mb-10 w-full lg:mb-16` in Stacked. Apply `contentIntroClasses`, `contentSectionHeadingClasses`, and `contentSectionDescriptionClasses` to the existing intro JSX. Do not change profile/contact typography, media, link, or empty-state behavior.

- [ ] **Step 5: Apply tracks, order, and diagnostics**

Remove the legacy one-third `col-span`. Render Split with:

```tsx
<div className={cn('grid gap-10 lg:gap-16', proportionClasses[resolvedLayout.splitProportion])}>
  {sectionContent}
  {accordionContent}
</div>
```

Keep DOM order `order-1` then `order-2`; use existing large-screen order maps for Q&A Position. Set:

```tsx
data-qa-accordion-layout={resolvedLayout.layoutMode}
data-qa-accordion-split-proportion={resolvedLayout.splitProportion}
data-qa-accordion-section-vertical-alignment={resolvedLayout.sectionVerticalAlignment}
```

- [ ] **Step 6: Run focused tests**

Run the Step 2 command. Expected: PASS, including retained appearance/action/accordion tests.

- [ ] **Step 7: Commit**

```bash
git add src/blocks/QaAccordion/Component.tsx tests/int/qa-accordion.int.spec.ts
git commit -m "feat(qa): align split layout composition"
```

---

### Task 4: Generated types, documentation, and verification

**Files:**
- Modify: `src/payload-types.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify if generated: `.agents/skills/project-context/references/project-inventory.json`
- Review: `.agents/skills/project-context/references/change-impact-map.md`

**Interfaces:**
- Consumes: completed schema and renderer.
- Produces: generated Q&A types and maintained documentation matching the non-migrating contract.

- [ ] **Step 1: Generate Payload types**

```bash
pnpm generate:types
```

Expected `QaAccordionBlock` members:

```ts
layoutMode: 'stacked' | 'split';
splitProportion: 'balanced' | 'sectionFocus' | 'qaFocus';
accordionPlacement: 'left' | 'right';
sectionVerticalAlignment: 'top' | 'center' | 'bottom';
```

- [ ] **Step 2: Update maintained documentation**

Describe Q&A in `docs/guides/blocks.md` as Stacked or Split with Balanced 50/50, Section Content Focus 60/40, Q&A Focus 40/60, left/right Q&A, top/center/bottom alignment, and Split-only Profile/Contact Prompt.

Replace the old Q&A paragraph in `block-system.md` with:

```markdown
Q&A Accordion separates composition from proportion. `stacked` places the section introduction above
Q&A and ignores optional supporting content. `split` offers Balanced 50/50, Section Content Focus
60/40, and Q&A Focus 40/60 proportions; Q&A Position swaps desktop sides while DOM/mobile order
remains section content first. Top, Center, and Bottom align the natural-height section-content group
against Q&A on large screens. Profile and Contact Prompt remain part of that group and are available
only in Split mode. The renderer normalizes legacy layout values without rewriting stored content.
```

- [ ] **Step 3: Update project context and inspect impact**

```bash
pnpm project-context:update
```

Read `change-impact-map.md`, then run:

```bash
git diff -- src/blocks/QaAccordion tests/int/qa-accordion.int.spec.ts src/payload-types.ts docs/guides/blocks.md .agents/skills/project-context/references
```

Expected: `layoutContract.ts` appears in inventory; no migration files or unrelated changes appear.

- [ ] **Step 4: Run focused contracts**

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/qa-accordion.int.spec.ts \
  tests/int/block-catalog.int.spec.ts \
  tests/int/news-events-detail-template.int.spec.tsx \
  tests/int/theme-contracts.int.spec.ts
```

Expected: PASS. If the News/Event detail parity filename differs, locate it with `rg --files tests/int | rg 'news-events.*detail'` and run that file.

- [ ] **Step 5: Run repository checks**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm project-context:check
pnpm test:int
```

Expected: all commands exit 0. If MongoMemoryServer cannot bind in the sandbox, rerun the affected command with approved elevated permission and report that environment limitation separately.

- [ ] **Step 6: Review scope and commit maintained artifacts**

```bash
git status --short
git diff --check
git diff --stat
```

Confirm no migration file exists, no database command ran, Stacked omits supporting content, DOM order remains content then Q&A, and the Q&A section-content wrappers have no `h-full`, supporting `flex-1`, or `justify-between`.

```bash
git add src/payload-types.ts docs/guides/blocks.md .agents/skills/project-context/references
git commit -m "docs(qa): record accordion layout contract"
```
