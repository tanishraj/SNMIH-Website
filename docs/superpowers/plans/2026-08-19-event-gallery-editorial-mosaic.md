# Event Gallery Editorial Mosaic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing Event Gallery into a configurable, accessible two-, three-, or
four-column editorial mosaic with shared overlay controls, configurable ratios, and optional Event
Date and Image Count metadata.

**Architecture:** Keep Gallery Albums, selected-ID loading, ordering, live-preview snapshots, and the
full-screen viewer unchanged. Add Payload presentation fields to the existing block, centralize
client-safe normalization and mosaic cadence in a focused helper, resolve the established shared media
overlay in the section layer, and pass only serializable presentation values into the existing client
component.

**Tech Stack:** Payload CMS 3.85, Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion,
Vitest, Testing Library.

## Global Constraints

- Do not change the `gallery-albums` collection schema.
- Do not add category or classification metadata.
- Do not change album selection, ordering, or the full-screen viewer.
- Preserve the `eventGallery` slug, generated `EventGalleryBlock` interface, public renderer, Admin
  preview, Page live preview, reusable sections, and thumbnail definition.
- Reuse the shared Overlay Tone, Strength, Direction, Coverage fields and resolver.
- Preserve DOM, keyboard, and viewer order; do not implement JavaScript masonry.
- Mobile is one column without spans; tablet is two columns; desktop uses the configured 2, 3, or 4
  columns.
- Card titles stay at the bottom. A compact Image Count and optional Event Date row appears directly
  above them when the details overlay is enabled.
- Use existing spacing, typography, border, radius, and color tokens.
- Do not commit or stage changes.

---

### Task 1: Define and test the Event Gallery presentation contract

**Files:**

- Create: `src/components/event-gallery-presentation.ts`
- Modify: `src/blocks/EventGallery/config.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Create: `tests/int/event-gallery-presentation.int.spec.ts`

**Interfaces:**

- Produces `EventGalleryCardsPerRow = 2 | 3 | 4`.
- Produces `EventGalleryCardRatio = 'landscape' | 'square' | 'wide'`.
- Produces `normalizeEventGalleryCardsPerRow`, `normalizeEventGalleryCardRatio`, and
  `isEventGalleryLeadCard` for the section and client component.
- Keeps `EventGalleryCardTextLayout = 'center' | 'split'`, with `split` presented as Bottom Left.

- [ ] **Step 1: Extend the schema test before changing the block**

Add assertions in `tests/int/page-blocks.int.spec.ts` that the Theme Settings tab contains:

```ts
const cardsPerRow = getNamedField<SelectShape>(layoutTab?.fields ?? [], 'cardsPerRow')
const cardRatio = getNamedField<SelectShape>(layoutTab?.fields ?? [], 'cardRatio')
const showEventDate = getNamedField<CheckboxShape>(layoutTab?.fields ?? [], 'showEventDate')
const showImageCount = getNamedField<CheckboxShape>(layoutTab?.fields ?? [], 'showImageCount')
const showCardOverlay = getNamedField<CheckboxShape>(layoutTab?.fields ?? [], 'showCardOverlay')
const themeMode = getNamedField<SelectShape>(layoutTab?.fields ?? [], 'themeMode')
const overlayStyle = getNamedField<SelectShape>(layoutTab?.fields ?? [], 'overlayStyle')
const overlayDirection = getNamedField<SelectShape>(layoutTab?.fields ?? [], 'overlayDirection')
const overlayCoverage = getNamedField<SelectShape>(layoutTab?.fields ?? [], 'overlayCoverage')

expect(cardsPerRow).toMatchObject({ defaultValue: '3', required: true, type: 'select' })
expect(cardsPerRow?.options?.map(({ value }) => value)).toEqual(['2', '3', '4'])
expect(cardRatio).toMatchObject({ defaultValue: 'landscape', required: true, type: 'select' })
expect(cardRatio?.options?.map(({ value }) => value)).toEqual(['wide', 'landscape', 'square'])
expect(showCardOverlay).toMatchObject({ defaultValue: true, type: 'checkbox' })
expect(showEventDate).toMatchObject({ defaultValue: true, type: 'checkbox' })
expect(showImageCount).toMatchObject({ defaultValue: true, type: 'checkbox' })
expect(themeMode).toMatchObject({ defaultValue: 'dark', type: 'select' })
expect(overlayStyle).toMatchObject({ defaultValue: 'darker', type: 'select' })
expect(overlayDirection).toMatchObject({ defaultValue: 'bottomToTop', type: 'select' })
expect(overlayCoverage).toMatchObject({ defaultValue: 'full', type: 'select' })
```

Also assert that `cardTextLayout` defaults to `split` and retains values `split` and `center`.

- [ ] **Step 2: Add failing pure presentation tests**

Create `tests/int/event-gallery-presentation.int.spec.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import {
  isEventGalleryLeadCard,
  normalizeEventGalleryCardRatio,
  normalizeEventGalleryCardsPerRow,
} from '@/components/event-gallery-presentation'

