# Testimonial Spotlight Optional Testimonial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Testimonial Spotlight's featured statement optional while keeping the rest of the block visible and reducing present testimonial copy to a restrained 18–20px responsive scale.

**Architecture:** Keep the schema change local to the existing Payload block and regenerate Payload types. The server component continues to require media, title, and person name, but conditionally selects semantic `figure`/`blockquote`/`figcaption` elements only when normalized testimonial text exists; otherwise it uses ordinary `div` wrappers for description and attribution. Existing section controls, container surfaces, media behavior, quote normalization, attribution typography, and content order remain unchanged.

**Tech Stack:** Payload CMS 3.85, React 19 Server Components, Next.js 16, Tailwind CSS 4, TypeScript 5.7, Vitest integration tests, Playwright thumbnail generation.

## Global Constraints

- Do not create a commit, stage files, unstage files, or alter the user's existing staging state.
- `image`, `title`, and `personName` remain required; `testimonial` becomes optional.
- Missing, empty, or whitespace-only testimonial text must not hide an otherwise valid block.
- When testimonial text is absent, emit no quotation marks, `figure`, `blockquote`, or `figcaption`.
- When testimonial text is present, preserve the existing canonical curly-quote normalization and semantic quotation structure.
- Testimonial text uses `font-sans`, `text-lg` (18px) by default, `sm:text-xl` (20px) from the small breakpoint upward, relaxed leading, and medium weight.
- Preserve the existing 16px semibold person name and 12px secondary designation hierarchy.
- Do not change global font loading, theme CSS, section/container styling, layout, media behavior, field order, or action behavior.
- Refresh generated Payload types, the Testimonial Spotlight thumbnail, and project-context knowledge after implementation.

---

### Task 1: Make the Payload field optional and regenerate types

**Files:**

- Modify: `tests/int/testimonial-spotlight-config.int.spec.ts:44-74`
- Modify: `src/blocks/TestimonialSpotlight/config.ts:37-41`
- Modify (generated): `src/payload-types.ts:914-939`

**Interfaces:**

- Consumes: the existing `testimonial` textarea field in `TestimonialSpotlightBlock`.
- Produces: optional generated property `testimonial?: string | null` on `TestimonialSpotlightBlock`.

- [ ] **Step 1: Change the config test to require only image, title, and person**

Replace the existing content-field test title and required-field assertions in `tests/int/testimonial-spotlight-config.int.spec.ts` with:

```ts
it('defines required image, title, and person with an optional testimonial and no actions', () => {
  const tabsField = TestimonialSpotlightBlock.fields[0] as {
    tabs?: Array<{ fields: unknown[]; label: string }>
  }
  const contentFields = tabsField.tabs?.find(({ label }) => label === 'Content')?.fields ?? []

  expect(contentFields.map((field) => (field as { name?: string }).name)).toEqual([
    'image',
    'eyebrow',
    'title',
    'testimonial',
    'description',
    'personName',
    'designation',
  ])
  expect(
    getNamedField<{ relationTo?: string; required?: boolean; type?: string }>(
      contentFields,
      'image',
    ),
  ).toMatchObject({
    relationTo: 'media',
    required: true,
    type: 'upload',
  })
  for (const name of ['title', 'personName']) {
    expect(getNamedField<{ required?: boolean }>(contentFields, name)?.required).toBe(true)
  }
  expect(
    getNamedField<{ required?: boolean; type?: string }>(contentFields, 'testimonial'),
  ).toMatchObject({ type: 'textarea' })
  expect(
    getNamedField<{ required?: boolean }>(contentFields, 'testimonial')?.required,
  ).toBeUndefined()
  expect(getNamedField(contentFields, 'actions')).toBeUndefined()
  expect(getNamedField(contentFields, 'footerActions')).toBeUndefined()
})
```

