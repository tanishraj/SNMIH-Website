# Academic Programmes Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Program Grid with one configurable Academic Programmes block that supports optional images, filters, grid/list presentations, badges, duration, and intake while retaining the project's current editorial design system.

**Architecture:** Keep Academic Programmes' server component responsible for Payload/media/link normalization and the shared section header/footer. Add a focused client presentation component for category state and grid/list cards, then remove Program Grid from every registry, renderer, thumbnail, type, and test surface.

**Tech Stack:** Payload CMS 3, Next.js 15, React 19, TypeScript, Tailwind CSS, Radix-compatible tab semantics, Vitest, Testing Library.

## Global Constraints

- Keep the `academicProgrammes` slug and existing Academic Programmes field names.
- Add no migration, compatibility adapter, hidden legacy renderer, new dependency, or raw brand colour.
- Images are optional; only a non-empty programme title is required at runtime.
- Filters derive from `Study Level / Category`; do not add a second category field.
- Grid remains the saved and runtime fallback; column values remain `2`, `3`, or `4` with fallback `3`.
- Reuse shared block spacing, content typography, card surfaces, media/link resolvers, and content-tab rail styles.
- Preserve existing split/stacked headers, alignments, actions, appearance, and section sizes.
- Do not stage, unstage, or commit any file.

---

### Task 1: Extend the Academic Programmes authoring schema

**Files:**
- Modify: `tests/int/academic-programmes.int.spec.tsx`
- Modify: `src/blocks/AcademicProgrammes/config.ts`

**Interfaces:**
- Produces: required `viewMode: 'grid' | 'list'`, optional `showFilter`, optional programme `badge`, `duration`, and `intake`, optional `image`, and `programmes.maxRows = 24`.
- Produces: `columns` Admin condition that is true unless the sibling `viewMode` is `list`.

- [ ] **Step 1: Add failing schema assertions**

Extend `NamedField` with `admin`, `maxRows`, and `label`, then assert:

```tsx
expect(findNamedField(fields, 'programmes')).toMatchObject({
  maxRows: 24,
  minRows: 1,
  required: true,
  type: 'array',
})
expect(findNamedField(fields, 'image')?.required).not.toBe(true)
expect(findNamedField(fields, 'badge')).toMatchObject({ type: 'text' })
expect(findNamedField(fields, 'duration')).toMatchObject({ type: 'text' })
expect(findNamedField(fields, 'intake')).toMatchObject({ type: 'text' })
expect(findNamedField(fields, 'viewMode')).toMatchObject({
  defaultValue: 'grid',
  required: true,
  type: 'select',
})
expect(findNamedField(fields, 'showFilter')).toMatchObject({
  defaultValue: false,
  type: 'checkbox',
})
expect(findNamedField(fields, 'ctaLabel')).toBeDefined()
expect(findNamedField(fields, 'actionMode')).toBeUndefined()
expect(findNamedField(fields, 'actionVariant')).toBeUndefined()
```

- [ ] **Step 2: Run the focused schema test and confirm failure**

Run `pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx`.

Expected: FAIL because the image is required, the array maximum is 6, and the new controls do not exist.

- [ ] **Step 3: Implement the schema fields and condition**

Add:

```ts
type AcademicProgrammesViewSiblingData = {
  viewMode?: 'grid' | 'list' | null
}

const usesGridView = (_data: unknown, siblingData: AcademicProgrammesViewSiblingData) =>
  siblingData?.viewMode !== 'list'
```

Remove `required: true` from `image`, set `programmesField.maxRows` to `24`, add `badge`, `duration`, and `intake` optional text fields after `eyebrow`, and add Theme Settings fields:

```ts
{
  name: 'viewMode',
  label: 'Programme Layout',
  type: 'select',
  defaultValue: 'grid',
  required: true,
  options: [
    { label: 'Grid', value: 'grid' },
    { label: 'List', value: 'list' },
  ],
},
{
  name: 'showFilter',
  label: 'Show Category Filter',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    description: 'Uses Study Level / Category values as filters when at least two categories exist.',
  },
},
```

Set `columns.admin.condition` to `usesGridView` and explain that columns apply only to Grid.

- [ ] **Step 4: Re-run the focused schema test**

Expected: PASS.

### Task 2: Add normalized grid/list/filter presentation

**Files:**
- Create: `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`
- Modify: `src/blocks/AcademicProgrammes/Component.tsx`
- Modify: `tests/int/academic-programmes.int.spec.tsx`

