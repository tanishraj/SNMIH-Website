# Fee Structure Centered Auto Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Centered Auto Width Fee Structure category-tab option that shrink-wraps and centers fitting tabs while preserving inline-start horizontal scrolling for overflow.

**Architecture:** Extend the Fee Structure-owned `tabWidth` union, Payload select, and runtime resolver without changing the shared content-tab system. Map each resolved width mode to one explicit rail class set; retain equal-width trigger classes only for `equal`. Exercise the new mode through the deterministic Fee Structure preview fixture for bounded responsive browser verification.

**Tech Stack:** Payload CMS 3.85.2, React 19, TypeScript 5.7, Tailwind CSS 4, Radix Tabs, Vitest, Playwright preview tooling, project-context tooling.

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-21-fee-structure-centered-auto-tabs-design.md`.
- Add `{ label: 'Centered Auto Width', value: 'centered' }` between Content Width and Equal Full Width.
- Preserve `content` as the saved default and runtime fallback for missing or unknown values.
- Centered Auto Width uses `mx-auto w-max`, retains intrinsic trigger widths, and never adds equal-width trigger classes.
- Keep `overflow-x-auto pb-1` so oversized centered rails begin at the inline start and scroll horizontally.
- Preserve Content Width as `w-max min-w-full` and Equal Full Width as `w-full min-w-0` with equal triggers.
- Preserve Contained, Pill, and Underline visuals, Radix keyboard/focus semantics, tab order, and category switching.
- Do not couple tab width to Section Content Alignment or modify the shared content-tab rail.
- Preserve the latest user-owned `ProgrammeCostAtlasPresentation.tsx` byte-for-byte. If it changes again during execution, re-baseline and preserve the newer version.
- Execute this plan alongside `docs/superpowers/plans/2026-08-21-fee-structure-default-programme-duration.md`; the two changes remain independent and share only final type/docs/context verification.
- Do not stage, unstage, or commit any files. Preserve the user’s current index and worktree state.

---

## File Map

- Modify `tests/int/fee-structure.int.spec.tsx`: lock schema ordering, fallback, centered geometry, overflow, intrinsic triggers, and switching.
- Modify `src/blocks/FeeStructure/types.ts`: add `centered` to `FeeStructureTabWidth`.
- Modify `src/blocks/FeeStructure/config.ts`: expose Centered Auto Width and clarify the field description.
- Modify `src/blocks/FeeStructure/FeeStructureClient.tsx`: resolve and render all three width modes locally.
- Modify `src/block-thumbnails/fixtures.tsx`: make the Fee Structure preview demonstrate Centered Auto Width.
- Regenerate `src/payload-types.ts`: synchronize the generated `tabWidth` union.
- Replace `public/block-thumbnails/fee-structure.jpg`: regenerate from the current production component fixture.
- Modify `docs/guides/blocks.md`, `docs/architecture/feature-inventory.md`, and `.agents/skills/project-context/references/block-system.md`: document the third option and responsive overflow behavior.
- Refresh `.agents/skills/project-context/references/project-inventory.json` through the required context loop.
- Do not modify `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx`, normalization, fee data, or shared tab modules.

---

### Task 1: Protect the current user changes

**Files:**

- Inspect only: repository index and worktree
- Preserve unchanged: `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx`

**Interfaces:**

- Consumes: the user’s staged Fee Structure implementation and any concurrent edits.
- Produces: baseline evidence for the final preservation audit.

- [ ] **Step 1: Record the complete index/worktree boundary**

Run:

```bash
git status --short
git diff --cached --name-status
git diff --name-status
```

Expected: existing feature work remains staged, and new planning artifacts may be untracked. Do not alter the index.

- [ ] **Step 2: Record the Atlas checksum**

Run:

```bash
shasum -a 256 src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx
```

Expected: record the current checksum. If the user edits the file later, re-run this read-only command and treat the latest user version as authoritative; never revert it.

---

### Task 2: Lock the centered schema and runtime contract test-first

**Files:**

- Modify: `tests/int/fee-structure.int.spec.tsx`

**Interfaces:**

- Consumes: `FeeStructureBlockComponent`, `findNamedField`, existing General/NRI fixtures, `data-fee-tab-width`, and Radix tab roles.
- Produces: exact schema and DOM contracts for `content | centered | equal`.

- [ ] **Step 1: Extend the Category Tab Width schema expectation**

Replace the current `tabWidth` expectation with:

```ts
expect(tabWidth).toMatchObject({
  defaultValue: 'content',
  required: true,
  options: [
    { label: 'Content Width', value: 'content' },
    { label: 'Centered Auto Width', value: 'centered' },
    { label: 'Equal Full Width', value: 'equal' },
  ],
})
```

Keep both existing single-category/multiple-category Admin-condition assertions.

- [ ] **Step 2: Add runtime fallback coverage**

Immediately before the existing Equal Full Width test, add:

```tsx
it.each([undefined, 'unknown'])(
  'uses content-width tabs as the runtime fallback for %s',
  (tabWidth) => {
    const { container } = render(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory, nriCategory]}
        programmeName="MBBS"
        tabWidth={tabWidth as never}
      />,
    )

    const rail = container.querySelector('[data-fee-tab-width="content"]')
    const railClasses = new Set(rail?.className.split(/\s+/))

    expect(railClasses.has('w-max')).toBe(true)
    expect(railClasses.has('min-w-full')).toBe(true)
    expect(railClasses.has('mx-auto')).toBe(false)
  },
)
```

- [ ] **Step 3: Add the centered responsive geometry test**

Add this test immediately after the fallback coverage:

```tsx
it('centers intrinsic category tabs and keeps overflow scrolling available', () => {
  const longCategory = {
    ...nriCategory,
    id: 'international-sponsored',
    label: 'International Sponsored Category',
  }
  const { container } = render(
    <FeeStructureBlockComponent
      academicSession="2026-27"
      feeCategories={[generalCategory, longCategory]}
      programmeName="MBBS"
      tabStyle="pills"
      tabWidth="centered"
    />,
  )

  const rail = container.querySelector('[data-fee-tab-width="centered"]')
  const railClasses = new Set(rail?.className.split(/\s+/))
  const wrapperClasses = new Set(rail?.parentElement?.className.split(/\s+/))
  const tabs = screen.getAllByRole('tab')

  expect(railClasses.has('mx-auto')).toBe(true)
  expect(railClasses.has('w-max')).toBe(true)
  expect(railClasses.has('min-w-full')).toBe(false)
  expect(railClasses.has('w-full')).toBe(false)
  expect(railClasses.has('min-w-0')).toBe(false)
  expect(wrapperClasses.has('overflow-x-auto')).toBe(true)
  expect(wrapperClasses.has('pb-1')).toBe(true)
  expect(tabs.map((tab) => tab.textContent)).toEqual([
    'General',
    'International Sponsored Category',
  ])
  expect(tabs.every((tab) => tab.className.includes('min-h-11'))).toBe(true)
  expect(tabs.every((tab) => tab.className.includes('shrink-0'))).toBe(true)
  expect(tabs.every((tab) => !tab.className.includes('flex-1'))).toBe(true)
  expect(tabs.every((tab) => !tab.className.includes('w-0'))).toBe(true)
  expect(tabs.every((tab) => !tab.className.includes('text-ellipsis'))).toBe(true)

  fireEvent.mouseDown(screen.getByRole('tab', { name: 'International Sponsored Category' }), {
    button: 0,
    ctrlKey: false,
  })

  expect(
    container.querySelector('[data-fee-category="International Sponsored Category"]'),
  ).toBeTruthy()
})
```

This test uses a long authored label to lock intrinsic sizing and overflow-safe classes without relying on JSDOM layout measurements.

- [ ] **Step 4: Run the focused suite and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx
```

