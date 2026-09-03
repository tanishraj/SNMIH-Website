# SNMIH Surface-Aware Eyebrow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give section-level eyebrows an accessible SNMIH-only green treatment that follows the rendered surface without adding theme tokens or CMS settings.

**Architecture:** Add a shared `SectionEyebrow` presentation component that preserves the incumbent eyebrow typography and exposes the semantic surface through a data attribute. Keep the two approved green values as direct, SNMIH-scoped CSS declarations in `theme-snmih.css`; other themes continue using the component's inherited fallback color. Normal blocks pass their configured semantic background, mode-aware image overlays use the normal surface contract, and overlays that always retain white foreground pass an explicit dark-overlay surface.

**Tech Stack:** React 19, Next.js 16, TypeScript, Tailwind CSS 4, theme-scoped CSS, Vitest, React server rendering.

## Global Constraints

- Apply the green treatment only under `data-theme-color="snmih"`.
- Use `#2b833f` on light surfaces and `#9dd4a6` on dark surfaces.
- Add no CSS custom properties, Tailwind color tokens, Payload fields, or editor-facing controls.
- Resolve color from the rendered surface, not only the site's light/dark mode.
- Preserve `text-current/70` as the fallback for every non-SNMIH theme.
- In SNMIH dark mode, leave `primary`-background eyebrows on semantic inherited foreground because neither approved green has sufficient contrast against the inverted light-blue Primary.
- Preserve existing eyebrow font family, size, weight, case, tracking, spacing, and alignment.
- Do not recolor card metadata, programme categories, key facts, office regions, timeline step labels, tab labels, navigation, statuses, or form labels.
- Add no dependencies and do not change CMS schemas or generated Payload types.

---

## File Structure

- Create `src/components/SectionEyebrow.tsx` as the single section-eyebrow typography and surface contract.
- Modify `src/styles/themes/theme-snmih.css` with theme-scoped direct-color selectors; do not add variables.
- Create `tests/int/section-eyebrow.int.spec.tsx` for the shared component, exact theme selectors, fallback behavior, scope, and migration contract.
- Modify regular block renderers and shared presentation components to consume `SectionEyebrow` and pass their semantic `appearance.background`.
- Modify `src/blocks/HeroBanner/Component.tsx`, `src/blocks/HeroCarousel/HeroCarouselClient.tsx`, and `src/blocks/PageHeader/Component.tsx` to pass explicit overlay surfaces.
- Modify focused Hero Banner and dark-media tests for overlay render evidence.

### Task 1: Establish the shared surface-aware eyebrow contract

**Files:**

- Create: `src/components/SectionEyebrow.tsx`
- Modify: `src/styles/themes/theme-snmih.css`
- Create: `tests/int/section-eyebrow.int.spec.tsx`

**Interfaces:**

- Produces: `export type SectionEyebrowSurface = BlockBackground | 'darkOverlay'`
- Produces: `SectionEyebrow({ children, className, surface, ...props }: SectionEyebrowProps)`
- Emits: `data-section-eyebrow="true"`
- Emits: `data-section-eyebrow-surface="none|primary|secondary|muted|accent|darkOverlay"`
- Preserves: standard classes `font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current/70`

- [ ] **Step 1: Write the failing shared-component and theme-scope tests**

Create `tests/int/section-eyebrow.int.spec.tsx`:

```tsx
import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SectionEyebrow } from '@/components/SectionEyebrow'

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')

describe('SNMIH section eyebrows', () => {
  it.each([
    'none',
    'primary',
    'secondary',
    'muted',
    'accent',
    'darkOverlay',
  ] as const)('renders the %s surface contract with the inherited fallback', (surface) => {
    const html = renderToStaticMarkup(
      <SectionEyebrow className="mb-2" surface={surface}>
        Academics
      </SectionEyebrow>,
    )

    expect(html).toContain('data-section-eyebrow="true"')
    expect(html).toContain(`data-section-eyebrow-surface="${surface}"`)
    expect(html).toContain(
      'font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current/70 mb-2',
    )
    expect(html).toContain('>Academics</p>')
  })

  it('scopes direct eyebrow colors to SNMIH without defining another token', () => {
    const css = read('src/styles/themes/theme-snmih.css')

    expect(css).toContain("[data-theme-color='snmih']")
    expect(css).toContain("[data-section-eyebrow-surface='none']")
    expect(css).toContain("[data-section-eyebrow-surface='primary']")
    expect(css).toContain("[data-section-eyebrow-surface='darkOverlay']")
    expect(css).toContain('color: #2b833f;')
    expect(css).toContain('color: #9dd4a6;')
    expect(css).not.toMatch(/--(?:section-)?eyebrow/)
    expect(css).not.toMatch(/--section-accent/)
  })

  it('keeps the SNMIH dark-mode primary surface on inherited foreground', () => {
    const css = read('src/styles/themes/theme-snmih.css')
    const darkPrimaryRule =
      /:root\[data-theme-color='snmih'\]\.dark[^{}]*\[data-section-eyebrow-surface='primary'\][^{]*\{[^}]*color:/

    expect(css).not.toMatch(darkPrimaryRule)
  })
})
```

