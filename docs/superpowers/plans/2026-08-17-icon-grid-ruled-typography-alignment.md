# Icon Grid Ruled Typography Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Icon Grid Ruled Columns item titles and descriptions with the shared typography contract used by existing content blocks.

**Architecture:** Import the existing `contentItemTitleClasses` and `contentItemDescriptionClasses` exports into Icon Grid and apply them only inside `RuledItem`. Preserve the section-derived secondary color by composing it with the shared description classes, then regenerate the existing Icon Grid thumbnail and refresh deterministic project knowledge.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, Payload CMS 3 project tooling

## Global Constraints

- Apply the change only to the Icon Grid `Ruled Columns` presentation.
- Reuse `contentItemTitleClasses` and `contentItemDescriptionClasses` from `src/blocks/shared/contentStyles.ts`.
- Do not duplicate or modify the shared typography class strings.
- Preserve section-surface semantic contrast through `surface.secondary`.
- Preserve item padding, gaps, icons, dividers, columns, links, buttons, focus behavior, and markup semantics.
- Preserve Card, Contact Cards, Minimal, and Icon Top output.
- Do not change Payload configuration, generated Payload types, block registration, operator controls, or theme files.
- Regenerate only `public/block-thumbnails/icon-grid.jpg`.
- Refresh and check the project-context inventory after implementation.
- Do not stage or commit any change.

---

### Task 1: Apply the shared item typography contract

**Files:**

- Modify: `tests/int/icon-grid-ruled-columns.int.spec.tsx:118-148`
- Modify: `src/blocks/IconGrid/Component.tsx:1-22,517-525`
- Verify unchanged: `src/blocks/shared/contentStyles.ts`
- Verify unchanged: `src/styles/themes/theme-snmih.css`

**Interfaces:**

- Consumes: `contentItemTitleClasses: string` and `contentItemDescriptionClasses: string` from `@/blocks/shared/contentStyles`.
- Produces: Ruled Columns titles with shared sans-serif `text-md sm:text-lg` typography and descriptions with shared `text-sm leading-5` typography.
- Preserves: `surface.secondary` as the final description color input.

- [ ] **Step 1: Import the shared typography constants in the focused test**

Add this import below the Icon Grid config import in `tests/int/icon-grid-ruled-columns.int.spec.tsx`:

```tsx
import {
  contentItemDescriptionClasses,
  contentItemTitleClasses,
} from '@/blocks/shared/contentStyles'
```

- [ ] **Step 2: Replace the old Ruled Columns typography assertions with the shared contract**

In the existing `inherits the section surface and ignores per-item card backgrounds` test, replace:

```tsx
expect(html).toContain('font-[family-name:var(--font-display)]')
```

with:

```tsx
for (const className of contentItemTitleClasses.split(' ')) {
  expect(html).toContain(className)
}
for (const className of contentItemDescriptionClasses.split(' ')) {
  expect(html).toContain(className)
}
expect(html).not.toContain('font-[family-name:var(--font-display)]')
expect(html).not.toContain('text-2xl')
expect(html).not.toContain('text-base leading-7')
```

Keep the existing `border-current/15`, `text-current/70`, Outline icon, background-ignore, and card-shell assertions unchanged.

- [ ] **Step 3: Run the focused typography test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-grid-ruled-columns.int.spec.tsx -t "inherits the section surface" --reporter=dot
```

Expected: FAIL because the current ruled title uses the display font at `text-2xl` and its description uses `text-base leading-7`.

- [ ] **Step 4: Import the shared typography constants in Icon Grid**

Add this import with the existing shared block imports in `src/blocks/IconGrid/Component.tsx`:

```tsx
import {
  contentItemDescriptionClasses,
  contentItemTitleClasses,
} from '@/blocks/shared/contentStyles'
```

- [ ] **Step 5: Replace only the `RuledItem` title and description classes**

Replace the title and description section inside `RuledItem` with:

```tsx
<div className="flex flex-1 flex-col gap-3">
  <h3 className={contentItemTitleClasses}>{item.title?.trim()}</h3>
  {item.description?.trim() ? (
    <p className={cn(contentItemDescriptionClasses, 'whitespace-pre-line', surface.secondary)}>
      {item.description.trim()}
    </p>
  ) : null}
</div>
```

Do not change `ContactCardItem`, which intentionally retains its display-font `text-2xl` contact-card treatment.

- [ ] **Step 6: Run focused and adjacent renderer contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-grid-ruled-columns.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/content-style-parity.int.spec.ts --reporter=dot
```

Expected: all tests PASS. The focused suite proves Ruled Columns uses the shared contract; adjacent suites prove other variants and semantic surfaces remain intact.

