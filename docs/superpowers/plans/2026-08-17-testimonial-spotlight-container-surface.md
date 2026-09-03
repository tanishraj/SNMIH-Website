# Testimonial Spotlight Container Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add semantic background and optional outline controls to the complete inner image-and-content container of Testimonial Spotlight without changing its outer section controls or legacy rendering.

**Architecture:** Extend the existing shared card-background field factory so a consumer can relabel only its inherited option as `Match Section`, then use the existing `resolveCardSurface()` presentation helper inside Testimonial Spotlight. The outer `<section>` continues to own section appearance and spacing; the inner split wrapper owns container background, foreground, radius, clipping, outline, divider color, and diagnostics.

**Tech Stack:** Payload CMS 3.85 select fields and generated types, React 19 Server Components, Next.js 16 image rendering, Tailwind CSS 4 semantic utilities, Vitest server-render integration tests, Playwright thumbnail generation.

## Global Constraints

- Do not create a commit, stage files, unstage files, or alter the user's existing staging state.
- `containerBackground` options are exactly Match Section, Primary, Secondary, Muted, and Accent; the stored values remain `default`, `primary`, `secondary`, `muted`, and `accent`.
- `containerOutline` options are exactly None and Outline; newly authored blocks default to `outline`.
- Missing legacy values render as Match Section plus no outline.
- Container styling wraps the complete image-and-content split, never the outer section.
- Outer section appearance, border, padding, media side, crop, fill, size, and vertical-alignment contracts remain independent and unchanged.
- Reuse semantic surface, secondary-text, divider, and radius tokens; add no arbitrary colors and make no global theme CSS changes.
- Retain one person/message, media-first mobile and DOM order, server-only rendering, and no buttons or actions.

---

### Task 1: Add the Payload authoring controls

**Files:**

- Modify: `src/blocks/shared/cardThemeFields.ts`
- Modify: `src/blocks/TestimonialSpotlight/config.ts`
- Test: `tests/int/card-theme-contract.int.spec.ts`
- Test: `tests/int/testimonial-spotlight-config.int.spec.ts`

**Interfaces:**

- Consumes: existing `createCardBackgroundField(options?: CreateCardBackgroundFieldOptions): SelectField` and Payload `SelectField` contracts.
- Produces: `createCardBackgroundField({ defaultOptionLabel?: string })`, plus required `containerBackground` and `containerOutline` fields on `TestimonialSpotlightBlock`.

- [ ] **Step 1: Write the failing shared-field and block-schema tests**

Add this assertion to the existing `card theme contract` suite in `tests/int/card-theme-contract.int.spec.ts`:

```ts
it('allows a consumer-specific label for the inherited surface option', () => {
  expect(createCardBackgroundField({ defaultOptionLabel: 'Match Section' }).options).toEqual([
    { label: 'Match Section', value: 'default' },
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
    { label: 'Muted', value: 'muted' },
    { label: 'Accent', value: 'accent' },
  ])
})
```

In `tests/int/testimonial-spotlight-config.int.spec.ts`, extend the `expected` object inside `reuses shared appearance and the complete split-layout control set` with these contracts:

```ts
containerBackground: {
  defaultValue: 'default',
  labels: ['Match Section', 'Primary', 'Secondary', 'Muted', 'Accent'],
  values: ['default', 'primary', 'secondary', 'muted', 'accent'],
},
containerOutline: {
  defaultValue: 'outline',
  labels: ['None', 'Outline'],
  values: ['none', 'outline'],
},
```

Expand the field shape and assertions in that loop so labels are checked when present:

```ts
const field = getNamedField<{
  defaultValue?: string
  options?: Array<{ label: string; value: string }>
  required?: boolean
  type?: string
}>(fields, name)
expect(field?.type).toBe('select')
expect(field?.required).toBe(true)
expect(field?.defaultValue).toBe(contract.defaultValue)
expect(field?.options?.map(({ value }) => value)).toEqual(contract.values)
if ('labels' in contract) {
  expect(field?.options?.map(({ label }) => label)).toEqual(contract.labels)
}
```

- [ ] **Step 2: Run the schema tests and verify the new contracts fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-theme-contract.int.spec.ts tests/int/testimonial-spotlight-config.int.spec.ts
```

Expected: FAIL because `defaultOptionLabel` is not accepted and the Testimonial Spotlight theme tab does not contain `containerBackground` or `containerOutline`.

- [ ] **Step 3: Extend the shared field factory without changing existing consumers**

Update the option type and factory in `src/blocks/shared/cardThemeFields.ts`:

```ts
type CreateCardBackgroundFieldOptions = {
  adminDescription?: string
  defaultOptionLabel?: string
  label?: string
  name?: string
}

