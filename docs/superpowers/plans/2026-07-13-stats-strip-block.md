# Stats Strip Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable page-level `StatsStrip` block with a theme-driven inline stats layout, unlimited items, automatic wrapping at four items per row, mobile two-column behavior, and count-up animation on viewport entry.

**Architecture:** The block follows the existing Payload block pattern used by Announcement, HeroInstitutional, and FeatureSpotlight: a block config registered on `Pages`, a block thumbnail, and a renderer under `src/blocks`. Count-up behavior lives in a small client component colocated with the block so the main block renderer can stay deterministic in server markup while the animated value hydrates locally.

**Tech Stack:** Payload CMS 3, Next.js App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui theme tokens, Vitest, Testing Library

## Global Constraints

- One reusable `StatsStrip` page block
- Unlimited stats items
- Maximum four items per row
- Items split remaining space equally within each row
- Mobile defaults to two items per row
- Count-up animation runs on viewport entry
- Theme-token-driven colors, borders, spacing, and radius
- Use semantic tokens only
- `backgroundStyle` maps to `default`, `muted`, and `accent`
- If reduced motion is enabled, render final values immediately
- Prefix and suffix stay static; only the numeric `value` animates

---

### Task 1: Add the Payload block schema and register it on Pages

**Files:**

- Create: `src/blocks/StatsStrip/config.ts`
- Create: `src/blocks/StatsStrip/thumbnail.ts`
- Modify: `src/collections/Pages.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**

- Consumes: existing Payload `Block` patterns from `src/blocks/Announcement/config.ts` and `src/blocks/FeatureSpotlight/config.ts`
- Produces:
  - `export const StatsStripBlock: Block`
  - block slug `statsStrip`
  - block field names:
    - `items`
    - `backgroundStyle`
    - `animationEnabled`
    - `animationDuration`
    - `triggerOnce`

- [ ] **Step 1: Write the failing schema test**

Add a new assertion block to `tests/int/page-blocks.int.spec.ts`:

```ts
it('defines the statsStrip schema with metric items, background, and animation fields', async () => {
  const { StatsStripBlock } = await import('@/blocks/StatsStrip/config')

  const itemsField = StatsStripBlock.fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === 'items',
  ) as
    | { fields?: Array<{ name?: string; type?: string }>; minRows?: number; type?: string }
    | undefined

  const backgroundStyleField = StatsStripBlock.fields.find(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === 'backgroundStyle',
  ) as { defaultValue?: string; options?: Array<{ value: string }>; type?: string } | undefined

  const animationEnabledField = StatsStripBlock.fields.find(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === 'animationEnabled',
  ) as { defaultValue?: boolean; type?: string } | undefined

  const animationDurationField = StatsStripBlock.fields.find(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === 'animationDuration',
  ) as { defaultValue?: number; type?: string } | undefined

  const triggerOnceField = StatsStripBlock.fields.find(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === 'triggerOnce',
  ) as { defaultValue?: boolean; type?: string } | undefined

  expect(itemsField?.type).toBe('array')
  expect(itemsField?.minRows).toBe(1)
  expect(itemsField?.fields?.map((field) => field.name)).toEqual([
    'prefix',
    'value',
    'suffix',
    'label',
  ])
  expect(backgroundStyleField?.type).toBe('select')
  expect(backgroundStyleField?.defaultValue).toBe('default')
  expect(backgroundStyleField?.options?.map((option) => option.value)).toEqual([
    'default',
    'muted',
    'accent',
  ])
  expect(animationEnabledField?.type).toBe('checkbox')
  expect(animationEnabledField?.defaultValue).toBe(true)
  expect(animationDurationField?.type).toBe('number')
  expect(animationDurationField?.defaultValue).toBe(1200)
  expect(triggerOnceField?.type).toBe('checkbox')
  expect(triggerOnceField?.defaultValue).toBe(true)
})
```

Update the existing layout registration expectation in the same file:

```ts
expect(layoutField?.blocks?.map((block) => block.slug)).toEqual([
  'announcement',
  'heroInstitutional',
  'featureSpotlight',
  'statsStrip',
])
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts
```

Expected: FAIL with `Cannot find module '@/blocks/StatsStrip/config'` and the layout slug assertion still missing `statsStrip`.

- [ ] **Step 3: Write the block schema and register it**

Create `src/blocks/StatsStrip/config.ts`:

```ts
import type { ArrayField, Block, CheckboxField, NumberField, SelectField } from 'payload'

import { statsStripThumbnail } from './thumbnail'

const itemsField = {
  name: 'items',
  type: 'array',
  minRows: 1,
  fields: [
    { name: 'prefix', type: 'text' },
    { name: 'value', type: 'number', required: true },
    { name: 'suffix', type: 'text' },
    { name: 'label', type: 'text', required: true },
  ],
} satisfies ArrayField

