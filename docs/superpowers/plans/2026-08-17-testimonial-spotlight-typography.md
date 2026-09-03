# Testimonial Spotlight Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Testimonial Spotlight a clearer attribution hierarchy and an Inter-based testimonial that always renders with one canonical pair of curly double quotation marks.

**Architecture:** Keep the change local to the existing server component. A small pure normalizer trims testimonial content and removes at most one matching outer straight or curly double-quote pair; the `blockquote` then supplies canonical curly quotes as real text. Existing theme font variables, semantic surface colors, responsive sizing, content schema, and section/container controls remain unchanged.

**Tech Stack:** React 19 Server Components, Next.js 16, Tailwind CSS 4 typography utilities, Vitest server-render integration tests, Playwright thumbnail generation.

## Global Constraints

- Do not create a commit, stage files, unstage files, or alter the user's existing staging state.
- Testimonial text uses the existing sans-serif family (`font-sans`, Inter in the default and SNMIH themes), never the display/Playfair or mono family.
- Keep the existing responsive testimonial sizes: `text-xl sm:text-2xl lg:text-[1.75rem]`.
- Use relaxed testimonial leading and normal weight for readable long-form quotation text.
- Render exactly one canonical outer pair of curly double quotation marks (`“` and `”`) as real selectable and accessible text.
- Remove at most one matching authored outer pair of straight (`"..."`) or curly (`“...”`) double quotation marks before adding the canonical pair.
- Preserve internal quotation marks and unmatched leading or trailing marks.
- Person name uses `text-base` (16px), `font-semibold`, and the current foreground.
- Designation uses `text-xs` (12px), compact readable leading, and the selected container surface's existing secondary color.
- Do not change Payload fields, generated Payload types, global font loading, theme CSS, section/container styling, layout, media behavior, or content order.

---

### Task 1: Implement the testimonial and attribution typography contract

**Files:**

- Modify: `src/blocks/TestimonialSpotlight/Component.tsx`
- Test: `tests/int/testimonial-spotlight-render.int.spec.tsx`

**Interfaces:**

- Consumes: authored `testimonial?: string | null`, the existing `containerSurface.secondary` class, and the current Testimonial Spotlight content hierarchy.
- Produces: local `normalizeTestimonial(value?: string | null): string | undefined`; a sans-serif quoted `blockquote`; 16px name and 12px designation roles.

- [ ] **Step 1: Add failing typography and quotation tests**

Add this helper near the existing `getTagWithAttribute` helper in `tests/int/testimonial-spotlight-render.int.spec.tsx`:

```ts
const getElementStartTag = (html: string, element: string) =>
  html.match(new RegExp(`<${element}[^>]*>`))?.[0] ?? ''
```

Inside the existing `testimonial spotlight rendering` suite, add these tests:

```ts
it('uses sans-serif testimonial copy with distinct name and designation roles', () => {
  const html = renderToStaticMarkup(createElement(TestimonialSpotlightBlockComponent, baseProps))
  const blockquoteTag = getElementStartTag(html, 'blockquote')

  expect(blockquoteTag).toContain('font-sans')
  expect(blockquoteTag).toContain('text-xl')
  expect(blockquoteTag).toContain('sm:text-2xl')
  expect(blockquoteTag).toContain('lg:text-[1.75rem]')
  expect(blockquoteTag).toContain('leading-relaxed')
  expect(blockquoteTag).toContain('font-normal')
  expect(blockquoteTag).not.toContain('var(--font-display)')
  expect(blockquoteTag).not.toContain('font-mono')
  expect(html).toContain(
    '<span class="text-base font-semibold text-current">Shri Ravindra Kumar Singh</span>',
  )
  expect(html).toContain('<span class="text-xs leading-4 text-current/70">Founder</span>')
})

it.each([
  ['Our shared purpose.', '“Our shared purpose.”'],
  ['"Our shared purpose."', '“Our shared purpose.”'],
  ['“Our shared purpose.”', '“Our shared purpose.”'],
  ['Our “shared” purpose.', '“Our “shared” purpose.”'],
] as const)('renders one canonical quote pair for %s', (testimonial, expected) => {
  const html = renderToStaticMarkup(
    createElement(TestimonialSpotlightBlockComponent, {
      ...baseProps,
      testimonial,
    }),
  )

  expect(html).toContain(`<blockquote`)
  expect(html).toContain(`>${expected}</blockquote>`)
})

it.each([
  ['"An intentionally unmatched quotation.', '“&quot;An intentionally unmatched quotation.”'],
  ['"', '“&quot;”'],
] as const)('preserves unmatched quotation marks in %s', (testimonial, expected) => {
  const html = renderToStaticMarkup(
    createElement(TestimonialSpotlightBlockComponent, {
      ...baseProps,
      testimonial,
    }),
  )

  expect(html).toContain(`>${expected}</blockquote>`)
})
```