- [ ] **Step 2: Run the focused test and verify the intended failure**

Run:

```bash
pnpm exec vitest run tests/int/section-eyebrow.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because `@/components/SectionEyebrow` does not exist.

- [ ] **Step 3: Implement the shared presentation component**

Create `src/components/SectionEyebrow.tsx`:

```tsx
import type { ComponentPropsWithoutRef } from 'react'

import type { BlockBackground } from '@/blocks/shared/blockAppearance'
import { cn } from '@/lib/utils'

export type SectionEyebrowSurface = BlockBackground | 'darkOverlay'

type SectionEyebrowProps = ComponentPropsWithoutRef<'p'> & {
  surface?: SectionEyebrowSurface
}

export function SectionEyebrow({
  children,
  className,
  surface = 'none',
  ...props
}: SectionEyebrowProps) {
  return (
    <p
      {...props}
      className={cn(
        'font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current/70',
        className,
      )}
      data-section-eyebrow="true"
      data-section-eyebrow-surface={surface}
    >
      {children}
    </p>
  )
}
```

Do not put either green value or any theme-name condition in the React component. Its default remains the incumbent inherited color.

- [ ] **Step 4: Add SNMIH-only direct-color selectors**

Append this presentation section to `src/styles/themes/theme-snmih.css` after the dark token block:

```css
/* Section eyebrows use direct brand accents without expanding the theme token API. */
:root[data-theme-color='snmih']:not(.dark)
  :is(
    [data-section-eyebrow-surface='none'],
    [data-section-eyebrow-surface='secondary'],
    [data-section-eyebrow-surface='muted'],
    [data-section-eyebrow-surface='accent']
  ) {
  color: #2b833f;
}

:root[data-theme-color='snmih']:not(.dark) [data-section-eyebrow-surface='primary'],
:root[data-theme-color='snmih'].dark
  :is(
    [data-section-eyebrow-surface='none'],
    [data-section-eyebrow-surface='secondary'],
    [data-section-eyebrow-surface='muted'],
    [data-section-eyebrow-surface='accent']
  ),
:root[data-theme-color='snmih'] [data-section-eyebrow-surface='darkOverlay'] {
  color: #9dd4a6;
}
```

Do not add a `.dark` + `primary` selector. Its absence intentionally preserves the component's `text-current/70` fallback on SNMIH's inverted Primary.

- [ ] **Step 5: Run the focused test and verify the shared contract passes**

Run:

```bash
pnpm exec vitest run tests/int/section-eyebrow.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS for all six surfaces, direct SNMIH colors, no new tokens, and the dark-primary exception.

- [ ] **Step 6: Commit the shared contract**

```bash
git add src/components/SectionEyebrow.tsx src/styles/themes/theme-snmih.css tests/int/section-eyebrow.int.spec.tsx
git commit -m "feat(theme): add adaptive eyebrows"
```

### Task 2: Migrate regular section eyebrows without recoloring metadata

**Files:**

