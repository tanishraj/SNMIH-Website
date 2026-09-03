# Section-Aware Default Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Default Card` transparent and visually inherited from its containing section, with subtle section-aware borders and readable content in light and dark modes.

**Architecture:** Extend the shared semantic card resolver to accept the containing block background and derive default-card presentation from that context. Pass the semantic background value through server and client component boundaries; keep explicit card surfaces unchanged and give media overlays a dedicated readability treatment.

**Tech Stack:** TypeScript, React 19, Next.js 16, Tailwind CSS 4 semantic tokens, Payload CMS 3, Vitest.

## Global Constraints

- `Default Card` renders with a transparent background.
- Default-card foreground, borders, dividers, icons, links, and actions adapt to the containing section.
- Borders and dividers remain decorative and low contrast.
- `Primary`, `Secondary`, `Muted`, and `Accent` card surfaces retain their existing semantic behavior.
- Media overlays retain image-independent text readability.
- Existing Payload field names, stored values, and generated data shapes remain unchanged.
- Missing and invalid card-background values continue to resolve to `default`.
- No new dependencies.

---

## File Structure

- Modify `src/blocks/shared/blockAppearance.ts` to export the canonical `BlockBackground` type.
- Modify `src/blocks/shared/cardSurface.ts` to resolve default-card classes from a section background while preserving explicit surfaces.
- Modify server-rendered block/component consumers to pass `appearance?.background` into `resolveCardSurface`.
- Modify client boundaries for Download List, Media Carousel, Program Grid, and Profile Carousel to carry a semantic `sectionBackground` value.
- Modify `tests/int/card-theme-contract.int.spec.ts` for resolver behavior.
- Modify `tests/int/card-block-renderers.int.spec.tsx` for end-to-end rendering behavior.
- Modify `tests/int/program-matrix.int.spec.tsx` only where its existing surface assertions need the new transparent default contract.

### Task 1: Define the section-aware surface contract

**Files:**

- Modify: `src/blocks/shared/blockAppearance.ts`
- Modify: `src/blocks/shared/cardSurface.ts`
- Test: `tests/int/card-theme-contract.int.spec.ts`

**Interfaces:**

- Produces: `export type BlockBackground = 'none' | 'primary' | 'secondary' | 'muted' | 'accent'`
- Produces: `resolveCardSurface(value?: string | null, sectionBackground?: BlockBackground | null): CardSurfaceClasses`
- Preserves: `CardSurfaceClasses` and `CardSurfaceValue`

- [ ] **Step 1: Write failing resolver tests**

Replace the default entry in the existing table test and add section-context coverage:

```ts
it.each([
  ['none', 'bg-transparent text-current', 'border-current/10'],
  ['primary', 'bg-transparent text-current', 'border-current/15'],
  ['secondary', 'bg-transparent text-current', 'border-current/10'],
  ['muted', 'bg-transparent text-current', 'border-current/10'],
  ['accent', 'bg-transparent text-current', 'border-current/10'],
] as const)('inherits the %s section for a default card', (background, className, divider) => {
  expect(resolveCardSurface('default', background)).toMatchObject({
    className,
    divider,
    secondary: 'text-current/70',
    value: 'default',
  })
})

it('keeps explicit card surfaces independent from the section', () => {
  expect(resolveCardSurface('primary', 'accent')).toMatchObject({
    className: 'bg-primary text-primary-foreground',
    divider: 'border-primary-foreground/15',
    value: 'primary',
  })
})

it('uses a dedicated readable media overlay for a default card', () => {
  expect(resolveCardSurface('default', 'primary').overlay).toBe(
    'from-black/80 via-black/50 to-transparent text-white',
  )
})
```

- [ ] **Step 2: Run the resolver tests and confirm failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-theme-contract.int.spec.ts
```

Expected: FAIL because `resolveCardSurface` ignores the section background and returns `bg-card text-card-foreground` for `default`.

- [ ] **Step 3: Export the canonical section-background type**

In `src/blocks/shared/blockAppearance.ts`, define and use:

```ts
export type BlockBackground = 'none' | 'primary' | 'secondary' | 'muted' | 'accent'

export type BlockAppearance = {
  background?: BlockBackground | null
  border?: 'none' | 'top' | 'bottom' | 'topAndBottom' | null
}
```

- [ ] **Step 4: Implement section-aware default-card classes**

In `src/blocks/shared/cardSurface.ts`, keep the four explicit surface records and resolve `default` separately:

```ts
import type { BlockBackground } from './blockAppearance'