export const createCardBackgroundField = ({
  adminDescription = 'Default Card inherits the section background. Other choices use the active theme and automatically adjust card contrast.',
  defaultOptionLabel = 'Default Card',
  label = 'Background',
  name = 'cardBackground',
}: CreateCardBackgroundFieldOptions = {}): SelectField => ({
  name,
  label,
  type: 'select',
  defaultValue: 'default',
  required: true,
  options: [
    { label: defaultOptionLabel, value: 'default' },
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
    { label: 'Muted', value: 'muted' },
    { label: 'Accent', value: 'accent' },
  ],
  admin: {
    description: adminDescription,
  },
})
```

The default remains `Default Card`, so all existing callers and their tests keep identical labels and values.

- [ ] **Step 4: Add the two controls to Testimonial Spotlight**

Import the shared field factory in `src/blocks/TestimonialSpotlight/config.ts`:

```ts
import { createCardBackgroundField } from '@/blocks/shared/cardThemeFields'
```

Insert these fields immediately after `createBlockAppearanceFields()` in the Theme Settings tab:

```ts
createCardBackgroundField({
  adminDescription:
    'Match Section inherits the section surface. Other choices apply a semantic theme surface to the complete image and content container.',
  defaultOptionLabel: 'Match Section',
  label: 'Container Background',
  name: 'containerBackground',
}),
{
  name: 'containerOutline',
  label: 'Container Outline',
  type: 'select',
  defaultValue: 'outline',
  options: [
    { label: 'None', value: 'none' },
    { label: 'Outline', value: 'outline' },
  ],
  required: true,
} satisfies SelectField,
```

- [ ] **Step 5: Run the schema tests and verify they pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-theme-contract.int.spec.ts tests/int/testimonial-spotlight-config.int.spec.ts
```

Expected: both files PASS; the original `Default Card` factory contract also remains green.

### Task 2: Apply the surface and outline to the inner split wrapper

**Files:**

- Modify: `src/blocks/TestimonialSpotlight/Component.tsx`
- Test: `tests/int/testimonial-spotlight-render.int.spec.tsx`

**Interfaces:**

- Consumes: `resolveCardSurface(value, sectionBackground): CardSurfaceClasses`, `CardSurfaceValue`, `SectionEyebrowSurface`, and the existing section appearance resolver.
- Produces: `containerBackground?: CardSurfaceValue | null` and `containerOutline?: 'none' | 'outline' | null` component inputs; stable inner-wrapper attributes `data-testimonial-spotlight-container-background` and `data-testimonial-spotlight-container-outline`.

- [ ] **Step 1: Add failing renderer tests for semantic surfaces and wrapper ownership**

Add these helpers near `baseProps` in `tests/int/testimonial-spotlight-render.int.spec.tsx`:

```ts
const getTagWithAttribute = (html: string, attribute: string) =>
  html.match(new RegExp(`<[^>]+${attribute}="[^"]*"[^>]*>`))?.[0] ?? ''

const semanticSurfaces = [
  {
    background: 'default' as const,
    divider: 'border-current/10',
    eyebrow: 'subtle',
    secondary: 'text-current/70',
    surface: 'bg-transparent text-current',
  },
  {
    background: 'primary' as const,
    divider: 'border-primary-foreground/15',
    eyebrow: 'brand',
    secondary: 'text-primary-foreground/75',
    surface: 'bg-primary text-primary-foreground',
  },
  {
    background: 'secondary' as const,
    divider: 'border-secondary-foreground/15',
    eyebrow: 'subtle',
    secondary: 'text-secondary-foreground/70',
    surface: 'bg-secondary text-secondary-foreground',
  },
  {
    background: 'muted' as const,
    divider: 'border-border',
    eyebrow: 'subtle',
    secondary: 'text-muted-foreground',
    surface: 'bg-muted text-foreground',
  },
  {
    background: 'accent' as const,
    divider: 'border-accent-foreground/15',
    eyebrow: 'subtle',
    secondary: 'text-accent-foreground/70',
    surface: 'bg-accent text-accent-foreground',
  },
]
```

Add explicit authoring values to `baseProps` so normal new-block rendering exercises the approved framed result:

```ts
containerBackground: 'default' as const,
containerOutline: 'outline' as const,
```

In the existing `supports the %s fill contract` test, keep the edge-to-edge expectation and update the framed `containedFill` expectation:

```ts
if (mediaFillMode === 'edgeToEdge') {
  expect(html).toContain('px-4 pt-8 md:px-8 md:py-16 lg:px-12')
} else {
  expect(html).toContain('p-8 md:px-8 md:py-16 lg:px-12')
}
```

Add these tests inside the existing describe block:

```ts
it.each(semanticSurfaces)(
  'applies the $background semantic surface and outline to the complete inner split',
  ({ background, divider, eyebrow, secondary, surface }) => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        appearance: { ...baseProps.appearance, border: 'none' },
        containerBackground: background,
      }),
    )
    const sectionTag = getTagWithAttribute(html, 'data-testimonial-spotlight')
    const containerTag = getTagWithAttribute(
      html,
      'data-testimonial-spotlight-container-background',
    )

    expect(containerTag).toContain(
      `data-testimonial-spotlight-container-background="${background}"`,
    )
    expect(containerTag).toContain('data-testimonial-spotlight-container-outline="outline"')
    expect(containerTag).toContain(surface)
    expect(containerTag).toContain('border')
    expect(containerTag).toContain(divider)
    expect(containerTag).toContain('overflow-hidden rounded-[var(--radius)]')
    expect(html).toContain(secondary)
    expect(html).toContain(`data-section-eyebrow-surface="${eyebrow}"`)
    expect(sectionTag).not.toContain(surface)
    expect(sectionTag).not.toContain(divider)
  },
)

