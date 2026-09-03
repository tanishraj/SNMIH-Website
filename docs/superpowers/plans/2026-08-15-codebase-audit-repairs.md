# Codebase Audit Repairs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair every actionable audit finding so Payload admin controls match rendered behavior, all blocks have complete integration coverage, and authored application checks pass.

**Architecture:** Preserve the explicit per-block schema and renderer switches. Use generated Payload interfaces at renderer boundaries, keep legacy normalization inside block adapters, and add focused regression tests before each behavioral change.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16.2.10, React 19.2.7, TypeScript 5.7.3, Vitest 4.0.18, Playwright 1.58.2, Tailwind CSS 4.3.2.

## Global Constraints

- Preserve the existing Payload collection, access-control, and explicit block-registration architecture.
- Missing legacy `sticky` values must remain sticky; only an explicit `false` disables stickiness.
- Do not change visual styling merely to satisfy a brittle source-string assertion.
- Keep Reusable Section recursion prevention and renderer depth limits unchanged.
- Do not edit generated `src/payload-types.ts` manually.
- Remove the public `/my-route` example endpoint.
- Format every touched authored file with Prettier.

## File Structure

- `src/blocks/ContentHighlights/Component.tsx`: map every Content Highlights admin field into presentation props.
- `src/components/global/GlobalHeader.tsx`: own the sticky wrapper behavior derived from the active header block.
- `src/blocks/{TestimonialGrid,AwardsList,AboutSection}/Component.tsx`: expose generated-type-compatible block component props.
- `src/blocks/renderPageBlocks.tsx` and `src/blocks/renderLivePreviewPageBlocks.tsx`: retain exhaustive typed switches without escape casts.
- `tests/int/study-pathways.int.spec.tsx`: own Study Pathways schema, rendering, and registration contracts.
- `public/block-thumbnails/study-pathways.jpg`: generated admin picker asset.
- `tests/int/page-blocks.int.spec.ts`, `tests/int/system-page-blocks.int.spec.ts`, `docs/architecture/feature-inventory.md`, and `docs/guides/blocks.md`: canonical block inventory.
- `src/blocks/shared/contentStyles.ts` and related tests: one shared typography contract.
- `src/blocks/StatsStrip/AnimatedMetricValue.tsx`: reduced-motion-safe metric state.
- `src/components/event-gallery-viewer.tsx`: event-driven autoplay completion.
- `src/app/(frontend)/error.tsx`: framework-native internal navigation.
- `eslint.config.mjs`: exclude checked-in non-product tooling.

---

### Task 1: Repair Content Highlights and Header admin contracts

**Files:**

- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `src/blocks/ContentHighlights/Component.tsx`
- Modify: `tests/int/global-header.int.spec.ts`
- Modify: `src/components/global/GlobalHeader.tsx`

**Interfaces:**

- Consumes: `ContentHighlightsProps['accentTitle']`, `Header['layout']`.
- Produces: rendered Content Highlights accent titles and `GlobalHeader` behavior where `sticky !== false` is sticky.

- [ ] **Step 1: Add failing Content Highlights rendering coverage**

Add this test inside the existing `describe('Content Highlights', ...)`:

```tsx
it('renders the editor-authored accent title', () => {
  const html = renderToStaticMarkup(
    <ContentHighlightsBlockComponent
      accentTitle="worth exploring."
      items={[{ title: 'Research' }]}
      title="Content"
    />,
  )

  expect(html).toContain('<span class="block font-[inherit]">Content</span>')
  expect(html).toContain('<em class="block font-[inherit]">worth exploring.</em>')
})
```

- [ ] **Step 2: Run the focused test and verify the regression**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx`

Expected: FAIL because `worth exploring.` is absent.

- [ ] **Step 3: Pass `accentTitle` through the block adapter**

Add the field to `ContentHighlightsBlockLike`, destructure it, and pass the trimmed value:

```tsx
type ContentHighlightsBlockLike = {
  accentTitle?: string | null
  // existing fields remain unchanged
}