const defaultDividerClasses: Record<BlockBackground, string> = {
  none: 'border-current/10',
  primary: 'border-current/15',
  secondary: 'border-current/10',
  muted: 'border-current/10',
  accent: 'border-current/10',
}

const resolveDefaultCardSurface = (
  sectionBackground: BlockBackground = 'none',
): CardSurfaceClasses => ({
  value: 'default',
  className: 'bg-transparent text-current',
  secondary: 'text-current/70',
  icon:
    sectionBackground === 'none' || sectionBackground === 'muted' ? 'text-primary' : 'text-current',
  divider: defaultDividerClasses[sectionBackground],
  link:
    sectionBackground === 'none' || sectionBackground === 'muted'
      ? 'text-primary hover:text-primary/80'
      : 'text-current hover:text-current/80',
  overlay: 'from-black/80 via-black/50 to-transparent text-white',
  button:
    sectionBackground === 'primary'
      ? {
          default:
            'bg-primary-foreground text-primary hover:bg-primary-foreground/90 focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/30',
        }
      : sectionBackground === 'secondary'
        ? {
            secondary:
              'bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90 focus-visible:border-secondary-foreground focus-visible:ring-secondary-foreground/30',
          }
        : {},
})

export const resolveCardSurface = (
  value?: string | null,
  sectionBackground: BlockBackground = 'none',
): CardSurfaceClasses => {
  const resolvedValue = cardSurfaceValues.includes(value as CardSurfaceValue)
    ? (value as CardSurfaceValue)
    : 'default'

  return resolvedValue === 'default'
    ? resolveDefaultCardSurface(sectionBackground)
    : explicitCardSurfaceClasses[resolvedValue]
}
```

Format the ternary expression with Prettier rather than manually preserving the sample line length.

- [ ] **Step 5: Run the resolver tests and confirm success**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-theme-contract.int.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the resolver contract**

```bash
git add src/blocks/shared/blockAppearance.ts src/blocks/shared/cardSurface.ts tests/int/card-theme-contract.int.spec.ts
git commit -m "fix(cards): inherit default section surface"
```

### Task 2: Thread section context through server renderers

**Files:**

- Modify: `src/blocks/AwardsList/Component.tsx`
- Modify: `src/blocks/BentoGrid/Component.tsx`
- Modify: `src/blocks/IconGrid/Component.tsx`
- Modify: `src/blocks/NumberedSteps/Component.tsx`
- Modify: `src/blocks/ProgramMatrix/Component.tsx`
- Modify: `src/blocks/TestimonialGrid/Component.tsx`
- Modify: `src/components/content-highlights.tsx`
- Modify: `src/components/feature-matrix.tsx`
- Modify: `src/components/team-showcase.tsx`
- Test: `tests/int/card-block-renderers.int.spec.tsx`
- Test: `tests/int/program-matrix.int.spec.tsx`

**Interfaces:**

- Consumes: `resolveCardSurface(value, sectionBackground)` from Task 1.
- Produces: server-rendered default cards with `bg-transparent text-current` and a low-opacity inherited border.

- [ ] **Step 1: Add failing server-renderer assertions**

Add a helper and cases to `tests/int/card-block-renderers.int.spec.tsx`:

```ts
const expectInheritedDefaultSurface = (html: string) => {
  expect(html).toContain('data-card-background="default"')
  expect(html).toContain('bg-transparent text-current')
  expect(html).not.toContain('bg-card text-card-foreground')
}

it('inherits a primary section in server-rendered default cards', () => {
  const markups = [
    renderToStaticMarkup(
      <IconGridBlockComponent
        appearance={{ background: 'primary' }}
        items={[{ icon: 'Hospital', title: 'Hospital training' }]}
        title="Why choose us"
        variant="card"
      />,
    ),
    renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        appearance={{ background: 'primary' }}
        items={[{ title: 'MBBS' }]}
        title="Programmes"
      />,
    ),
    renderToStaticMarkup(
      <TestimonialGridBlockComponent
        appearance={{ background: 'primary' }}
        testimonials={[{ name: 'Student', quote: 'Excellent' }]}
        variant="grid"
      />,
    ),
  ]

  for (const html of markups) {
    expectInheritedDefaultSurface(html)
    expect(html).toContain('border-current/15')
  }
})
```

Import `ProgramMatrixBlockComponent` in the test file. Update Program Matrix's existing default-card assertion to expect `bg-transparent text-current`.

- [ ] **Step 2: Run server-renderer tests and confirm failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-block-renderers.int.spec.tsx tests/int/program-matrix.int.spec.tsx
```

Expected: FAIL because server renderers call `resolveCardSurface` without the section background.