it('keeps missing legacy container values visually untreated', () => {
  const { containerBackground, containerOutline, ...legacyProps } = baseProps
  const html = renderToStaticMarkup(createElement(TestimonialSpotlightBlockComponent, legacyProps))
  const containerTag = getTagWithAttribute(html, 'data-testimonial-spotlight-container-background')

  expect(containerTag).toContain('data-testimonial-spotlight-container-background="default"')
  expect(containerTag).toContain('data-testimonial-spotlight-container-outline="none"')
  expect(containerTag).toContain('bg-transparent text-current')
  expect(containerTag).not.toContain(' rounded-[var(--radius)]')
  expect(containerTag).not.toMatch(/class="[^"]*\bborder\b/)
  expect(html).toContain('data-section-eyebrow-surface="subtle"')
})

it('allows the inner outline to be disabled without removing its explicit surface', () => {
  const html = renderToStaticMarkup(
    createElement(TestimonialSpotlightBlockComponent, {
      ...baseProps,
      containerBackground: 'primary',
      containerOutline: 'none',
    }),
  )
  const containerTag = getTagWithAttribute(html, 'data-testimonial-spotlight-container-background')

  expect(containerTag).toContain('bg-primary text-primary-foreground')
  expect(containerTag).toContain('data-testimonial-spotlight-container-outline="none"')
  expect(containerTag).not.toContain('border-primary-foreground/15')
})

it('preserves the legacy contained-fill spacing when container controls are missing', () => {
  const { containerBackground, containerOutline, ...legacyProps } = baseProps
  const html = renderToStaticMarkup(
    createElement(TestimonialSpotlightBlockComponent, {
      ...legacyProps,
      mediaFillMode: 'containedFill',
    }),
  )

  expect(html).toContain('pt-8 md:px-8 md:py-16 lg:px-12')
  expect(html).not.toContain('p-8 md:px-8 md:py-16 lg:px-12')
})
```

- [ ] **Step 2: Run the renderer test and verify the new contracts fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: FAIL because the component does not accept, resolve, or expose the container fields.

- [ ] **Step 3: Add the component inputs and semantic surface resolution**

Add these imports in `src/blocks/TestimonialSpotlight/Component.tsx`:

```ts
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import type { CardSurfaceValue } from '@/blocks/shared/cardThemeFields'
import { SectionEyebrow, type SectionEyebrowSurface } from '@/components/SectionEyebrow'
```

Replace the existing standalone `SectionEyebrow` import with the grouped import above. Add the inputs to `TestimonialSpotlightBlockLike`:

```ts
containerBackground?: CardSurfaceValue | null
containerOutline?: 'none' | 'outline' | null
```

Add this local resolver after the static class maps:

```ts
const resolveContainerEyebrowSurface = (
  containerBackground: CardSurfaceValue,
  sectionBackground: SectionEyebrowSurface,
): SectionEyebrowSurface => {
  if (containerBackground === 'default') return sectionBackground
  return containerBackground === 'primary' ? 'brand' : 'subtle'
}
```

Destructure `containerBackground` and `containerOutline` without assigning an authoring default:

```ts
containerBackground,
containerOutline,
```

Immediately after resolving `appearanceClasses`, move the existing `isFilled` declaration there and add the safe runtime normalization before `media` is resolved:

```ts
const isFilled = resolvedMediaFillMode !== 'contained'
const containerSurface = resolveCardSurface(containerBackground, appearanceClasses.background)
const resolvedContainerOutline = containerOutline === 'outline' ? 'outline' : 'none'
const hasContainerTreatment =
  containerSurface.value !== 'default' || resolvedContainerOutline === 'outline'
