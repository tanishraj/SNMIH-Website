# Icon Grid Ruled Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive `Ruled Columns` presentation to Icon Grid that reproduces the approved open, divided layout while preserving every existing Icon Grid presentation and saved value.

**Architecture:** Extend the existing Icon Grid `variant` select with stored value `ruled`, then route that value to a dedicated `RuledItem` renderer inside the existing block component. Resolve icon, text, divider, link, button, and focus colors from the section surface; use breakpoint-specific static Tailwind selector maps for divider geometry; keep all block registries and data fields unchanged.

**Tech Stack:** Payload CMS 3, TypeScript, React 19, Next.js 16, Tailwind CSS 4, Lucide React, Vitest

## Global Constraints

- Keep the block slug `iconGrid`, the field name `variant`, and the existing default `card`.
- Keep the existing stored variants `card`, `contactCards`, `minimal`, and `iconTop` unchanged; append `ruled`.
- Reuse the existing columns, icon style, content alignment, appearance, action, link, and item fields.
- Do not add a migration, dependency, block registration, renderer registration, or new content field.
- Ignore per-item `cardBackground` only while `variant="ruled"`; keep the stored value available when editors switch presentations.
- Resolve Ruled Columns colors from `resolveCardSurface('default', sectionBackground)`.
- Preserve one mobile column, two columns from `sm`, and the configured 2/3/4 columns at the existing desktop breakpoint (`lg` for 3 and 4).
- Keep the full-item anchor contract for Link mode and the article-with-linked-button contract for Button mode; never nest anchors.
- Preserve filtering of blank titles, null rendering for no valid items, missing-icon omission, stale-icon `Star` fallback, and stale-variant Card fallback.
- Keep Card, Contact Cards, Minimal, and Icon Top markup and styling unchanged except for type-compatible helper signatures shared with the new renderer.
- Do not modify `src/styles/themes/theme-snmih.css` or any unrelated block.

---

### Task 1: Extend the Payload editor and generated type contract

**Files:**

- Create: `tests/int/icon-grid-ruled-columns.int.spec.tsx`
- Modify: `src/blocks/IconGrid/config.ts:46-66,202-216`
- Modify through generation: `src/payload-types.ts:3517`

**Interfaces:**

- Consumes: the existing Icon Grid `variant` select and `iconGridCardBackgroundField` factory.
- Produces: a `Ruled Columns` editor choice stored as `ruled`.
- Produces: `IconGridBlock['variant']` union support for `ruled`.
- Preserves: `card` as the default and all four existing option labels/values.

- [ ] **Step 1: Add the focused schema and generated-contract tests**

Create `tests/int/icon-grid-ruled-columns.int.spec.tsx` with the schema helpers and initial tests below:

```tsx
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { IconGridBlock } from '@/blocks/IconGrid/config'

const findField = (fields: unknown[], name: string): Record<string, unknown> | undefined => {
  for (const field of fields) {
    if (!field || typeof field !== 'object') continue
    if ('name' in field && field.name === name) return field as Record<string, unknown>

    if ('fields' in field && Array.isArray(field.fields)) {
      const nested = findField(field.fields, name)
      if (nested) return nested
    }

    if ('tabs' in field && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        if (tab && typeof tab === 'object' && 'fields' in tab && Array.isArray(tab.fields)) {
          const nested = findField(tab.fields, name)
          if (nested) return nested
        }
      }
    }
  }

  return undefined
}

const payloadTypesSource = readFileSync('src/payload-types.ts', 'utf8')

describe('Icon Grid Ruled Columns', () => {
  it('exposes Ruled Columns without changing existing presentation values or the default', () => {
    const variantField = findField(IconGridBlock.fields, 'variant')

    expect(variantField).toMatchObject({
      defaultValue: 'card',
      label: 'Card Style',
      name: 'variant',
      type: 'select',
    })
    expect(variantField?.options).toEqual([
      { label: 'Card (bordered box)', value: 'card' },
      { label: 'Contact Cards', value: 'contactCards' },
      { label: 'Minimal (icon + text, no box)', value: 'minimal' },
      { label: 'Icon Top (centered icon above title)', value: 'iconTop' },
      { label: 'Ruled Columns', value: 'ruled' },
    ])
  })

  it('explains which presentations ignore per-item backgrounds', () => {
    const cardBackgroundField = findField(IconGridBlock.fields, 'cardBackground')

    expect(cardBackgroundField).toMatchObject({
      admin: {
        description:
          'Applied to the Card and Contact Cards presentations. Match Section inherits the section surface; Minimal, Icon Top, and Ruled Columns inherit the section surface.',
      },
    })
  })

  it('includes ruled in the generated Payload contract', () => {
    expect(payloadTypesSource).toContain(
      "variant?: ('card' | 'contactCards' | 'minimal' | 'iconTop' | 'ruled') | null;",
    )
  })
})
```