Expected: FAIL because the schema does not offer `centered`, the runtime normalizes it to `content`, and centered rail classes are absent. Existing content/equal behavior remains green.

---

### Task 3: Implement the Fee Structure-owned centered mode

**Files:**

- Modify: `src/blocks/FeeStructure/types.ts`
- Modify: `src/blocks/FeeStructure/config.ts`
- Modify: `src/blocks/FeeStructure/FeeStructureClient.tsx`

**Interfaces:**

- Consumes: `FeeStructureTabWidth`, `cn`, `getContentTabRailClasses`, and existing Radix tabs.
- Produces: `FeeStructureTabWidth = 'centered' | 'content' | 'equal'` and a three-mode local rail-class resolver.

- [ ] **Step 1: Extend the Fee Structure tab-width union**

Change the type in `src/blocks/FeeStructure/types.ts` to:

```ts
export type FeeStructureTabWidth = 'centered' | 'content' | 'equal'
```

- [ ] **Step 2: Add the Payload option and exact Admin guidance**

Change the `tabWidth` options and description in `src/blocks/FeeStructure/config.ts` to:

```ts
options: [
  { label: 'Content Width', value: 'content' },
  { label: 'Centered Auto Width', value: 'centered' },
  { label: 'Equal Full Width', value: 'equal' },
],
admin: {
  condition: hasMultipleFeeCategories,
  description:
    'Centered Auto Width keeps intrinsic tabs centered when they fit and scrollable when they overflow. Equal Full Width divides the complete tab rail evenly.',
},
```

