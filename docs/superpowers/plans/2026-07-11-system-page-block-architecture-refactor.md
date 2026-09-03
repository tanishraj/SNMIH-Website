# System Page Block Architecture Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor system-page blocks so `404`, `maintenance`, and `coming soon` each own their rendering through dedicated view components while sharing only small reusable primitives.

**Architecture:** Introduce a `system-pages` view layer plus small server-safe primitives for shell, status, actions, and copy. Convert each Payload block `Component` into a thin adapter, route fallback pages through the same views, then remove the current variant-based `SystemPageHero` and split the shared field factory into clearer responsibilities.

**Tech Stack:** Next.js App Router, React server components, Payload CMS block configs, TypeScript, Tailwind CSS, Vitest

## Global Constraints

- Keep `404`, `maintenance`, and `coming soon` as separate Payload blocks and separate frontend views.
- Reuse code only at the primitive level; do not keep a smart shared variant component.
- Keep fallback pages visually aligned by rendering the same dedicated views used by block adapters.
- Keep these views server-renderable unless interaction strictly requires client code.
- Prefer static direct imports; do not add barrel exports for the new `system-pages` files.
- Keep animation limited to `transform` and `opacity` where used.
- Do not change route-level system mode logic or ordinary frontend block behavior.

---

### Task 1: Introduce shared system-page primitives and move maintenance / coming-soon to dedicated views

**Files:**
- Create: `src/components/system-pages/types.ts`
- Create: `src/components/system-pages/primitives/SystemPageShell.tsx`
- Create: `src/components/system-pages/primitives/SystemPageActions.tsx`
- Create: `src/components/system-pages/primitives/SystemPageStatus.tsx`
- Create: `src/components/system-pages/primitives/SystemPageCopy.tsx`
- Create: `src/components/system-pages/SystemMaintenanceView.tsx`
- Create: `src/components/system-pages/SystemComingSoonView.tsx`
- Modify: `src/blocks/SystemMaintenance/Component.tsx`
- Modify: `src/blocks/SystemComingSoon/Component.tsx`
- Modify: `src/app/(frontend)/SystemFallbackPage.tsx`
- Modify: `tests/int/system-page-rendering.int.spec.ts`

**Interfaces:**
- Consumes: `resolveSystemPageAction(value)` from `src/components/system-page-hero.tsx`
- Produces: `SystemPageActionLink`, `SystemPageViewProps`, `SystemPageShell`, `SystemPageActions`, `SystemPageStatus`, `SystemPageCopy`, `SystemMaintenanceView`, `SystemComingSoonView`

- [ ] **Step 1: Write the failing rendering assertions for the new dedicated maintenance and coming-soon views**

```ts
it('renders the maintenance block through the dedicated maintenance view', () => {
  const html = renderToStaticMarkup(
    createElement(SystemMaintenanceBlockComponent, {
      badge: 'Maintenance',
      description: 'We are applying updates.',
      heading: 'Scheduled maintenance',
      id: 'system-maintenance',
      primaryAction: null,
      secondaryAction: null,
      supportingNote: 'Support remains available by email.',
    } as never),
  )

  expect(html).toContain('data-system-page-root="true"')
  expect(html).toContain('data-system-page-variant="maintenance"')
  expect(html).toContain('Scheduled maintenance')
  expect(html).toContain('Support remains available by email.')
})

it('renders the coming soon block through the dedicated coming-soon view', () => {
  const html = renderToStaticMarkup(
    createElement(SystemComingSoonBlockComponent, {
      badge: 'Coming Soon',
      description: 'A refreshed campus experience is on the way.',
      heading: 'New site in progress',
      id: 'system-coming-soon',
      primaryAction: null,
      secondaryAction: null,
      supportingNote: null,
    } as never),
  )

  expect(html).toContain('data-system-page-root="true"')
  expect(html).toContain('data-system-page-variant="comingSoon"')
  expect(html).toContain('New site in progress')
})
```

- [ ] **Step 2: Run the focused test to verify the new assertions fail**

Run: `pnpm run test:int -- tests/int/system-page-rendering.int.spec.ts`
Expected: FAIL because `data-system-page-variant="maintenance"` and `data-system-page-variant="comingSoon"` are not rendered yet.

- [ ] **Step 3: Create the shared types and primitives**

