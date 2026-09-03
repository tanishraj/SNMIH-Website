# Testimonial Spotlight Section Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional, aligned section header and section/footer actions around Testimonial Spotlight while preserving its existing image-and-message container and legacy output.

**Architecture:** Extend the existing flat Payload block schema with prefixed section-copy fields, shared action arrays, and one alignment select; do not rename or nest current testimonial fields. The server component resolves the new optional content, keeps its current render branch when no valid section content exists, and uses a separate standard-section branch to place a shared header before the untouched split composition and shared footer actions after it. Heading tags adapt semantically while retaining current visual classes.

**Tech Stack:** Payload CMS 3.85, React 19 Server Components, Next.js 16, Tailwind CSS 4, TypeScript 5.7, Vitest integration tests, Playwright thumbnail generation.

## Global Constraints

- Preserve the existing `testimonialSpotlight` slug, interface name, registrations, renderer cases, and testimonial field names.
- Preserve the current image-and-message layout, inner content order, typography, media behavior, container surface, outline, radius, clipping, and required-content guard.
- Add optional `sectionEyebrow`, `sectionTitle`, `sectionDescription`, `actions`, and `footerActions` fields without a data migration.
- Build both action arrays with `createContentActionsField()` and limit each to two rows.
- Add required `sectionContentAlignment` values `left` and `center`, defaulting and falling back to `center`.
- Render no section header wrapper, action markup, footer spacing, or heading-level change when all new content is absent or invalid.
- Resolve the outer eyebrow against the outer section appearance and keep the existing inner eyebrow resolved against the container surface.
- Render the outer title as `h2`; render the inner title as visually identical `h3` only when the outer title exists, otherwise retain `h2`.
- Keep footer actions centered and contained even when media is edge-to-edge.
- Do not modify global theme CSS or shared action, spacing, typography, or surface primitives.

---

### Task 1: Add the section-content schema and generated types

**Files:**

- Modify: `tests/int/testimonial-spotlight-config.int.spec.ts:44-135`
- Modify: `src/blocks/TestimonialSpotlight/config.ts:1-145`
- Modify (generated): `src/payload-types.ts:914-939`

**Interfaces:**

- Consumes: `createContentActionsField(options)` from `src/blocks/shared/contentActionsFields.ts` and the current flat Testimonial Spotlight Content and Theme Settings tabs.
- Produces: optional `sectionEyebrow`, `sectionTitle`, `sectionDescription`, `actions`, and `footerActions` properties plus required `sectionContentAlignment: 'left' | 'center'` in `TestimonialSpotlightBlock`.

- [ ] **Step 1: Update the config test with the complete additive field order**

In `tests/int/testimonial-spotlight-config.int.spec.ts`, replace the content-field name expectation with:

```ts
expect(contentFields.map((field) => (field as { name?: string }).name)).toEqual([
  'sectionEyebrow',
  'sectionTitle',
  'sectionDescription',
  'actions',
  'image',
  'eyebrow',
  'title',
  'testimonial',
  'description',
  'personName',
  'designation',
  'footerActions',
])
```

After the existing testimonial optionality assertion, add:

```ts
for (const name of ['sectionEyebrow', 'sectionTitle', 'sectionDescription']) {
  expect(getNamedField<{ required?: boolean }>(contentFields, name)?.required).toBeUndefined()
}

for (const [name, label] of [
  ['actions', 'Section Actions'],
  ['footerActions', 'Footer Actions'],
] as const) {
  expect(
    getNamedField<{ label?: string; maxRows?: number; type?: string }>(contentFields, name),
  ).toMatchObject({
    label,
    maxRows: 2,
    type: 'array',
  })
}
```

Remove the old assertions that `actions` and `footerActions` are undefined.

- [ ] **Step 2: Add the alignment contract to the Theme Settings test**

Add this entry to the `expected` object in the Theme Settings test:

```ts
sectionContentAlignment: {
  defaultValue: 'center',
  values: ['left', 'center'],
},
```

Replace the final alignment exclusion with:

```ts
expect(getNamedField(fields, 'layoutMode')).toBeUndefined()
expect(getNamedField(fields, 'contentAlignment')).toBeUndefined()
expect(
  getNamedField<{ label?: string }>(fields, 'sectionContentAlignment')?.label,
).toBe('Section Content Alignment')
```