- [ ] **Step 2: Run the config test and verify the optional-field contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-config.int.spec.ts
```

Expected: FAIL because `testimonial.required` is still `true`.

- [ ] **Step 3: Remove required validation from the testimonial field**

Change the field in `src/blocks/TestimonialSpotlight/config.ts` to:

```ts
{
  name: 'testimonial',
  type: 'textarea',
},
```

- [ ] **Step 4: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: command exits successfully and `TestimonialSpotlightBlock` contains:

```ts
testimonial?: string | null
```

- [ ] **Step 5: Run the config test again**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-config.int.spec.ts
```

Expected: PASS.

### Task 2: Render valid blocks without testimonial semantics

**Files:**

- Modify: `tests/int/testimonial-spotlight-render.int.spec.tsx:149-168`
- Modify: `tests/int/testimonial-spotlight-render.int.spec.tsx:267-283`
- Modify: `src/blocks/TestimonialSpotlight/Component.tsx:117-200`

**Interfaces:**

- Consumes: `normalizeTestimonial(testimonial?: string | null): string | undefined`, resolved media, title, description, person name, designation, and semantic container-surface classes.
- Produces: a valid rendered block without quote semantics when testimonial text is absent; a present quote rendered at `text-lg sm:text-xl` inside `figure`/`blockquote`/`figcaption`.

- [ ] **Step 1: Add a failing optional-testimonial renderer test**

Add this test after the existing optional-fields safety test in `tests/int/testimonial-spotlight-render.int.spec.tsx`:

```tsx
it.each([undefined, null, '', '   '] as const)(
  'keeps the block visible without quotation semantics for testimonial %s',
  (testimonial) => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        testimonial,
      }),
    )

    expect(html).toContain('data-testimonial-spotlight="true"')
    expect(html).toContain('Leadership with a long-term purpose.')
    expect(html).toContain(
      'Her leadership connects education, care, and service across the institution.',
    )
    expect(html).toContain('Shri Ravindra Kumar Singh')
    expect(html).toContain('Founder')
    expect(html).not.toContain('<figure')
    expect(html).not.toContain('<blockquote')
    expect(html).not.toContain('<figcaption')
    expect(html).not.toContain('“')
    expect(html).not.toContain('”')
  },
)
```

- [ ] **Step 2: Change the typography test to the approved smaller scale**

Replace the testimonial size assertions in the existing typography test with:

```ts
expect(blockquoteTag).toContain('font-sans')
expect(blockquoteTag).toContain('text-lg')
expect(blockquoteTag).toContain('sm:text-xl')
expect(blockquoteTag).not.toContain('sm:text-2xl')
expect(blockquoteTag).not.toContain('lg:text-[1.75rem]')
expect(blockquoteTag).toContain('leading-relaxed')
expect(blockquoteTag).toContain('font-medium')
```

Keep the existing display/mono exclusions and name/designation assertions immediately after these lines.

- [ ] **Step 3: Run the renderer test and verify both new contracts fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: FAIL because missing testimonial text currently triggers the required-content guard, and present testimonial text still grows from 20px to 28px.

- [ ] **Step 4: Remove testimonial text from the required-content guard**

Change the guard in `src/blocks/TestimonialSpotlight/Component.tsx` to:

```ts
if (!media || !resolvedTitle || !resolvedPersonName) return null
```

- [ ] **Step 5: Select semantic wrappers from the normalized testimonial state**

Immediately after the required-content guard, add:

```ts
const ContentGroup = resolvedTestimonial ? 'figure' : 'div'
const Attribution = resolvedTestimonial ? 'figcaption' : 'div'
```

These intrinsic-element unions keep the layout identical while avoiding quotation-specific semantics when no quotation exists.

- [ ] **Step 6: Make quotation markup conditional and reduce its type scale**

Replace the existing fixed `figure` group with:

```tsx
<ContentGroup className="flex flex-col gap-5">
  {resolvedTestimonial ? (
    <blockquote className="font-sans text-lg leading-relaxed font-medium text-pretty text-current sm:text-xl">
      “{resolvedTestimonial}”
    </blockquote>
  ) : null}
  {resolvedDescription ? (
    <p className={cn(contentSectionDescriptionClasses, containerSurface.secondary)}>
      {resolvedDescription}
    </p>
  ) : null}
  <Attribution className="flex flex-col gap-1 font-sans">
    <span className="text-base font-semibold text-current">{resolvedPersonName}</span>
    {resolvedDesignation ? (
      <span className={cn('text-xs leading-4', containerSurface.secondary)}>
        {resolvedDesignation}
      </span>
    ) : null}
  </Attribution>
</ContentGroup>
```