export const StatsStripBlock: Block = {
  slug: 'statsStrip',
  interfaceName: 'StatsStripBlock',
  admin: {
    images: {
      thumbnail: {
        alt: 'Stats strip block preview',
        url: statsStripThumbnail,
      },
    },
  },
  labels: {
    singular: 'Stats Strip',
    plural: 'Stats Strips',
  },
  fields: [
    itemsField,
    {
      name: 'backgroundStyle',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Muted', value: 'muted' },
        { label: 'Accent', value: 'accent' },
      ],
      required: true,
    } satisfies SelectField,
    {
      name: 'animationEnabled',
      type: 'checkbox',
      defaultValue: true,
    } satisfies CheckboxField,
    {
      name: 'animationDuration',
      type: 'number',
      defaultValue: 1200,
      required: true,
    } satisfies NumberField,
    {
      name: 'triggerOnce',
      type: 'checkbox',
      defaultValue: true,
    } satisfies CheckboxField,
  ],
}
```

Create `src/blocks/StatsStrip/thumbnail.ts`:

```ts
export const statsStripThumbnail =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" fill="none"><rect width="640" height="360" rx="24" fill="%23141418"/><rect x="54" y="96" width="128" height="168" rx="0" fill="%23F5F5F6"/><rect x="182" y="96" width="1" height="168" fill="%23353A45"/><rect x="183" y="96" width="128" height="168" fill="%23F5F5F6"/><rect x="311" y="96" width="1" height="168" fill="%23353A45"/><rect x="312" y="96" width="128" height="168" fill="%23F5F5F6"/><rect x="440" y="96" width="1" height="168" fill="%23353A45"/><rect x="441" y="96" width="145" height="168" fill="%23F5F5F6"/><rect x="77" y="132" width="68" height="22" rx="4" fill="%231B2B59"/><rect x="77" y="174" width="92" height="10" rx="5" fill="%236B7280"/></svg>'
```

Update `src/collections/Pages.ts` imports and layout block registration:

```ts
import { StatsStripBlock } from '@/blocks/StatsStrip/config'

// ...

blocks: [AnnouncementBlock, HeroInstitutionalBlock, FeatureSpotlightBlock, StatsStripBlock],
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts
```

Expected: PASS for the layout registration and `statsStrip` schema checks.

- [ ] **Step 5: Commit**

```bash
git add src/blocks/StatsStrip/config.ts src/blocks/StatsStrip/thumbnail.ts src/collections/Pages.ts tests/int/page-blocks.int.spec.ts
git commit -m "feat: add stats strip block schema"
```

### Task 2: Build the stats strip renderer and the animated value primitive

**Files:**

- Create: `src/blocks/StatsStrip/AnimatedMetricValue.tsx`
- Create: `src/blocks/StatsStrip/Component.tsx`
- Create: `tests/int/stats-strip-render.int.spec.ts`

**Interfaces:**

- Consumes:
  - `StatsStripBlock` field contract from Task 1
  - `cn` from `@/lib/utils`
- Produces:
  - `export function AnimatedMetricValue(props: AnimatedMetricValueProps): JSX.Element`
  - `export function StatsStripBlockComponent(props: StatsStripBlockLike): JSX.Element | null`
  - `type StatsStripItem = { label?: string | null; prefix?: string | null; suffix?: string | null; value?: number | null }`

- [ ] **Step 1: Write the failing renderer and animation tests**

Create `tests/int/stats-strip-render.int.spec.ts`:

```ts
import { act, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnimatedMetricValue } from '@/blocks/StatsStrip/AnimatedMetricValue'
import { StatsStripBlockComponent } from '@/blocks/StatsStrip/Component'