Keep `defaultValue: 'content'` and `required: true` unchanged.

- [ ] **Step 3: Add a local rail-width class map**

In `src/blocks/FeeStructure/FeeStructureClient.tsx`, immediately after `resolveFeeStructureTabVariant`, add:

```ts
const feeTabRailWidthClasses = {
  centered: 'mx-auto w-max',
  content: 'w-max min-w-full',
  equal: 'w-full min-w-0',
} as const satisfies Record<FeeStructureTabWidth, string>
```

- [ ] **Step 4: Normalize all three supported values**

Replace the current two-value resolver with:

```ts
const resolvedTabWidth: FeeStructureTabWidth =
  tabWidth === 'centered' || tabWidth === 'equal' ? tabWidth : 'content'
```

Missing and invalid values still become `content`.

- [ ] **Step 5: Apply the resolved rail map without changing triggers**

Replace the current width ternary inside `TabsPrimitive.List` with:

```tsx
className={cn(
  'flex flex-nowrap',
  feeTabRailWidthClasses[resolvedTabWidth],
  getContentTabRailClasses(variant),
)}
```

Leave the existing trigger condition exactly `resolvedTabWidth === 'equal'`, so only Equal Full Width receives flexible, truncating triggers. Keep the `overflow-x-auto pb-1` wrapper unchanged.

- [ ] **Step 6: Format and run the focused suite**

Run:

```bash
pnpm exec prettier --write src/blocks/FeeStructure/types.ts src/blocks/FeeStructure/config.ts src/blocks/FeeStructure/FeeStructureClient.tsx tests/int/fee-structure.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx
```

Expected: all Fee Structure tests PASS, including schema order, content fallback, centered intrinsic geometry, overflow wrapper, equal distribution, and category switching.

---

### Task 4: Exercise the new mode in the real preview and generated types

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Regenerate: `src/payload-types.ts`
- Replace: `public/block-thumbnails/fee-structure.jpg`

**Interfaces:**

- Consumes: the production Fee Structure block fixture and Payload config.
- Produces: generated `centered | content | equal` Payload typing and a real preview route using Centered Auto Width.

- [ ] **Step 1: Switch only the Fee Structure fixture width mode**

In the `feeStructure` fixture, replace:

```tsx
tabWidth = 'equal'
```

with:

```tsx
tabWidth = 'centered'
```

Preserve every other fixture value, including the user’s current Atlas data and programme-duration row.

- [ ] **Step 2: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: generation succeeds and each generated Fee Structure `tabWidth` property accepts `'centered' | 'content' | 'equal' | null` while all other generated shapes remain synchronized.

- [ ] **Step 3: Run thumbnail fixture contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts
```

Expected: both fixture/manifest suites PASS and every preview still renders through its production component.

- [ ] **Step 4: Regenerate only the Fee Structure thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=feeStructure pnpm generate:block-thumbnails
```

Expected: `✓ feeStructure -> public/block-thumbnails/fee-structure.jpg`; the output remains a 1600×900 JPEG and visibly demonstrates the centered intrinsic Pill tab group.

---

### Task 5: Verify complete responsiveness in one bounded browser pass

**Files:**

- Inspect: development preview route `/block-thumbnail-previews/feeStructure`
- Inspect: `public/block-thumbnails/fee-structure.jpg`

**Interfaces:**

- Consumes: the real production-component preview configured with Centered Auto Width.
- Produces: visual evidence for centered fit, overflow safety, zoom resilience, focus behavior, and unchanged Atlas content.

- [ ] **Step 1: Start or reuse the development server**

Run:

```bash
pnpm dev
```

Expected: the local Next.js development server is available at `http://localhost:3000`. If an existing server is already healthy, reuse it instead of starting a duplicate.

- [ ] **Step 2: Load the browser-control skill and open the real preview**

Use the in-app browser to open:

```text
http://localhost:3000/block-thumbnail-previews/feeStructure
```

Confirm the browser is rendering the production Fee Structure fixture and the tab rail exposes `data-fee-tab-width="centered"`.

- [ ] **Step 3: Inspect desktop, tablet, and mobile together**

Capture and inspect the same preview at approximately:

```text
1440 × 1000
768 × 1024
375 × 812
```

Expected:

- at 1440px and 768px, General and NRI remain intrinsic-width, centered as one group, and do not stretch;
- at 375px, fitting labels remain centered; the Atlas stacks normally without affecting the tabs;
- the active/inactive Pill visuals, 44px minimum targets, focus ring, content order, complete expense, and download remain intact;
- there is no clipping, second line, squeezed text, or unintended equal distribution.