- [ ] **Step 3: Pass section background in each server-rendered consumer**

Resolve once near the block root:

```ts
const sectionBackground = appearance?.background ?? 'none'
```

Then replace each applicable call:

```ts
const surface = resolveCardSurface(item.cardBackground, sectionBackground)
```

For helpers that render individual cards, add a typed parameter:

```ts
sectionBackground: BlockBackground
```

Import `type BlockBackground` from `@/blocks/shared/blockAppearance`. Apply this to Awards List, Bento Grid, Icon Grid, Numbered Steps, Program Matrix, Testimonial Grid, Content Highlights, Feature Matrix, and Team Showcase. Do not add card-surface classes to their non-card variants.

For Program Matrix, also change its outer grid from an independent card surface:

```tsx
className =
  'grid overflow-hidden rounded-[var(--radius)] border border-current/10 bg-transparent text-current md:grid-cols-2'
```

Its cells then remain transparent instead of revealing a `bg-card` parent. On a Primary section use `border-current/15` for the outer grid, matching the default-card divider contract.

- [ ] **Step 4: Run server-renderer tests and confirm success**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-block-renderers.int.spec.tsx tests/int/program-matrix.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit server-renderer propagation**

```bash
git add src/blocks/AwardsList/Component.tsx src/blocks/BentoGrid/Component.tsx src/blocks/IconGrid/Component.tsx src/blocks/NumberedSteps/Component.tsx src/blocks/ProgramMatrix/Component.tsx src/blocks/TestimonialGrid/Component.tsx src/components/content-highlights.tsx src/components/feature-matrix.tsx src/components/team-showcase.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/program-matrix.int.spec.tsx
git commit -m "fix(cards): pass section surface context"
```

### Task 3: Thread section context through client renderers

**Files:**

- Modify: `src/blocks/DownloadList/Component.tsx`
- Modify: `src/blocks/DownloadList/DownloadListClient.tsx`
- Modify: `src/blocks/MediaCarousel/Component.tsx`
- Modify: `src/blocks/MediaCarousel/MediaCarouselClient.tsx`
- Modify: `src/blocks/ProgramGrid/Component.tsx`
- Modify: `src/blocks/ProgramGrid/ProgramGridClient.tsx`
- Modify: `src/components/profile-carousel.tsx`
- Modify: `src/components/profile-carousel-client.tsx`
- Modify: `src/components/profile-carousel-card.tsx`
- Test: `tests/int/card-block-renderers.int.spec.tsx`
- Test: `tests/int/profile-carousel.int.spec.ts`

**Interfaces:**

- Consumes: `BlockBackground` and `resolveCardSurface(value, sectionBackground)` from Task 1.
- Produces: `sectionBackground: BlockBackground` on each relevant client component and card helper.

- [ ] **Step 1: Add failing client-boundary rendering assertions**

Extend `tests/int/card-block-renderers.int.spec.tsx`:

```ts
it('inherits a primary section across client-rendered default cards', () => {
  const markups = [
    renderToStaticMarkup(
      <DownloadListBlockComponent
        appearance={{ background: 'primary' }}
        displayMode="cards"
        downloads={[{ externalUrl: 'https://example.com/form.pdf', title: 'Application Form' }]}
      />,
    ),
    renderToStaticMarkup(
      <MediaCarouselBlockComponent
        appearance={{ background: 'primary' }}
        items={[{ media, title: 'Campus life' }]}
        title="Gallery"
      />,
    ),
    renderToStaticMarkup(
      <ProgramGridBlockComponent
        appearance={{ background: 'primary' }}
        programs={[{ title: 'MBBS' }]}
        title="Programmes"
      />,
    ),
    renderToStaticMarkup(
      <ProfileCarouselBlockComponent
        appearance={{ background: 'primary' }}
        profiles={[{ image: media, name: 'Dr Example' }]}
        title="Faculty"
      />,
    ),
  ]

  for (const html of markups) {
    expectInheritedDefaultSurface(html)
  }
})
```

Add a Profile Carousel assertion that overlay cards contain `from-black/80 via-black/50 to-transparent text-white` when the card background is default.

- [ ] **Step 2: Run client-boundary tests and confirm failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-block-renderers.int.spec.tsx tests/int/profile-carousel.int.spec.ts
```

Expected: FAIL because the semantic section value is not passed through client component props.

- [ ] **Step 3: Add semantic section-background props**

For Download List, Media Carousel, and Program Grid, add:

```ts
import type { BlockBackground } from '@/blocks/shared/blockAppearance'