- [ ] **Step 3: Run the config test and verify the new contracts fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-config.int.spec.ts
```

Expected: FAIL because none of the five section-content fields or `sectionContentAlignment` exist.

- [ ] **Step 4: Add shared action-field support and the section fields**

Add this import to `src/blocks/TestimonialSpotlight/config.ts`:

```ts
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
```

At the beginning of the Content tab's `fields` array, before `image`, add:

```ts
{
  name: 'sectionEyebrow',
  label: 'Section Eyebrow',
  type: 'text',
  admin: { description: 'Small label above the section title.' },
},
{
  name: 'sectionTitle',
  label: 'Section Title',
  type: 'text',
},
{
  name: 'sectionDescription',
  label: 'Section Description',
  type: 'textarea',
},
createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
```

After the existing `designation` field, add:

```ts
createContentActionsField({
  name: 'footerActions',
  label: 'Footer Actions',
  maxRows: 2,
}),
```

- [ ] **Step 5: Add the section alignment field**

Immediately after `createBlockAppearanceFields()` in the Theme Settings tab, add:

```ts
{
  name: 'sectionContentAlignment',
  label: 'Section Content Alignment',
  type: 'select',
  defaultValue: 'center',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
  ],
  required: true,
} satisfies SelectField,
```

- [ ] **Step 6: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: command exits successfully and `TestimonialSpotlightBlock` contains the new section fields, shared nested action rows, and:

```ts
sectionContentAlignment: 'left' | 'center'
```

- [ ] **Step 7: Run the config test and verify the schema passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-config.int.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Commit the schema task**

```bash
git add src/blocks/TestimonialSpotlight/config.ts src/payload-types.ts tests/int/testimonial-spotlight-config.int.spec.ts
git commit -m "feat(testimonial): add section fields"
```

### Task 2: Render the optional section header and actions

**Files:**

- Modify: `tests/int/testimonial-spotlight-render.int.spec.tsx:11-352`
- Modify: `src/blocks/TestimonialSpotlight/Component.tsx:1-263`

**Interfaces:**

- Consumes: `CmsActionValue`, `resolveCmsActions()`, `ContentActions`, `BlockFooterActions`, outer `appearanceClasses.background`, and the unchanged `splitLayout` JSX.
- Produces: optional section-header markup before `splitLayout`, centered footer actions after it, `data-testimonial-spotlight-section-header`, and `data-testimonial-spotlight-section-alignment` diagnostics.

- [ ] **Step 1: Add a failing content-order and action-rendering test**

Add this test after the existing exact-hierarchy test in `tests/int/testimonial-spotlight-render.int.spec.tsx`:

```tsx
it('renders section content before the existing composition and footer actions after it', () => {
  const html = renderToStaticMarkup(
    createElement(TestimonialSpotlightBlockComponent, {
      ...baseProps,
      actions: [{ label: 'Meet our leadership', linkType: 'custom', url: '/leadership' }],
      footerActions: [
        {
          label: 'Contact the college',
          linkType: 'custom',
          mode: 'button',
          showArrow: true,
          url: '/contact',
          variant: 'primary',
        },
      ],
      sectionDescription: 'Perspectives from the people guiding our institution.',
      sectionEyebrow: 'Leadership',
      sectionTitle: 'Messages from our leadership',
    }),
  )

  const headerIndex = html.indexOf('data-testimonial-spotlight-section-header="true"')
  const compositionIndex = html.indexOf('data-testimonial-spotlight-container-background')
  const footerIndex = html.indexOf('Contact the college')

  expect(headerIndex).toBeGreaterThan(-1)
  expect(headerIndex).toBeLessThan(compositionIndex)
  expect(compositionIndex).toBeLessThan(footerIndex)
  expect(html).toContain('href="/leadership"')
  expect(html).toContain('href="/contact"')
  expect(html).toContain('data-action-mode="button"')
})
```

- [ ] **Step 2: Add failing alignment and surface-context tests**

Add:

```tsx
it.each([
  ['left', 'items-start text-left', 'justify-start'],
  ['center', 'mx-auto items-center text-center', 'justify-center'],
] as const)('aligns %s section content and actions', (alignment, headerClass, actionClass) => {
  const html = renderToStaticMarkup(
    createElement(TestimonialSpotlightBlockComponent, {
      ...baseProps,
      actions: [{ label: 'Learn more', linkType: 'custom', url: '/learn' }],
      sectionContentAlignment: alignment,
      sectionTitle: 'Leadership voices',
    }),
  )
  const headerTag = getTagWithAttribute(html, 'data-testimonial-spotlight-section-header')
  const actionsTag = getTagWithAttribute(html, 'data-testimonial-spotlight-section-actions')

  expect(headerTag).toContain(`data-testimonial-spotlight-section-alignment="${alignment}"`)
  expect(headerTag).toContain(headerClass)
  expect(actionsTag).toContain(actionClass)
})