describe('stats strip block', () => {
  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    cleanup()
  })

  it('renders four items in the first row and wraps remaining items', () => {
    const html = renderToStaticMarkup(
      createElement(StatsStripBlockComponent, {
        backgroundStyle: 'accent',
        items: [
          { label: 'Years of training physicians', value: 112 },
          { label: 'Student-to-faculty ratio', suffix: ':1', value: 9 },
          { label: 'Annual research funding', prefix: '$', suffix: 'M', value: 186 },
          { label: 'Residency match rate', suffix: '%', value: 96 },
          { label: 'Clinical sites', value: 14 },
        ],
      }),
    )

    expect(html).toContain('data-stats-strip-background="accent"')
    expect(html).toContain('data-stats-strip-row="0"')
    expect(html).toContain('data-stats-strip-row="1"')
    expect(html).toContain('data-stats-strip-row-size="4"')
    expect(html).toContain('data-stats-strip-row-size="1"')
    expect(html).toContain('Years of training physicians')
    expect(html).toContain('Student-to-faculty ratio')
  })

  it('animates only the numeric value and preserves prefix and suffix', () => {
    const observerCallback = vi.fn()
    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback.mockImplementation(() =>
          callback([{ isIntersecting: true }] as IntersectionObserverEntry[], this as never),
        )
      }
      disconnect() {}
      observe() {
        observerCallback()
      }
      unobserve() {}
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver as never)
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      }),
    )

    render(
      createElement(AnimatedMetricValue, {
        durationMs: 1200,
        prefix: '$',
        suffix: 'M',
        triggerOnce: true,
        value: 186,
      }),
    )

    expect(screen.getByTestId('stats-strip-value').textContent).toBe('$0M')

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(screen.getByTestId('stats-strip-value').textContent).toBe('$186M')
  })

  it('renders the final value immediately when reduced motion is enabled', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: true,
        removeEventListener: vi.fn(),
      }),
    )

    render(
      createElement(AnimatedMetricValue, {
        durationMs: 1200,
        suffix: '%',
        triggerOnce: true,
        value: 96,
      }),
    )

    expect(screen.getByTestId('stats-strip-value').textContent).toBe('96%')
  })
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/stats-strip-render.int.spec.ts
```

Expected: FAIL with `Cannot find module '@/blocks/StatsStrip/Component'`.

- [ ] **Step 3: Write the animated value primitive and block renderer**

Create `src/blocks/StatsStrip/AnimatedMetricValue.tsx`:

```tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type AnimatedMetricValueProps = {
  durationMs?: number | null
  prefix?: string | null
  suffix?: string | null
  triggerOnce?: boolean | null
  value: number
}

export function AnimatedMetricValue({
  durationMs = 1200,
  prefix,
  suffix,
  triggerOnce = true,
  value,
}: AnimatedMetricValueProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const rootRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setPrefersReducedMotion(mediaQuery.matches)
    sync()
    mediaQuery.addEventListener('change', sync)
    return () => mediaQuery.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value)
      return
    }

    const node = rootRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasStarted(true)
          if (triggerOnce) observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [prefersReducedMotion, triggerOnce, value])

  useEffect(() => {
    if (!hasStarted || prefersReducedMotion) return

    const stepMs = 16
    const totalSteps = Math.max(1, Math.ceil(durationMs / stepMs))
    let currentStep = 0

    const interval = window.setInterval(() => {
      currentStep += 1
      const progress = Math.min(currentStep / totalSteps, 1)
      setDisplayValue(Math.round(value * progress))

      if (progress >= 1) {
        window.clearInterval(interval)
      }
    }, stepMs)

    return () => window.clearInterval(interval)
  }, [durationMs, hasStarted, prefersReducedMotion, value])

  const text = useMemo(
    () => `${prefix ?? ''}${displayValue}${suffix ?? ''}`,
    [displayValue, prefix, suffix],
  )

  return (
    <span ref={rootRef} data-testid="stats-strip-value">
      {text}
    </span>
  )
}
```

Create `src/blocks/StatsStrip/Component.tsx`:

```tsx
import { cn } from '@/lib/utils'

import { AnimatedMetricValue } from './AnimatedMetricValue'

type StatsStripItem = {
  label?: string | null
  prefix?: string | null
  suffix?: string | null
  value?: number | null
}

type StatsStripBlockLike = {
  animationDuration?: number | null
  animationEnabled?: boolean | null
  backgroundStyle?: 'accent' | 'default' | 'muted' | null
  items?: StatsStripItem[] | null
  triggerOnce?: boolean | null
}

const backgroundClasses = {
  default: 'bg-background text-foreground',
  muted: 'bg-muted text-foreground',
  accent: 'bg-accent text-accent-foreground',
} as const

const chunkItems = (items: StatsStripItem[]) => {
  const rows: StatsStripItem[][] = []
  for (let index = 0; index < items.length; index += 4) {
    rows.push(items.slice(index, index + 4))
  }
  return rows
}

