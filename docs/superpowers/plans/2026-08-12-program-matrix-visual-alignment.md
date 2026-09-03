# Program Matrix Visual Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Program Matrix typography, icon sizing, color roles, and spacing with the existing block system while preserving its seamless matrix layout and semantic card surfaces.

**Architecture:** Keep the current schema, data flow, surface resolver, and responsive grid. Replace only one-off visual utility classes in the server renderer with the established conventions used by Program Grid, Icon Grid, Bento Grid, and Feature Matrix. The section heading inherits the theme display family; card titles explicitly use the theme sans family.

**Tech Stack:** React Server Components, Next.js 16, TypeScript, Tailwind CSS v4 semantic tokens, Lucide React, Vitest.

## Global Constraints

- Preserve the seamless connected matrix and one-column/two-column responsive behavior.
- Preserve all per-card semantic backgrounds and automatic contrast behavior.
- Section titles inherit the active theme's `--font-display`; programme titles use `font-sans`.
- Eyebrow and metadata use `font-mono`; body copy inherits `--font-text`.
- Use shared block scales: section title `text-3xl sm:text-4xl`, card title `text-lg`, icon `size-5`, card padding `p-6 md:p-8`.
- Use only semantic color utilities; do not add raw colors or manual dark-mode exceptions.
- Keep the existing CMS configuration unchanged.
- Leave all changes uncommitted unless the user explicitly requests a commit.

---

### Task 1: Standardize Program Matrix visual roles

**Files:**
- Modify: `tests/int/program-matrix.int.spec.tsx`
- Modify: `src/blocks/ProgramMatrix/Component.tsx`

**Interfaces:**
- Consumes: the existing `ProgramMatrixBlockComponent`, `cardSurfaceClasses`, shared block spacing helpers, `ContentActions`, and `ProgrammeAction`.
- Produces: the same component API and markup semantics with shared typography, icon, color, and spacing class contracts.

- [ ] **Step 1: Write failing visual-contract assertions**

Extend `renders semantic responsive content and flexible icons` with:

```tsx
expect(html).toContain('flex flex-col gap-10 md:gap-12')
expect(html).toContain('flex max-w-3xl flex-col gap-4')
expect(html).toContain(
  'text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl',
)
expect(html).not.toContain('font-serif')
expect(html).toContain('max-w-[70ch] text-base leading-7 text-current/70')
expect(html).toContain('border-current/10 p-6 text-left md:p-8')
expect(html).toContain('mb-4 size-5 shrink-0')
expect(html).toContain('font-sans text-lg font-semibold leading-snug text-current')
expect(html).toContain(
  'mt-2 font-mono text-xs font-semibold uppercase tracking-[0.24em]',
)
```

Add representative body copy to the first `baseItems` entry:

```tsx
{
  icon: 'hospital',
  title: 'MBBS',
  metadata: '4.5 Years + 1 Year Internship',
  description: 'Supervised clinical learning from the first semester.',
},
```

Then assert its description uses the shared card-copy treatment:

```tsx
expect(html).toContain('mt-4 max-w-[65ch] text-sm leading-6')
```

Add a primary section-surface assertion:

```tsx
const primaryHtml = renderToStaticMarkup(
  <ProgramMatrixBlockComponent
    appearance={{ background: 'primary' }}
    eyebrow="Academics"
    items={baseItems}
    title="Programmes"
  />,
)

expect(primaryHtml).toContain(
  'font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current/70',
)
```

- [ ] **Step 2: Run the focused test and confirm the intended failure**

Run:

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the component still uses the one-off serif, larger type, `size-6` icon, `gap-5`, and `p-10` desktop treatment.

- [ ] **Step 3: Replace the one-off introduction classes**

In `ProgramMatrixBlockComponent`, change the container and introduction classes to:

```tsx
<div className={cn(regularBlockContainerClasses, 'flex flex-col gap-10 md:gap-12')}>
```

