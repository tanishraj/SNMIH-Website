# Event Gallery Overlay Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render image count, event date, and a sans-serif gallery title as one vertical stack for every Event Gallery overlay position.

**Architecture:** Keep one shared content structure inside `EventGalleryCardContent`. The stored `cardTextLayout` value controls only the stack's placement and alignment: Bottom Left is left-aligned at the bottom, Bottom Center is centered at the bottom, and Center — Vertical & Horizontal is centered on both axes.

**Tech Stack:** React 19, Next.js 15, Tailwind CSS 4 utility classes, Payload CMS block fields, Vitest, Testing Library.

## Global Constraints

- Every overlay position renders image icon plus number, event date, and gallery title in that order.
- The visible image-count copy is numeric only; keep accessible `N image/images` context for assistive technology.
- Every gallery title uses `var(--font-text)`, semibold weight, `text-lg sm:text-xl`, and a two-line clamp.
- Bottom Left aligns the stack left; Bottom Center and Center — Vertical & Horizontal center every row.
- Disabled or unavailable metadata is omitted without empty spacing.
- Overlay tone, strength, direction, coverage, album ordering, rectangular quilt layout, viewer behavior, accessibility, and motion remain unchanged.
- Do not stage or commit changes.

---

### Task 1: Apply the universal overlay stack

**Files:**

- Modify: `tests/int/event-gallery-render.int.spec.tsx`
- Modify: `src/components/event-gallery-client.tsx`
- Modify: `src/blocks/EventGallery/config.ts`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `docs/guides/blocks.md`

**Interfaces:**

- Consumes: `EventGalleryCardTextLayout` values `split`, `center`, and `middleCenter`.
- Produces: `data-event-gallery-metadata-layout="stacked"` for every position.
- Produces: `data-event-gallery-content-alignment="left" | "center"` to expose the resolved row alignment in rendering tests.
- Preserves: the whole-card `aria-label="Open {title} gallery with N image/images"` and adds accessible count context while displaying only the number.

- [ ] **Step 1: Replace centered-only assertions with the universal-stack contract**

Update the position test in `tests/int/event-gallery-render.int.spec.tsx`:

```tsx
it('stacks count, date, and a text-family title for every overlay position', () => {
  for (const position of ['split', 'center', 'middleCenter'] as const) {
    const html = renderToStaticMarkup(
      <EventGallery albums={[albums[0]]} cardTextLayout={position} title="Event gallery" />,
    )
    const cardContent = html.slice(html.indexOf('data-event-gallery-card-content="true"'))

    expect(cardContent).toContain(`data-event-gallery-card-position="${position}"`)
    expect(cardContent).toContain('data-event-gallery-metadata-layout="stacked"')
    expect(cardContent).toContain('font-[family-name:var(--font-text)]')
    expect(cardContent).not.toContain('font-[family-name:var(--font-display)]')
    expect(cardContent).not.toContain('>2 images</span>')

    const imageCountIndex = cardContent.indexOf('data-event-gallery-image-count="true"')
    const eventDateIndex = cardContent.indexOf('Jun 21, 2026')
    const titleIndex = cardContent.indexOf('Yoga Day')

    expect(imageCountIndex).toBeGreaterThan(-1)
    expect(imageCountIndex).toBeLessThan(eventDateIndex)
    expect(eventDateIndex).toBeLessThan(titleIndex)
    expect(cardContent).toContain(
      `data-event-gallery-content-alignment="${position === 'split' ? 'left' : 'center'}"`,
    )
  }
})
```

Keep and adapt the optional metadata test so the centered stack still closes when image count is disabled. Update the rectangular-quilt assertion from `split` to `stacked` because the default Bottom Left position now uses the universal stack.

- [ ] **Step 2: Run the focused test and verify the revised assertions fail**

Run:

```bash
pnpm vitest run tests/int/event-gallery-render.int.spec.tsx
```

Expected: failures show that Bottom Left and Bottom Center still emit split metadata, display `2 images`, and use the display-family title.

- [ ] **Step 3: Replace the position-specific metadata branches with one shared column**

In `src/components/event-gallery-client.tsx`, remove `isFullyCentered` and calculate alignment once:

```tsx
const contentAlignment = layout === 'split' ? 'left' : 'center'
const isLeftAligned = contentAlignment === 'left'
```