- Modify: `tests/int/section-eyebrow.int.spec.tsx`
- Modify: `src/blocks/AboutSection/Component.tsx`
- Modify: `src/blocks/AwardsList/Component.tsx`
- Modify: `src/blocks/BentoGrid/Component.tsx`
- Modify: `src/blocks/DownloadList/Component.tsx`
- Modify: `src/blocks/FeatureSpotlight/Component.tsx`
- Modify: `src/blocks/GalleryCoverflow/Component.tsx`
- Modify: `src/blocks/IconGrid/Component.tsx`
- Modify: `src/blocks/LogoStrip/Component.tsx`
- Modify: `src/blocks/MediaCarousel/MediaCarouselClient.tsx`
- Modify: `src/blocks/NumberedSteps/Component.tsx`
- Modify: `src/blocks/ProgramGrid/ProgramGridClient.tsx`
- Modify: `src/blocks/ProgramMatrix/Component.tsx`
- Modify: `src/blocks/QuoteBlock/Component.tsx`
- Modify: `src/blocks/ReviewSubmission/Component.tsx`
- Modify: `src/blocks/TabsContent/Component.tsx`
- Modify: `src/blocks/TabsContent/TabsContentClient.tsx`
- Modify: `src/blocks/TestimonialGrid/Component.tsx`
- Modify: `src/blocks/Timeline/Component.tsx`
- Modify: `src/blocks/VideoEmbed/Component.tsx`
- Modify: `src/components/contact24.tsx`
- Modify: `src/components/contact33.tsx`
- Modify: `src/components/content-highlights.tsx`
- Modify: `src/components/event-gallery.tsx`
- Modify: `src/components/feature-matrix.tsx`
- Modify: `src/components/gallery-showcase.tsx`
- Modify: `src/components/image-mosaic.tsx`
- Modify: `src/components/news-events/NewsEventsFeed.tsx`
- Modify: `src/components/news-events/NewsEventsHighlights.tsx`
- Modify: `src/components/profile-carousel.tsx`
- Modify: `src/components/rating-spotlight.tsx`
- Modify: `src/components/review-feed.tsx`
- Modify: `src/components/services21.tsx`

**Interfaces:**

- Consumes: `SectionEyebrow` and each renderer's existing `appearance?.background` or `sectionBackground`.
- Preserves: all component props, CMS values, layout, alignment, spacing, and headings.
- Leaves unchanged: Bento card eyebrows, Program Grid categories, Page Header key facts, Contact office regions, Timeline step labels, and tab navigation labels.

- [ ] **Step 1: Add failing migration and scope assertions**

Extend `tests/int/section-eyebrow.int.spec.tsx` with exact target lists:

```tsx
const regularSectionEyebrowFiles = [
  'src/blocks/AboutSection/Component.tsx',
  'src/blocks/AwardsList/Component.tsx',
  'src/blocks/BentoGrid/Component.tsx',
  'src/blocks/DownloadList/Component.tsx',
  'src/blocks/FeatureSpotlight/Component.tsx',
  'src/blocks/GalleryCoverflow/Component.tsx',
  'src/blocks/IconGrid/Component.tsx',
  'src/blocks/LogoStrip/Component.tsx',
  'src/blocks/MediaCarousel/MediaCarouselClient.tsx',
  'src/blocks/NumberedSteps/Component.tsx',
  'src/blocks/ProgramGrid/ProgramGridClient.tsx',
  'src/blocks/ProgramMatrix/Component.tsx',
  'src/blocks/QuoteBlock/Component.tsx',
  'src/blocks/ReviewSubmission/Component.tsx',
  'src/blocks/TabsContent/Component.tsx',
  'src/blocks/TabsContent/TabsContentClient.tsx',
  'src/blocks/TestimonialGrid/Component.tsx',
  'src/blocks/Timeline/Component.tsx',
  'src/blocks/VideoEmbed/Component.tsx',
  'src/components/contact24.tsx',
  'src/components/contact33.tsx',
  'src/components/content-highlights.tsx',
  'src/components/event-gallery.tsx',
  'src/components/feature-matrix.tsx',
  'src/components/gallery-showcase.tsx',
  'src/components/image-mosaic.tsx',
  'src/components/news-events/NewsEventsFeed.tsx',
  'src/components/news-events/NewsEventsHighlights.tsx',
  'src/components/profile-carousel.tsx',
  'src/components/rating-spotlight.tsx',
  'src/components/review-feed.tsx',
  'src/components/services21.tsx',
] as const

it.each(regularSectionEyebrowFiles)('%s consumes the shared section eyebrow', (file) => {
  expect(read(file)).toContain('SectionEyebrow')
})

it('does not convert metadata labels into section eyebrows', () => {
  expect(read('src/blocks/ProgramGrid/ProgramGridClient.tsx')).toContain(
    'font-mono text-xs font-semibold uppercase tracking-[0.24em]',
  )
  expect(read('src/blocks/PageHeader/Component.tsx')).toContain('{fact.label!.trim()}')
  expect(read('src/components/contact24.tsx')).toContain('{office.region}')
})
```

Add a representative server-rendered surface test:

```tsx
import { ProgramMatrixBlockComponent } from '@/blocks/ProgramMatrix/Component'

it('passes a regular section background to the eyebrow', () => {
  const html = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      appearance={{ background: 'primary' }}
      eyebrow="Academics"
      items={[{ title: 'MBBS' }]}
      title="Programmes offered"
    />,
  )

  expect(html).toContain('data-section-eyebrow="true"')
  expect(html).toContain('data-section-eyebrow-surface="primary"')
})
```

- [ ] **Step 2: Run the focused suite and verify migration assertions fail**

Run:

```bash
pnpm exec vitest run tests/int/section-eyebrow.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the listed renderers still emit local `<p>` treatments.

- [ ] **Step 3: Replace regular section eyebrow markup**

In every listed renderer:

1. Import `SectionEyebrow` from `@/components/SectionEyebrow`.
2. Replace only the element displaying the block or section's `eyebrow` prop.
3. Pass the existing section background:

```tsx
<SectionEyebrow surface={appearance?.background ?? 'none'}>
  {eyebrow.trim()}
</SectionEyebrow>
```

For client components that already receive `sectionBackground`, use:

```tsx
<SectionEyebrow surface={sectionBackground}>{eyebrow}</SectionEyebrow>
```

For locally extracted headers such as Timeline's `SectionHeader` and Content Highlights' `ContentHighlightsIntro`, add a typed `surface: BlockBackground` prop and forward it from the owning section:

```tsx
<SectionEyebrow surface={surface}>{eyebrow}</SectionEyebrow>
```

For `TabsContentClient`, add `sectionBackground: BlockBackground` to `Props`, pass it from `TabsContentBlockComponent`, and apply it only to the active tab content eyebrow. The tab buttons remain unchanged.

Preserve local spacing or tracking differences through `className`. Examples:

```tsx
<SectionEyebrow className="mb-2" surface={appearance?.background ?? 'none'}>
```

Do not replace these metadata elements:

```tsx
// Bento card eyebrow
item.eyebrow

// Program Grid card category
program.category

// Page Header key fact
fact.label

// Contact office region
office.region
```

- [ ] **Step 4: Run focused eyebrow and representative block suites**

Run:

```bash
pnpm exec vitest run tests/int/section-eyebrow.int.spec.tsx tests/int/program-matrix.int.spec.tsx tests/int/block-layout-contracts.int.spec.tsx tests/int/block-surface-semantics.int.spec.ts --config ./vitest.config.mts
```

Expected: PASS. Existing layout and surface assertions remain unchanged except where an assertion intentionally targets the old inline eyebrow class; update those assertions to require `data-section-eyebrow="true"` and the correct surface instead.

- [ ] **Step 5: Commit the regular block migration**

```bash
git add tests/int/section-eyebrow.int.spec.tsx src/blocks src/components
git commit -m "refactor(blocks): share eyebrow styling"
```

Before committing, inspect `git diff --cached --name-only` and unstage any file outside the Task 2 list. In particular, do not stage generated Payload types.

### Task 3: Map image-overlay eyebrows to their actual surface

**Files:**

- Modify: `tests/int/section-eyebrow.int.spec.tsx`
- Modify: `tests/int/hero-banner-render.int.spec.ts`
- Modify: `tests/int/dark-mode-media-treatment.int.spec.tsx`
- Modify: `src/blocks/HeroBanner/Component.tsx`
- Modify: `src/blocks/HeroCarousel/HeroCarouselClient.tsx`
- Modify: `src/blocks/PageHeader/Component.tsx`

**Interfaces:**

- Hero Banner `themeMode='dark'` produces `surface="darkOverlay"`.
- Hero Banner `themeMode='light'` and `themeMode='auto'` produce `surface="none"`, allowing the actual site mode to select the accessible green because those overlays use the theme's `background` color.
- Hero Carousel and banner Page Header produce `surface="darkOverlay"` because their overlays retain white foreground in every mode.

- [ ] **Step 1: Add failing overlay-surface render assertions**

In `tests/int/hero-banner-render.int.spec.ts`, extend the explicit theme override test:

```ts
expect(darkHtml).toContain('data-section-eyebrow-surface="darkOverlay"')
expect(lightHtml).toContain('data-section-eyebrow-surface="none"')
```

Add `eyebrow="Admissions"` to both fixtures so the shared component renders.

In the first Hero Banner test, assert auto-mode behavior:

```ts
expect(html).toContain('data-section-eyebrow-surface="none"')
```

In `tests/int/dark-mode-media-treatment.int.spec.tsx`, pass `eyebrow="Admissions"` to the Page Header fixture and assert:

```tsx
expect(html).toContain('data-section-eyebrow-surface="darkOverlay"')
```

Extend `tests/int/section-eyebrow.int.spec.tsx` with a Hero Carousel source contract:

```tsx
it('marks Hero Carousel eyebrows as dark-overlay content', () => {
  const source = read('src/blocks/HeroCarousel/HeroCarouselClient.tsx')

  expect(source).toContain('SectionEyebrow')
  expect(source).toContain('surface="darkOverlay"')
})
```

- [ ] **Step 2: Run the focused tests and verify overlay assertions fail**

Run:

```bash
pnpm exec vitest run tests/int/section-eyebrow.int.spec.tsx tests/int/hero-banner-render.int.spec.ts tests/int/dark-mode-media-treatment.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the three overlay renderers still use local white or foreground eyebrow classes.