- [ ] **Step 7: Run task-level static and layout checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/IconGrid/Component.tsx tests/int/icon-grid-ruled-columns.int.spec.tsx
pnpm exec prettier --check src/blocks/IconGrid/Component.tsx tests/int/icon-grid-ruled-columns.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/IconGrid/Component.tsx
git diff --check
git diff --exit-code -- src/blocks/shared/contentStyles.ts src/styles/themes/theme-snmih.css
```

Expected: TypeScript, ESLint, Prettier, and whitespace checks pass; the layout detector returns `[]`; shared styles and the SNMIH theme have no diff.

---

### Task 2: Refresh the preview and maintained project knowledge

**Files:**

- Regenerate: `public/block-thumbnails/icon-grid.jpg`
- Modify through generation if the source hash changes: `.agents/skills/project-context/references/project-inventory.json`
- Verify unchanged: `src/block-thumbnails/fixtures.tsx`
- Verify unchanged: `docs/guides/blocks.md`
- Verify unchanged: `.agents/skills/project-context/references/block-system.md`

**Interfaces:**

- Consumes: the existing production-component `iconGrid` thumbnail fixture with `variant="ruled"`.
- Produces: a 1600×900 Admin picker JPEG showing the shared item typography.
- Produces: a deterministic project inventory matching the final uncommitted source tree.

- [ ] **Step 1: Regenerate only the Icon Grid thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=iconGrid pnpm generate:block-thumbnails
```

Expected: only `public/block-thumbnails/icon-grid.jpg` is regenerated. Inspect it once to confirm titles use the smaller shared sans-serif treatment, descriptions use the shared body scale, dividers remain aligned, and no content is clipped.

- [ ] **Step 2: Run thumbnail and live-rendering contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-grid-ruled-columns.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts --reporter=dot
```

Expected: all tests PASS without fixture, registration, or renderer changes.

- [ ] **Step 3: Refresh and validate project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the inventory refreshes if needed and the check reports `Project context is current.` The existing knowledge-graph commit warning is non-blocking. Leave `block-system.md` unchanged because typography alignment does not change architecture, ownership, registration, or operator controls.

- [ ] **Step 4: Run the final affected verification matrix**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-grid-ruled-columns.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/content-style-parity.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/project-context-repository.int.spec.ts --reporter=dot
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/IconGrid/Component.tsx tests/int/icon-grid-ruled-columns.int.spec.tsx
pnpm exec prettier --check src/blocks/IconGrid/Component.tsx tests/int/icon-grid-ruled-columns.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/IconGrid/Component.tsx
pnpm project-context:check
git diff --check
```

Expected: all affected tests and static checks pass, the layout detector returns `[]`, and project context is current.

- [ ] **Step 5: Inspect scope and leave every change uncommitted**

Run:

```bash
git status --short
git diff --stat
git diff -- src/blocks/IconGrid/Component.tsx tests/int/icon-grid-ruled-columns.int.spec.tsx public/block-thumbnails/icon-grid.jpg .agents/skills/project-context/references/project-inventory.json src/blocks/shared/contentStyles.ts src/styles/themes/theme-snmih.css src/block-thumbnails/fixtures.tsx docs/guides/blocks.md .agents/skills/project-context/references/block-system.md
```

Expected implementation changes:

- `src/blocks/IconGrid/Component.tsx`
- `tests/int/icon-grid-ruled-columns.int.spec.tsx`
- `public/block-thumbnails/icon-grid.jpg`
- `.agents/skills/project-context/references/project-inventory.json` if its deterministic source hash changes

Expected planning files remain untracked unless already tracked by the caller:

- `docs/superpowers/specs/2026-08-17-icon-grid-ruled-typography-alignment-design.md`
- `docs/superpowers/plans/2026-08-17-icon-grid-ruled-typography-alignment.md`

Expected unchanged files include `src/blocks/shared/contentStyles.ts`, `src/styles/themes/theme-snmih.css`, `src/block-thumbnails/fixtures.tsx`, `docs/guides/blocks.md`, and `.agents/skills/project-context/references/block-system.md`.

Do not run `git add`, `git commit`, or any command that modifies Git history or the index.

---

## Completion Criteria

- Ruled Columns titles use the shared sans-serif `text-md sm:text-lg` content-item treatment.
- Ruled Columns descriptions use the shared `text-sm leading-5` content-item treatment with section-aware secondary color.
- Ruled layout geometry, semantics, theming, actions, and all other Icon Grid presentations remain unchanged.
- The Icon Grid Admin thumbnail reflects the typography alignment.
- Focused tests, adjacent rendering/theme contracts, TypeScript, ESLint, Prettier, layout detection, and project-context checks pass.
- All changes remain uncommitted.