- [ ] **Step 2: Run the focused tests and verify the contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-grid-ruled-columns.int.spec.tsx
```

Expected: FAIL because the config has no `ruled` option, its background help text does not mention Ruled Columns, and generated types do not accept `ruled`.

- [ ] **Step 3: Append the new select option and clarify background behavior**

In `src/blocks/IconGrid/config.ts`, replace the background field description with:

```ts
description:
  'Applied to the Card and Contact Cards presentations. Match Section inherits the section surface; Minimal, Icon Top, and Ruled Columns inherit the section surface.',
```

Append this option after `iconTop` in the `variant` field without changing the existing options or default:

```ts
{ label: 'Ruled Columns', value: 'ruled' },
```

- [ ] **Step 4: Verify the hand-authored schema before type generation**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-grid-ruled-columns.int.spec.tsx -t "exposes|explains"
```

Expected: both schema tests PASS. The generated-contract test is intentionally deferred until the next step.

- [ ] **Step 5: Regenerate Payload types and verify the exact union**

Run:

```bash
pnpm generate:types
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-grid-ruled-columns.int.spec.tsx
git diff -- src/payload-types.ts
```

Expected: all focused tests PASS and the relevant generated diff changes only the Icon Grid union to:

```ts
variant?: ('card' | 'contactCards' | 'minimal' | 'iconTop' | 'ruled') | null;
```

- [ ] **Step 6: Run task-level static checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/IconGrid/config.ts tests/int/icon-grid-ruled-columns.int.spec.tsx
pnpm exec prettier --check src/blocks/IconGrid/config.ts tests/int/icon-grid-ruled-columns.int.spec.tsx src/payload-types.ts
```

Expected: all commands exit with code 0.

- [ ] **Step 7: Commit the editor and generated contract**

```bash
git add src/blocks/IconGrid/config.ts src/payload-types.ts tests/int/icon-grid-ruled-columns.int.spec.tsx
git commit -m "feat(icon-grid): add ruled presentation"
```

---

### Task 2: Render section-aware ruled items and responsive dividers

**Files:**

- Modify: `tests/int/icon-grid-ruled-columns.int.spec.tsx`
- Modify: `src/blocks/IconGrid/Component.tsx:20-579`
- Verify unchanged: `src/blocks/shared/cardSurface.ts`
- Verify unchanged: `src/styles/themes/theme-snmih.css`

**Interfaces:**

- Consumes: `IconGridBlockLike`, `resolveHref`, `IconContainer`, `CardAction`, `resolveCardSurface`, `columnClasses`, and existing section appearance resolution.
- Produces: direct grid children marked `data-icon-grid-presentation="ruled"` and a wrapper marked `data-icon-grid-grid="ruled"`.
- Produces: literal Tailwind class maps for 2, 3, and 4-column divider geometry.
- Preserves: all existing variants' rendering branches and action semantics.

- [ ] **Step 1: Add failing visual, divider, and background tests**

Add these imports to `tests/int/icon-grid-ruled-columns.int.spec.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server'

