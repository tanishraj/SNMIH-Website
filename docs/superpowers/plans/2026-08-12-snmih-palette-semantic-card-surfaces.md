# SNMIH Palette and Semantic Card Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the SNMIH Primary palette with the approved navy system and establish shared Payload and renderer helpers for theme-aware card surfaces.

**Architecture:** SNMIH remains a token-only theme; components continue consuming semantic Tailwind classes. A shared field factory owns card-background schema options, and a shared resolver owns foreground, icon, divider, link, and matching-button contrast. Program Matrix becomes the first integration consumer, proving the contract before the wider rollout.

**Tech Stack:** Payload CMS 3 field configs, Next.js 16, React 19, TypeScript, Tailwind CSS semantic variables, Vitest.

## Global Constraints

- Modify only `theme-snmih.css`; Default, Blue, Kodama, and Sunset palettes remain unchanged.
- Light-mode Primary must render exactly as `#031d44`.
- Do not introduce `--link`; links, buttons, tabs, icons, selected states, and sidebar actions use Primary.
- Dark mode uses the approved accessible same-family Primary tint `#8fb7ea` with `#031d44` foreground.
- CMS authors choose only Default Card, Primary, Secondary, Muted, or Accent.
- Components must not contain SNMIH-specific hex or OKLCH values.
- Existing field paths and stored Program Matrix values remain unchanged.
- Do not commit; the user requested that the current work remain uncommitted.

---

## File Structure

- Create `src/blocks/shared/cardThemeFields.ts`: one Payload schema source for card surfaces and nested card tabs.
- Create `src/blocks/shared/cardSurface.ts`: one renderer source for semantic card contrast classes.
- Modify `src/styles/themes/theme-snmih.css`: approved light and dark tokens.
- Modify `src/blocks/ProgramMatrix/config.ts`: consume shared card schema helpers.
- Modify `src/blocks/ProgramMatrix/Component.tsx`: consume shared surface resolver.
- Modify `tests/int/theme-contracts.int.spec.ts`: exact SNMIH token and contrast contract.
- Create `tests/int/card-theme-contract.int.spec.ts`: shared schema and renderer tests.
- Modify `tests/int/program-matrix.int.spec.tsx`: prove integration and fallback behavior.

### Task 1: Lock the SNMIH light and dark palette

**Files:**
- Modify: `tests/int/theme-contracts.int.spec.ts`
- Modify: `src/styles/themes/theme-snmih.css`

**Interfaces:**
- Consumes: existing `getModeTokens()`, `parseOklch()`, and `contrastRatio()` test helpers.
- Produces: semantic CSS variables used by every frontend component under `data-theme-color="snmih"`.

- [ ] **Step 1: Write the exact palette assertions**

Add a test after the general contrast test. Use exact OKLCH conversions of the approved hex values:

```ts
it('uses the approved SNMIH brand palette in both modes', () => {
  const light = getModeTokens('snmih', 'light')
  const dark = getModeTokens('snmih', 'dark')

  expect(light).toMatchObject({
    background: 'oklch(1 0 0)',
    foreground: 'oklch(0.209255 0.032306 262.410)',
    primary: 'oklch(0.238550 0.080565 258.205)',
    'primary-foreground': 'oklch(0.984152 0.003413 247.858)',
    secondary: 'oklch(0.947186 0.013730 258.345)',
    muted: 'oklch(0.972008 0.006231 255.475)',
    accent: 'oklch(0.925732 0.024723 251.905)',
    border: 'oklch(0.898202 0.015641 257.200)',
    ring: 'oklch(0.529970 0.089429 256.778)',
  })
  expect(dark).toMatchObject({
    background: 'oklch(0.176997 0.032292 258.683)',
    foreground: 'oklch(0.974538 0.007928 253.852)',
    card: 'oklch(0.216127 0.040176 256.770)',
    primary: 'oklch(0.769267 0.085353 254.774)',
    'primary-foreground': 'oklch(0.238550 0.080565 258.205)',
    secondary: 'oklch(0.274249 0.048665 256.289)',
    muted: 'oklch(0.251364 0.046287 259.131)',
    accent: 'oklch(0.325710 0.063155 255.477)',
    border: 'oklch(0.351576 0.044540 255.167)',
    ring: 'oklch(0.769267 0.085353 254.774)',
  })
})
```