describe('Event Gallery presentation settings', () => {
  it('normalizes columns and ratios to approved defaults', () => {
    expect(normalizeEventGalleryCardsPerRow('2')).toBe(2)
    expect(normalizeEventGalleryCardsPerRow(4)).toBe(4)
    expect(normalizeEventGalleryCardsPerRow('invalid')).toBe(3)
    expect(normalizeEventGalleryCardRatio('wide')).toBe('wide')
    expect(normalizeEventGalleryCardRatio('square')).toBe('square')
    expect(normalizeEventGalleryCardRatio('invalid')).toBe('landscape')
  })

  it('repeats deterministic lead cards for each desktop density', () => {
    expect([0, 1, 2, 3, 4, 5].filter((index) => isEventGalleryLeadCard(index, 2))).toEqual([0, 3])
    expect([0, 1, 2, 3, 4, 5].filter((index) => isEventGalleryLeadCard(index, 3))).toEqual([0, 3])
    expect([0, 1, 2, 3, 4, 5].filter((index) => isEventGalleryLeadCard(index, 4))).toEqual([0, 5])
  })
})
```

- [ ] **Step 3: Run the focused tests and confirm the expected failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/event-gallery-presentation.int.spec.ts
```

Expected: FAIL because the new schema fields and helper do not exist.

- [ ] **Step 4: Add the client-safe presentation helper**

Create `src/components/event-gallery-presentation.ts`:

```ts
export type EventGalleryCardsPerRow = 2 | 3 | 4
export type EventGalleryCardRatio = 'landscape' | 'square' | 'wide'

export function normalizeEventGalleryCardsPerRow(value: unknown): EventGalleryCardsPerRow {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value
  return parsed === 2 || parsed === 4 ? parsed : 3
}

export function normalizeEventGalleryCardRatio(value: unknown): EventGalleryCardRatio {
  return value === 'wide' || value === 'square' ? value : 'landscape'
}

export function isEventGalleryLeadCard(index: number, columns: EventGalleryCardsPerRow): boolean {
  const interval = columns === 4 ? 5 : 3
  return index % interval === 0
}
```

- [ ] **Step 5: Add the approved Theme Settings fields**

In `src/blocks/EventGallery/config.ts`, import `CheckboxField`, `Condition`, and the four shared
overlay field factories. Add Cards Per Row, Card Ratio, Show Card Details Overlay, Show Event Date,
Show Image Count, and shared overlay fields after `createBlockAppearanceFields()`. Hide every
overlay-dependent field when Show Card Details Overlay is disabled. Change the card placement field
to:

```ts
{
  name: 'cardTextLayout',
  label: 'Card Content Position',
  type: 'select',
  defaultValue: 'split',
  options: [
    { label: 'Bottom Left', value: 'split' },
    { label: 'Bottom Center', value: 'center' },
  ],
  required: true,
} satisfies SelectField
```

Use:

```ts
createMediaOverlayToneField({ defaultValue: 'dark' })
createMediaOverlayStrengthField({ defaultValue: 'darker' })
createMediaOverlayDirectionField({ defaultValue: 'bottomToTop' })
createMediaOverlayCoverageField({ defaultValue: 'full' })
```

- [ ] **Step 6: Run the focused contract tests**

Run the command from Step 3.

Expected: PASS.

---

### Task 2: Render the responsive editorial mosaic and shared overlay

**Files:**

- Modify: `src/blocks/EventGallery/Presentation.tsx`
- Modify: `src/components/event-gallery.tsx`
- Modify: `src/components/event-gallery-client.tsx`
- Modify: `tests/int/event-gallery-render.int.spec.tsx`
- Modify: `tests/int/event-gallery-selection.int.spec.tsx`