- [ ] **Step 4: Verify long-label overflow and 200% zoom**

Using the browser inspector, temporarily replace the visible NRI trigger text with `International Sponsored Category` for inspection only, then verify at 375px and at 200% browser zoom:

- the rail begins at the inline start when wider than the viewport;
- horizontal scrolling reaches the full last tab;
- labels stay on one line and remain untruncated;
- focus remains visible and keyboard arrow navigation still changes the active tab;
- returning to normal zoom restores centered fit without a reload requirement.

Do not save or persist the inspector-only text change.

- [ ] **Step 5: Inspect the generated 1600×900 thumbnail**

Open `public/block-thumbnails/fee-structure.jpg` with the workspace image viewer. Confirm the centered tab group is visible, the user’s latest Atlas layout remains intact, and no content is clipped or overlapped.

Stop after this bounded responsive pass unless it reveals a concrete defect. If it does, fix all observed defects in one batch and perform at most one confirmation pass.

---

### Task 6: Synchronize documentation, project context, and final verification

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`
- Preserve unchanged: `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx`

**Interfaces:**

- Consumes: the final three-mode tab contract and responsive QA evidence.
- Produces: current operator/reference documentation, passing affected checks, and proof that user-owned presentation work remains preserved.

- [ ] **Step 1: Update the maintained Fee Structure wording**

Add this sentence to the Fee Structure paragraph in all three maintained references:

```markdown
Centered Auto Width shrink-wraps and centers the category tabs when they fit, then returns them to the inline start inside the existing horizontal scroller when long labels or narrow viewports overflow.
```

For `docs/guides/blocks.md`, keep editor-facing bold control labels. For the architecture inventory and project-context reference, keep code values only where the surrounding paragraph already uses them. Preserve the separately added Programme Duration default wording.

- [ ] **Step 2: Format all files changed by both approved plans**

Run:

```bash
pnpm exec prettier --write src/blocks/FeeStructure/config.ts src/blocks/FeeStructure/types.ts src/blocks/FeeStructure/FeeStructureClient.tsx tests/int/fee-structure.int.spec.tsx src/block-thumbnails/fixtures.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-21-fee-structure-default-programme-duration-design.md docs/superpowers/specs/2026-08-21-fee-structure-centered-auto-tabs-design.md docs/superpowers/plans/2026-08-21-fee-structure-default-programme-duration.md docs/superpowers/plans/2026-08-21-fee-structure-centered-auto-tabs.md
```

Expected: every listed source, test, and document formats successfully without touching `ProgrammeCostAtlasPresentation.tsx`.

- [ ] **Step 3: Complete the required project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the inventory refreshes atomically and the check reports `Project context is current.` The known stale knowledge-graph warning is acceptable only if it is the sole warning.

- [ ] **Step 4: Run affected tests and static checks**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/theme-contracts.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/FeeStructure/config.ts src/blocks/FeeStructure/types.ts src/blocks/FeeStructure/FeeStructureClient.tsx tests/int/fee-structure.int.spec.tsx src/block-thumbnails/fixtures.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/FeeStructure/FeeStructureClient.tsx src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx
git diff --check
```

Expected: affected tests, TypeScript, focused ESLint, and whitespace checks PASS; the layout detector returns `[]`. If the existing unrelated SNMIH exact-token-format theme assertion still fails only on `0.013730` versus `0.01373`, report it without modifying theme files.

- [ ] **Step 5: Prove user presentation and staging preservation**

Run:

```bash
shasum -a 256 src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx
git status --short
git diff --cached --name-status
git diff --name-status
```

Expected: the Atlas checksum matches the latest user baseline captured in Task 1, the original index remains intact, and this implementation’s edits are layered without staging or unstaging files. The regenerated Fee Structure thumbnail is the only intended visual artifact change.

- [ ] **Step 6: Audit the focused implementation diff**

Run:

```bash
git diff -- src/blocks/FeeStructure/config.ts src/blocks/FeeStructure/types.ts src/blocks/FeeStructure/FeeStructureClient.tsx tests/int/fee-structure.int.spec.tsx src/block-thumbnails/fixtures.tsx src/payload-types.ts public/block-thumbnails/fee-structure.jpg docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
```

Expected: the unstaged task diff contains only the approved Programme Duration default, Centered Auto Width schema/type/runtime behavior, focused tests, intentional preview fixture/thumbnail update, accurate documentation, and generated synchronization. `ProgrammeCostAtlasPresentation.tsx` is absent from the task-specific diff and no user work was reverted.