export function ContentHighlightsBlockComponent({
  accentTitle,
  // existing props remain unchanged
}: ContentHighlightsBlockLike) {
  // existing normalization remains unchanged

  return (
    <>
      <ContentHighlights
        accentTitle={accentTitle?.trim() || undefined}
        // existing props remain unchanged
      />
      <BlockFooterActions actions={footerActions} />
    </>
  )
}
```

- [ ] **Step 4: Add failing sticky enabled, disabled, and legacy coverage**

Refactor the existing global-header test fixture into a helper, then assert:

```tsx
const renderHeader = (sticky?: boolean) =>
  renderToStaticMarkup(
    createElement(GlobalHeader, {
      header: {
        layout: [
          {
            blockType: 'headerNavbar12',
            logoMode: 'siteDefault',
            menuItems: [],
            navAlignment: 'center',
            size: 'default',
            ...(sticky === undefined ? {} : { sticky }),
          },
        ],
      } as never,
      stickyTopOffset: 'calc(3rem + 3rem)',
    }),
  )

expect(renderHeader()).toContain('data-global-header-sticky="true"')
expect(renderHeader(true)).toContain('position:sticky')
expect(renderHeader(false)).toContain('data-global-header-sticky="false"')
expect(renderHeader(false)).not.toContain('position:sticky')
expect(renderHeader(false)).not.toContain('top:calc(3rem + 3rem)')
```

- [ ] **Step 5: Make the active Header Navbar sticky setting authoritative**

In `GlobalHeader`, derive and expose the state:

```tsx
const firstBlock = header.layout[0]
const isSticky = firstBlock?.blockType !== 'headerNavbar12' || firstBlock.sticky !== false

return (
  <div
    data-global-header="true"
    data-global-header-sticky={isSticky ? 'true' : 'false'}
    style={isSticky ? { position: 'sticky', top: stickyTopOffset, zIndex: 30 } : undefined}
  >
    {renderHeaderBlocks(header.layout, { siteLogo, siteName })}
  </div>
)
```

- [ ] **Step 6: Run both focused contracts**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx tests/int/global-header.int.spec.ts`

Expected: both files PASS.

- [ ] **Step 7: Commit the contract repairs**

```bash
git add tests/int/content-highlights.int.spec.tsx src/blocks/ContentHighlights/Component.tsx tests/int/global-header.int.spec.ts src/components/global/GlobalHeader.tsx
git commit -m "fix(blocks): honor configured content"
```

---

### Task 2: Remove renderer type escape hatches

**Files:**

- Modify: `src/blocks/TestimonialGrid/Component.tsx`
- Modify: `src/blocks/AwardsList/Component.tsx`
- Modify: `src/blocks/AboutSection/Component.tsx`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**

- Consumes: generated `TestimonialGridBlock`, `AwardsListBlock`, and `AboutSectionBlock` interfaces.
- Produces: component props assignable directly from the discriminated `Page['layout']` union.

- [ ] **Step 1: Add a source contract rejecting renderer casts**

In the page pipeline test, add:

```ts
it('keeps every page renderer branch type-safe', () => {
  const publicRenderer = readFileSync('src/blocks/renderPageBlocks.tsx', 'utf8')
  const liveRenderer = readFileSync('src/blocks/renderLivePreviewPageBlocks.tsx', 'utf8')

  for (const source of [publicRenderer, liveRenderer]) {
    expect(source).not.toContain('block as any')
    expect(source).not.toContain('no-explicit-any')
  }
})
```

- [ ] **Step 2: Verify the source contract fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts`

Expected: FAIL on the existing three casted branches.

- [ ] **Step 3: Derive component item types from generated block types**

Replace manually duplicated row shapes with generated indexed access types. Use this pattern in each component:

```ts
import type {
  AboutSectionBlock,
  AwardsListBlock,
  Media,
  TestimonialGridBlock,
} from '@/payload-types'