- [ ] **Step 2: Run the theme test and verify the new contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts
```

Expected: FAIL in `uses the approved SNMIH brand palette in both modes` because the current Primary and neutral tokens differ.

- [ ] **Step 3: Replace the SNMIH token values**

Keep the two existing selectors and assign the approved palette. Use these exact primary declarations and the matching values from the specification for the other semantic tokens:

```css
:root[data-theme-color='snmih'] {
  --background: oklch(1 0 0);
  --foreground: oklch(0.209255 0.032306 262.410);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.209255 0.032306 262.410);
  --primary: oklch(0.238550 0.080565 258.205);
  --primary-foreground: oklch(0.984152 0.003413 247.858);
  --secondary: oklch(0.947186 0.013730 258.345);
  --secondary-foreground: oklch(0.244862 0.038771 264.354);
  --muted: oklch(0.972008 0.006231 255.475);
  --muted-foreground: oklch(0.523909 0.030609 257.074);
  --accent: oklch(0.925732 0.024723 251.905);
  --accent-foreground: oklch(0.275086 0.063427 255.223);
  --border: oklch(0.898202 0.015641 257.200);
  --input: oklch(0.898202 0.015641 257.200);
  --ring: oklch(0.529970 0.089429 256.778);
}

:root[data-theme-color='snmih'].dark {
  --background: oklch(0.176997 0.032292 258.683);
  --foreground: oklch(0.974538 0.007928 253.852);
  --card: oklch(0.216127 0.040176 256.770);
  --card-foreground: oklch(0.974538 0.007928 253.852);
  --primary: oklch(0.769267 0.085353 254.774);
  --primary-foreground: oklch(0.238550 0.080565 258.205);
  --secondary: oklch(0.274249 0.048665 256.289);
  --secondary-foreground: oklch(0.964189 0.013083 251.559);
  --muted: oklch(0.251364 0.046287 259.131);
  --muted-foreground: oklch(0.774331 0.030076 254.713);
  --accent: oklch(0.325710 0.063155 255.477);
  --accent-foreground: oklch(0.974538 0.007928 253.852);
  --border: oklch(0.351576 0.044540 255.167);
  --input: oklch(0.351576 0.044540 255.167);
  --ring: oklch(0.769267 0.085353 254.774);
}
```

Retain the theme's destructive and chart scales, but reconcile popover and sidebar values with the new Background, Card, Primary, Accent, Border, and Ring tokens. Do not retain the old unrelated sidebar blue.

- [ ] **Step 4: Run contrast and exact-token tests**

Run the Task 1 command again.

Expected: PASS, including all `>= 4.5` semantic contrast checks for SNMIH light and dark modes.

- [ ] **Step 5: Check the uncommitted patch**

Run:

```bash
git diff --check
```

Expected: no output. Do not commit.

### Task 2: Add the shared card schema factories

**Files:**
- Create: `tests/int/card-theme-contract.int.spec.ts`
- Create: `src/blocks/shared/cardThemeFields.ts`

**Interfaces:**
- Produces: `cardSurfaceValues`, `CardSurfaceValue`, `createCardBackgroundField(options?)`, and `createCardTabs({ contentFields, themeFields? })`.
- Consumes: Payload `Field`, `SelectField`, and `TabsField` types.

- [ ] **Step 1: Write failing field-factory tests**

```ts
import { describe, expect, it } from 'vitest'
import {
  cardSurfaceValues,
  createCardBackgroundField,
  createCardTabs,
} from '@/blocks/shared/cardThemeFields'