**Interfaces:**

- Consumes the Task 1 normalizers and types.
- Consumes `resolveMediaOverlay` and its existing serializable resolved result.
- Produces data attributes for resolved columns, ratio, overlay, metadata visibility, and lead cards.
- Preserves `EventGalleryViewer` activation and focus restoration.

- [ ] **Step 1: Add failing render assertions**

Extend `tests/int/event-gallery-render.int.spec.tsx` to render at least six albums and assert:

```ts
expect(html).toContain('data-event-gallery-columns="4"')
expect(html).toContain('data-event-gallery-ratio="wide"')
expect(html).toContain('data-event-gallery-overlay-tone="brand"')
expect(html).toContain('data-event-gallery-overlay-direction="bottomToTop"')
expect(html).toContain('data-event-gallery-lead="true"')
expect(html.match(/data-event-gallery-lead="true"/g)).toHaveLength(2)
```

Add independent metadata tests:

```ts
const hiddenMetadata = renderToStaticMarkup(
  <EventGallery albums={albums} showEventDate={false} showImageCount={false} title="Gallery" />,
)
expect(hiddenMetadata).not.toContain('21 Jun 2026')
expect(hiddenMetadata).not.toContain('data-event-gallery-image-count')
```

Keep the existing open/close/focus test unchanged.

- [ ] **Step 2: Run the Event Gallery render tests and confirm failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/event-gallery-render.int.spec.tsx \
  tests/int/event-gallery-selection.int.spec.tsx
```

Expected: FAIL because the new presentation props and markup are absent.

- [ ] **Step 3: Thread generated block values through the server presentation**

Extend `EventGalleryBlockLike` in `src/blocks/EventGallery/Presentation.tsx` with:

```ts
cardsPerRow?: EventGalleryCardsPerRow | `${EventGalleryCardsPerRow}` | null
cardRatio?: EventGalleryCardRatio | null
showEventDate?: boolean | null
showImageCount?: boolean | null
showCardOverlay?: boolean | null
themeMode?: MediaOverlayTone | null
overlayStyle?: MediaOverlayStrength | null
overlayDirection?: MediaOverlayDirection | null
overlayCoverage?: MediaOverlayCoverage | null
```

Pass every value to `<EventGallery>`, using nullish defaults only for booleans:

```tsx
showEventDate={showEventDate ?? true}
showImageCount={showImageCount ?? true}
showCardOverlay={showCardOverlay ?? true}
```

- [ ] **Step 4: Resolve settings and overlay in the section component**

In `src/components/event-gallery.tsx`, normalize columns and ratio, resolve the overlay once with
`resolveMediaOverlay`, add resolved data attributes to the section, and pass the resolved values into
`EventGalleryClient`:

```ts
const overlay = resolveMediaOverlay({
  coverage: overlayCoverage,
  direction: overlayDirection,
  sectionBackground: appearanceClasses.background,
  strength: overlayStyle,
  tone: themeMode,
})
```

- [ ] **Step 5: Replace the uniform client grid with deterministic mosaic cards**

In `src/components/event-gallery-client.tsx`:

- Keep hydration-safe reduced-motion handling, viewer state, and focus restoration.
- Use `grid-flow-dense grid-cols-1 md:grid-cols-2`, with literal desktop mappings for 2, 3, or 4
  columns.
- Treat every third tablet card as a full-width lead.
- On desktop, use `isEventGalleryLeadCard`; 2-column leads span two columns, while 3- and 4-column
  leads span two columns and two rows.
- Reset tablet spans at desktop when a 4-column card is not a desktop lead.
- Apply literal ratio mappings `aspect-video`, `aspect-4/3`, and `aspect-square`.
- Preserve DOM order and mark lead cards with `data-event-gallery-lead`.
- Render the shared overlay with `overlay.frameClassName` and `overlay.className`.
- Render the overlay and visible copy only when Show Card Details Overlay is enabled.
- Use `overlay.text.eyebrow` for one compact Image Count/Event Date row above the title and
  `overlay.text.title` for the title.
- Keep both Bottom Left and Bottom Center titles anchored to the lower edge.
- Use project display typography and a two-line title clamp:

```tsx
className={cn(
  'line-clamp-2 font-[family-name:var(--font-display)] font-semibold tracking-tight text-balance',
  overlay.text.title,
  isLead ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-xl sm:text-2xl',
)}
```

- Keep Event Date compact and render Image Count only when enabled.
- Keep image zoom and the focus-visible ring; respect reduced motion.

- [ ] **Step 6: Run all Event Gallery behavior tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/event-gallery-presentation.int.spec.ts \
  tests/int/event-gallery-render.int.spec.tsx \
  tests/int/event-gallery-selection.int.spec.tsx \
  tests/int/event-gallery-data.int.spec.ts \
  tests/int/event-gallery-viewer.int.spec.tsx
```

