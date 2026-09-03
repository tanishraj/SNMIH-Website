# Content Link Underlines and Configurable Button Arrows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give editorial links a persistent underline and let editors opt individual CTA buttons into a consistent trailing arrow.

**Architecture:** Extend the shared action schema and resolver with a backward-compatible `showArrow` boolean, then render button labels through one shared `ActionButtonContent` primitive. Keep editorial styling isolated in `ContentLink`, and explicitly adapt Hero Banner, Hero Carousel, Header, and Footer CTA paths without touching navigation links.

**Tech Stack:** Payload CMS 3, React 19, Next.js 16, TypeScript, Tailwind CSS 4, Lucide React, Vitest.

## Global Constraints

- Existing CTA records without `showArrow` remain unchanged; the default is `false`.
- Underlines apply to editorial/content-action links only.
- Header navigation, dropdown links, footer link groups, and footer utility links remain unchanged.
- Link-style CTAs use the editorial-link treatment and ignore `showArrow`.
- Arrow icons are decorative and use `aria-hidden="true"`.
- Do not add dependencies, colors, or theme tokens.
- Do not commit until the user explicitly asks.

---

## File Map

- Create `src/components/ActionButtonContent.tsx`: shared button-label/arrow primitive.
- Create `tests/int/content-action-presentation.int.spec.tsx`: shared schema and rendering contract.
- Modify `src/blocks/shared/contentActionsFields.ts`: shared Payload checkbox.
- Modify `src/lib/cmsLinks.ts`: normalize `showArrow`.
- Modify `src/components/ContentLink.tsx` and `src/components/ContentActions.tsx`: editorial underline and shared button arrow.
- Modify Hero Banner and Hero Carousel configs/components: bespoke CTA support.
- Modify Header Navbar config/components: desktop/mobile CTA support only.
- Modify Footer config/components: CTA support while leaving navigation links untouched.
- Regenerate `src/payload-types.ts`.
- Extend existing Hero, Carousel, Header, Footer, and schema integration tests.

---

### Task 1: Shared action schema and normalized data

**Files:**
- Modify: `src/blocks/shared/contentActionsFields.ts`
- Modify: `src/lib/cmsLinks.ts`
- Create: `tests/int/content-action-presentation.int.spec.tsx`

**Interfaces:**
- Produces: `CmsActionValue.showArrow?: boolean | null`
- Produces: `ResolvedCmsAction.showArrow: boolean`
- Produces: `showArrow` checkbox with `defaultValue: false`

- [ ] **Step 1: Write failing shared-schema and resolver tests**

Create the test file with these core assertions:

```tsx
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { ContentActions } from '@/components/ContentActions'
import { ContentLink } from '@/components/ContentLink'
import { resolveCmsActions } from '@/lib/cmsLinks'

type TestField = {
  admin?: { condition?: unknown }
  defaultValue?: unknown
  fields?: TestField[]
  label?: string
  name?: string
  tabs?: Array<{ fields: TestField[]; label: string }>
  type?: string
}

const getActionTabs = (includeDisplayMode = false) => {
  const field = createContentActionsField({ includeDisplayMode })
  return ((field.fields[0] as TestField).tabs ?? [])
}

describe('content action presentation', () => {
  it('defines an opt-in button arrow in shared action theme settings', () => {
    const themeFields = getActionTabs()
      .find((tab) => tab.label === 'Theme Settings')?.fields ?? []

    expect(themeFields.find((field) => field.name === 'showArrow')).toMatchObject({
      defaultValue: false,
      label: 'Show arrow',
      type: 'checkbox',
    })
  })

  it('only exposes the row arrow control for button display mode', () => {
    const themeFields = getActionTabs(true)
      .find((tab) => tab.label === 'Theme Settings')?.fields ?? []
    const field = themeFields.find((item) => item.name === 'showArrow')
    const condition = field?.admin?.condition as
      | ((_data: unknown, siblings: { mode?: string }) => boolean)
      | undefined

    expect(condition?.({}, { mode: 'button' })).toBe(true)
    expect(condition?.({}, { mode: 'link' })).toBe(false)
  })

  it('defaults missing arrows to false and preserves explicit arrows', () => {
    expect(resolveCmsActions([
      { label: 'Plain', linkType: 'custom', url: '/plain' },
      { label: 'Arrow', linkType: 'custom', showArrow: true, url: '/arrow' },
    ])).toEqual([
      expect.objectContaining({ href: '/plain', showArrow: false }),
      expect.objectContaining({ href: '/arrow', showArrow: true }),
    ])
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

```bash
pnpm exec vitest run tests/int/content-action-presentation.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because `showArrow` is absent.