describe('card theme field contract', () => {
  it('exposes one semantic background vocabulary', () => {
    expect(cardSurfaceValues).toEqual(['default', 'primary', 'secondary', 'muted', 'accent'])
    expect(createCardBackgroundField()).toMatchObject({
      name: 'cardBackground',
      label: 'Background',
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
  })

  it('creates fresh unnamed Content and Theme Settings tabs', () => {
    const first = createCardTabs({
      contentFields: [{ name: 'title', type: 'text' }],
      themeFields: [{ name: 'emphasis', type: 'checkbox' }],
    })
    const second = createCardTabs({ contentFields: [{ name: 'title', type: 'text' }] })

    expect(first).toMatchObject({
      type: 'tabs',
      tabs: [
        { label: 'Content', fields: [{ name: 'title' }] },
        { label: 'Theme Settings', fields: [{ name: 'emphasis' }, { name: 'cardBackground' }] },
      ],
    })
    expect(second).not.toBe(first)
  })

  it('can reuse a legacy semantic background field without creating a duplicate', () => {
    const tabs = createCardTabs({
      contentFields: [{ name: 'title', type: 'text' }],
      includeBackground: false,
      themeFields: [{ name: 'accentColor', type: 'select', options: [] }],
    })
    expect(tabs.tabs[1].fields).toEqual([
      { name: 'accentColor', type: 'select', options: [] },
    ])
  })
})
```

- [ ] **Step 2: Run the new test and verify import failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-theme-contract.int.spec.ts
```

Expected: FAIL because `cardThemeFields.ts` does not exist.

- [ ] **Step 3: Implement the schema factories**

```ts
import type { Field, SelectField, TabsField } from 'payload'

export const cardSurfaceValues = ['default', 'primary', 'secondary', 'muted', 'accent'] as const
export type CardSurfaceValue = (typeof cardSurfaceValues)[number]

type CardBackgroundOptions = {
  label?: string
  name?: string
}

export const createCardBackgroundField = ({
  label = 'Background',
  name = 'cardBackground',
}: CardBackgroundOptions = {}): SelectField => ({
  name,
  label,
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
    description: 'Uses the active website theme and automatically adjusts card contrast.',
  },
})

export const createCardTabs = ({
  contentFields,
  includeBackground = true,
  themeFields = [],
}: {
  contentFields: Field[]
  includeBackground?: boolean
  themeFields?: Field[]
}): TabsField => ({
  type: 'tabs',
  tabs: [
    { label: 'Content', fields: [...contentFields] },
    {
      label: 'Theme Settings',
      fields: [
        ...themeFields,
        ...(includeBackground ? [createCardBackgroundField()] : []),
      ],
    },
  ],
})
```

- [ ] **Step 4: Run the shared schema tests**

Run the Task 2 command again.

Expected: PASS.

- [ ] **Step 5: Check the uncommitted patch**

Run `git diff --check` and expect no output. Do not commit.

### Task 3: Add the shared semantic surface resolver

**Files:**
- Modify: `tests/int/card-theme-contract.int.spec.ts`
- Create: `src/blocks/shared/cardSurface.ts`

**Interfaces:**
- Consumes: `CardSurfaceValue` from `cardThemeFields.ts` and `CmsActionVariant` from `src/lib/cmsLinks.ts`.
- Produces: `resolveCardSurface(value?: string | null): CardSurfaceClasses`.

- [ ] **Step 1: Add failing resolver tests**

```ts
import { resolveCardSurface } from '@/blocks/shared/cardSurface'

it.each([
  ['default', 'bg-card text-card-foreground', 'text-muted-foreground'],
  ['primary', 'bg-primary text-primary-foreground', 'text-primary-foreground/75'],
  ['secondary', 'bg-secondary text-secondary-foreground', 'text-secondary-foreground/70'],
  ['muted', 'bg-muted text-foreground', 'text-muted-foreground'],
  ['accent', 'bg-accent text-accent-foreground', 'text-accent-foreground/70'],
] as const)('resolves the %s card surface', (value, className, secondary) => {
  expect(resolveCardSurface(value)).toMatchObject({ className, secondary })
})

it('falls back safely and inverses matching filled buttons', () => {
  expect(resolveCardSurface('unknown').value).toBe('default')
  expect(resolveCardSurface(null).value).toBe('default')
  expect(resolveCardSurface('primary').button.default).toContain('bg-primary-foreground')
  expect(resolveCardSurface('secondary').button.secondary).toContain('bg-secondary-foreground')
})
```

- [ ] **Step 2: Run the resolver tests and verify import failure**

Run the Task 2 command.

Expected: FAIL because `cardSurface.ts` does not exist.

- [ ] **Step 3: Implement the complete resolver**

Implement the complete shared record and resolver:

```ts
import type { CmsActionVariant } from '@/lib/cmsLinks'
import { cardSurfaceValues, type CardSurfaceValue } from './cardThemeFields'

export type CardSurfaceClasses = {
  button: Partial<Record<CmsActionVariant, string>>
  className: string
  divider: string
  icon: string
  link: string
  secondary: string
  value: CardSurfaceValue
}

const cardSurfaceClasses: Record<CardSurfaceValue, CardSurfaceClasses> = {
  default: {
    value: 'default',
    className: 'bg-card text-card-foreground',
    secondary: 'text-muted-foreground',
    icon: 'text-primary',
    divider: 'border-border',
    link: 'text-primary hover:text-primary/80',
    button: {},
  },
  primary: {
    value: 'primary',
    className: 'bg-primary text-primary-foreground',
    secondary: 'text-primary-foreground/75',
    icon: 'text-primary-foreground',
    divider: 'border-primary-foreground/15',
    link: 'text-primary-foreground hover:text-primary-foreground/80',
    button: {
      default:
        'bg-primary-foreground text-primary hover:bg-primary-foreground/90 focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/30',
    },
  },
  secondary: {
    value: 'secondary',
    className: 'bg-secondary text-secondary-foreground',
    secondary: 'text-secondary-foreground/70',
    icon: 'text-secondary-foreground',
    divider: 'border-secondary-foreground/15',
    link: 'text-secondary-foreground hover:text-secondary-foreground/80',
    button: {
      secondary:
        'bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90 focus-visible:border-secondary-foreground focus-visible:ring-secondary-foreground/30',
    },
  },
  muted: {
    value: 'muted',
    className: 'bg-muted text-foreground',
    secondary: 'text-muted-foreground',
    icon: 'text-primary',
    divider: 'border-border',
    link: 'text-primary hover:text-primary/80',
    button: {},
  },
  accent: {
    value: 'accent',
    className: 'bg-accent text-accent-foreground',
    secondary: 'text-accent-foreground/70',
    icon: 'text-primary',
    divider: 'border-accent-foreground/15',
    link: 'text-primary hover:text-primary/80',
    button: {},
  },
}

export const resolveCardSurface = (value?: string | null): CardSurfaceClasses => {
  const resolvedValue = cardSurfaceValues.includes(value as CardSurfaceValue)
    ? (value as CardSurfaceValue)
    : 'default'

  return cardSurfaceClasses[resolvedValue]
}
```

- [ ] **Step 4: Run the resolver test**

Run the Task 2 command again.

Expected: PASS.

- [ ] **Step 5: Check the uncommitted patch**

Run `git diff --check` and expect no output. Do not commit.

### Task 4: Refactor Program Matrix onto the shared contract

**Files:**
- Modify: `src/blocks/ProgramMatrix/config.ts`
- Modify: `src/blocks/ProgramMatrix/Component.tsx`
- Modify: `tests/int/program-matrix.int.spec.tsx`

**Interfaces:**
- Consumes: `createCardTabs()`, `resolveCardSurface()`, and `CardSurfaceValue`.
- Produces: an unchanged Program Matrix UI and stored schema using shared implementations.

- [ ] **Step 1: Extend the integration test for nested tabs and invalid fallback**

Replace direct `cardBackground` lookup expectations with a nested row-tab assertion:

```ts
const itemTabs = itemsField.fields?.[0] as TabsField
expect(itemTabs.tabs.map(({ label }) => label)).toEqual(['Content', 'Theme Settings'])
expect(findNamedField(itemTabs.tabs[1].fields, 'cardBackground')).toMatchObject({
  defaultValue: 'default',
  required: true,
})
```

Add a renderer assertion that an item with `cardBackground: 'invalid' as never` renders
`data-card-background="default"` and `bg-card text-card-foreground`.

- [ ] **Step 2: Run the Program Matrix test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: FAIL because the row is flat and invalid values do not resolve through the shared fallback.

- [ ] **Step 3: Replace the flat row schema with `createCardTabs()`**

Move icon, title, metadata, description, link type, page, URL, and new-tab fields into
`contentFields`. Remove the local SelectField card-background declaration and pass the content
array to `createCardTabs({ contentFields })`. Preserve every field name and condition exactly.

- [ ] **Step 4: Replace the local surface record with `resolveCardSurface()`**

Remove `ProgramMatrixCardBackground`, `ProgramMatrixCardSurfaceClasses`, and
`cardSurfaceClasses`. Type `cardBackground` as `CardSurfaceValue`, resolve it during item mapping,
and render with:

```ts
const surface = resolveCardSurface(item.cardBackground)

<article
  className={cn(
    'flex min-w-0 flex-col p-6 text-left md:p-8',
    surface.className,
    surface.divider,
    !isLastItem && 'border-b',
    isLastDesktopRow && 'md:border-b-0',
    isLeftColumn && 'md:border-r',
  )}
  data-card-background={surface.value}
>
```

Use `surface.icon`, `surface.secondary`, `surface.link`, and
`surface.button[resolvedActionVariant]` at the existing call sites.

- [ ] **Step 5: Run shared and Program Matrix tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-theme-contract.int.spec.ts tests/int/program-matrix.int.spec.tsx tests/int/theme-contracts.int.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Run type and lint checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/shared/cardThemeFields.ts src/blocks/shared/cardSurface.ts src/blocks/ProgramMatrix/config.ts src/blocks/ProgramMatrix/Component.tsx tests/int/card-theme-contract.int.spec.ts tests/int/program-matrix.int.spec.tsx tests/int/theme-contracts.int.spec.ts
git diff --check
```

Expected: all commands pass with no output from `git diff --check`. Do not commit.

## Phase Acceptance

- SNMIH light Primary visually equals `#031d44`.
- SNMIH dark mode meets the approved contrast contract.
- No separate link token exists.
- Shared card field and renderer helpers have focused tests.
- Program Matrix uses the shared helpers without visual or data-shape regression.
- Other theme preset files are untouched.