```ts
// src/components/system-pages/types.ts
export type SystemPageActionLink = {
  label: string
  openInNewTab?: boolean | null
  url: string
}

export type SystemPageViewProps = {
  badge?: string | null
  description?: string | null
  heading: string
  primaryAction?: SystemPageActionLink | null
  secondaryAction?: SystemPageActionLink | null
  statusDisplay?: string | null
  supportingNote?: string | null
}
```

```tsx
// src/components/system-pages/primitives/SystemPageShell.tsx
import type { ReactNode } from 'react'

export function SystemPageShell({
  children,
  className,
  variant,
}: {
  children: ReactNode
  className?: string
  variant: 'comingSoon' | 'maintenance' | 'notFound'
}) {
  return (
    <section
      data-system-page-root="true"
      data-system-page-variant={variant}
      className={[
        'flex min-h-screen items-center justify-center bg-background px-6 py-16 text-center md:px-10',
        className ?? '',
      ]
        .join(' ')
        .trim()}
    >
      {children}
    </section>
  )
}
```

```tsx
// src/components/system-pages/primitives/SystemPageStatus.tsx
export function SystemPageStatus({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div
      className={[
        'animate-[fade-in_.7s_ease-out_both] font-semibold leading-none tracking-tight text-foreground/20',
        className ?? 'text-[clamp(4.5rem,18vw,8rem)]',
      ]
        .join(' ')
        .trim()}
    >
      {children}
    </div>
  )
}
```

```tsx
// src/components/system-pages/primitives/SystemPageCopy.tsx
export function SystemPageCopy({
  description,
  heading,
}: {
  description?: string | null
  heading: string
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <h1 className="max-w-2xl animate-[fade-in_.7s_ease-out_.12s_both] text-balance text-[clamp(2rem,8vw,3.75rem)] font-semibold leading-none text-foreground">
        {heading}
      </h1>
      {description ? (
        <p className="max-w-xl animate-[fade-in_.7s_ease-out_.2s_both] text-balance text-[clamp(1rem,2.6vw,1.125rem)] leading-7 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}
```

```tsx
// src/components/system-pages/primitives/SystemPageActions.tsx
import { ArrowRight, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { SystemPageActionLink } from '@/components/system-pages/types'

function ActionButton({
  action,
  variant,
}: {
  action?: SystemPageActionLink | null
  variant: 'default' | 'outline'
}) {
  if (!action?.label || !action.url) return null

  const isExternal = /^https?:\/\//.test(action.url)
  const openInNewTab = action.openInNewTab || isExternal

  return (
    <Button asChild size="lg" variant={variant} className="animate-[fade-in_.7s_ease-out_.3s_both]">
      <a
        href={action.url}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noreferrer noopener' : undefined}
      >
        {action.label}
        {variant === 'default' ? <ArrowRight data-icon="inline-end" /> : null}
        {variant === 'outline' && openInNewTab ? <ExternalLink data-icon="inline-end" /> : null}
      </a>
    </Button>
  )
}

export function SystemPageActions({
  primaryAction,
  secondaryAction,
}: {
  primaryAction?: SystemPageActionLink | null
  secondaryAction?: SystemPageActionLink | null
}) {
  if (!primaryAction?.label && !secondaryAction?.label) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ActionButton action={primaryAction} variant="default" />
      <ActionButton action={secondaryAction} variant="outline" />
    </div>
  )
}
```

- [ ] **Step 4: Create the dedicated maintenance and coming-soon views and update their adapters plus fallbacks**

```tsx
// src/components/system-pages/SystemMaintenanceView.tsx
import { SystemPageActions } from '@/components/system-pages/primitives/SystemPageActions'
import { SystemPageCopy } from '@/components/system-pages/primitives/SystemPageCopy'
import { SystemPageShell } from '@/components/system-pages/primitives/SystemPageShell'
import { SystemPageStatus } from '@/components/system-pages/primitives/SystemPageStatus'
import type { SystemPageViewProps } from '@/components/system-pages/types'

export function SystemMaintenanceView(props: SystemPageViewProps) {
  return (
    <SystemPageShell variant="maintenance">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
        <SystemPageStatus>{props.statusDisplay || props.badge || 'Maintenance'}</SystemPageStatus>
        <SystemPageCopy heading={props.heading} description={props.description} />
        <SystemPageActions
          primaryAction={props.primaryAction}
          secondaryAction={props.secondaryAction}
        />
        {props.supportingNote ? (
          <p className="max-w-lg animate-[fade-in_.7s_ease-out_.38s_both] text-[clamp(0.875rem,2.2vw,1rem)] leading-6 text-muted-foreground">
            {props.supportingNote}
          </p>
        ) : null}
      </div>
    </SystemPageShell>
  )
}
```