import { IconGridBlockComponent } from '@/blocks/IconGrid/Component'
```

Add these tests within the existing `describe`:

```tsx
it.each([
  ['2', 'sm:grid-cols-2 sm:[&>*:nth-child(-n+2)]:border-t-0 sm:[&>*:nth-child(2n)]:border-l'],
  [
    '3',
    'sm:grid-cols-2 sm:[&>*:nth-child(-n+2)]:border-t-0 sm:[&>*:nth-child(2n)]:border-l lg:grid-cols-3 lg:[&>*:nth-child(-n+3)]:border-t-0 lg:[&>*:nth-child(3n+1)]:border-l-0 lg:[&>*:nth-child(3n+2)]:border-l lg:[&>*:nth-child(3n)]:border-l',
  ],
  [
    '4',
    'sm:grid-cols-2 sm:[&>*:nth-child(-n+2)]:border-t-0 sm:[&>*:nth-child(2n)]:border-l lg:grid-cols-4 lg:[&>*:nth-child(-n+4)]:border-t-0 lg:[&>*:nth-child(4n+1)]:border-l-0 lg:[&>*:nth-child(4n+2)]:border-l lg:[&>*:nth-child(4n+3)]:border-l lg:[&>*:nth-child(4n)]:border-l',
  ],
] as const)('renders clean responsive divider geometry for %s columns', (columns, classes) => {
  const html = renderToStaticMarkup(
    <IconGridBlockComponent
      columns={columns}
      items={[
        { title: 'Education' },
        { title: 'Healthcare' },
        { title: 'Community' },
        { title: 'Research' },
        { title: 'Service' },
      ]}
      variant="ruled"
    />,
  )

  expect(html).toContain('data-icon-grid-grid="ruled"')
  expect(html).toContain(
    'grid grid-cols-1 gap-0 border-y [&amp;&gt;*]:border-t [&amp;&gt;*:first-child]:border-t-0',
  )
  for (const className of classes.split(' ')) {
    expect(html).toContain(className.replaceAll('&', '&amp;').replaceAll('>', '&gt;'))
  }
  expect(html.match(/data-icon-grid-presentation="ruled"/g)).toHaveLength(5)
})

it('inherits the section surface and ignores per-item card backgrounds', () => {
  const html = renderToStaticMarkup(
    <IconGridBlockComponent
      appearance={{ background: 'brand' }}
      iconStyle="outline"
      items={[
        {
          cardBackground: 'gradient-brand',
          description: 'Build strong academic foundations.',
          icon: 'GraduationCap',
          title: 'Education',
        },
      ]}
      variant="ruled"
    />,
  )

  expect(html).toContain('data-icon-grid-presentation="ruled"')
  expect(html).toContain('font-[family-name:var(--font-display)]')
  expect(html).toContain('border-current/15')
  expect(html).toContain('text-current/70')
  expect(html).toContain('rounded-lg border')
  expect(html).not.toContain('data-card-background')
  expect(html).not.toContain('bg-card-gradient-brand')
  expect(html).not.toContain('rounded-xl')
  expect(html).not.toContain('shadow-sm')
})
```

The escape normalization matches the installed React static renderer, which serializes `&` as
`&amp;` and `>` as `&gt;` inside the class attribute.

- [ ] **Step 2: Run the visual tests and verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-grid-ruled-columns.int.spec.tsx -t "divider geometry|inherits the section surface"
```

Expected: FAIL because `ruled` currently follows the existing Card fallback path.

- [ ] **Step 3: Extend the component input and shared helper surface types**

In `src/blocks/IconGrid/Component.tsx`, add `ruled` to the local compatibility type:

```ts
variant?: 'card' | 'contactCards' | 'minimal' | 'iconTop' | 'ruled' | null
```

Broaden only the helper input types so both `iconGridCardSurfaces` and `resolveCardSurface` results are accepted:

```ts
surface?: Pick<CardSurfaceClasses, 'button' | 'link'>
```

for `CardAction`, and:

```ts
surface?: Pick<CardSurfaceClasses, 'divider' | 'icon'>
```

for `IconContainer`. Update its signature and class composition exactly as follows:

```tsx
function IconContainer({
  icon,
  iconStyle,
  inheritOutlineBorder = false,
  surface,
}: {
  icon: string
  iconStyle: keyof typeof iconContainerClasses
  inheritOutlineBorder?: boolean
  surface?: Pick<CardSurfaceClasses, 'divider' | 'icon'>
}) {
  const Icon = ((LucideIcons as Record<string, unknown>)[icon] as LucideIcon | undefined) ?? Star
  return (
    <div
      className={cn(
        iconContainerClasses[iconStyle],
        surface?.icon,
        inheritOutlineBorder && iconStyle === 'outline' && surface?.divider,
      )}
    >
      <Icon className="size-5" />
    </div>
  )
}
```

Existing callers omit the flag, so their markup remains unchanged; `RuledItem` opts in so
Outline icons use a border that remains visible on brand sections.

- [ ] **Step 4: Add literal responsive divider maps**

Place this map next to `columnClasses` so Tailwind can discover every class statically:

```ts
const ruledColumnClasses: Record<NonNullable<IconGridBlockLike['columns']>, string> = {
  '2': 'sm:grid-cols-2 sm:[&>*:nth-child(-n+2)]:border-t-0 sm:[&>*:nth-child(2n)]:border-l',
  '3': 'sm:grid-cols-2 sm:[&>*:nth-child(-n+2)]:border-t-0 sm:[&>*:nth-child(2n)]:border-l lg:grid-cols-3 lg:[&>*:nth-child(-n+3)]:border-t-0 lg:[&>*:nth-child(3n+1)]:border-l-0 lg:[&>*:nth-child(3n+2)]:border-l lg:[&>*:nth-child(3n)]:border-l',
  '4': 'sm:grid-cols-2 sm:[&>*:nth-child(-n+2)]:border-t-0 sm:[&>*:nth-child(2n)]:border-l lg:grid-cols-4 lg:[&>*:nth-child(-n+4)]:border-t-0 lg:[&>*:nth-child(4n+1)]:border-l-0 lg:[&>*:nth-child(4n+2)]:border-l lg:[&>*:nth-child(4n+3)]:border-l lg:[&>*:nth-child(4n)]:border-l',
}
```

The grid wrapper will supply one full-width top and bottom border. Direct children supply a top border only after the first active row and a left border only between active columns, so incomplete final rows remain clean.

- [ ] **Step 5: Implement `RuledItem` with safe link semantics**

Add this renderer after `IconTopItem`:

```tsx
function RuledItem({
  actionLabel,
  actionMode,
  actionVariant,
  iconStyle,
  item,
  surface,
}: {
  actionLabel: string
  actionMode: 'button' | 'link'
  actionVariant: CmsActionVariant
  iconStyle: keyof typeof iconContainerClasses
  item: IconGridItem
  surface: CardSurfaceClasses
}) {
  const link = resolveHref(item)
  const content = (
    <>
      {item.icon ? (
        <IconContainer
          icon={item.icon}
          iconStyle={iconStyle}
          inheritOutlineBorder
          surface={surface}
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-3">
        <h3 className="font-[family-name:var(--font-display)] text-2xl leading-tight font-semibold tracking-tight">
          {item.title?.trim()}
        </h3>
        {item.description?.trim() ? (
          <p className={cn('text-base leading-7 whitespace-pre-line', surface.secondary)}>
            {item.description.trim()}
          </p>
        ) : null}
      </div>
      {link ? (
        <CardAction
          actionLabel={actionLabel}
          actionMode={actionMode}
          actionVariant={actionVariant}
          link={link}
          surface={surface}
        />
      ) : null}
    </>
  )
  const itemClasses = cn(
    'group flex h-full min-w-0 flex-col gap-6 px-6 py-8 sm:p-8 lg:p-10',
    surface.divider,
  )

  if (link && actionMode === 'link') {
    return (
      <a
        className={cn(
          itemClasses,
          'focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none',
        )}
        data-icon-grid-presentation="ruled"
        href={link.href}
        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
        target={link.openInNewTab ? '_blank' : undefined}
      >
        {content}
      </a>
    )
  }

  return (
    <article className={itemClasses} data-icon-grid-presentation="ruled">
      {content}
    </article>
  )
}
```

The `CardAction` Link branch stays non-anchor markup inside the full-item anchor. Its Button branch remains the single nested destination link inside an article.