const usesJoinedColumns = isFilled || hasContainerTreatment
const containerEyebrowSurface = resolveContainerEyebrowSurface(
  containerSurface.value,
  appearanceClasses.background,
)
```

Remove the old `isFilled` declaration after the required-content guard so it is declared exactly once. Keep media validation before constructing markup.

- [ ] **Step 4: Apply typography contrast and joined-container spacing**

Change the eyebrow, supporting description, and designation markup to use the resolved inner surface:

```tsx
<SectionEyebrow surface={containerEyebrowSurface}>{resolvedEyebrow}</SectionEyebrow>
```

```tsx
<p className={cn(contentSectionDescriptionClasses, containerSurface.secondary)}>
  {resolvedDescription}
</p>
```

```tsx
<span className={cn('text-sm leading-5', containerSurface.secondary)}>{resolvedDesignation}</span>
```

Use `usesJoinedColumns` for the desktop gap so a surfaced or outlined contained layout forms the same joined image/content unit as the supplied reference:

```ts
usesJoinedColumns ? 'md:gap-0' : 'md:gap-12 lg:gap-16'
```

Resolve content padding before constructing `content`:

```ts
const contentPaddingClasses =
  resolvedMediaFillMode === 'edgeToEdge'
    ? 'px-4 pt-8 md:px-8 md:py-16 lg:px-12'
    : hasContainerTreatment
      ? 'p-8 md:px-8 md:py-16 lg:px-12'
      : resolvedMediaFillMode === 'containedFill'
        ? 'pt-8 md:px-8 md:py-16 lg:px-12'
        : undefined
```

Pass `contentPaddingClasses` directly to the content-column `cn()` call in place of the old `isFilled && (...)` expression. The legacy Match Section/no-outline path keeps the previous desktop gap and unframed `containedFill` spacing, while a treated contained or contained-fill wrapper receives the inner padding required by its visible edge.

- [ ] **Step 5: Put all container classes and diagnostics on the split wrapper**

Extend the `splitLayout` opening `<div>` as follows:

```tsx
<div
  className={cn(
    'grid items-stretch gap-8',
    gridTemplateClasses[resolvedMediaPosition],
    usesJoinedColumns ? 'md:gap-0' : 'md:gap-12 lg:gap-16',
    containerSurface.className,
    hasContainerTreatment && 'overflow-hidden rounded-[var(--radius)]',
    resolvedContainerOutline === 'outline' && ['border', containerSurface.divider],
  )}
  data-testimonial-spotlight-container-background={containerSurface.value}
  data-testimonial-spotlight-container-outline={resolvedContainerOutline}
>
```

Do not move `appearanceClasses.className`, section background diagnostics, or regular section spacing off the outer `<section>`.

- [ ] **Step 6: Run renderer tests and verify all layout contracts pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: PASS for hierarchy, image side, media fill, optional content, both render pipelines, all five container surfaces, outline on/off, and the legacy fallback.

### Task 3: Regenerate artifacts, document the operator contract, and verify the repository

**Files:**

- Modify: `src/payload-types.ts` (generated)
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/testimonial-spotlight.jpg` (generated)
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify if generated facts change: `.agents/skills/project-context/references/project-inventory.json`
- Verify: `.agents/skills/project-context/references/change-impact-map.md`

**Interfaces:**

- Consumes: the final Payload schema and Testimonial Spotlight component inputs from Tasks 1–2.
- Produces: generated `TestimonialSpotlightBlock` field types, an updated 1600×900 picker preview, and current operator/project knowledge.

- [ ] **Step 1: Update the production thumbnail fixture to demonstrate the framed container**

Change only the Testimonial Spotlight fixture in `src/block-thumbnails/fixtures.tsx`:

```tsx
testimonialSpotlight: (
  <TestimonialSpotlightBlockComponent
    appearance={{ background: 'none', border: 'none' }}
    containerBackground="muted"
    containerOutline="outline"
    description="A long-term commitment to education, healthcare, and service guides every institutional decision."
    designation="Founder"
    eyebrow="Message from management"
    image={{ alt: 'Institutional leader portrait', url: portrait }}
    mediaFillMode="containedFill"
    mediaPosition="left"
    personName="Shri Ravindra Kumar Singh"
    size="compact"
    testimonial="Our aim is to build an institution where education, healthcare, and service strengthen one another."
    title="Leadership with a long-term purpose."
  />
),
```