The designation expectation uses the Match Section/subtle surface from `baseProps`, whose shared secondary class is `text-current/70`.

- [ ] **Step 2: Run the renderer test and verify the new contracts fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: FAIL because the blockquote still uses `var(--font-display)`, testimonial content is unwrapped, the name is `text-sm`, and the designation is `text-sm leading-5`.

- [ ] **Step 3: Add the pure testimonial normalizer**

Add this module-level helper after `resolveContainerEyebrowSurface` in `src/blocks/TestimonialSpotlight/Component.tsx`:

```ts
const testimonialQuotePairs = [
  ['"', '"'],
  ['“', '”'],
] as const

const normalizeTestimonial = (value?: string | null) => {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  const outerPair = testimonialQuotePairs.find(
    ([opening, closing]) =>
      trimmed.length >= opening.length + closing.length &&
      trimmed.startsWith(opening) &&
      trimmed.endsWith(closing),
  )

  if (!outerPair) return trimmed

  const normalized = trimmed.slice(outerPair[0].length, -outerPair[1].length).trim()
  return normalized || undefined
}
```

Replace the existing testimonial normalization inside the component:

```ts
const resolvedTestimonial = normalizeTestimonial(testimonial)
```

This removes no more than one matching outer pair. The existing required-content guard returns `null` when an authored value contains only an empty quote pair.

- [ ] **Step 4: Apply the approved testimonial typography and real quote characters**

Replace the existing `blockquote` with:

```tsx
<blockquote className="font-sans text-xl leading-relaxed font-normal text-pretty text-current sm:text-2xl lg:text-[1.75rem]">
  “{resolvedTestimonial}”
</blockquote>
```

The curly characters are JSX text, not CSS-generated content or decorative icons, so they remain available to assistive technology, selection, and copying.

- [ ] **Step 5: Apply the approved attribution hierarchy**

Replace the person-name and designation spans with:

```tsx
;<span className="text-base font-semibold text-current">{resolvedPersonName}</span>
{
  resolvedDesignation ? (
    <span className={cn('text-xs leading-4', containerSurface.secondary)}>
      {resolvedDesignation}
    </span>
  ) : null
}
```

- [ ] **Step 6: Run the renderer test and verify all contracts pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: PASS for all existing layout/surface behavior plus Inter typography, attribution sizing, canonical wrapping, duplicate-wrapper prevention, internal quotes, and unmatched marks.

### Task 2: Refresh the visual fixture and project knowledge

**Files:**

- Modify: `public/block-thumbnails/testimonial-spotlight.jpg` (generated)
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify if generated hash changes: `.agents/skills/project-context/references/project-inventory.json`
- Verify: `src/block-thumbnails/fixtures.tsx`
- Verify: `docs/guides/blocks.md`
- Verify: `.agents/skills/project-context/references/payload-model.md`

**Interfaces:**

- Consumes: the existing Testimonial Spotlight production thumbnail fixture and the completed component typography from Task 1.
- Produces: a current 1600×900 block-picker JPEG and project-context documentation that records the typography/quotation behavior.

