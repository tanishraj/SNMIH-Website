# Program Matrix Card Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add independent semantic background controls to Program Matrix cards while aligning the block's configuration, contrast behavior, spacing, and theme adaptation with neighboring CMS blocks.

**Architecture:** Extend each `items` row with a required `cardBackground` select and resolve that value through a local, typed surface-class map in the server renderer. The map owns surface, secondary-copy, icon, divider, link, and matching-button contrast classes so every installed theme and dark mode remains authoritative. Keep the seamless matrix frame, shared spacing helpers, shared actions, and existing production/live-preview registrations unchanged.

**Tech Stack:** Payload CMS 3, React Server Components, Next.js 16, TypeScript, Tailwind CSS v4 semantic tokens, shadcn Button, Lucide React, Vitest.

## Global Constraints

- Preserve the approved seamless one-column/two-column matrix; do not convert cells into detached cards.
- Use only semantic theme tokens: Default Card, Primary, Secondary, Muted, and Accent.
- Do not accept raw colors or add manual dark-mode exceptions.
- Keep programme copy left-aligned and section introduction alignment configurable.
- Keep Button and Link Text action modes, including safe internal/external link behavior.
- Keep Program Grid and every other block unchanged.
- Leave all implementation changes uncommitted unless the user explicitly requests a commit.

---

### Task 1: Add the per-programme card-background schema

**Files:**
- Modify: `tests/int/program-matrix.int.spec.tsx`
- Modify: `src/blocks/ProgramMatrix/config.ts`

**Interfaces:**
- Consumes: Payload `SelectField` and the existing Program Matrix `items` array.
- Produces: `items[].cardBackground` with type `'default' | 'primary' | 'secondary' | 'muted' | 'accent'`, default `'default'`, and required `true`.

- [ ] **Step 1: Write the failing schema assertions**

Add these assertions to the existing schema test:

```tsx
expect(findNamedField(ProgramMatrixBlock.fields, 'cardBackground')).toMatchObject({
  label: 'Card Background',
  type: 'select',
  defaultValue: 'default',
  required: true,
  options: [
    { label: 'Default Card', value: 'default' },
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
    { label: 'Muted', value: 'muted' },
    { label: 'Accent', value: 'accent' },
  ],
})
```

Also inspect the top-level tabs and assert the second tab is named `Layout`:

```tsx
const tabs = ProgramMatrixBlock.fields.find((field) => field.type === 'tabs')
expect(tabs && tabs.type === 'tabs' ? tabs.tabs.map((tab) => tab.label) : []).toEqual([
  'Content',
  'Layout',
])
```

- [ ] **Step 2: Run the focused test and confirm the intended failure**

Run:

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because `cardBackground` is missing and the current tab is `Layout & Theme`.

- [ ] **Step 3: Add the semantic select to every programme row**

In `itemsField.fields`, place this field after `description` and before link configuration:

```ts
{
  name: 'cardBackground',
  label: 'Card Background',
  type: 'select',
  defaultValue: 'default',
  required: true,
  options: [
    { label: 'Default Card', value: 'default' },
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
    { label: 'Muted', value: 'muted' },
    { label: 'Accent', value: 'accent' },
  ],
  admin: {
    description: 'Uses the active theme surface and automatically adjusts card contrast.',
  },
} satisfies SelectField,
```

Rename the second tab from `Layout & Theme` to `Layout`.

- [ ] **Step 4: Run the focused schema test**

Run:

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS for schema identity, field defaults, row limits, and tab labels.

- [ ] **Step 5: Inspect the task diff without committing**

Run:

```bash
git diff --check -- src/blocks/ProgramMatrix/config.ts tests/int/program-matrix.int.spec.tsx
```

Expected: no output and exit code 0.

---

### Task 2: Make every card surface theme-aware

**Files:**
- Modify: `tests/int/program-matrix.int.spec.tsx`
- Modify: `src/blocks/ProgramMatrix/Component.tsx`

**Interfaces:**
- Consumes: `items[].cardBackground` from Task 1 and the existing `ProgrammeAction` component.
- Produces: `ProgramMatrixCardBackground`, `cardSurfaceClasses`, adaptive programme actions, and `data-card-background` render evidence.

- [ ] **Step 1: Write failing surface and contrast tests**

Add a renderer test that supplies all five backgrounds:

```tsx
it('adapts every card surface through semantic theme classes', () => {
  const html = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      items={[
        { cardBackground: 'default', title: 'Default' },
        { cardBackground: 'primary', title: 'Primary' },
        { cardBackground: 'secondary', title: 'Secondary' },
        { cardBackground: 'muted', title: 'Muted' },
        { cardBackground: 'accent', title: 'Accent' },
      ]}
      title="Programmes"
    />,
  )

  expect(html).toContain('data-card-background="default"')
  expect(html).toContain('data-card-background="primary"')
  expect(html).toContain('data-card-background="secondary"')
  expect(html).toContain('data-card-background="muted"')
  expect(html).toContain('data-card-background="accent"')
  expect(html).toContain('bg-card text-card-foreground')
  expect(html).toContain('bg-primary text-primary-foreground')
  expect(html).toContain('bg-secondary text-secondary-foreground')
  expect(html).toContain('bg-muted text-foreground')
  expect(html).toContain('bg-accent text-accent-foreground')
  expect(html).toContain('border-current/10')
})
```

Add an action-contrast test:

```tsx
it('keeps primary-card links and primary buttons readable', () => {
  const linkHtml = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      actionMode="link"
      items={[{ cardBackground: 'primary', linkType: 'custom', title: 'MBBS', url: '/mbbs' }]}
      title="Programmes"
    />,
  )
  const buttonHtml = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      actionMode="button"
      actionVariant="default"
      items={[{ cardBackground: 'primary', linkType: 'custom', title: 'MBBS', url: '/mbbs' }]}
      title="Programmes"
    />,
  )

  expect(linkHtml).toContain('text-primary-foreground')
  expect(buttonHtml).toContain('bg-primary-foreground text-primary')
})
```

- [ ] **Step 2: Run the focused test and confirm the intended failures**

Run:

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the renderer does not yet consume `cardBackground`.

- [ ] **Step 3: Add the typed semantic surface map**

In `Component.tsx`, add:

```ts
type ProgramMatrixCardBackground = 'accent' | 'default' | 'muted' | 'primary' | 'secondary'

type ProgramMatrixCardSurfaceClasses = {
  button: Partial<Record<CmsActionVariant, string>>
  icon: string
  link: string
  secondary: string
  surface: string
}

const cardSurfaceClasses: Record<
  ProgramMatrixCardBackground,
  ProgramMatrixCardSurfaceClasses
> = {
  default: {
    surface: 'bg-card text-card-foreground',
    secondary: 'text-muted-foreground',
    icon: 'text-primary',
    link: 'text-primary',
    button: {},
  },
  primary: {
    surface: 'bg-primary text-primary-foreground',
    secondary: 'text-primary-foreground/75',
    icon: 'text-primary-foreground',
    link: 'text-primary-foreground',
    button: {
      default:
        'bg-primary-foreground text-primary hover:bg-primary-foreground/90 focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/30',
    },
  },
  secondary: {
    surface: 'bg-secondary text-secondary-foreground',
    secondary: 'text-secondary-foreground/70',
    icon: 'text-secondary-foreground',
    link: 'text-secondary-foreground',
    button: {
      secondary:
        'bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90 focus-visible:border-secondary-foreground focus-visible:ring-secondary-foreground/30',
    },
  },
  muted: {
    surface: 'bg-muted text-foreground',
    secondary: 'text-muted-foreground',
    icon: 'text-primary',
    link: 'text-primary',
    button: {},
  },
  accent: {
    surface: 'bg-accent text-accent-foreground',
    secondary: 'text-accent-foreground/70',
    icon: 'text-primary',
    link: 'text-primary',
    button: {},
  },
}
```

Add `cardBackground?: ProgramMatrixCardBackground | null` to `ProgramMatrixItem` and
`cardBackground: ProgramMatrixCardBackground` to `ResolvedProgramMatrixItem`. Resolve each item
with `cardBackground: item.cardBackground ?? 'default'`.

- [ ] **Step 4: Pass adaptive classes through the card and action**

Extend `ProgrammeActionProps` with `buttonClassName?: string` and `linkClassName?: string`. Pass
`className={buttonClassName}` to `Button` and `className={linkClassName}` to `ContentLink`.

Inside the item map, resolve:

```ts
const surface = cardSurfaceClasses[item.cardBackground]
const buttonClassName = surface.button[resolvedActionVariant]
```

Update each article to include:

```tsx
className={cn(
  'flex min-w-0 flex-col border-current/10 p-6 text-left sm:p-8 md:p-10',
  surface.surface,
  !isLastItem && 'border-b',
  isLastDesktopRow && 'md:border-b-0',
  isLeftColumn && 'md:border-r',
)}
data-card-background={item.cardBackground}
```