Use one shared metadata column for every position:

```tsx
<div
  className={cn(
    'min-w-0',
    layout === 'middleCenter' ? 'w-full max-w-sm' : 'w-full',
    isLeftAligned ? 'items-start text-left' : 'items-center text-center',
  )}
  data-event-gallery-content-alignment={contentAlignment}
>
  {hasMetadata ? (
    <div
      className={cn(
        'mb-3 flex w-full flex-col gap-2 font-mono text-xs font-normal uppercase tracking-wider',
        isLeftAligned ? 'items-start text-left' : 'items-center text-center',
        overlay.text.eyebrow,
      )}
      data-event-gallery-card-meta="true"
      data-event-gallery-metadata-layout="stacked"
    >
      {showImageCount ? (
        <span
          aria-label={`${album.imageCount} ${album.imageCount === 1 ? 'image' : 'images'}`}
          className="inline-flex items-center justify-center gap-1.5"
          data-event-gallery-image-count="true"
        >
          <Images aria-hidden="true" className="size-3.5" />
          {album.imageCount}
        </span>
      ) : null}
      {hasEventDate ? <span className="max-w-full truncate">{eventDate}</span> : null}
    </div>
  ) : null}
  <p
    className={cn(
      'line-clamp-2 font-[family-name:var(--font-text)] text-lg font-semibold tracking-tight text-balance sm:text-xl',
      overlay.text.title,
      isLeftAligned ? 'max-w-md' : 'mx-auto max-w-md',
    )}
  >
    {album.title}
  </p>
</div>
```

Keep `contentPositionClasses` unchanged so each stored position continues to control bottom-left, bottom-center, or fully centered placement.

- [ ] **Step 4: Update the Payload Admin guidance**

Change the `cardTextLayout` description in `src/blocks/EventGallery/config.ts` to:

```ts
description:
  'Every position stacks the image count, event date, and title. Choose where that stack sits and whether it aligns left or center.',
```

Do not change the field name, option values, default, condition, or required state; existing documents remain compatible and generated Payload types remain unchanged.

- [ ] **Step 5: Run focused block and preview tests**

Run:

```bash
pnpm vitest run tests/int/event-gallery-render.int.spec.tsx tests/int/event-gallery-presentation.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx
```

Expected: all suites pass with stacked metadata and text-family titles in every position.

- [ ] **Step 6: Update maintained documentation**

Update the Event Gallery contract in `.agents/skills/project-context/references/block-system.md` and `docs/guides/blocks.md` to state:

```text
Every overlay position stacks image count, event date, and a text-family title. Bottom Left aligns the stack left; Bottom Center and Center — Vertical & Horizontal center it.
```

Record that the visible count is icon plus number only and missing metadata closes naturally. Do not rewrite historical plan or specification files.

- [ ] **Step 7: Run formatting and static verification**

Run:

```bash
pnpm exec prettier --write src/components/event-gallery-client.tsx src/blocks/EventGallery/config.ts tests/int/event-gallery-render.int.spec.tsx .agents/skills/project-context/references/block-system.md docs/guides/blocks.md
pnpm exec tsc --noEmit
pnpm exec eslint src/components/event-gallery-client.tsx src/blocks/EventGallery/config.ts tests/int/event-gallery-render.int.spec.tsx
git diff --check
```

Expected: Prettier completes, TypeScript and ESLint report no errors, and `git diff --check` produces no output.

- [ ] **Step 8: Run the complete affected suite and project-context loop**

Run:

```bash
pnpm vitest run tests/int/event-gallery-data.int.spec.ts tests/int/event-gallery-presentation.int.spec.ts tests/int/event-gallery-render.int.spec.tsx tests/int/event-gallery-selection.int.spec.tsx tests/int/event-gallery-viewer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/news-events-detail-template.int.spec.tsx tests/int/news-events-metadata-routes.int.spec.ts tests/int/page-blocks.int.spec.ts
pnpm project-context:update
pnpm project-context:check
```

Expected: all affected tests pass and project context is current. The existing stale knowledge-graph warning is acceptable if it is the only warning. Inspect the final diff against `.agents/skills/project-context/references/change-impact-map.md` and confirm the data loader, quilt geometry, viewer, and shared overlay resolver remain untouched.