type ClientProps = {
  sectionBackground: BlockBackground
  // existing props remain unchanged
}
```

Pass the value from each server block:

```tsx
<ClientComponent
  sectionBackground={appearance?.background ?? 'none'}
  // existing props
/>
```

Pass it into card helpers and resolve with:

```ts
const surface = resolveCardSurface(item.cardBackground, sectionBackground)
```

Keep list and compact Download List variants unchanged because they are not configurable card surfaces.

- [ ] **Step 4: Propagate section context through Profile Carousel**

Add `sectionBackground: BlockBackground` to `ProfileCarouselClient` and `ProfileCarouselCard`. From `ProfileCarousel`, pass:

```tsx
sectionBackground={appearance?.background ?? 'none'}
```

Resolve the surface in `ProfileCarouselCard` with:

```ts
const surface = resolveCardSurface(profile.cardBackground, sectionBackground)
```

Use `surface.overlay` only for the overlay content layer. The card wrapper remains `bg-transparent text-current` for a default surface.

- [ ] **Step 5: Run client-boundary tests and confirm success**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-block-renderers.int.spec.tsx tests/int/profile-carousel.int.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit client-renderer propagation**

```bash
git add src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/DownloadListClient.tsx src/blocks/MediaCarousel/Component.tsx src/blocks/MediaCarousel/MediaCarouselClient.tsx src/blocks/ProgramGrid/Component.tsx src/blocks/ProgramGrid/ProgramGridClient.tsx src/components/profile-carousel.tsx src/components/profile-carousel-client.tsx src/components/profile-carousel-card.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/profile-carousel.int.spec.ts
git commit -m "fix(cards): inherit client section colors"
```

### Task 4: Verify the complete visual contract

**Files:**

- Modify only if required by a verified assertion: files already listed in Tasks 1–3.

**Interfaces:**

- Consumes: all Task 1–3 behavior.
- Produces: verified type-safe implementation with no schema migration or explicit-surface regression.

- [ ] **Step 1: Format touched source and test files**

Run:

```bash
pnpm exec prettier --write src/blocks/shared/blockAppearance.ts src/blocks/shared/cardSurface.ts src/blocks/AwardsList/Component.tsx src/blocks/BentoGrid/Component.tsx src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/DownloadListClient.tsx src/blocks/IconGrid/Component.tsx src/blocks/MediaCarousel/Component.tsx src/blocks/MediaCarousel/MediaCarouselClient.tsx src/blocks/NumberedSteps/Component.tsx src/blocks/ProgramGrid/Component.tsx src/blocks/ProgramGrid/ProgramGridClient.tsx src/blocks/ProgramMatrix/Component.tsx src/blocks/TestimonialGrid/Component.tsx src/components/content-highlights.tsx src/components/feature-matrix.tsx src/components/profile-carousel.tsx src/components/profile-carousel-client.tsx src/components/profile-carousel-card.tsx src/components/team-showcase.tsx tests/int/card-theme-contract.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/program-matrix.int.spec.tsx tests/int/profile-carousel.int.spec.ts
```

Expected: files are formatted without errors.

- [ ] **Step 2: Run focused card-surface tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-theme-contract.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/program-matrix.int.spec.tsx tests/int/profile-carousel.int.spec.ts
```

Expected: all selected test files pass.

- [ ] **Step 3: Run TypeScript and focused lint**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/shared/blockAppearance.ts src/blocks/shared/cardSurface.ts src/blocks/AwardsList/Component.tsx src/blocks/BentoGrid/Component.tsx src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/DownloadListClient.tsx src/blocks/IconGrid/Component.tsx src/blocks/MediaCarousel/Component.tsx src/blocks/MediaCarousel/MediaCarouselClient.tsx src/blocks/NumberedSteps/Component.tsx src/blocks/ProgramGrid/Component.tsx src/blocks/ProgramGrid/ProgramGridClient.tsx src/blocks/ProgramMatrix/Component.tsx src/blocks/TestimonialGrid/Component.tsx src/components/content-highlights.tsx src/components/feature-matrix.tsx src/components/profile-carousel.tsx src/components/profile-carousel-client.tsx src/components/profile-carousel-card.tsx src/components/team-showcase.tsx
```

Expected: both commands exit with code 0.

- [ ] **Step 4: Check the final diff**

Run:

```bash
git diff --check
git status --short
```

Expected: `git diff --check` produces no output, and status lists only the intended implementation and test files.

- [ ] **Step 5: Commit any verification-driven corrections**

If verification required source corrections, stage only those corrections and commit:

```bash
git add src tests/int
git commit -m "test(cards): cover inherited surfaces"
```

If no corrections remain, do not create an empty commit.