type Testimonial = NonNullable<TestimonialGridBlock['testimonials']>[number]
type AwardItem = NonNullable<AwardsListBlock['awards']>[number]
type ListItem = NonNullable<AboutSectionBlock['listItems']>[number]
type StatItem = NonNullable<AboutSectionBlock['stats']>[number]
type ValueItem = NonNullable<AboutSectionBlock['values']>[number]
type ImageDetail = NonNullable<AboutSectionBlock['imageDetail']>
```

Keep each existing `*BlockLike` adapter type, but source shared properties from the generated type with `Pick` and widen only the legacy-normalized media/action fields:

```ts
type AwardsListBlockLike = Pick<
  AwardsListBlock,
  | 'accentTitle'
  | 'appearance'
  | 'awards'
  | 'contentAlignment'
  | 'description'
  | 'eyebrow'
  | 'size'
  | 'title'
  | 'variant'
> & {
  actions?: CmsActionValue[] | null
  footerActions?: CmsActionValue[] | null
}
```

Apply the equivalent explicit `Pick` union to Testimonial Grid and About Section.

- [ ] **Step 4: Remove the six cast/suppression lines**

Use direct spreads in both renderers:

```tsx
case 'testimonialGrid':
  return wrap(<TestimonialGridBlockComponent {...block} />)
case 'awardsList':
  return wrap(<AwardsListBlockComponent {...block} />)
case 'aboutSection':
  return wrap(<AboutSectionBlockComponent {...block} />)
```

Use the same direct props in live preview while retaining `key={key}`.

- [ ] **Step 5: Verify the generated-type boundary**

Run: `pnpm exec tsc --noEmit`

Expected: PASS without `any` casts.

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/about-section.int.spec.tsx`

Expected: PASS except any independently stale style assertion addressed in Task 5.

- [ ] **Step 6: Commit the type repair**

```bash
git add src/blocks/TestimonialGrid/Component.tsx src/blocks/AwardsList/Component.tsx src/blocks/AboutSection/Component.tsx src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx tests/int/page-blocks.int.spec.ts
git commit -m "refactor(blocks): type renderer boundaries"
```

---

### Task 3: Complete Study Pathways integration

**Files:**

- Create: `tests/int/study-pathways.int.spec.tsx`
- Create: `public/block-thumbnails/study-pathways.jpg`
- Modify: `src/collections/Pages.ts`
- Modify: `src/blocks/StudyPathways/Component.tsx`

**Interfaces:**

- Consumes: `StudyPathwaysBlock`, `StudyPathwaysBlockComponent`, the Pages and Reusable Sections block fields, and the thumbnail manifest.
- Produces: focused schema/rendering coverage and a 1600×900 JPEG admin asset.

- [ ] **Step 1: Add the Study Pathways schema contract**

Create the test file with a recursive `findNamedField` helper and assertions equivalent to:

```tsx
expect(StudyPathwaysBlock).toMatchObject({
  interfaceName: 'StudyPathwaysBlock',
  slug: 'studyPathways',
  labels: { singular: 'Study Pathways', plural: 'Study Pathways' },
})
expect(findNamedField(StudyPathwaysBlock.fields, 'pathways')).toMatchObject({
  minRows: 2,
  maxRows: 4,
  required: true,
  type: 'array',
})
expect(selectValues('cardSplit')).toEqual(['60-40', 'equal', '40-60', '30-30-60', '60-30-30'])
expect(selectValues('cardHeight')).toEqual(['compact', 'default', 'comfortable'])
expect(selectValues('contentAlignment')).toEqual(['left', 'center', 'right'])
```

- [ ] **Step 2: Add public rendering and data-normalization cases**

Use `renderToStaticMarkup` with deterministic fake Media objects. Cover:

```tsx
const twoCards = renderToStaticMarkup(
  <StudyPathwaysBlockComponent
    accentTitle="direction."
    cardSplit="60-40"
    pathways={[pathway(1), pathway(2)]}
    title="Study"
  />,
)
expect(twoCards).toContain('data-study-pathways="true"')
expect(twoCards).toContain('lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]')
expect(twoCards).toContain('<em class="block font-[inherit]">direction.</em>')

const threeCards = renderToStaticMarkup(
  <StudyPathwaysBlockComponent
    cardSplit="30-30-60"
    pathways={[pathway(1), pathway(2), pathway(3)]}
  />,
)
expect(threeCards).toContain('lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(18rem,2fr)]')
```

Also assert four-card span behavior, stacked headers, center/right alignment, compact/comfortable heights, overlay attributes, valid custom links, blank-row filtering, and `null` for no usable pathways.

- [ ] **Step 3: Add registration, type, fixture, and manifest coverage**

Read the relevant source files and assert `studyPathways` is present in Pages, Reusable Sections, both renderers, `src/payload-types.ts`, thumbnail definitions, and thumbnail fixtures.

- [ ] **Step 4: Run the new test file**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/study-pathways.int.spec.tsx`

Expected: rendering/schema tests PASS; the thumbnail file check remains covered by `block-thumbnails.int.spec.ts` and fails until Step 5.

- [ ] **Step 5: Generate only the missing thumbnail**

Run: `BLOCK_THUMBNAIL_SLUG=studyPathways pnpm generate:block-thumbnails`

Expected: `✓ studyPathways -> public/block-thumbnails/study-pathways.jpg`.

- [ ] **Step 6: Validate exact asset metadata and block coverage**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/study-pathways.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts`

Expected: all three files PASS, including JPEG format and 1600×900 dimensions.

- [ ] **Step 7: Format the newly added block integration**

Run: `pnpm exec prettier --write src/collections/Pages.ts src/blocks/StudyPathways/Component.tsx tests/int/study-pathways.int.spec.tsx`

Expected: Prettier reports all three files formatted.

- [ ] **Step 8: Commit Study Pathways completion**

```bash
git add tests/int/study-pathways.int.spec.tsx public/block-thumbnails/study-pathways.jpg src/collections/Pages.ts src/blocks/StudyPathways/Component.tsx
git commit -m "test(study-pathways): complete integration"
```

---

### Task 4: Align block inventory tests and operator documentation

**Files:**

- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `tests/int/program-matrix.int.spec.tsx`
- Modify: `tests/int/editorial-reasons.int.spec.tsx`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `docs/guides/blocks.md`

**Interfaces:**

- Consumes: current 48-entry Pages block list and 47-entry Reusable Sections list.
- Produces: one consistent source/test/operator inventory.

- [ ] **Step 1: Replace stale page-count expectations**

Change page choice assertions to 48 and explicitly include the newest block:

```ts
expect(registeredSlugs).toHaveLength(48)
expect(registeredSlugs).toContain('studyPathways')
```

Use the same 48 count in system block registration coverage. Keep reusable parity dynamic:

```ts
expect(reusableSectionSlugs.slice().sort()).toEqual(
  pageSlugs.filter((slug) => slug !== 'reusableSection').sort(),
)
expect(reusableSectionSlugs).toHaveLength(47)
```

- [ ] **Step 2: Update documentation assertions to the canonical wording**

In Program Matrix and Editorial Reasons tests, replace `Normal Pages register 43 choices` with `Normal Pages register 48 choices`.

- [ ] **Step 3: Correct the maintained feature inventory**

Update the Pages table row from `43-block layouts` to `48-block layouts`. Update the prose count to 48 and insert `Study Pathways` after `Event Gallery`, matching source order.

- [ ] **Step 4: Complete the operator block catalog**

Add these rows in source order:

```markdown
| Banner CTA | Image-backed conversion banner | Media overlay, alignment, height, and section actions |
| Academic Programmes | Programme cards and pathways | Responsive columns, section actions, and independent card backgrounds |
| Study Pathways | Two-to-four image-led pathway cards | Configurable split proportions, overlays, links, and card heights |
| Breadcrumb | Standalone page trail | Uses automatic hierarchy or editor-authored breadcrumb items |
| Accreditation Cards | Accreditation and certification summary | Two-to-four columns with shared semantic card and icon treatments |
```

