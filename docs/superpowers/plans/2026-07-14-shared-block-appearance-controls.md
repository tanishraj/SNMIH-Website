# Shared Block Appearance Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one shared appearance system for all current blocks so editors can control block background, baseline text color, and root borders using theme-safe semantic tokens.

**Architecture:** Introduce a shared Payload field factory for `appearance` and a shared runtime helper that maps `appearance` values to root-level Tailwind token classes. Migrate block configs and block renderers to that shared contract, removing legacy per-block background selectors where they overlap, then regenerate types and verify with focused tests.

**Tech Stack:** Payload CMS 3, Next.js App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Vitest

## Global Constraints

- Do not add new theme tokens.
- Do not expose arbitrary editor-controlled text colors.
- Keep override options restricted to `auto`, `default`, and `inverse`.
- Use semantic tokens only; no raw colors and no manual `dark:` overrides.
- Apply appearance classes at the block root as a baseline, not as a replacement for intentional nested semantic styling.
- Replace overlapping legacy block background fields instead of keeping two parallel background systems.
- Regenerate `src/payload-types.ts` after schema changes.

---

### Task 1: Add the shared appearance field factory and class resolver

**Files:**

- Create: `src/blocks/shared/blockAppearanceFields.ts`
- Create: `src/blocks/shared/blockAppearance.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`

**Interfaces:**

- Consumes: Payload `Field` types and the existing block config pattern
- Produces:
  - `createBlockAppearanceFields(options?: { includeTextOverride?: boolean }): Field`
  - `type BlockAppearance = { background?: 'none' | 'primary' | 'secondary' | 'muted' | 'accent' | null; textColor?: 'auto' | 'default' | 'inverse' | null; border?: 'none' | 'top' | 'bottom' | 'topAndBottom' | null }`
  - `resolveBlockAppearanceClasses(appearance?: BlockAppearance | null): { backgroundClassName: string; textClassName: string; borderClassName: string; className: string }`

- [ ] **Step 1: Write the failing schema assertions for the shared appearance contract**

Add assertions to `tests/int/page-blocks.int.spec.ts` and `tests/int/system-page-blocks.int.spec.ts` that look for:

```ts
expect(appearanceField?.type).toBe('group')
expect(appearanceBackgroundField?.defaultValue).toBe('none')
expect(appearanceTextColorField?.defaultValue).toBe('auto')
expect(appearanceBorderField?.defaultValue).toBe('none')
expect(appearanceBackgroundField?.options?.map((option) => option.value)).toEqual([
  'none',
  'primary',
  'secondary',
  'muted',
  'accent',
])
expect(appearanceTextColorField?.options?.map((option) => option.value)).toEqual([
  'auto',
  'default',
  'inverse',
])
expect(appearanceBorderField?.options?.map((option) => option.value)).toEqual([
  'none',
  'top',
  'bottom',
  'topAndBottom',
])
```

- [ ] **Step 2: Run the focused tests to confirm they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts
```

Expected: FAIL because the shared appearance field does not exist yet.

- [ ] **Step 3: Implement the shared field factory**

Create `src/blocks/shared/blockAppearanceFields.ts` with a single group field:

```ts
import type { Field, GroupField, SelectField } from 'payload'

const backgroundField = {
  name: 'background',
  type: 'select',
  defaultValue: 'none',
  options: [
    { label: 'None', value: 'none' },
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
    { label: 'Muted', value: 'muted' },
    { label: 'Accent', value: 'accent' },
  ],
  required: true,
} satisfies SelectField

const textColorField = {
  name: 'textColor',
  label: 'Text Color',
  type: 'select',
  defaultValue: 'auto',
  options: [
    { label: 'Auto', value: 'auto' },
    { label: 'Default', value: 'default' },
    { label: 'Inverse', value: 'inverse' },
  ],
  required: true,
} satisfies SelectField

const borderField = {
  name: 'border',
  type: 'select',
  defaultValue: 'none',
  options: [
    { label: 'None', value: 'none' },
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
    { label: 'Top and Bottom', value: 'topAndBottom' },
  ],
  required: true,
} satisfies SelectField

export const createBlockAppearanceFields = (): Field =>
  ({
    name: 'appearance',
    label: 'Appearance',
    type: 'group',
    fields: [backgroundField, textColorField, borderField],
  }) satisfies GroupField
```

- [ ] **Step 4: Implement the shared runtime resolver**

Create `src/blocks/shared/blockAppearance.ts`:

```ts
import { cn } from '@/lib/utils'

export type BlockAppearance = {
  background?: 'none' | 'primary' | 'secondary' | 'muted' | 'accent' | null
  textColor?: 'auto' | 'default' | 'inverse' | null
  border?: 'none' | 'top' | 'bottom' | 'topAndBottom' | null
}