```tsx
// src/components/system-pages/SystemComingSoonView.tsx
import { SystemPageActions } from '@/components/system-pages/primitives/SystemPageActions'
import { SystemPageCopy } from '@/components/system-pages/primitives/SystemPageCopy'
import { SystemPageShell } from '@/components/system-pages/primitives/SystemPageShell'
import { SystemPageStatus } from '@/components/system-pages/primitives/SystemPageStatus'
import type { SystemPageViewProps } from '@/components/system-pages/types'

export function SystemComingSoonView(props: SystemPageViewProps) {
  return (
    <SystemPageShell variant="comingSoon">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
        <SystemPageStatus>{props.statusDisplay || props.badge || 'Coming Soon'}</SystemPageStatus>
        <SystemPageCopy heading={props.heading} description={props.description} />
        <SystemPageActions
          primaryAction={props.primaryAction}
          secondaryAction={props.secondaryAction}
        />
        {props.supportingNote ? (
          <p className="max-w-lg animate-[fade-in_.7s_ease-out_.38s_both] text-[clamp(0.875rem,2.2vw,1rem)] leading-6 text-muted-foreground">
            {props.supportingNote}
          </p>
        ) : null}
      </div>
    </SystemPageShell>
  )
}
```

```tsx
// src/blocks/SystemMaintenance/Component.tsx
import { resolveSystemPageAction } from '@/components/system-page-hero'
import { SystemMaintenanceView } from '@/components/system-pages/SystemMaintenanceView'
```

```tsx
return (
  <SystemMaintenanceView
    badge={props.badge}
    description={props.description}
    heading={props.heading}
    primaryAction={primaryAction}
    secondaryAction={secondaryAction}
    statusDisplay={props.badge || 'Maintenance'}
    supportingNote={props.supportingNote}
  />
)
```

```tsx
// src/app/(frontend)/SystemFallbackPage.tsx
import { SystemComingSoonView } from '@/components/system-pages/SystemComingSoonView'
import { SystemMaintenanceView } from '@/components/system-pages/SystemMaintenanceView'
```

- [ ] **Step 5: Run the focused rendering spec and verify it passes**

Run: `pnpm run test:int -- tests/int/system-page-rendering.int.spec.ts`
Expected: PASS with maintenance and coming-soon rendering through dedicated views.

- [ ] **Step 6: Commit**

```bash
git add src/components/system-pages/types.ts src/components/system-pages/primitives/SystemPageShell.tsx src/components/system-pages/primitives/SystemPageActions.tsx src/components/system-pages/primitives/SystemPageStatus.tsx src/components/system-pages/primitives/SystemPageCopy.tsx src/components/system-pages/SystemMaintenanceView.tsx src/components/system-pages/SystemComingSoonView.tsx src/blocks/SystemMaintenance/Component.tsx src/blocks/SystemComingSoon/Component.tsx src/app/'(frontend)'/SystemFallbackPage.tsx tests/int/system-page-rendering.int.spec.ts
git commit -m "refactor: split maintenance and soon views"
```

### Task 2: Move 404 to a dedicated view and delete the variant-based shared hero

**Files:**
- Create: `src/components/system-pages/System404View.tsx`
- Modify: `src/blocks/System404/Component.tsx`
- Modify: `src/app/(frontend)/SystemFallbackPage.tsx`
- Modify: `tests/int/system-page-rendering.int.spec.ts`
- Delete: `src/components/system-page-hero.tsx`

**Interfaces:**
- Consumes: `SystemPageShell`, `SystemPageActions`, `SystemPageViewProps`
- Produces: `System404View(props: SystemPageViewProps): JSX.Element`

- [ ] **Step 1: Extend the rendering spec to assert the dedicated 404 view instead of a hero variant**

```ts
expect(html).toContain('data-system-page-variant="notFound"')
expect(html).toContain('min-h-[100dvh]')
expect(html).toContain('text-center')
expect(html).toContain("We couldn&#x27;t find that page")
expect(notFoundHtml).toContain('Go to homepage')
expect(notFoundHtml).toContain('data-system-page-variant="notFound"')
```