**Interfaces:**
- Produces: exported `ResolvedAcademicProgramme` with `id`, optional image, badge, eyebrow, description, duration, intake, href, and new-tab state.
- Produces: `AcademicProgrammesClient({ background, columns, contentAlignment, programmes, showFilter, viewMode })`.
- Consumes: shared `getContentTabClasses`, `getContentTabRailClasses`, `resolveCardSurface`, `SectionEyebrow`, `ActionArrow`, and shared content typography classes.

- [ ] **Step 1: Add failing server-render and interaction tests**

Update the old empty-state assertion so a titled programme without an image renders. Add server assertions:

```tsx
expect(html).toContain('data-academic-programmes-view="grid"')
expect(html).toContain('data-academic-programme-image="false"')
expect(html).toContain('Clinical priority')
expect(html).toContain('4.5 years')
expect(html).toContain('150 seats')
```

Add a `// @vitest-environment jsdom` interaction test using Testing Library with programmes in `Undergraduate`, duplicate `undergraduate`, `Postgraduate`, and no category. Assert the tablist contains `All`, the first authored `Undergraduate`, and `Postgraduate`; click `Postgraduate`; assert its programme remains and the others are hidden. Assert one-category data does not render a tablist.

Add list-mode assertions for `data-academic-programmes-view="list"`, responsive row classes, optional image, and no grid-column classes.

- [ ] **Step 2: Run the focused tests and confirm failure**

Expected: FAIL because image-less programmes are discarded and no client presentation exists.

- [ ] **Step 3: Normalize all approved fields in the server component**

Extend `ProgrammeValue` and `AcademicProgrammesBlockLike`, resolve an optional image, and keep a programme whenever `title.trim()` is non-empty:

```ts
const image = getMediaImageProps({
  media: programme.image as Media | string | number | null | undefined,
  fallbackAlt: programmeTitle,
})

return [{
  badge: programme.badge?.trim() || undefined,
  cardBackground: programme.cardBackground,
  ctaLabel: programme.ctaLabel?.trim() || 'Explore programme',
  description: programme.description?.trim() || undefined,
  duration: programme.duration?.trim() || undefined,
  eyebrow: programme.eyebrow?.trim() || undefined,
  href: destination.href,
  id: programme.id ?? index,
  image: image ?? undefined,
  intake: programme.intake?.trim() || undefined,
  openInNewTab: destination.openInNewTab ?? false,
  title: programmeTitle,
}]
```

Normalize `viewMode` to `list` only for that exact value; otherwise use `grid`. Pass normalized display props and programmes to the new client component while leaving the header and footer server-rendered.

- [ ] **Step 4: Implement the focused client presentation**

In `AcademicProgrammesClient.tsx`:

- derive categories in source order with `trimmed.toLocaleLowerCase()` keys;
- preserve the first authored display spelling;
- render filters only when `showFilter && categories.length >= 2`;
- treat an invalid active key as `all` without an effect;
- implement tab semantics, roving focus, Arrow Left/Right, Home, and End;
- reuse shared pill rail/tab class helpers;
- align the filter wrapper from `contentAlignment`;
- render grid classes for `2`, `3`, and `4`, or one responsive list row per programme;
- render optional image, badge, eyebrow, description, metadata, and existing ruled CTA in the approved order;
- wrap the complete card in a single anchor only when `href` exists.

Use `data-academic-programmes-view`, `data-academic-programmes-filter`, `data-academic-programmes-panel`, `data-academic-programme`, `data-academic-programme-image`, and `data-academic-programme-link` hooks for focused tests and thumbnail diagnosis.

- [ ] **Step 5: Re-run Academic Programmes tests**

Expected: PASS for schema, server rendering, list mode, optional images, metadata, category deduplication, filter interaction, and existing header/action behaviour.

### Task 3: Remove Program Grid from runtime and authoring registries