it('resolves outer and inner eyebrows against their independent surfaces', () => {
  const html = renderToStaticMarkup(
    createElement(TestimonialSpotlightBlockComponent, {
      ...baseProps,
      appearance: { background: 'brand', border: 'none' },
      containerBackground: 'muted',
      sectionEyebrow: 'Leadership',
    }),
  )

  const outerIndex = html.indexOf('data-section-eyebrow-surface="brand"')
  const innerIndex = html.indexOf('data-section-eyebrow-surface="subtle"')
  expect(outerIndex).toBeGreaterThan(-1)
  expect(outerIndex).toBeLessThan(innerIndex)
})
```

- [ ] **Step 3: Run the renderer test and verify the section contracts fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: FAIL because the component does not accept or render section copy/actions/alignment.

- [ ] **Step 4: Add the shared action imports and component properties**

Add these imports to `src/blocks/TestimonialSpotlight/Component.tsx`:

```ts
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { ContentActions } from '@/components/ContentActions'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
```

Extend `TestimonialSpotlightBlockLike` with:

```ts
actions?: CmsActionValue[] | null
footerActions?: CmsActionValue[] | null
sectionContentAlignment?: 'center' | 'left' | null
sectionDescription?: string | null
sectionEyebrow?: string | null
sectionTitle?: string | null
```

Add the same names to the component destructuring, keeping `sectionContentAlignment = 'center'` as its default.

- [ ] **Step 5: Resolve section content and preserve invalid-action behavior**

After the existing inner-content normalization, add:

```ts
const resolvedSectionEyebrow = sectionEyebrow?.trim()
const resolvedSectionTitle = sectionTitle?.trim()
const resolvedSectionDescription = sectionDescription?.trim()
const resolvedSectionActions = resolveCmsActions(actions)
const hasFooterActions = resolveCmsActions(footerActions).length > 0
const resolvedSectionContentAlignment =
  sectionContentAlignment === 'left' ? 'left' : 'center'
const hasSectionHeader = Boolean(
  resolvedSectionEyebrow ||
    resolvedSectionTitle ||
    resolvedSectionDescription ||
    resolvedSectionActions.length,
)
```

- [ ] **Step 6: Add the optional standard section header**

After the required-content guard and before `mediaFrame`, add:

```tsx
const MessageHeading = resolvedSectionTitle ? 'h3' : 'h2'
const isSectionCentered = resolvedSectionContentAlignment === 'center'