- [ ] **Step 2: Run the focused rendering spec to verify it fails after removing `SystemPageHero` imports from the test’s mental model**

Run: `pnpm run test:int -- tests/int/system-page-rendering.int.spec.ts`
Expected: FAIL until the new 404 view exists and adapters use it.

- [ ] **Step 3: Create `System404View` and move the current centered 404 layout there**

```tsx
// src/components/system-pages/System404View.tsx
import { SystemPageActions } from '@/components/system-pages/primitives/SystemPageActions'
import { SystemPageShell } from '@/components/system-pages/primitives/SystemPageShell'
import type { SystemPageViewProps } from '@/components/system-pages/types'

export function System404View(props: SystemPageViewProps) {
  const statusValue = props.statusDisplay || '404'

  return (
    <SystemPageShell
      variant="notFound"
      className="relative min-h-[100dvh] overflow-hidden py-16 md:py-20"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/7 blur-3xl motion-safe:animate-[float_14s_ease-in-out_infinite] motion-reduce:animate-none" />
          <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/60" />
        </div>
      </div>
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-5">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-[fade-in_.7s_ease-out_both] select-none text-[clamp(4rem,15vw,7rem)] font-semibold leading-none text-foreground/10 motion-safe:animate-[float_14s_ease-in-out_infinite] motion-reduce:animate-none">
            {statusValue}
          </div>
          <h1 className="max-w-2xl animate-[fade-in_.7s_ease-out_.12s_both] text-balance text-[clamp(1.8rem,7vw,3.25rem)] font-semibold leading-[0.95] text-foreground">
            {props.heading}
          </h1>
          {props.description ? (
            <p className="max-w-2xl animate-[fade-in_.7s_ease-out_.2s_both] text-balance text-[clamp(1rem,1.6vw,1.125rem)] leading-7 text-muted-foreground">
              {props.description}
            </p>
          ) : null}
        </div>
        <SystemPageActions
          primaryAction={props.primaryAction}
          secondaryAction={props.secondaryAction}
        />
      </div>
    </SystemPageShell>
  )
}
```

- [ ] **Step 4: Update the 404 adapter and fallback to use the new view, then delete the old smart hero file**

```tsx
// src/blocks/System404/Component.tsx
import { resolveSystemPageAction } from '@/lib/systemPageActions'
import { System404View } from '@/components/system-pages/System404View'

export function System404BlockComponent(props: System404BlockData) {
  const primaryAction = resolveSystemPageAction(props.primaryAction)
  const secondaryAction = resolveSystemPageAction(props.secondaryAction)

  return (
    <System404View
      badge={props.badge}
      description={props.description}
      heading={props.heading}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      statusDisplay={props.badge || '404'}
      supportingNote={props.supportingNote}
    />
  )
}
```

```tsx
// src/app/(frontend)/SystemFallbackPage.tsx
import { System404View } from '@/components/system-pages/System404View'
```

```tsx
return (
  <System404View
    badge="404"
    heading="We couldn't find that page"
    description="It may have been moved, deleted, or the web address might be incorrect."
    primaryAction={{ label: 'Go to homepage', url: '/' }}
    statusDisplay="404"
  />
)
```

- [ ] **Step 5: Replace the old resolver location with a dedicated helper before deleting the hero file**

```ts
// src/lib/systemPageActions.ts
import { resolveCmsLink, type CmsLinkValue } from '@/lib/cmsLinks'
import type { SystemPageActionLink } from '@/components/system-pages/types'

type SystemPageActionValue = {
  label?: string | null
} & CmsLinkValue

export const resolveSystemPageAction = (
  value: SystemPageActionValue | null | undefined,
): SystemPageActionLink | null => {
  if (!value?.label) return null

  const resolved = resolveCmsLink(value)
  if (!resolved.href) return null

  return {
    label: value.label,
    openInNewTab: resolved.openInNewTab ?? null,
    url: resolved.href,
  }
}
```

- [ ] **Step 6: Run the focused specs and verify the hero file is no longer needed**

Run: `pnpm run test:int -- tests/int/system-page-rendering.int.spec.ts tests/int/system-page-blocks.int.spec.ts`
Expected: PASS with `src/components/system-page-hero.tsx` removed.

- [ ] **Step 7: Commit**