- [ ] **Step 6: Route `ruled` through the existing block component**

After resolving `sectionBackground`, resolve the ruled surface once:

```ts
const ruledSurface = resolveCardSurface('default', sectionBackground)
```

Replace the grid wrapper's current fixed `gap-6`/column class composition with:

```tsx
<div
  className={cn(
    'grid grid-cols-1',
    resolvedVariant === 'ruled'
      ? cn(
          'gap-0 border-y [&>*]:border-t [&>*:first-child]:border-t-0',
          ruledColumnClasses[resolvedColumns],
          ruledSurface.divider,
        )
      : cn('gap-6', columnClasses[resolvedColumns]),
  )}
  data-icon-grid-grid={resolvedVariant === 'ruled' ? 'ruled' : undefined}
>
```

Inside the existing `validItems.map`, add this branch after `iconTop` and before the Card fallback:

```tsx
if (resolvedVariant === 'ruled') {
  return <RuledItem key={index} {...itemProps} surface={ruledSurface} />
}
```

Keep `resolvedVariant = variant ?? 'card'` and the final Card branch unchanged. Therefore an unknown runtime variant still misses all named branches and falls back to Card.

- [ ] **Step 7: Add failing action and normalization coverage**

Add these tests to `tests/int/icon-grid-ruled-columns.int.spec.tsx`:

```tsx
it('keeps Link mode as one full-item anchor with safe new-tab attributes', () => {
  const html = renderToStaticMarkup(
    <IconGridBlockComponent
      actionMode="link"
      itemActionLabel="Learn more"
      items={[
        {
          linkType: 'custom',
          openInNewTab: true,
          title: 'Education',
          url: 'https://example.edu/education',
        },
      ]}
      variant="ruled"
    />,
  )

  expect(html.match(/<a\b/g)).toHaveLength(1)
  expect(html).toContain('href="https://example.edu/education"')
  expect(html).toContain('target="_blank"')
  expect(html).toContain('rel="noopener noreferrer"')
  expect(html).toContain('Learn more')
  expect(html).toContain('focus-visible:ring-2')
})

it('keeps Button mode as an article containing one linked shared button', () => {
  const html = renderToStaticMarkup(
    <IconGridBlockComponent
      actionMode="button"
      actionVariant="outline"
      itemActionLabel="Explore"
      items={[{ linkType: 'custom', title: 'Healthcare', url: '/healthcare' }]}
      variant="ruled"
    />,
  )

  expect(html).toContain('<article')
  expect(html.match(/<a\b/g)).toHaveLength(1)
  expect(html).toContain('href="/healthcare"')
  expect(html).toContain('Explore')
  expect(html).toContain('data-slot="button"')
})

it('omits missing icons, keeps the stale-icon fallback, filters blank titles, and handles empty data', () => {
  const html = renderToStaticMarkup(
    <IconGridBlockComponent
      items={[
        { icon: null, title: 'Education' },
        { icon: 'RemovedIconName', title: 'Healthcare' },
        { icon: 'Hospital', title: '   ' },
      ]}
      variant="ruled"
    />,
  )

  expect(html.match(/data-icon-grid-presentation="ruled"/g)).toHaveLength(2)
  expect(html.match(/<svg\b/g)).toHaveLength(1)
  expect(html).not.toContain('Hospital')
  expect(
    renderToStaticMarkup(<IconGridBlockComponent items={[{ title: '   ' }]} variant="ruled" />),
  ).toBe('')
})

it('continues to send a stale presentation through the Card fallback', () => {
  const html = renderToStaticMarkup(
    <IconGridBlockComponent
      items={[{ cardBackground: 'primary', title: 'Fallback card' }]}
      variant={'removed-presentation' as never}
    />,
  )

  expect(html).toContain('data-card-background="primary"')
  expect(html).not.toContain('data-icon-grid-presentation="ruled"')
})
```