- [ ] **Step 3: Add the shared checkbox**

In `contentActionsFields.ts`, append this to `createActionLayoutFields`:

```ts
{
  name: 'showArrow',
  label: 'Show arrow',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    description: 'Adds a trailing arrow when this action is displayed as a button.',
    ...(includeDisplayMode ? { condition: isButtonMode } : {}),
  },
} satisfies CheckboxField
```

- [ ] **Step 4: Extend shared action types and normalization**

In `cmsLinks.ts`, use:

```ts
export type CmsActionVariant = 'default' | 'link' | 'outline' | 'secondary'

export type CmsActionValue = CmsLinkValue & {
  label?: string | null
  showArrow?: boolean | null
  variant?: CmsActionVariant | null
}

export type ResolvedCmsAction = {
  href: string
  label: string
  openInNewTab?: boolean
  showArrow: boolean
  variant: CmsActionVariant
}
```

Add `showArrow: Boolean(action.showArrow)` in `resolveCmsActions`.

- [ ] **Step 5: Re-run the focused test**

Expected: all Task 1 tests PASS.

---

### Task 2: Editorial underlines and shared button arrows

**Files:**
- Create: `src/components/ActionButtonContent.tsx`
- Modify: `src/components/ContentLink.tsx`
- Modify: `src/components/ContentActions.tsx`
- Modify: `tests/int/content-action-presentation.int.spec.tsx`

**Interfaces:**
- Produces: `ActionButtonContent({ label, showArrow })`
- Consumes: `ResolvedCmsAction.showArrow`
- Preserves: existing `ContentLink` API and animated arrow

- [ ] **Step 1: Add failing rendering tests**

```tsx
it('underlines the editorial label without underlining its icon', () => {
  const html = renderToStaticMarkup(
    createElement(ContentLink, { href: '/programs', label: 'Explore programs' }),
  )

  expect(html).toContain('data-content-link="true"')
  expect(html).toContain('data-content-link-label="true"')
  expect(html).toContain('underline-offset-4')
  expect(html).toContain('data-content-link-arrow="true"')
})

it('renders a decorative arrow only for opted-in buttons', () => {
  const html = renderToStaticMarkup(createElement(ContentActions, {
    actions: [
      { href: '/plain', label: 'Plain', showArrow: false, variant: 'default' },
      { href: '/arrow', label: 'Arrow', showArrow: true, variant: 'outline' },
    ],
    mode: 'button',
  }))

  expect((html.match(/data-action-arrow="true"/g) ?? [])).toHaveLength(1)
  expect(html).toContain('aria-hidden="true"')
})

it('keeps link-style CTAs editorial and ignores their button arrow', () => {
  const html = renderToStaticMarkup(createElement(ContentActions, {
    actions: [{ href: '/read', label: 'Read more', showArrow: true, variant: 'link' }],
    mode: 'button',
  }))

  expect(html).toContain('data-content-link="true"')
  expect(html).not.toContain('data-action-arrow="true"')
})
```

- [ ] **Step 2: Run the focused test and verify failure**

Expected: FAIL on missing markers and arrow rendering.

- [ ] **Step 3: Create the shared button content**

Create `ActionButtonContent.tsx`:

```tsx
import { ArrowRight } from 'lucide-react'

type Props = { label: string; showArrow?: boolean }

export function ActionButtonContent({ label, showArrow = false }: Props) {
  return (
    <>
      <span>{label}</span>
      {showArrow ? (
        <ArrowRight
          aria-hidden="true"
          className="transition-transform duration-200 ease-out motion-reduce:transition-none group-hover/button:translate-x-0.5 group-focus-visible/button:translate-x-0.5"
          data-action-arrow="true"
          data-icon="inline-end"
        />
      ) : null}
    </>
  )
}
```