```bash
git add src/components/system-pages/System404View.tsx src/components/system-pages/primitives/SystemPageShell.tsx src/components/system-pages/primitives/SystemPageActions.tsx src/app/'(frontend)'/SystemFallbackPage.tsx src/blocks/System404/Component.tsx src/lib/systemPageActions.ts tests/int/system-page-rendering.int.spec.ts
git rm src/components/system-page-hero.tsx
git commit -m "refactor: separate system page views"
```

### Task 3: Split the shared field factory responsibilities and update schema tests

**Files:**
- Modify: `src/blocks/systemPageFields.ts`
- Modify: `src/blocks/System404/config.ts`
- Modify: `src/blocks/SystemMaintenance/config.ts`
- Modify: `src/blocks/SystemComingSoon/config.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`

**Interfaces:**
- Consumes: existing `SystemPageDefaults` content structure
- Produces: `createBaseSystemPageFields(defaults): Field[]`, `createSystemPageBlock({ slug, singularLabel, pluralLabel, fields }): Block`

- [ ] **Step 1: Add a failing schema assertion for the new factory shape**

```ts
it('keeps the block assembly thin and the field factory reusable', () => {
  expect(typeof createBaseSystemPageFields).toBe('function')
})
```

- [ ] **Step 2: Run the focused schema test to verify it fails**

Run: `pnpm run test:int -- tests/int/system-page-blocks.int.spec.ts`
Expected: FAIL because `createBaseSystemPageFields` is not exported yet.

- [ ] **Step 3: Split field creation from block assembly in `systemPageFields.ts`**

```ts
export const createBaseSystemPageFields = (defaults: SystemPageDefaults): Field[] => [
  {
    name: 'badge',
    type: 'text',
    defaultValue: defaults.badge,
  },
  {
    name: 'heading',
    type: 'text',
    required: true,
    defaultValue: defaults.heading,
  },
  {
    name: 'description',
    type: 'textarea',
    defaultValue: defaults.description,
  },
  {
    name: 'supportingNote',
    type: 'text',
  },
  {
    type: 'row',
    fields: [
      {
        name: 'primaryAction',
        type: 'group',
        admin: { width: '50%' },
        fields: actionFields,
      },
      {
        name: 'secondaryAction',
        type: 'group',
        admin: { width: '50%' },
        fields: actionFields,
      },
    ],
  },
]

export const createSystemPageBlock = ({
  fields,
  pluralLabel,
  singularLabel,
  slug,
}: {
  fields: Field[]
  pluralLabel: string
  singularLabel: string
  slug: string
}): Block => ({
  slug,
  interfaceName: `${slug.charAt(0).toUpperCase()}${slug.slice(1)}Block`,
  labels: {
    singular: singularLabel,
    plural: pluralLabel,
  },
  fields,
})
```

- [ ] **Step 4: Update the three config files to pass `fields: createBaseSystemPageFields(defaults)`**

```ts
// src/blocks/System404/config.ts
import { createBaseSystemPageFields, createSystemPageBlock } from '../systemPageFields'

const defaults = {
  badge: '404',
  heading: "We couldn't find that page",
  description: 'It may have been moved, deleted, or the web address might be incorrect.',
}

export const System404Block = createSystemPageBlock({
  fields: createBaseSystemPageFields(defaults),
  pluralLabel: 'System 404 Blocks',
  singularLabel: 'System 404',
  slug: 'system404',
})
```

- [ ] **Step 5: Run the focused schema and rendering specs to verify the refactor is behavior-preserving**

Run: `pnpm run test:int -- tests/int/system-page-blocks.int.spec.ts tests/int/system-page-rendering.int.spec.ts`
Expected: PASS with unchanged block defaults and rendering output.

- [ ] **Step 6: Commit**

```bash
git add src/blocks/systemPageFields.ts src/blocks/System404/config.ts src/blocks/SystemMaintenance/config.ts src/blocks/SystemComingSoon/config.ts tests/int/system-page-blocks.int.spec.ts tests/int/system-page-rendering.int.spec.ts
git commit -m "refactor: split system page field factory"
```

## Self-Review

- Spec coverage: this plan covers dedicated views, thin adapters, fallback alignment, primitive extraction, helper relocation, and field-factory separation.
- Placeholder scan: no `TODO`, `TBD`, or implicit “handle later” steps remain.
- Type consistency: adapters produce `SystemPageViewProps`, action links are shared through `SystemPageActionLink`, and the helper names are consistent across tasks.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-11-system-page-block-architecture-refactor.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