- [ ] **Step 8: Run focused and adjacent renderer tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-grid-ruled-columns.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/button-primary-variant.int.spec.tsx
```

Expected: all tests PASS. If `data-slot="button"` differs in the installed shared Button implementation, assert its existing stable button marker and visible class contract instead; do not change the Button component.

- [ ] **Step 9: Run implementation static checks and inspect the theme boundary**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/IconGrid/Component.tsx tests/int/icon-grid-ruled-columns.int.spec.tsx
pnpm exec prettier --check src/blocks/IconGrid/Component.tsx tests/int/icon-grid-ruled-columns.int.spec.tsx
git diff -- src/blocks/IconGrid/Component.tsx src/styles/themes/theme-snmih.css
git diff --check
```

Expected: all checks pass; the component diff is scoped to the ruled presentation and compatible helper types; `theme-snmih.css` has no diff.

- [ ] **Step 10: Commit the renderer and contracts**

```bash
git add src/blocks/IconGrid/Component.tsx tests/int/icon-grid-ruled-columns.int.spec.tsx
git commit -m "feat(icon-grid): render ruled columns"
```

---

### Task 3: Demonstrate and document the new presentation

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx:1629-1679`
- Regenerate: `public/block-thumbnails/icon-grid.jpg`
- Modify: `docs/guides/blocks.md:61`
- Modify through generation: `.agents/skills/project-context/references/project-inventory.json`
- Review, normally unchanged: `.agents/skills/project-context/references/block-system.md`
- Verify unchanged: `src/features/feature-inventory.ts`

**Interfaces:**

- Consumes: the production Icon Grid component and Admin thumbnail definition already registered for `iconGrid`.
- Produces: an Admin picker preview of the Ruled Columns presentation.
- Produces: an operator-guide description of the new presentation and background behavior.
- Produces: a current deterministic project inventory after all source/test/doc changes.

- [ ] **Step 1: Add a failing thumbnail/documentation contract**

Add this constant below `payloadTypesSource` in `tests/int/icon-grid-ruled-columns.int.spec.tsx`:

```tsx
const blocksGuideSource = readFileSync('docs/guides/blocks.md', 'utf8')
const thumbnailFixtureSource = readFileSync('src/block-thumbnails/fixtures.tsx', 'utf8')
```

Add this test inside the existing `describe`:

```tsx
it('documents and demonstrates Ruled Columns', () => {
  expect(blocksGuideSource).toMatch(/\| Icon Grid\s+\|/)
  expect(blocksGuideSource).toContain('Ruled Columns')
  expect(blocksGuideSource).toContain('inherits the section surface')
  expect(thumbnailFixtureSource).toMatch(/iconGrid:[\s\S]*variant="ruled"[\s\S]*iconCardShowcase:/)
})
```

- [ ] **Step 2: Run the documentation contract and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-grid-ruled-columns.int.spec.tsx -t "documents and demonstrates"
```

Expected: FAIL because the guide and fixture still describe/show `iconTop`.

- [ ] **Step 3: Replace the Icon Grid thumbnail fixture**

Replace only the `iconGrid` entry in `src/block-thumbnails/fixtures.tsx` with:

```tsx
iconGrid: (
  <IconGridBlockComponent
    appearance={{ background: 'none', border: 'none' }}
    columns="3"
    contentAlignment="center"
    description="Education, healthcare and community service are treated as connected responsibilities rather than separate activities."
    eyebrow="Our purpose"
    iconStyle="outline"
    items={[
      {
        title: 'Education',
        description: 'Build strong academic foundations through teaching, laboratories and clinical learning.',
        icon: 'GraduationCap',
      },
      {
        title: 'Healthcare',
        description: 'Support multidisciplinary diagnosis and treatment through associated clinical services.',
        icon: 'Hospital',
      },
      {
        title: 'Community',
        description: 'Develop medical professionals and expand access to regional care.',
        icon: 'Users',
      },
    ]}
    size="compact"
    title="Three responsibilities. One institution."
    variant="ruled"
  />
),
```

Keep the fixture production-component based and repository-local.

- [ ] **Step 4: Update the block operator guide**

Replace the current Icon Grid row in `docs/guides/blocks.md` with:

```markdown
| Icon Grid | Icon-led benefits and responsibilities | Card, Contact Cards, Minimal, Icon Top, or Ruled Columns; ruled items use continuous responsive dividers and inherit the section surface |
```