const sectionHeader = hasSectionHeader ? (
  <div
    className={cn(
      'flex max-w-3xl flex-col gap-4',
      isSectionCentered
        ? 'mx-auto items-center text-center'
        : 'items-start text-left',
    )}
    data-testimonial-spotlight-section-alignment={resolvedSectionContentAlignment}
    data-testimonial-spotlight-section-header="true"
  >
    {resolvedSectionEyebrow ? (
      <SectionEyebrow surface={appearanceClasses.background}>
        {resolvedSectionEyebrow}
      </SectionEyebrow>
    ) : null}
    {resolvedSectionTitle ? (
      <h2 className={contentSectionHeadingClasses}>{resolvedSectionTitle}</h2>
    ) : null}
    {resolvedSectionDescription ? (
      <p className={contentSectionDescriptionClasses}>{resolvedSectionDescription}</p>
    ) : null}
    {resolvedSectionActions.length ? (
      <div className="mt-2 w-full">
        <ContentActions
          actions={resolvedSectionActions}
          alignment={resolvedSectionContentAlignment}
          data-testimonial-spotlight-section-actions="true"
        />
      </div>
    ) : null}
  </div>
) : null
```

- [ ] **Step 7: Make the inner heading semantic without changing its classes**

Replace the existing inner message heading with:

```tsx
<MessageHeading className={contentSectionHeadingClasses}>{resolvedTitle}</MessageHeading>
```

- [ ] **Step 8: Add the section-content render branch while retaining the current branch verbatim**

Rename the current return content expression to `legacyLayout`:

```tsx
const legacyLayout =
  resolvedMediaFillMode === 'edgeToEdge' ? (
    splitLayout
  ) : (
    <div
      className={cn(
        regularBlockContainerClasses,
        !isFilled && regularBlockMobilePaddingClasses[resolvedSize],
      )}
    >
      {splitLayout}
    </div>
  )
```

Keep the current section branch for documents with no valid new content:

```tsx
if (!hasSectionHeader && !hasFooterActions) {
  return (
    <section
      className={cn(
        isFilled && regularBlockMobilePaddingClasses[resolvedSize],
        isFilled && 'md:py-0',
        appearanceClasses.className,
      )}
      data-testimonial-spotlight="true"
      data-testimonial-spotlight-background={appearanceClasses.background}
      data-testimonial-spotlight-content-vertical-alignment={resolvedVerticalAlignment}
      data-testimonial-spotlight-image-position={resolvedImagePosition}
      data-testimonial-spotlight-media-fill={resolvedMediaFillMode}
      data-testimonial-spotlight-media-position={resolvedMediaPosition}
      data-testimonial-spotlight-size={resolvedSize}
    >
      {legacyLayout}
    </section>
  )
}
```

Then add the section-content branch:

```tsx
return (
  <section
    className={cn(
      regularBlockMobilePaddingClasses[resolvedSize],
      appearanceClasses.className,
    )}
    data-testimonial-spotlight="true"
    data-testimonial-spotlight-background={appearanceClasses.background}
    data-testimonial-spotlight-content-vertical-alignment={resolvedVerticalAlignment}
    data-testimonial-spotlight-image-position={resolvedImagePosition}
    data-testimonial-spotlight-media-fill={resolvedMediaFillMode}
    data-testimonial-spotlight-media-position={resolvedMediaPosition}
    data-testimonial-spotlight-size={resolvedSize}
  >
    {resolvedMediaFillMode === 'edgeToEdge' ? (
      <>
        {sectionHeader ? (
          <div className={cn(regularBlockContainerClasses, 'mb-12')}>{sectionHeader}</div>
        ) : null}
        {splitLayout}
        {hasFooterActions ? (
          <div className={regularBlockContainerClasses}>
            <BlockFooterActions actions={footerActions} />
          </div>
        ) : null}
      </>
    ) : (
      <div className={regularBlockContainerClasses}>
        {sectionHeader ? <div className="mb-12">{sectionHeader}</div> : null}
        {splitLayout}
        <BlockFooterActions actions={footerActions} />
      </div>
    )}
  </section>
)
```

- [ ] **Step 9: Run the focused renderer test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: PASS for the new header/action contracts and all existing testimonial, surface, typography, quote, media, and renderer tests.

- [ ] **Step 10: Commit section rendering**

```bash
git add src/blocks/TestimonialSpotlight/Component.tsx tests/int/testimonial-spotlight-render.int.spec.tsx
git commit -m "feat(testimonial): render section content"
```

### Task 3: Lock heading, legacy, invalid-action, and fill-mode edge cases

**Files:**

- Modify: `tests/int/testimonial-spotlight-render.int.spec.tsx`
- Modify only if a test reveals a defect: `src/blocks/TestimonialSpotlight/Component.tsx`

**Interfaces:**

- Consumes: the completed section-content render branch from Task 2.
- Produces: explicit regression coverage for conditional headings, invalid action omission, exact legacy diagnostics, and contained/edge-to-edge section chrome.

- [ ] **Step 1: Add heading and legacy-preservation tests**

Add:

```tsx
it('uses an outer h2 and visually identical inner h3 only when a section title exists', () => {
  const withSectionTitle = renderToStaticMarkup(
    createElement(TestimonialSpotlightBlockComponent, {
      ...baseProps,
      sectionTitle: 'Leadership voices',
    }),
  )
  const withoutSectionTitle = renderToStaticMarkup(
    createElement(TestimonialSpotlightBlockComponent, {
      ...baseProps,
      sectionEyebrow: 'Leadership',
    }),
  )

  expect(withSectionTitle).toContain(
    `<h2 class="${contentSectionHeadingClasses}">Leadership voices</h2>`,
  )
  expect(withSectionTitle).toContain(
    `<h3 class="${contentSectionHeadingClasses}">${baseProps.title}</h3>`,
  )
  expect(withoutSectionTitle).toContain(
    `<h2 class="${contentSectionHeadingClasses}">${baseProps.title}</h2>`,
  )
  expect(withoutSectionTitle).not.toContain('<h3')
})