Use `surface.icon` for the icon, `surface.secondary` for metadata and description,
`surface.link` for Link Text, and `buttonClassName` for a matching button variant. Keep the title
`text-current`. Keep the outer frame `rounded-[var(--radius)] border border-border bg-card`.

- [ ] **Step 5: Run the focused renderer tests**

Run:

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx --config ./vitest.config.mts
```

Expected: all Program Matrix tests pass, including all five surface and Primary-card action cases.

- [ ] **Step 6: Run the Impeccable detector once for the changed UI**

Run only if it has not already been run for this implementation pass:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/ProgramMatrix/Component.tsx src/blocks/ProgramMatrix/config.ts
```

Expected: no unresolved design-system defects. Fix reported Program Matrix defects in one bounded batch; do not rerun the detector.

- [ ] **Step 7: Inspect the task diff without committing**

Run:

```bash
git diff --check -- src/blocks/ProgramMatrix/Component.tsx src/blocks/ProgramMatrix/config.ts tests/int/program-matrix.int.spec.tsx
```

Expected: no output and exit code 0.

---

### Task 3: Regenerate types, demonstrate surfaces, and verify the complete refinement

**Files:**
- Modify: `src/payload-types.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Regenerate: `public/block-thumbnails/program-matrix.jpg`
- Modify: `docs/guides/blocks.md`
- Test: `tests/int/program-matrix.int.spec.tsx`
- Test: `tests/int/block-thumbnails.int.spec.ts`
- Test: `tests/int/block-thumbnail-fixtures.int.spec.ts`

**Interfaces:**
- Consumes: the final schema and renderer from Tasks 1–2.
- Produces: generated Payload types containing `cardBackground`, an updated preview fixture and asset, operator documentation, and verification evidence.

- [ ] **Step 1: Add generated-type and documentation assertions**

Extend the existing catalog/type tests with:

```tsx
expect(payloadTypesSource).toContain("cardBackground: 'default' | 'primary' | 'secondary' | 'muted' | 'accent'")
expect(blocksGuideSource).toContain('independent semantic card backgrounds')
```

- [ ] **Step 2: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: exit code 0 and `ProgramMatrixBlock.items[]` includes the five-value `cardBackground` field.

- [ ] **Step 3: Update the thumbnail fixture with restrained surface variation**

In the four existing fixture items, set backgrounds in this order:

```tsx
cardBackground: 'default'
cardBackground: 'muted'
cardBackground: 'default'
cardBackground: 'primary'
```

This demonstrates the control without making every cell compete for attention.

- [ ] **Step 4: Update the block guide**

Change the Program Matrix capability text in `docs/guides/blocks.md` to:

```markdown
Seamless one/two-column matrix with flexible Lucide icons, independent semantic card backgrounds, and optional Button or Link Text actions
```

- [ ] **Step 5: Regenerate the Program Matrix thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=programMatrix pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/program-matrix.jpg` is regenerated at the repository's standard thumbnail dimensions.

- [ ] **Step 6: Inspect the thumbnail once at original resolution**

Open `public/block-thumbnails/program-matrix.jpg` with the workspace image viewer. Confirm the intro and two-column matrix retain the approved hierarchy, the Primary cell has readable text/actions, the Muted cell remains quiet, and the matrix is still one connected frame.

- [ ] **Step 7: Run the focused integration suite**

Run:

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx --config ./vitest.config.mts
```

Expected: all selected test files pass.

- [ ] **Step 8: Run type, lint, and diff verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/ProgramMatrix/Component.tsx src/blocks/ProgramMatrix/config.ts src/block-thumbnails/fixtures.tsx tests/int/program-matrix.int.spec.tsx
git diff --check
```

Expected: TypeScript and diff checks pass; targeted ESLint has zero errors.

- [ ] **Step 9: Perform the bounded finish review**

Review desktop and mobile rendering once if the in-app browser surface is available. Confirm semantic contrast, responsive dividers, content wrapping, focus visibility, and agreement with the approved design. If the browser is unavailable, record that limitation and rely on the generated desktop preview plus render-class tests for responsive structure.

- [ ] **Step 10: Report the uncommitted handoff**

Run:

```bash
git status --short
```

Expected: only the intended Program Matrix implementation, generated type/thumbnail, test, and documentation changes remain uncommitted alongside the already-existing uncommitted Program Matrix work.
