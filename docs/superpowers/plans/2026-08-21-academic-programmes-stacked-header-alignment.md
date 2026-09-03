# Academic Programmes Stacked Header Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Position the complete Academic Programmes stacked header according to the existing Section Content Alignment setting.

**Architecture:** Keep the existing header and content structure. Add one outer-positioning class map beside the existing inner-content alignment map, then apply `w-full max-w-3xl` and the resolved outer alignment only to the stacked header branch.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, React server rendering, Payload CMS project-context tooling

## Global Constraints

- Preserve the existing `max-w-3xl` readable measure.
- Left stacked headers use `mr-auto`, Center uses `mx-auto`, and Right uses `ml-auto`.
- Leave the split header grid unchanged.
- Do not change Payload fields, generated types, saved content, programme cards, typography, actions, or data behavior.
- Do not stage, unstage, or commit any files.

---

### Task 1: Align the complete stacked header within the section container

**Files:**
- Modify: `tests/int/academic-programmes.int.spec.tsx:75-170`
- Modify: `src/blocks/AcademicProgrammes/Component.tsx:70-78,161-168`
- Verify: `public/block-thumbnails/academic-programmes.jpg`

**Interfaces:**
- Consumes: `AcademicProgrammesBlockComponent` props `headerLayout` and `contentAlignment`.
- Produces: stacked header classes `w-full max-w-3xl` plus `mr-auto`, `mx-auto`, or `ml-auto`; no new props or saved values.

- [ ] **Step 1: Add failing tests for all stacked outer alignments**

Add this parameterized rendering test after the editorial-card test:

```tsx
it.each([
  ['left', 'mr-auto'],
  ['center', 'mx-auto'],
  ['right', 'ml-auto'],
] as const)('positions a %s-aligned stacked header across the full container', (alignment, outerClass) => {
  const html = renderToStaticMarkup(
    <AcademicProgrammesBlockComponent
      contentAlignment={alignment}
      description="Programmes designed for clinical confidence."
      headerLayout="stacked"
      programmes={[
        {
          image: { alt: 'Anatomy teaching model', url: '/media/anatomy.jpg' },
          title: 'MBBS',
        },
      ]}
      title="Begin your journey"
    />,
  )
  const headerClasses =
    html
      .match(/<header class="([^"]+)" data-academic-programmes-header="stacked">/)?.[1]
      ?.split(' ') ?? []

  expect(headerClasses).toEqual(
    expect.arrayContaining(['grid', 'gap-6', 'w-full', 'max-w-3xl', outerClass]),
  )
  expect(html).toContain(`data-content-alignment="${alignment}"`)
  if (alignment === 'center') {
    expect(html).toContain('mx-auto items-center text-center')
  }
})
```

- [ ] **Step 2: Add a failing split-layout isolation assertion**

In the existing default split-layout test, extract the header classes and prove the stacked-only
contract is absent:

```tsx
const splitHeaderClasses =
  html
    .match(/<header class="([^"]+)" data-academic-programmes-header="split">/)?.[1]
    ?.split(' ') ?? []

expect(splitHeaderClasses).toContain(
  'lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]',
)
expect(splitHeaderClasses).not.toContain('w-full')
expect(splitHeaderClasses).not.toContain('max-w-3xl')
expect(splitHeaderClasses).not.toContain('mr-auto')
expect(splitHeaderClasses).not.toContain('mx-auto')
expect(splitHeaderClasses).not.toContain('ml-auto')
```

- [ ] **Step 3: Run the focused test and confirm the new stacked assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx
```

Expected: all three stacked cases fail because the header currently contains only `max-w-3xl`; the
split isolation assertions pass.

- [ ] **Step 4: Add the established stacked-header alignment map**

Place this constant immediately after `contentAlignmentClasses`:

```tsx
const stackedHeaderAlignmentClasses = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
} as const
```

- [ ] **Step 5: Apply the outer alignment only to stacked headers**

Replace the stacked branch in the header class resolver:

```tsx
resolvedHeaderLayout === 'split'
  ? 'lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)] lg:items-end lg:gap-16'
  : cn('w-full max-w-3xl', stackedHeaderAlignmentClasses[resolvedContentAlignment])
```

- [ ] **Step 6: Run the focused test and confirm it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx
```

Expected: all Academic Programmes integration tests pass, including the three stacked alignments and
split isolation.

- [ ] **Step 7: Format and run static and neighboring-block verification**

Run:

```bash
pnpm exec prettier --write src/blocks/AcademicProgrammes/Component.tsx tests/int/academic-programmes.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/AcademicProgrammes/Component.tsx tests/int/academic-programmes.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/AcademicProgrammes/Component.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts
```

Expected: TypeScript and ESLint exit successfully, the layout detector returns `[]`, and all
neighboring block contracts pass.

- [ ] **Step 8: Regenerate and inspect the existing Academic Programmes thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=academicProgrammes pnpm generate:block-thumbnails
sips -g pixelWidth -g pixelHeight public/block-thumbnails/academic-programmes.jpg
```

Expected: the generator produces a 1600×900 image. The fixture uses the unchanged split layout, so
its composition remains stable; inspect it once for regressions.

- [ ] **Step 9: Complete the repository context loop and final Git boundary audit**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
git diff --check
git status --short
git diff --name-status
git diff --cached --name-status
```

Expected: project context is current; a stale knowledge-graph commit warning is allowed. The component,
tests, spec, and plan remain unstaged, and the index remains unchanged.