it('preserves the legacy branch when every new field is absent or invalid', () => {
  const html = renderToStaticMarkup(
    createElement(TestimonialSpotlightBlockComponent, {
      ...baseProps,
      actions: [{ label: 'Broken', linkType: 'custom', url: '' }],
      footerActions: [{ label: 'Broken footer', linkType: 'custom', url: '' }],
      sectionDescription: '   ',
      sectionEyebrow: '',
      sectionTitle: null,
    }),
  )

  expect(html).not.toContain('data-testimonial-spotlight-section-header')
  expect(html).not.toContain('data-testimonial-spotlight-section-actions')
  expect(html).not.toContain('Broken')
  expect(html).not.toContain('<h3')
  expect(html).toContain('py-12')
  expect(html).toContain(`<h2 class="${contentSectionHeadingClasses}">${baseProps.title}</h2>`)
})
```

Add this import near the component imports in the test file:

```ts
import { contentSectionHeadingClasses } from '@/blocks/shared/contentStyles'
```

- [ ] **Step 2: Add fill-mode and footer containment tests**

Add:

```tsx
it.each(['contained', 'containedFill', 'edgeToEdge'] as const)(
  'keeps section chrome ordered and contained in %s mode',
  (mediaFillMode) => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        footerActions: [{ label: 'Contact us', linkType: 'custom', url: '/contact' }],
        mediaFillMode,
        sectionTitle: 'Leadership voices',
      }),
    )

    expect(html.indexOf('Leadership voices')).toBeLessThan(
      html.indexOf('data-testimonial-spotlight-container-background'),
    )
    expect(html.indexOf('data-testimonial-spotlight-container-background')).toBeLessThan(
      html.indexOf('Contact us'),
    )
    expect(html).toContain(regularBlockContainerClasses)
    if (mediaFillMode === 'edgeToEdge') {
      expect(html).toContain('data-testimonial-spotlight-media-fill="edgeToEdge"')
      expect(html).toContain('mx-auto w-full max-w-screen-2xl px-4 mb-12')
    }
  },
)
```

Add this import in the test file:

```ts
import { regularBlockContainerClasses } from '@/blocks/shared/blockSpacing'
```

- [ ] **Step 3: Run the focused renderer test and correct only revealed contract defects**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: PASS. If a failure identifies class-order brittleness in the edge-to-edge assertion, inspect the rendered start tag with `getTagWithAttribute` and assert the individual `regularBlockContainerClasses` and `mb-12` tokens rather than changing production class order.

- [ ] **Step 4: Run config and renderer tests together**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-config.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit edge-case coverage**

```bash
git add src/blocks/TestimonialSpotlight/Component.tsx tests/int/testimonial-spotlight-render.int.spec.tsx
git commit -m "test(testimonial): cover section chrome"
```

### Task 4: Refresh the thumbnail, documentation, and project knowledge

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx:1428-1445`
- Modify (generated): `public/block-thumbnails/testimonial-spotlight.jpg`
- Modify: `docs/guides/blocks.md:31`
- Modify: `.agents/skills/project-context/references/block-system.md:53-59`
- Modify (generated): `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the completed production component and its new public props.
- Produces: a representative 1600×900 Admin picker image, accurate operator guidance, and current project-context knowledge.

- [ ] **Step 1: Add concise section content to the production thumbnail fixture**

Add these props to the `testimonialSpotlight` fixture in `src/block-thumbnails/fixtures.tsx`:

```tsx
sectionContentAlignment="center"
sectionDescription="Perspectives from the people guiding our institution."
sectionEyebrow="Leadership"
sectionTitle="Messages from our leadership"
```

Do not add fixture actions; the section-copy hierarchy is enough to demonstrate the new outer layer without overcrowding the 1600×900 picker image.

- [ ] **Step 2: Update the block operator guide**

Replace the Testimonial Spotlight table row in `docs/guides/blocks.md` with:

```md
| Testimonial Spotlight    | One image-led leadership message            | Optional aligned section header/actions and centered footer actions; one person; image side, crop, fill, section appearance, spacing, inner alignment, semantic container background/outline |
```

- [ ] **Step 3: Update the project-context block narrative**

Extend the Testimonial Spotlight paragraph in `.agents/skills/project-context/references/block-system.md` with:

```md
An optional outer section layer adds prefixed eyebrow/title/description fields, shared section and
footer actions, and Left/Center header alignment without renaming the existing inner message fields.
The outer eyebrow follows the section appearance; the existing inner eyebrow follows the container
surface. Documents without valid outer content retain the legacy render branch.
```

- [ ] **Step 4: Regenerate and inspect the thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=testimonialSpotlight pnpm generate:block-thumbnails
file public/block-thumbnails/testimonial-spotlight.jpg
```