- [ ] **Step 2: Generate Payload types and verify the exact new type members**

Run:

```bash
pnpm generate:types
```

Expected: `TestimonialSpotlightBlock` in `src/payload-types.ts` contains:

```ts
containerBackground: 'default' | 'primary' | 'secondary' | 'muted' | 'accent'
containerOutline: 'none' | 'outline'
```

- [ ] **Step 3: Generate only the changed block thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=testimonialSpotlight pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/testimonial-spotlight.jpg` is regenerated as a 1600×900 JPEG showing a muted inner container with an outline around both the image and content; no unrelated thumbnail file changes.

- [ ] **Step 4: Update operator and project-context documentation**

Replace the Testimonial Spotlight row in `docs/guides/blocks.md` with:

```md
| Testimonial Spotlight | One image-led leadership message | One person per block; configurable image side, crop, fill, section appearance, spacing, vertical alignment, and independent semantic container background/outline; no actions |
```

Add this paragraph to the Shared Configuration and Presentation section of `.agents/skills/project-context/references/block-system.md`:

```md
Testimonial Spotlight keeps section appearance independent from its complete image-and-content container. The inner container supports Match Section/Primary/Secondary/Muted/Accent semantic surfaces and an optional divider-colored outline; missing legacy values render as Match Section with no outline.
```

- [ ] **Step 5: Format the touched source, tests, plan, and documentation**

Run:

```bash
pnpm exec prettier --write src/blocks/shared/cardThemeFields.ts src/blocks/TestimonialSpotlight/config.ts src/blocks/TestimonialSpotlight/Component.tsx src/block-thumbnails/fixtures.tsx tests/int/card-theme-contract.int.spec.ts tests/int/testimonial-spotlight-config.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx docs/guides/blocks.md .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-17-testimonial-spotlight-block-design.md docs/superpowers/plans/2026-08-17-testimonial-spotlight-container-surface.md
```

Expected: Prettier completes without errors and only formatting-related changes within the listed text files.

- [ ] **Step 6: Run focused block and shared-surface contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-theme-contract.int.spec.ts tests/int/testimonial-spotlight-config.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/page-blocks.int.spec.ts
```

Expected: all selected tests PASS.

- [ ] **Step 7: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/shared/cardThemeFields.ts src/blocks/TestimonialSpotlight/config.ts src/blocks/TestimonialSpotlight/Component.tsx src/block-thumbnails/fixtures.tsx tests/int/card-theme-contract.int.spec.ts tests/int/testimonial-spotlight-config.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx
git diff --check
```

Expected: TypeScript, targeted ESLint, and whitespace validation all exit successfully.

- [ ] **Step 8: Refresh and check generated project knowledge**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
pnpm run test:project-context
```

Expected: the inventory is current, all project-context tests PASS, and only `.agents/skills/project-context/references/project-inventory.json` changes if the generator records the new schema facts. A stale knowledge-graph commit hash may remain a non-blocking warning, as documented by the skill.

- [ ] **Step 9: Inspect the final impact and staging state without mutating either**

Run:

```bash
git status --short
git diff -- src/blocks/shared/cardThemeFields.ts src/blocks/TestimonialSpotlight/config.ts src/blocks/TestimonialSpotlight/Component.tsx src/payload-types.ts src/block-thumbnails/fixtures.tsx public/block-thumbnails/testimonial-spotlight.jpg tests/int/card-theme-contract.int.spec.ts tests/int/testimonial-spotlight-config.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx docs/guides/blocks.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
```

Expected: no section-level theme CSS, block registries, or renderer registrations changed; the inner wrapper alone owns container surface/outline classes; existing staged changes remain staged and new edits remain in their naturally produced state. Do not run `git add`, `git restore`, `git reset`, or `git commit`.

- [ ] **Step 10: Run the broader integration suite and report environmental exceptions precisely**

Run:

```bash
pnpm test:int
```

Expected: all affected Testimonial Spotlight, shared-card, page-block, thumbnail, documentation, and project-context contracts PASS. If the existing sandbox-only Mongo memory-server `EPERM` failures or the unrelated SNMIH precision contract recur, report them separately with their exact test names; do not expand this feature or alter theme tokens to mask unrelated baseline failures.