- [ ] **Step 1: Confirm the existing fixture already exercises all changed roles**

Inspect the `testimonialSpotlight` entry in `src/block-thumbnails/fixtures.tsx` and verify it still provides `testimonial`, `personName`, and `designation`:

```tsx
personName = 'Shri Ravindra Kumar Singh'
testimonial =
  'Our aim is to build an institution where education, healthcare, and service strengthen one another.'
designation = 'Founder'
```

Expected: no fixture source edit is needed because the production component will display the new font, canonical quotes, larger name, and smaller designation from those existing values.

- [ ] **Step 2: Regenerate only the Testimonial Spotlight thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=testimonialSpotlight pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/testimonial-spotlight.jpg` is regenerated as a 1600×900 JPEG; no unrelated thumbnail changes. Visually verify that the testimonial is sans-serif and curly-quoted, the name is more prominent, the designation is smaller, and no text clips.

- [ ] **Step 3: Update the maintained block-system behavior note**

Extend the existing Testimonial Spotlight paragraph in `.agents/skills/project-context/references/block-system.md` to read:

```md
Testimonial Spotlight keeps section appearance independent from its complete image-and-content
container. The inner container supports Match Section/Primary/Secondary/Muted/Accent semantic
surfaces and an optional divider-colored outline; missing legacy values render as Match Section with
no outline. Testimonial copy uses the existing sans-serif family with one normalized pair of curly
double quotation marks; the person name and designation use distinct body and metadata sizes.
```

Do not change `payload-model.md`: no collection, access, field, hook, workflow, or relationship contract changed. Do not lengthen the operator-guide table row: the automatic quotation and type hierarchy are presentation details already covered by the block-system reference.

- [ ] **Step 4: Format only touched text files**

Run:

```bash
pnpm exec prettier --write src/blocks/TestimonialSpotlight/Component.tsx tests/int/testimonial-spotlight-render.int.spec.tsx .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-17-testimonial-spotlight-block-design.md docs/superpowers/plans/2026-08-17-testimonial-spotlight-typography.md
```

Expected: formatting completes without changing files outside this typography follow-up.

- [ ] **Step 5: Run focused and static verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/testimonial-spotlight-render.int.spec.tsx tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/page-blocks.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/TestimonialSpotlight/Component.tsx tests/int/testimonial-spotlight-render.int.spec.tsx
git diff --check
```

Expected: all selected tests, TypeScript, targeted ESLint, and whitespace validation PASS.

- [ ] **Step 6: Refresh and verify generated project context after every final text change**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
pnpm run test:project-context
```

Expected: `.agents/skills/project-context/references/project-inventory.json` receives the current deterministic repository hash, all 14 project-context tests PASS, and the context check reports current. The known stale knowledge-graph hash may remain a warning. The Payload-model review warning is acknowledged by Step 3 and requires no narrative edit.

- [ ] **Step 7: Inspect final scope and staging state without mutating either**

Run:

```bash
git status --short
git diff -- src/blocks/TestimonialSpotlight/Component.tsx tests/int/testimonial-spotlight-render.int.spec.tsx public/block-thumbnails/testimonial-spotlight.jpg .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json docs/superpowers/specs/2026-08-17-testimonial-spotlight-block-design.md
```

Expected: no Payload schema, generated Payload types, theme CSS, shared typography helper, layout, or media file changed. Existing staged changes remain staged and this follow-up remains uncommitted. Do not run `git add`, `git restore`, `git reset`, or `git commit`.

- [ ] **Step 8: Run the broader integration suite with local-port access if required**

Run:

```bash
pnpm test:int
```

Expected: all Testimonial Spotlight and project-context tests PASS. If sandboxed Mongo memory-server suites cannot open a local port, rerun with the required local-port permission. The unrelated existing SNMIH theme assertion may remain the sole failure because it expects `0.013730` while `theme-snmih.css` contains `0.01373`; do not modify that theme token as part of this typography task.