- [ ] **Step 5: Verify the fixture and guide before regenerating the JPEG**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-grid-ruled-columns.int.spec.tsx tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: both test files PASS and the fixture renders the production component without external assets.

- [ ] **Step 6: Regenerate only the Icon Grid thumbnail asset**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=iconGrid pnpm generate:block-thumbnails
```

Expected: the generator updates `public/block-thumbnails/icon-grid.jpg` and does not rewrite other block thumbnails. Inspect the generated preview for centered section copy, three open columns, visible outer/internal rules, and no clipped content.

- [ ] **Step 7: Refresh maintained project knowledge**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `.agents/skills/project-context/references/project-inventory.json` refreshes atomically and the check reports `Project context is current.` A stale knowledge-graph warning remains non-blocking. Review `.agents/skills/project-context/references/block-system.md` and leave it unchanged because no registry, renderer topology, or ownership boundary changed. Leave `src/features/feature-inventory.ts` unchanged because Icon Grid was already available and the project feature set did not change.

- [ ] **Step 8: Run final regression and quality checks**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-grid-ruled-columns.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/button-primary-variant.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/project-context-repository.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/IconGrid/config.ts src/blocks/IconGrid/Component.tsx src/block-thumbnails/fixtures.tsx tests/int/icon-grid-ruled-columns.int.spec.tsx
pnpm exec prettier --check src/blocks/IconGrid/config.ts src/blocks/IconGrid/Component.tsx src/block-thumbnails/fixtures.tsx tests/int/icon-grid-ruled-columns.int.spec.tsx docs/guides/blocks.md
pnpm project-context:check
git diff --check
```

Expected: every test and static check passes. The Page and live-preview suites confirm that the already-registered Icon Grid component accepts the generated `ruled` value without registry changes.

- [ ] **Step 9: Inspect the final scope**

Run:

```bash
git status --short
git diff --stat
git diff -- src/blocks/IconGrid/config.ts src/blocks/IconGrid/Component.tsx src/payload-types.ts tests/int/icon-grid-ruled-columns.int.spec.tsx src/block-thumbnails/fixtures.tsx docs/guides/blocks.md .agents/skills/project-context/references/project-inventory.json src/styles/themes/theme-snmih.css src/features/feature-inventory.ts .agents/skills/project-context/references/block-system.md
```

Expected changed files:

- `src/blocks/IconGrid/config.ts`
- `src/blocks/IconGrid/Component.tsx`
- `src/payload-types.ts`
- `tests/int/icon-grid-ruled-columns.int.spec.tsx`
- `src/block-thumbnails/fixtures.tsx`
- `public/block-thumbnails/icon-grid.jpg`
- `docs/guides/blocks.md`
- `.agents/skills/project-context/references/project-inventory.json`

Expected unchanged files include `src/styles/themes/theme-snmih.css`, `src/features/feature-inventory.ts`, and `.agents/skills/project-context/references/block-system.md`. Preserve any unrelated pre-existing working-tree changes.

- [ ] **Step 10: Commit the maintained preview and documentation**

```bash
git add src/block-thumbnails/fixtures.tsx public/block-thumbnails/icon-grid.jpg docs/guides/blocks.md .agents/skills/project-context/references/project-inventory.json
git commit -m "docs(icon-grid): show ruled columns"
```

---

## Completion Criteria

- Payload editors can select `Ruled Columns`; existing records and the `card` default are unchanged.
- The generated Payload union contains `ruled`.
- Ruled Columns uses a continuous top/bottom rule and correct non-doubled dividers at mobile, tablet, and configured desktop column counts.
- Items use section-derived semantic colors, ignore per-item backgrounds in this presentation, and retain icon styles, links, actions, focus behavior, and failure fallbacks.
- Existing Icon Grid presentations render as before.
- The Admin thumbnail, operator guide, generated project inventory, focused tests, adjacent regressions, TypeScript, ESLint, Prettier, and project-context checks are current and passing.
- `src/styles/themes/theme-snmih.css` remains untouched.