- [ ] **Step 5: Verify inventory contracts**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/program-matrix.int.spec.tsx tests/int/editorial-reasons.int.spec.tsx`

Expected: count, parity, and documentation assertions PASS except the style assertion handled in Task 5.

- [ ] **Step 6: Commit inventory alignment**

```bash
git add tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/program-matrix.int.spec.tsx tests/int/editorial-reasons.int.spec.tsx docs/architecture/feature-inventory.md docs/guides/blocks.md
git commit -m "docs(blocks): sync 48-block inventory"
```

---

### Task 5: Reconcile shared style contracts without visual regressions

**Files:**

- Modify: `tests/int/content-style-parity.int.spec.ts`
- Modify: `tests/int/editorial-reasons.int.spec.tsx`
- Modify: `tests/int/about-section.int.spec.tsx`
- Modify: `tests/int/theme-contracts.int.spec.ts`
- Test: `src/blocks/shared/contentStyles.ts`
- Test: `src/blocks/TabsContent/TabsContentClient.tsx`

**Interfaces:**

- Consumes: `contentItemDescriptionClasses = 'text-sm leading-5 text-current/70'` and rendered semantic attributes/classes.
- Produces: resilient tests for the current shared typography and tab active-state contracts.

- [ ] **Step 1: Make shared typography tests assert the exported contract**

Update the stale expected string in `content-style-parity.int.spec.ts`:

```ts
expect(contentItemDescriptionClasses).toBe('text-sm leading-5 text-current/70')
```

Update Editorial Reasons to assert the same rendered class. For About Section, assert its actual responsive description contract:

```ts
expect(html).toContain('text-xs leading-6 text-current/75 sm:text-sm sm:leading-6')
```

- [ ] **Step 2: Replace the Tabs source-format assertion with behavior coverage**

Remove the nested-ternary substring expectation from `theme-contracts.int.spec.ts`. Add or extend `tests/int/tabs-content-active-color.int.spec.ts` to render a light-surface and brand-surface Tabs Content instance and assert:

```ts
expect(lightHtml).toContain('border-primary text-primary')
expect(brandHtml).toContain('border-primary-foreground text-primary-foreground')
```

If server rendering cannot expose the active client state, assert the full semantic class literals independently rather than the exact ternary indentation:

```ts
expect(tabsSource).toContain("'border-primary text-primary'")
expect(tabsSource).toContain("'border-primary-foreground text-primary-foreground'")
```

- [ ] **Step 3: Run the four previously failing style files**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/content-style-parity.int.spec.ts tests/int/editorial-reasons.int.spec.tsx tests/int/about-section.int.spec.tsx tests/int/theme-contracts.int.spec.ts tests/int/tabs-content-active-color.int.spec.ts`

Expected: all files PASS with no production visual change.

- [ ] **Step 4: Commit resilient style contracts**

```bash
git add tests/int/content-style-parity.int.spec.ts tests/int/editorial-reasons.int.spec.tsx tests/int/about-section.int.spec.tsx tests/int/theme-contracts.int.spec.ts tests/int/tabs-content-active-color.int.spec.ts
git commit -m "test(styles): align shared contracts"
```

---

### Task 6: Resolve React and Next.js lint failures

**Files:**

- Modify: `src/blocks/StatsStrip/AnimatedMetricValue.tsx`
- Modify: `tests/int/stats-strip-render.int.spec.ts`
- Modify: `src/components/event-gallery-viewer.tsx`
- Modify: `tests/int/event-gallery-viewer.int.spec.tsx`
- Modify: `src/app/(frontend)/error.tsx`

**Interfaces:**

- Consumes: browser `matchMedia`, `IntersectionObserver`, and Event Gallery navigation state.
- Produces: effect-safe metric rendering, pure autoplay transition logic, and Next-native internal navigation.

- [ ] **Step 1: Preserve reduced-motion behavior with a failing lint-oriented test**