- [ ] **Step 7: Run focused config and renderer tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-config.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: PASS, including existing quote normalization and layout/surface coverage.

### Task 3: Refresh visual and project knowledge artifacts

**Files:**

- Modify (generated): `public/block-thumbnails/testimonial-spotlight.jpg`
- Modify: `.agents/skills/project-context/references/block-system.md:53-58`
- Modify if generated content changes: `.agents/skills/project-context/references/project-inventory.json`
- Verify: `src/block-thumbnails/fixtures.tsx:1428-1445`

**Interfaces:**

- Consumes: the updated production component, its existing populated thumbnail fixture, and the repository context updater.
- Produces: a current 1600×900 JPEG plus project knowledge recording the optional testimonial and conditional semantics.

- [ ] **Step 1: Update the Testimonial Spotlight project-context paragraph**

Replace the Testimonial Spotlight paragraph in `.agents/skills/project-context/references/block-system.md` with:

```md
Testimonial Spotlight keeps section appearance independent from its complete image-and-content
container. The inner container supports Match Section/Primary/Secondary/Muted/Accent semantic
surfaces and an optional divider-colored outline; missing legacy values render as Match Section with
no outline. Testimonial copy is optional: present copy uses the existing sans-serif family at a
responsive 18–20px size with one normalized pair of curly double quotation marks and semantic quote
markup, while absent copy leaves the image, title, description, and attribution visible without empty
quotation elements. The person name and designation retain distinct body and metadata sizes.
```

- [ ] **Step 2: Regenerate the project inventory**

Run:

```bash
pnpm project-context:update
```

Expected: command exits successfully and refreshes `.agents/skills/project-context/references/project-inventory.json` if tracked source hashes changed.

- [ ] **Step 3: Validate project knowledge**

Run:

```bash
pnpm project-context:check
```

Expected: PASS with no stale project-context artifacts.

- [ ] **Step 4: Regenerate only the Testimonial Spotlight thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=testimonialSpotlight pnpm generate:block-thumbnails
```

Expected: command exits successfully and rewrites `public/block-thumbnails/testimonial-spotlight.jpg` using the existing populated testimonial fixture, visibly reflecting the smaller quote typography.

- [ ] **Step 5: Inspect the generated thumbnail dimensions and appearance**

Run:

```bash
file public/block-thumbnails/testimonial-spotlight.jpg
```

Expected: JPEG image data with 1600×900 dimensions. Open the image and verify the testimonial is visibly smaller, the content remains balanced, and no text is clipped.

### Task 4: Run final regression checks

**Files:**

- Verify all files modified by Tasks 1–3.

**Interfaces:**

- Consumes: completed schema, renderer, generated types, thumbnail, and project-context changes.
- Produces: evidence that the change is formatted, type-safe, and regression-tested without altering git staging.

- [ ] **Step 1: Run the complete integration suite**

Run:

```bash
pnpm test:int
```

Expected: PASS. If an unrelated pre-existing failure remains, record its exact test name and observed mismatch without changing unrelated code.

- [ ] **Step 2: Run lint on the touched TypeScript files**

Run:

```bash
pnpm exec eslint src/blocks/TestimonialSpotlight/Component.tsx src/blocks/TestimonialSpotlight/config.ts tests/int/testimonial-spotlight-config.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: PASS with no warnings or errors in the touched files.

- [ ] **Step 3: Check whitespace and inspect the unstaged/staged state without changing it**

Run:

```bash
git diff --check
git status --short
```

Expected: `git diff --check` exits successfully. `git status --short` may contain the user's pre-existing staged and unstaged work; do not stage, unstage, commit, reset, or restore anything.