Expected: PASS.

---

### Task 3: Align previews, generated types, and maintained project knowledge

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/live-preview-renderer.int.spec.tsx`
- Modify: `src/payload-types.ts` via generator
- Modify: `.agents/skills/project-context/references/project-inventory.json` via updater
- Modify: `.agents/skills/project-context/references/block-system.md` only if the maintained behavior
  contract needs a narrative update

**Interfaces:**

- Consumes the unchanged `EventGalleryBlockPresentation` and `EventGalleryPreviewBlockComponent`.
- Produces a representative editorial-mosaic thumbnail fixture and current generated types.

- [ ] **Step 1: Add preview propagation assertions**

Extend the existing Event Gallery case in `tests/int/live-preview-renderer.int.spec.tsx` with
`cardsPerRow`, `cardRatio`, visibility toggles, and overlay values. Assert the matching Event Gallery
data attributes and the draft album title.

- [ ] **Step 2: Update the deterministic thumbnail fixture**

Update `src/block-thumbnails/fixtures.tsx` to pass:

```tsx
cardRatio="landscape"
cardTextLayout="split"
cardsPerRow={3}
overlayCoverage="full"
overlayDirection="bottomToTop"
overlayStyle="darker"
showEventDate
showImageCount
themeMode="dark"
```

Use at least three repository-local albums so the thumbnail displays one lead and two supporting
cards without a Payload or network query.

- [ ] **Step 3: Run preview and registry tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/live-preview-renderer.int.spec.tsx \
  tests/int/live-preview-import-boundary.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.tsx
```

Expected: PASS and no server-only gallery loader reachable from the live-preview graph.

- [ ] **Step 4: Generate Payload types**

Run `pnpm generate:types`.

Expected: `src/payload-types.ts` contains the new Event Gallery fields and no Gallery Album schema
change.

- [ ] **Step 5: Run type, format, lint, and diff checks**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/blocks/EventGallery src/components/event-gallery.tsx \
  src/components/event-gallery-client.tsx src/components/event-gallery-presentation.ts \
  tests/int/event-gallery-presentation.int.spec.ts tests/int/event-gallery-render.int.spec.tsx \
  tests/int/event-gallery-selection.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx
pnpm exec prettier --check src/blocks/EventGallery src/components/event-gallery.tsx \
  src/components/event-gallery-client.tsx src/components/event-gallery-presentation.ts \
  tests/int/event-gallery-presentation.int.spec.ts tests/int/event-gallery-render.int.spec.tsx \
  tests/int/event-gallery-selection.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx \
  docs/superpowers/specs/2026-08-19-event-gallery-editorial-mosaic-design.md \
  docs/superpowers/plans/2026-08-19-event-gallery-editorial-mosaic.md
git diff --check
```

Expected: PASS.

- [ ] **Step 6: Perform bounded visual verification**

Render the Event Gallery at one desktop and one mobile viewport in the same inspection pass. Verify
the primary-image hierarchy, repeated mosaic cadence, overlay contrast, long two-line titles, absent
dates, hidden counts, keyboard focus order, and mobile one-column flow. Make one consolidated
correction pass if needed, then one confirmation pass.

- [ ] **Step 7: Complete the project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Inspect the final diff against `.agents/skills/project-context/references/change-impact-map.md`. A
stale knowledge-graph warning is acceptable only if the check otherwise reports the repository
current.

- [ ] **Step 8: Final handoff without commit or staging**

Report the Admin controls, responsive mosaic behavior, overlay reuse, preserved viewer/loading
contracts, tests run, generated/context files changed, and any visual-verification limitation. Leave
all files uncommitted and unstaged.