- [ ] **Step 3: Migrate Hero Banner with explicit tone mapping**

Import `SectionEyebrow` and `SectionEyebrowSurface`, then resolve the surface after `resolvedThemeMode`:

```tsx
const eyebrowSurface: SectionEyebrowSurface =
  resolvedThemeMode === 'dark' ? 'darkOverlay' : 'none'
```

Replace the Hero Banner eyebrow with:

```tsx
<SectionEyebrow
  className={cn(
    'tracking-[0.28em]',
    resolvedThemeMode === 'dark' ? 'text-white/78' : 'text-foreground/78',
  )}
  data-hero-banner-eyebrow="true"
  surface={eyebrowSurface}
>
  {eyebrow}
</SectionEyebrow>
```

Remove only the old `eyebrow` entries from `textToneClasses`; keep title and description classes intact. SNMIH CSS overrides the fallback color, while other themes preserve the exact previous text tone.

- [ ] **Step 4: Migrate the always-dark overlay renderers**

In Hero Carousel, replace the slide eyebrow with:

```tsx
<SectionEyebrow
  className="tracking-[0.28em] text-white/75"
  surface="darkOverlay"
>
  {slide.eyebrow}
</SectionEyebrow>
```

In the Page Header banner variant, replace its eyebrow with:

```tsx
<SectionEyebrow className="mb-2 text-white/70" surface="darkOverlay">
  {eyebrow.trim()}
</SectionEyebrow>
```

The Page Header split and minimal variants must use their configured regular section background as completed in Task 2.

- [ ] **Step 5: Run the overlay and regression suites**

Run:

```bash
pnpm exec vitest run tests/int/section-eyebrow.int.spec.tsx tests/int/hero-banner-render.int.spec.ts tests/int/dark-mode-media-treatment.int.spec.tsx tests/int/block-surface-semantics.int.spec.ts --config ./vitest.config.mts
```

Expected: PASS for explicit light, explicit dark, auto, Hero Carousel dark-overlay, and Page Header banner treatment.

- [ ] **Step 6: Run full static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm run lint
git diff --check
```

Expected: all commands exit 0. If the repository contains a pre-existing unrelated lint failure, record its exact file and message and confirm no changed file introduces another failure.

- [ ] **Step 7: Perform one bounded visual pass**

Render representative SNMIH pages or block previews at desktop and mobile widths and verify together:

- light-mode `none`, `secondary`, `muted`, and `accent` sections use `#2b833f`;
- light-mode `primary` and image-dark-overlay sections use `#9dd4a6`;
- dark-mode regular dark sections use `#9dd4a6`;
- dark-mode `primary` uses readable inherited foreground rather than either green;
- explicit light Hero Banner overlay follows the site mode: `#2b833f` in light mode and `#9dd4a6` in dark mode;
- Default, Blue, Kodama, and Sunset retain their prior inherited eyebrow colors;
- alignment, line height, tracking, and vertical spacing have not shifted.

Fix all defects found in one batch, then run the focused Task 3 command once more. Stop after that confirmation pass.

- [ ] **Step 8: Commit overlay handling and verification updates**

```bash
git add src/blocks/HeroBanner/Component.tsx src/blocks/HeroCarousel/HeroCarouselClient.tsx src/blocks/PageHeader/Component.tsx tests/int/hero-banner-render.int.spec.ts tests/int/dark-mode-media-treatment.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
git commit -m "fix(theme): match eyebrows to surfaces"
```

Inspect the staged file list before committing and keep generated or unrelated changes out of the commit.