const backgroundClasses = {
  none: '',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  muted: 'bg-muted',
  accent: 'bg-accent',
} as const

const autoTextClasses = {
  none: 'text-foreground',
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  muted: 'text-foreground',
  accent: 'text-accent-foreground',
} as const

const borderClasses = {
  none: '',
  top: 'border-t border-border',
  bottom: 'border-b border-border',
  topAndBottom: 'border-y border-border',
} as const

export function resolveBlockAppearanceClasses(appearance?: BlockAppearance | null) {
  const background = appearance?.background ?? 'none'
  const textColor = appearance?.textColor ?? 'auto'
  const border = appearance?.border ?? 'none'

  const backgroundClassName = backgroundClasses[background]
  const textClassName = textColor === 'default' ? 'text-foreground' : autoTextClasses[background]
  const borderClassName = borderClasses[border]

  return {
    backgroundClassName,
    textClassName,
    borderClassName,
    className: cn(backgroundClassName, textClassName, borderClassName),
  }
}
```

- [ ] **Step 5: Run the focused tests to verify the shared contract passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts
```

Expected: PASS for the new shared-field assertions, with other failures still allowed until later tasks migrate the blocks.

- [ ] **Step 6: Commit**

```bash
git add src/blocks/shared/blockAppearanceFields.ts src/blocks/shared/blockAppearance.ts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts
git commit -m "feat: add shared block appearance helpers"
```

### Task 2: Migrate page blocks to the shared appearance contract

**Files:**

- Modify: `src/blocks/Announcement/config.ts`
- Modify: `src/blocks/Announcement/Component.tsx`
- Modify: `src/blocks/HeroInstitutional/config.ts`
- Modify: `src/blocks/HeroInstitutional/Component.tsx`
- Modify: `src/blocks/FeatureSpotlight/config.ts`
- Modify: `src/blocks/FeatureSpotlight/Component.tsx`
- Modify: `src/blocks/StatsStrip/config.ts`
- Modify: `src/blocks/StatsStrip/Component.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/global-announcement.int.spec.ts`
- Modify: `tests/int/hero-institutional-render.int.spec.ts`
- Modify: `tests/int/feature-spotlight-render.int.spec.ts`
- Modify: `tests/int/stats-strip-render.int.spec.ts`

**Interfaces:**

- Consumes:
  - `createBlockAppearanceFields(): Field`
  - `resolveBlockAppearanceClasses(appearance?: BlockAppearance | null)`
- Produces:
  - page block configs with a new `appearance` group
  - page block components that accept `appearance?: BlockAppearance | null`

- [ ] **Step 1: Add failing assertions for appearance fields on page blocks**

Extend `tests/int/page-blocks.int.spec.ts` for:

- `AnnouncementBlock`
- `HeroInstitutionalBlock`
- `FeatureSpotlightBlock`
- `StatsStripBlock`

Use checks like:

```ts
const appearanceField = Block.fields.find(
  (field) =>
    typeof field === 'object' && field !== null && 'name' in field && field.name === 'appearance',
)
expect(appearanceField).toBeDefined()
```

Also update the legacy background assertions:

- `FeatureSpotlight` should no longer assert `backgroundStyle`
- `StatsStrip` should no longer assert the old 3-option `backgroundStyle`

- [ ] **Step 2: Run the page-block focused tests to confirm migration failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/global-announcement.int.spec.ts tests/int/hero-institutional-render.int.spec.ts tests/int/feature-spotlight-render.int.spec.ts tests/int/stats-strip-render.int.spec.ts
```

Expected: FAIL because the page blocks still use legacy fields and root classes.

- [ ] **Step 3: Migrate the page block configs**

Replace legacy background selectors with the shared appearance group:

```ts
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'

fields: [
  // existing fields…
  createBlockAppearanceFields(),
]
```

Apply this to:

- `Announcement/config.ts`
- `HeroInstitutional/config.ts`
- `FeatureSpotlight/config.ts`
- `StatsStrip/config.ts`

Remove:

- `FeatureSpotlight.backgroundStyle`
- `StatsStrip.backgroundStyle`

Keep all non-appearance options intact.

- [ ] **Step 4: Migrate the page block components**

At each block root, merge the shared classes:

```ts
import { resolveBlockAppearanceClasses, type BlockAppearance } from '@/blocks/shared/blockAppearance'

type BlockLike = {
  appearance?: BlockAppearance | null
  // existing props…
}

const appearanceClasses = resolveBlockAppearanceClasses(appearance)