- [ ] **Step 4: Add persistent editorial-link styling**

In `ContentLink.tsx`, add `data-content-link="true"` to the anchor, add `data-content-link-arrow="true"` to the existing icon wrapper, and replace the plain label with:

```tsx
<span
  className="underline decoration-current/45 decoration-1 underline-offset-4 transition-[text-decoration-color,text-decoration-thickness] group-hover/button:decoration-current group-hover/button:decoration-2 group-focus-visible/button:decoration-current group-focus-visible/button:decoration-2"
  data-content-link-label="true"
>
  {label}
</span>
```

- [ ] **Step 5: Use the shared primitive in `ContentActions`**

Import both shared components. Within the action map, calculate:

```ts
const rendersAsButton = mode === 'button' && action.variant !== 'link'
```

Use `ContentLink` when false. Otherwise keep the existing `Button` and replace its raw label with:

```tsx
<ActionButtonContent label={action.label} showArrow={action.showArrow} />
```

- [ ] **Step 6: Re-run shared presentation tests**

Expected: all Task 1–2 tests PASS.

---

### Task 3: Hero Banner and Hero Carousel

**Files:**
- Modify: `src/blocks/HeroBanner/config.ts`
- Modify: `src/blocks/HeroBanner/Component.tsx`
- Modify: `src/blocks/HeroCarousel/config.ts`
- Modify: `src/blocks/HeroCarousel/Component.tsx`
- Modify: `src/blocks/HeroCarousel/HeroCarouselClient.tsx`
- Modify: `tests/int/hero-banner-render.int.spec.ts`
- Modify: `tests/int/carousel-blocks.int.spec.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**
- Consumes: `ActionButtonContent`, `ContentLink`, `showArrow?: boolean | null`
- Produces: `CarouselSlide.buttons[].showArrow: boolean`

- [ ] **Step 1: Write failing schema and rendering tests**

For each Hero button schema, locate its Theme Settings/Style tab and assert:

```ts
expect(showArrowField).toMatchObject({
  defaultValue: false,
  label: 'Show arrow',
  type: 'checkbox',
})
```

Render opted-in, plain, and `link` CTA variants. Assert only opted-in real buttons contain `data-action-arrow="true"`; link variants contain `data-content-link="true"`. Extend carousel normalization to assert `showArrow: true` survives.

- [ ] **Step 2: Run focused tests and verify failure**

```bash
pnpm exec vitest run tests/int/hero-banner-render.int.spec.ts tests/int/carousel-blocks.int.spec.tsx tests/int/page-blocks.int.spec.ts --config ./vitest.config.mts
```

Expected: FAIL on missing fields/data/rendering.

- [ ] **Step 3: Implement Hero Banner support**

Add a `showArrow` checkbox beside `variant`, conditioned on `variant !== 'link'`. Add `showArrow` to the local button type and normalize with `Boolean(button.showArrow)`. Render `ContentLink` for `link`; render existing `Button` plus `ActionButtonContent` otherwise.

- [ ] **Step 4: Implement Hero Carousel support**

Apply the same checkbox. Carry `showArrow` through `HeroButton`, `resolveHeroCarouselSlides`, and `CarouselSlide`. Render `ContentLink` with `className="text-white"` for `link`, otherwise `Button` plus `ActionButtonContent`.

- [ ] **Step 5: Re-run focused Hero tests**

Expected: all selected tests PASS.

---

### Task 4: Header and Footer CTAs

**Files:**
- Modify: `src/blocks/HeaderNavbar12/config.ts`
- Modify: `src/blocks/HeaderNavbar12/Component.tsx`
- Modify: `src/components/header/HeaderNavbar.tsx`
- Modify: `src/components/header/HeaderMobileMenu.tsx`
- Modify: `src/blocks/Footer56/config.ts`
- Modify: `src/blocks/Footer56/Component.tsx`
- Modify: `src/components/footer56.tsx`
- Modify: `tests/int/header-navbar-render.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/global-footer.int.spec.ts`

**Interfaces:**
- Consumes: `ActionButtonContent`, `ContentActions`, `resolveCmsActions`
- Preserves: Header/Footer navigation markup and classes
- Produces: visible Footer CTA output from existing `ctaButtons`

- [ ] **Step 1: Write failing Header/Footer tests**

Assert both bespoke CTA arrays have the checkbox contract. Set `showArrow: true` on Header and Footer CTAs and assert `data-action-arrow="true"`. Assert regular menu/link-group labels do not receive `data-content-link`.

- [ ] **Step 2: Run focused tests and verify failure**

```bash
pnpm exec vitest run tests/int/header-navbar-render.int.spec.ts tests/int/global-footer.int.spec.ts tests/int/page-blocks.int.spec.ts --config ./vitest.config.mts
```

Expected: FAIL; Footer CTA rows are also currently not passed to the renderer.

- [ ] **Step 3: Implement Header support**

Add the conditional checkbox after `variant`. Resolve `showArrow: Boolean(item.showArrow)`. Extend CTA prop types in desktop/mobile Header components. Use `ContentLink` for `link` variants and `ActionButtonContent` inside `Button` otherwise. Do not edit `HeaderNavMenu`, mobile top-level links, or dropdown child links.

- [ ] **Step 4: Implement Footer support**

Add the checkbox only to `ctaButtons`. In `Footer56BlockComponent`, destructure `ctaButtons` and `description`, resolve actions with `resolveCmsActions`, and pass both to `Footer56`. Add `actions?: ResolvedCmsAction[]` and `description?: string` to `Footer56`; render description and `<ContentActions actions={actions} className="mt-6" mode="button" />` in the brand column before contact details. Do not edit footer navigation/link-group styling.

- [ ] **Step 5: Re-run focused Header/Footer tests**

Expected: all selected tests PASS.

---

### Task 5: Generate Payload types and validate

**Files:**
- Modify: `src/payload-types.ts` (generated only)
- Verify: all Task 1–4 files and existing uncommitted eyebrow changes

**Interfaces:**
- Produces: generated `showArrow?: boolean | null` fields

- [ ] **Step 1: Generate Payload types**

```bash
pnpm run generate:types
```

Expected: exit 0; do not hand-edit generated types.

- [ ] **Step 2: Run all focused action tests**

```bash
pnpm exec vitest run tests/int/content-action-presentation.int.spec.tsx tests/int/hero-banner-render.int.spec.ts tests/int/carousel-blocks.int.spec.tsx tests/int/header-navbar-render.int.spec.ts tests/int/global-footer.int.spec.ts tests/int/page-blocks.int.spec.ts --config ./vitest.config.mts
```

Expected: all selected tests PASS.

- [ ] **Step 3: Run existing eyebrow/theme regressions**

```bash
pnpm exec vitest run tests/int/section-eyebrow.int.spec.tsx tests/int/dark-mode-media-treatment.int.spec.tsx --config ./vitest.config.mts
```

Expected: all tests PASS.

- [ ] **Step 4: Run TypeScript**

```bash
pnpm exec tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 5: Lint changed TypeScript files**

```bash
git diff --name-only -z -- '*.ts' '*.tsx' | xargs -0 pnpm exec eslint --quiet
```

Expected: exit 0 without pulling unrelated existing lint debt into scope.

- [ ] **Step 6: Check whitespace and uncommitted state**

```bash
git diff --check
git status --short
```

Expected: whitespace check exits 0 and all eyebrow/action changes remain uncommitted. Do not run `git add` or `git commit`.

---

## Self-Review

- Spec coverage: shared actions, both Heroes, Header desktop/mobile, Footer, editorial underlines, navigation exclusions, accessibility, compatibility, and validation are covered.
- Placeholder scan: no TBD, TODO, deferred behavior, or unspecified test step remains.
- Type consistency: `ResolvedCmsAction` owns normalized `showArrow`; `ActionButtonContent` is the sole button-arrow renderer.
- Scope: no icon selector, position control, global default, navigation underline, dependency, color, or token is added.