**Files:**
- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/ReusableSections.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Delete: `src/blocks/ProgramGrid/config.ts`
- Delete: `src/blocks/ProgramGrid/Component.tsx`
- Delete: `src/blocks/ProgramGrid/ProgramGridClient.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `tests/int/live-preview-renderer.int.spec.tsx`

**Interfaces:**
- Removes: `ProgramGridBlock`, `ProgramGridBlockComponent`, and `blockType: 'programGrid'` from all runtime and CMS unions after type generation.

- [ ] **Step 1: Add absence assertions and update expected counts**

Assert registered slugs and renderer sources do not contain `programGrid`. Reduce exact block counts by one wherever the removed choice is counted. Keep assertions that `academicProgrammes` exists in Pages and Reusable Sections and has both production and live-preview cases.

- [ ] **Step 2: Run registration and renderer tests and confirm failure**

Run `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx`.

Expected: FAIL because Program Grid remains registered and renderable.

- [ ] **Step 3: Remove imports, registrations, switch cases, and the Program Grid module**

Make exact removals only; preserve neighboring block order and unrelated imports. Delete the three Program Grid source files after all imports are gone.

- [ ] **Step 4: Re-run registration and renderer tests**

Expected: PASS.

### Task 4: Consolidate thumbnail coverage and generated types

**Files:**
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Delete: `public/block-thumbnails/program-grid.jpg`
- Regenerate: `public/block-thumbnails/academic-programmes.jpg`
- Regenerate: `src/payload-types.ts`
- Modify: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Modify: neighboring tests containing Program Grid generated-type or fixture expectations discovered with `rg`.

**Interfaces:**
- Removes the Program Grid thumbnail entry and fixture.
- Updates the Academic Programmes fixture to demonstrate filters, optional image, badge, duration, intake, and the retained editorial grid.
- Removes `ProgramGridBlock` from generated Payload types and expands `AcademicProgrammesBlock`.

- [ ] **Step 1: Add absence and consolidated-fixture assertions**

Assert Program Grid is absent from thumbnail definitions and fixtures. Assert Academic Programmes remains present and its fixture source contains the new fields/settings. Assert generated types contain `viewMode?: ('grid' | 'list') | null`, `showFilter?: boolean | null`, optional image, badge, duration, and intake, and do not contain `export interface ProgramGridBlock`.

- [ ] **Step 2: Run thumbnail/type-adjacent tests and confirm failure**

Run `pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/academic-programmes.int.spec.tsx`.

Expected: FAIL while Program Grid artifacts/types remain.

- [ ] **Step 3: Remove Program Grid thumbnail artifacts and update the Academic fixture**

Delete the Program Grid definition, JSX fixture, and exact JPEG. Update the Academic fixture with at least three programmes across two categories, including one text-only entry and populated badge/duration/intake metadata. Enable `showFilter` and retain grid mode.

- [ ] **Step 4: Regenerate Payload types**

Run `pnpm generate:types`.

Expected: successful generation; `AcademicProgrammesBlock` includes the new schema and `ProgramGridBlock` is absent.

- [ ] **Step 5: Regenerate and inspect the Academic Programmes thumbnail**

Run `BLOCK_THUMBNAIL_SLUG=academicProgrammes pnpm generate:block-thumbnails`.

Expected: `public/block-thumbnails/academic-programmes.jpg` is regenerated. Inspect it for current typography, spacing, filter contrast, mixed image/text cards, and clipping.

- [ ] **Step 6: Re-run thumbnail/type-adjacent tests**

Expected: PASS.

### Task 5: Verify the consolidation and refresh project context

**Files:**
- Modify only when generated by the mandated context workflow: `.agents/project-context/**`
- Modify only if existing operator documentation enumerates these blocks: matched documentation files from the context updater.

**Interfaces:**
- Produces a repository with one programme-card block and current generated project knowledge.

- [ ] **Step 1: Search for stale Program Grid references**

Run `rg -n "ProgramGrid|programGrid|Program Grid" src tests public docs` and exclude only this design/plan plus historical plans. Expected: no active source, test, fixture, generated-type, or public-thumbnail references. Historical plans remain unchanged.

- [ ] **Step 2: Run focused and neighboring integration tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/theme-surface-contract.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 3: Run static verification**

Run `pnpm exec tsc --noEmit` and `pnpm lint` separately. Expected: both exit 0.

- [ ] **Step 4: Run the project layout detector if present**

Locate the detector command from project context, run it, and require exit 0. Do not invent or install a detector when the context skill reports none.

- [ ] **Step 5: Complete the project-context update/check loop**

Run `pnpm project-context:update` followed by `pnpm project-context:check`.

Expected: generated knowledge reflects 52 registered page blocks and the consolidated Academic Programmes capabilities; check exits 0.

- [ ] **Step 6: Final diff and workspace review**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors; only approved implementation, generated types/thumbnail/context, spec, and plan changes appear. Leave every change unstaged and uncommitted.