return (
  <section className={cn('existing-structural-classes', appearanceClasses.className)}>
```

Specific expectations:

- `Announcement`: remove the hardcoded shell surface class and let `appearance` drive the bar root.
- `HeroInstitutional`: keep the overlay; apply appearance classes to the root section.
- `FeatureSpotlight`: remove `backgroundStyle` runtime branching and use `appearance`.
- `StatsStrip`: remove `backgroundStyle` runtime branching and use `appearance`.

- [ ] **Step 5: Update render assertions to the new root-class model**

Adjust tests so they assert the new semantic output, for example:

```ts
expect(html).toContain('bg-accent')
expect(html).toContain('text-accent-foreground')
expect(html).toContain('border-b border-border')
```

And update sample data from:

```ts
backgroundStyle: 'muted'
```

to:

```ts
appearance: { background: 'muted', textColor: 'auto', border: 'none' }
```

- [ ] **Step 6: Run the page-block focused tests to verify pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/global-announcement.int.spec.ts tests/int/hero-institutional-render.int.spec.ts tests/int/feature-spotlight-render.int.spec.ts tests/int/stats-strip-render.int.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/blocks/Announcement/config.ts src/blocks/Announcement/Component.tsx src/blocks/HeroInstitutional/config.ts src/blocks/HeroInstitutional/Component.tsx src/blocks/FeatureSpotlight/config.ts src/blocks/FeatureSpotlight/Component.tsx src/blocks/StatsStrip/config.ts src/blocks/StatsStrip/Component.tsx tests/int/page-blocks.int.spec.ts tests/int/global-announcement.int.spec.ts tests/int/hero-institutional-render.int.spec.ts tests/int/feature-spotlight-render.int.spec.ts tests/int/stats-strip-render.int.spec.ts
git commit -m "feat: add shared appearance to page blocks"
```

### Task 3: Migrate header and footer blocks to the shared appearance contract

**Files:**

- Modify: `src/blocks/HeaderNavbar12/config.ts`
- Modify: `src/components/header/HeaderNavbar.tsx`
- Modify: `src/blocks/Footer56/config.ts`
- Modify: `src/blocks/Footer56/Component.tsx`
- Modify: `tests/int/header-navbar-render.int.spec.ts`
- Modify: `tests/int/global-footer.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**

- Consumes:
  - `createBlockAppearanceFields(): Field`
  - `resolveBlockAppearanceClasses(appearance?: BlockAppearance | null)`
- Produces:
  - `HeaderNavbar12Block` and `Footer56Block` configs with `appearance`
  - header/footer shells driven by shared appearance classes

- [ ] **Step 1: Add failing schema/render assertions for header and footer**

Update tests to look for:

```ts
expect(appearanceField).toBeDefined()
expect(html).toContain('data-header-navbar="true"')
expect(html).toContain('bg-secondary')
expect(html).toContain('border-y')
expect(html).toContain('data-footer56-background')
```

Remove expectations tied to:

- `Footer56.backgroundStyle`
- the old footer-specific background option set

- [ ] **Step 2: Run the focused header/footer tests to confirm they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/header-navbar-render.int.spec.ts tests/int/global-footer.int.spec.ts tests/int/page-blocks.int.spec.ts
```

Expected: FAIL because configs and components still use legacy shells.

- [ ] **Step 3: Migrate the header and footer configs**

Add:

```ts
createBlockAppearanceFields(),
```

to both blocks.

Remove:

- `Footer56.backgroundStyle`

Keep:

- logo controls
- CTA config
- legal/site-settings integration

- [ ] **Step 4: Migrate the header and footer components**

Header shell:

```ts
const appearanceClasses = resolveBlockAppearanceClasses(appearance)

<header className={cn('shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-background/70', appearanceClasses.className)}>
```

Footer shell:

```ts
const appearanceClasses = resolveBlockAppearanceClasses(appearance)

<section className={cn('text-sm', appearanceClasses.className)}>
```

Preserve:

- header dropdown/sheet internals
- footer link groups, social links, legal links, and CTA variants

- [ ] **Step 5: Update the focused tests to the shared appearance contract**

Replace legacy test data:

```ts
backgroundStyle: 'inverse'
```

with:

```ts
appearance: { background: 'secondary', textColor: 'auto', border: 'top' }
```

Use only semantic class assertions that are now guaranteed by the shared helper.

- [ ] **Step 6: Run the focused tests to verify pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/header-navbar-render.int.spec.ts tests/int/global-footer.int.spec.ts tests/int/page-blocks.int.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/blocks/HeaderNavbar12/config.ts src/components/header/HeaderNavbar.tsx src/blocks/Footer56/config.ts src/blocks/Footer56/Component.tsx tests/int/header-navbar-render.int.spec.ts tests/int/global-footer.int.spec.ts tests/int/page-blocks.int.spec.ts
git commit -m "feat: add shared appearance to header and footer"
```

### Task 4: Migrate system page blocks and shared system field factory

**Files:**

- Modify: `src/blocks/systemPageFields.ts`
- Modify: `src/components/system-pages/primitives/SystemPageShell.tsx`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-rendering.int.spec.ts`

**Interfaces:**

- Consumes:
  - `createBlockAppearanceFields(): Field`
  - `resolveBlockAppearanceClasses(appearance?: BlockAppearance | null)`
- Produces:
  - system page blocks with the same `appearance` contract as other blocks
  - system page shell that respects block-level surface, text, and border settings

- [ ] **Step 1: Add failing system-block appearance assertions**

Extend `tests/int/system-page-blocks.int.spec.ts` to verify `appearance` exists on:

- `System404Block`
- `SystemMaintenanceBlock`
- `SystemComingSoonBlock`

And extend `tests/int/system-page-rendering.int.spec.ts` to render one system block with:

```ts
appearance: { background: 'muted', textColor: 'auto', border: 'topAndBottom' }
```

Then assert the root markup contains:

```ts
expect(html).toContain('bg-muted')
expect(html).toContain('text-foreground')
expect(html).toContain('border-y border-border')
```

- [ ] **Step 2: Run the focused system-page tests to confirm they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/system-page-blocks.int.spec.ts tests/int/system-page-rendering.int.spec.ts
```

Expected: FAIL because system blocks do not yet expose or render `appearance`.

- [ ] **Step 3: Add appearance to the shared system page field factory**

Modify `createBaseSystemPageFields`:

```ts
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'

export const createBaseSystemPageFields = (defaults: SystemPageDefaults): Field[] => [
  createBlockAppearanceFields(),
  {
    name: 'badge',
    // …
  },
]
```

- [ ] **Step 4: Update the system page shell to consume appearance**

Add the prop and merge classes:

```ts
import { resolveBlockAppearanceClasses, type BlockAppearance } from '@/blocks/shared/blockAppearance'

export function SystemPageShell({
  appearance,
  children,
  className,
  variant,
}: {
  appearance?: BlockAppearance | null
  children: ReactNode
  className?: string
  variant: SystemPageVariant
}) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)

  return (
    <section
      className={cn(
        'flex min-h-screen items-center justify-center px-6 py-16 text-center md:px-10',
        appearanceClasses.className,
        className,
      )}
    >
```

Then thread `appearance={props.appearance}` from the system page views.

- [ ] **Step 5: Run the focused system-page tests to verify pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/system-page-blocks.int.spec.ts tests/int/system-page-rendering.int.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/blocks/systemPageFields.ts src/components/system-pages/primitives/SystemPageShell.tsx tests/int/system-page-blocks.int.spec.ts tests/int/system-page-rendering.int.spec.ts
git commit -m "feat: add shared appearance to system blocks"
```

### Task 5: Regenerate types and run the full focused regression surface

**Files:**

- Modify: `src/payload-types.ts`

**Interfaces:**

- Consumes: updated block schemas
- Produces: regenerated Payload types consistent with the new `appearance` fields

- [ ] **Step 1: Regenerate Payload types**

Run:

```bash
pnpm run generate:types
```

Expected: `src/payload-types.ts` updates with `appearance` on all migrated block types.

- [ ] **Step 2: Run the full focused regression suite for all touched surfaces**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/global-announcement.int.spec.ts tests/int/header-navbar-render.int.spec.ts tests/int/hero-institutional-render.int.spec.ts tests/int/feature-spotlight-render.int.spec.ts tests/int/stats-strip-render.int.spec.ts tests/int/system-page-rendering.int.spec.ts tests/int/global-footer.int.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run targeted lint on the touched implementation files**

Run:

```bash
pnpm exec eslint src/blocks/shared/blockAppearanceFields.ts src/blocks/shared/blockAppearance.ts src/blocks/Announcement/config.ts src/blocks/Announcement/Component.tsx src/blocks/HeroInstitutional/config.ts src/blocks/HeroInstitutional/Component.tsx src/blocks/FeatureSpotlight/config.ts src/blocks/FeatureSpotlight/Component.tsx src/blocks/StatsStrip/config.ts src/blocks/StatsStrip/Component.tsx src/blocks/HeaderNavbar12/config.ts src/components/header/HeaderNavbar.tsx src/blocks/Footer56/config.ts src/blocks/Footer56/Component.tsx src/blocks/systemPageFields.ts src/components/system-pages/primitives/SystemPageShell.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/payload-types.ts
git commit -m "chore: regenerate types for block appearance"
```