Keep the existing final-value test and add a preference-change test by capturing the `matchMedia` change listener. After invoking it with `{ matches: true }`, assert the displayed value immediately becomes final.

- [ ] **Step 2: Derive the visible metric without effect state writes**

Remove both `setDisplayValue(value)` branches. Do not start observation or animation while reduced motion is enabled:

```tsx
useEffect(() => {
  if (prefersReducedMotion) return
  // existing IntersectionObserver setup
}, [prefersReducedMotion, triggerOnce])

useEffect(() => {
  if (prefersReducedMotion || !hasStarted) return
  // existing interval animation
}, [durationMs, hasStarted, prefersReducedMotion, value])

const renderedValue = prefersReducedMotion ? value : displayValue
const text = `${prefix ?? ''}${renderedValue}${suffix ?? ''}`
```

Remove the unnecessary `useMemo` import and memo.

- [ ] **Step 3: Extract and test Event Gallery autoplay decisions**

Export this pure helper:

```ts
export const getEventGalleryAutoplayAction = ({
  isAtEnd,
  isMultiple,
  isPlaying,
}: {
  isAtEnd: boolean
  isMultiple: boolean
  isPlaying: boolean
}) => {
  if (!isPlaying || !isMultiple) return 'idle' as const
  return isAtEnd ? ('stop' as const) : ('schedule' as const)
}
```

Test all three outcomes in `event-gallery-viewer.int.spec.tsx`.

- [ ] **Step 4: Move stop behavior into the scheduled timer callback**

Use the helper in the effect without synchronous state writes:

```tsx
useEffect(() => {
  const action = getEventGalleryAutoplayAction({ isAtEnd, isMultiple, isPlaying })
  if (action === 'idle') return

  autoplayRef.current = setTimeout(
    () => {
      if (action === 'stop') {
        setIsPlaying(false)
        return
      }
      goNext()
    },
    action === 'stop' ? 0 : AUTOPLAY_DELAY_MS,
  )

  return () => {
    if (autoplayRef.current) clearTimeout(autoplayRef.current)
  }
}, [goNext, isAtEnd, isMultiple, isPlaying])
```

- [ ] **Step 5: Replace the internal anchor with Next Link**

Add `import Link from 'next/link'` and replace the homepage `<a href="/">` with:

```tsx
<Link
  href="/"
  className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
>
  Go to homepage
</Link>
```

- [ ] **Step 6: Verify focused behavior and lint**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/stats-strip-render.int.spec.ts tests/int/event-gallery-viewer.int.spec.tsx tests/int/event-gallery-render.int.spec.tsx`

Expected: all files PASS.

Run: `pnpm exec eslint src/blocks/StatsStrip/AnimatedMetricValue.tsx src/components/event-gallery-viewer.tsx 'src/app/(frontend)/error.tsx'`

Expected: no errors.

- [ ] **Step 7: Commit React and Next repairs**

```bash
git add src/blocks/StatsStrip/AnimatedMetricValue.tsx tests/int/stats-strip-render.int.spec.ts src/components/event-gallery-viewer.tsx tests/int/event-gallery-viewer.int.spec.tsx src/app/'(frontend)'/error.tsx
git commit -m "fix(frontend): clear React lint errors"
```

---

### Task 7: Clean repository tooling and remove the example route

**Files:**

- Modify: `eslint.config.mjs`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/feature-matrix.int.spec.ts`
- Delete: `src/app/my-route/route.ts`
- Create: `tests/int/repository-hygiene.int.spec.ts`

**Interfaces:**

- Consumes: ESLint flat-config ignores and Next App Router filesystem routing.
- Produces: lint scoped to authored product code and no public starter example endpoint.

- [ ] **Step 1: Add repository hygiene assertions**

Create the test:

```ts
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('repository hygiene', () => {
  it('does not ship the starter example endpoint', () => {
    expect(existsSync('src/app/my-route/route.ts')).toBe(false)
  })

  it('excludes checked-in agent and preview tooling from product lint', () => {
    const source = readFileSync('eslint.config.mjs', 'utf8')
    expect(source).toContain("'.claude/**'")
    expect(source).toContain("'.superpowers/**'")
  })
})
```

- [ ] **Step 2: Verify the hygiene test fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/repository-hygiene.int.spec.ts`

Expected: both assertions FAIL.

- [ ] **Step 3: Remove the route and extend lint ignores**

Delete `src/app/my-route/route.ts`. Update the ignore array:

```js
ignores: [
  '.agents/**',
  '.claude/**',
  '.next/',
  '.superpowers/**',
  '.understand-anything/**',
  'src/payload-types.ts',
],
```

- [ ] **Step 4: Clear audited authored warnings**

Remove the unused suppression in `src/block-thumbnails/fixtures.tsx` and replace the remaining `any` fixture cast with the exact component prop type or a generated block type. Remove the unused `titleField` binding in `tests/int/feature-matrix.int.spec.ts` while preserving the assertion’s other field lookups. Replace the Event Gallery drag-end ternary expression with an explicit `if/else`.

- [ ] **Step 5: Verify repository hygiene and authored lint**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/repository-hygiene.int.spec.ts`

Expected: PASS.

Run: `pnpm exec eslint src tests scripts`

Expected: zero errors; only the accepted GTM recommendation may remain as a warning.

- [ ] **Step 6: Commit repository cleanup**

```bash
git add eslint.config.mjs src/block-thumbnails/fixtures.tsx tests/int/feature-matrix.int.spec.ts tests/int/repository-hygiene.int.spec.ts src/app/my-route/route.ts src/components/event-gallery-viewer.tsx
git commit -m "chore: remove starter audit debt"
```

---

### Task 8: Final formatting and verification

**Files:**

- Modify: only files reformatted by the approved repair.
- Test: all authored project source and integration tests.

**Interfaces:**

- Consumes: deliverables from Tasks 1–7.
- Produces: a clean, verified working tree ready for review.

- [ ] **Step 1: Format all changed authored files**

Run:

```bash
git diff --name-only HEAD~7 -- '*.ts' '*.tsx' '*.js' '*.mjs' '*.md' | xargs pnpm exec prettier --write
```

Expected: only repair files are formatted. If the commit count differs, derive the base from commit `6f9c731` with `git diff --name-only 6f9c731..HEAD`.

- [ ] **Step 2: Run TypeScript and authored lint**

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

Run: `pnpm exec eslint src tests scripts`

Expected: zero errors; document any intentionally retained warning.

- [ ] **Step 3: Run focused audit regression tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/content-highlights.int.spec.tsx \
  tests/int/global-header.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/system-page-blocks.int.spec.ts \
  tests/int/study-pathways.int.spec.tsx \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/content-style-parity.int.spec.ts \
  tests/int/about-section.int.spec.tsx \
  tests/int/editorial-reasons.int.spec.tsx \
  tests/int/theme-contracts.int.spec.ts \
  tests/int/stats-strip-render.int.spec.ts \
  tests/int/event-gallery-viewer.int.spec.tsx \
  tests/int/repository-hygiene.int.spec.ts
```

Expected: all focused files PASS.

- [ ] **Step 4: Run the full integration suite**

Run: `pnpm run test:int`

Expected: all non-database tests PASS. If MongoMemoryServer cannot bind a port, rerun with the required environment permission and report that infrastructure limitation separately.

- [ ] **Step 5: Check formatting and repository state**

Run: `pnpm exec prettier --check eslint.config.mjs src tests scripts docs/architecture docs/guides`

Expected: PASS.

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only intentional repair changes are present.

- [ ] **Step 6: Commit any final formatting-only changes**

```bash
git add eslint.config.mjs src tests scripts docs/architecture docs/guides public/block-thumbnails/study-pathways.jpg
git commit -m "style: format audit repairs"
```

Skip this commit when Step 1 produced no post-task diff.