export function StatsStripBlockComponent({
  animationDuration = 1200,
  animationEnabled = true,
  backgroundStyle = 'default',
  items,
  triggerOnce = true,
}: StatsStripBlockLike) {
  const validItems = (items ?? []).filter(
    (item): item is Required<Pick<StatsStripItem, 'label' | 'value'>> & StatsStripItem =>
      typeof item?.value === 'number' && Boolean(item.label?.trim()),
  )

  if (!validItems.length) return null

  const rows = chunkItems(validItems)

  return (
    <section
      className={cn('border-b border-border', backgroundClasses[backgroundStyle ?? 'default'])}
      data-stats-strip-background={backgroundStyle ?? 'default'}
    >
      <div className="mx-auto flex max-w-screen-2xl flex-col px-4">
        {rows.map((row, rowIndex) => (
          <div
            key={`stats-strip-row-${rowIndex}`}
            className={cn(
              'grid grid-cols-2',
              row.length === 1 && 'md:grid-cols-1',
              row.length === 2 && 'md:grid-cols-2',
              row.length === 3 && 'md:grid-cols-3',
              row.length === 4 && 'md:grid-cols-4',
            )}
            data-stats-strip-row={rowIndex}
            data-stats-strip-row-size={row.length}
          >
            {row.map((item, itemIndex) => (
              <article
                key={`${item.label}-${rowIndex}-${itemIndex}`}
                className={cn(
                  'flex min-h-40 flex-col justify-center gap-3 px-6 py-8',
                  'border-b border-border md:border-b-0',
                  itemIndex < row.length - 1 && 'md:border-r',
                  row.length % 2 === 1 &&
                    itemIndex === row.length - 1 &&
                    'col-span-2 md:col-span-1',
                )}
              >
                <p className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                  {animationEnabled ? (
                    <AnimatedMetricValue
                      durationMs={animationDuration}
                      prefix={item.prefix}
                      suffix={item.suffix}
                      triggerOnce={triggerOnce}
                      value={item.value}
                    />
                  ) : (
                    `${item.prefix ?? ''}${item.value}${item.suffix ?? ''}`
                  )}
                </p>
                <p className="font-mono text-xs uppercase tracking-[0.24em] opacity-70">
                  {item.label}
                </p>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/stats-strip-render.int.spec.ts
```

Expected: PASS for both static rendering and animated value behavior.

- [ ] **Step 5: Commit**

```bash
git add src/blocks/StatsStrip/AnimatedMetricValue.tsx src/blocks/StatsStrip/Component.tsx tests/int/stats-strip-render.int.spec.ts
git commit -m "feat: add stats strip renderer"
```

### Task 3: Wire the block into page rendering, regenerate types, and verify the full block pipeline

**Files:**

- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `src/payload-types.ts`

**Interfaces:**

- Consumes:
  - `StatsStripBlockComponent` from Task 2
  - `StatsStripBlock` registration from Task 1
- Produces:
  - `renderPageBlocks` support for `blockType === 'statsStrip'`
  - generated Payload type support for `Page['layout'][number]['blockType'] === 'statsStrip'`

- [ ] **Step 1: Write the failing page-render integration assertion**

Extend `tests/int/page-blocks.int.spec.ts` with a page-content rendering test:

```ts
it('renders a statsStrip page block through PageContent', () => {
  const result = PageContent({
    page: {
      id: 'page-stats-1',
      layout: [
        {
          animationDuration: 1200,
          animationEnabled: true,
          backgroundStyle: 'accent',
          blockType: 'statsStrip',
          items: [
            { label: 'Years of training physicians', value: 112 },
            { label: 'Student-to-faculty ratio', suffix: ':1', value: 9 },
            { label: 'Annual research funding', prefix: '$', suffix: 'M', value: 186 },
            { label: 'Residency match rate', suffix: '%', value: 96 },
          ],
          triggerOnce: true,
        },
      ],
      slug: 'institutional-metrics',
      title: 'Institutional Metrics',
    } as never,
  })

  const html = renderToStaticMarkup(result)

  expect(html).toContain('data-stats-strip-background="accent"')
  expect(html).toContain('Years of training physicians')
  expect(html).toContain('Residency match rate')
})
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/stats-strip-render.int.spec.ts
```

Expected: FAIL because `renderPageBlocks` does not yet handle `statsStrip`.

- [ ] **Step 3: Wire rendering and regenerate types**

Update `src/blocks/renderPageBlocks.tsx`:

```tsx
import { StatsStripBlockComponent } from './StatsStrip/Component'

// ...

          case 'statsStrip':
            return (
              <StatsStripBlockComponent
                key={block.id ?? `${block.blockType}-${index}`}
                {...block}
              />
            )
```

Regenerate Payload types:

```bash
npm run generate:types
```

Expected `src/payload-types.ts` changes:

```ts
export interface StatsStripBlock {
  items: {
    prefix?: string | null
    value: number
    suffix?: string | null
    label: string
    id?: string | null
  }[]
  backgroundStyle?: ('default' | 'muted' | 'accent') | null
  animationEnabled?: boolean | null
  animationDuration?: number | null
  triggerOnce?: boolean | null
  id?: string | null
  blockName?: string | null
  blockType: 'statsStrip'
}
```

- [ ] **Step 4: Run the full focused verification**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/stats-strip-render.int.spec.ts
./node_modules/.bin/tsc --noEmit
```

Expected:

- PASS for the page block pipeline tests
- PASS for the stats strip renderer tests
- PASS for TypeScript typecheck

- [ ] **Step 5: Commit**

```bash
git add src/blocks/renderPageBlocks.tsx src/payload-types.ts tests/int/page-blocks.int.spec.ts
git commit -m "feat: wire stats strip page block"
```