```tsx
className={cn(
  'flex max-w-3xl flex-col gap-4',
  resolvedAlignment === 'center'
    ? 'mx-auto items-center text-center'
    : 'items-start text-left',
)}
```

Use the shared eyebrow, heading, and description treatments:

```tsx
<p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current/70">
```

```tsx
<h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
```

```tsx
<p className="max-w-[70ch] text-base leading-7 text-current/70">
```

Do not add `font-sans` to the `h2`; the global heading rule must resolve the active theme's
`--font-display`.

- [ ] **Step 4: Replace the one-off card classes**

Use these exact visual roles:

```tsx
className={cn(
  'flex min-w-0 flex-col border-current/10 p-6 text-left md:p-8',
  surface.surface,
  !isLastItem && 'border-b',
  isLastDesktopRow && 'md:border-b-0',
  isLeftColumn && 'md:border-r',
)}
```

```tsx
<Icon className={cn('mb-4 size-5 shrink-0', surface.icon)} />
```

```tsx
<h3 className="font-sans text-lg font-semibold leading-snug text-current">
```

```tsx
<p
  className={cn(
    'mt-2 font-mono text-xs font-semibold uppercase tracking-[0.24em]',
    surface.secondary,
  )}
>
```

```tsx
<p className={cn('mt-4 max-w-[65ch] text-sm leading-6', surface.secondary)}>
```

Keep action spacing, semantic surface classes, dividers, responsive columns, and action contrast
logic unchanged.

- [ ] **Step 5: Run the focused test**

Run:

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx --config ./vitest.config.mts
```

Expected: all Program Matrix tests pass.

- [ ] **Step 6: Run targeted static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/ProgramMatrix/Component.tsx tests/int/program-matrix.int.spec.tsx
git diff --check -- src/blocks/ProgramMatrix/Component.tsx tests/int/program-matrix.int.spec.tsx
```

Expected: TypeScript and diff checks pass; targeted ESLint has zero errors.

---

### Task 2: Regenerate and inspect the visual preview

**Files:**
- Regenerate: `public/block-thumbnails/program-matrix.jpg`
- Verify: `tests/int/program-matrix.int.spec.tsx`
- Verify: `tests/int/block-thumbnails.int.spec.ts`
- Verify: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Verify: `tests/int/live-preview-renderer.int.spec.tsx`

**Interfaces:**
- Consumes: the standardized renderer from Task 1 and the existing Program Matrix thumbnail fixture.
- Produces: an admin thumbnail showing the final shared typography/icon/spacing scale and final verification evidence.

- [ ] **Step 1: Regenerate the Program Matrix thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=programMatrix pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/program-matrix.jpg` is regenerated at the standard dimensions.

- [ ] **Step 2: Inspect the preview once at original resolution**

Open `public/block-thumbnails/program-matrix.jpg` with the workspace image viewer. Confirm:

- the section heading matches neighboring block scale while retaining the theme display face;
- programme titles read as card titles, not competing section headings;
- icons are optically aligned and use the shared `size-5` scale;
- card padding and vertical rhythm are even;
- Default, Muted, and Primary surfaces retain readable semantic contrast;
- the matrix remains one connected visual object.

- [ ] **Step 3: Run the final focused suite**

Run:

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx --config ./vitest.config.mts
```

Expected: all selected tests pass.

- [ ] **Step 4: Run the final source checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/ProgramMatrix/Component.tsx tests/int/program-matrix.int.spec.tsx
git diff --check
git status --short
```

Expected: TypeScript and diff checks pass; targeted ESLint has zero errors; the Program Matrix work remains uncommitted.

- [ ] **Step 5: Complete the bounded finish review**

Review desktop and mobile rendering once if the in-app browser is available. If it remains
unavailable, record the limitation and use the generated desktop preview plus responsive render
tests as the verification evidence. Report the final disposition and any open material issue.