Expected: successful generation and a 1600×900 JPEG. Open the image and verify the new section header is legible, the existing split composition is unchanged, all content fits, and no horizontal overflow or clipping appears.

- [ ] **Step 5: Refresh and validate project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the generated inventory is current. A commit-hash-only knowledge-graph warning is non-blocking; any stale inventory error must be fixed before continuing.

- [ ] **Step 6: Run thumbnail and documentation-adjacent contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/project-context-lib.int.spec.ts tests/int/project-context-repository.int.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit generated and maintained artifacts**

```bash
git add .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json docs/guides/blocks.md public/block-thumbnails/testimonial-spotlight.jpg src/block-thumbnails/fixtures.tsx
git commit -m "docs(testimonial): refresh section preview"
```

### Task 5: Run final quality and regression checks

**Files:**

- Verify all files modified by Tasks 1–4.

**Interfaces:**

- Consumes: completed schema, renderer, generated types, tests, thumbnail, docs, and project-context artifacts.
- Produces: final evidence that the feature is formatted, type-safe, visually coherent, and regression-tested.

- [ ] **Step 1: Run touched-file lint**

Run:

```bash
pnpm exec eslint src/blocks/TestimonialSpotlight/Component.tsx src/blocks/TestimonialSpotlight/config.ts src/block-thumbnails/fixtures.tsx tests/int/testimonial-spotlight-config.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: PASS with no warnings or errors.

- [ ] **Step 2: Run the complete integration suite**

Run:

```bash
pnpm test:int
```

Expected: all feature-related tests pass. The known unrelated SNMIH precision assertion may still report `0.013730` expected versus `0.01373` in `theme-snmih.css`; report it without editing the theme file.

- [ ] **Step 3: Run the final design detector**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/TestimonialSpotlight/Component.tsx
```

Expected: an empty JSON findings array. Resolve only findings caused by this feature.

- [ ] **Step 4: Check the final diff and working tree**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and only intended feature changes or commits.

- [ ] **Step 5: Commit any final verified corrections**

If Step 1–4 required a correction, stage only the corrected feature files and commit:

```bash
git add src/blocks/TestimonialSpotlight/Component.tsx src/blocks/TestimonialSpotlight/config.ts src/block-thumbnails/fixtures.tsx src/payload-types.ts tests/int/testimonial-spotlight-config.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx docs/guides/blocks.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json public/block-thumbnails/testimonial-spotlight.jpg
git commit -m "fix(testimonial): align section content"
```

If no correction was required, do not create an empty commit.
