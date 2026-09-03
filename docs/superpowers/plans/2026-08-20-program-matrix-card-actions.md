# Program Matrix Card Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every linked Program Matrix card render its saved action using the existing block-level Link or Button presentation controls.

**Architecture:** Keep destination resolution and card rendering in the existing server component. Normalize the optional `actionMode` at the block boundary, fall back to Link for legacy content, and pass the resolved mode into the existing `ProgrammeAction` renderer. Preserve the Payload schema and shared semantic surface system.

**Tech Stack:** Payload CMS 3, Next.js 16, React 19 server components, TypeScript, Tailwind CSS 4, Vitest

## Global Constraints

- Do not make the full programme card clickable.
- Do not add per-item action presentation fields.
- Do not change section actions or footer actions.
- Missing, invalid, or unresolved destinations render no programme action.
- Missing or invalid legacy `actionMode` values fall back to `link`.
- Do not add raw colors or card-specific contrast overrides.
- No Payload migration or generated type change is required because the schema is unchanged.

---

### Task 1: Restore the Programme Action Rendering Contract

**Files:**
- Modify: `tests/int/program-matrix.int.spec.tsx:255-310`
- Modify: `src/blocks/ProgramMatrix/Component.tsx:38-51,107-120,152-156,267-278`

**Interfaces:**
- Consumes: Payload's existing optional `ProgramMatrixBlock.actionMode` value (`'button' | 'link' | null`) and `ProgrammeAction(props: ProgrammeActionProps)`.
- Produces: `ProgramMatrixBlockComponent` support for `actionMode?: 'button' | 'link' | null`, normalized to `'button' | 'link'` before programme cards render.

- [ ] **Step 1: Replace the link-only regression test with explicit Link, Button, and legacy-fallback coverage**

In `tests/int/program-matrix.int.spec.tsx`, replace `keeps item surface links readable across card backgrounds` with:

```tsx
it('honors link, button, and legacy programme action modes', () => {
  const linkHtml = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      actionMode="link"
      itemActionLabel="View programme"
      items={[
        {
          cardBackground: 'primary',
          linkType: 'custom',
          title: 'MBBS',
          url: '/mbbs',
        },
      ]}
      title="Programmes"
    />,
  )
  const buttonHtml = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      actionMode="button"
      actionVariant="secondary"
      itemActionLabel="Apply"
      items={[
        {
          cardBackground: 'secondary',
          linkType: 'custom',
          title: 'Nursing',
          url: '/nursing',
        },
      ]}
      title="Programmes"
    />,
  )
  const legacyHtml = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      items={[{ linkType: 'custom', title: 'Allied Health', url: '/allied-health' }]}
      title="Programmes"
    />,
  )

  expect(linkHtml).toContain('data-content-link="true"')
  expect(linkHtml).toContain('text-primary-foreground')
  expect(linkHtml).not.toContain('data-slot="button"')
  expect(buttonHtml).toContain('data-slot="button"')
  expect(buttonHtml).toContain('data-variant="secondary"')
  expect(buttonHtml).toContain('bg-secondary-foreground text-secondary')
  expect(buttonHtml).not.toContain('data-content-link="true"')
  expect(legacyHtml).toContain('data-content-link="true"')
})
```

- [ ] **Step 2: Run the focused test and verify the new contract fails**

Run:

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx
```

Expected: TypeScript transform or assertion failure because `ProgramMatrixBlockComponent` does not accept `actionMode` and still renders the Button case as a ContentLink.

- [ ] **Step 3: Add and normalize `actionMode` in the server component**

In `ProgramMatrixBlockLike`, add:

```ts
actionMode?: 'button' | 'link' | null
```

Destructure it in `ProgramMatrixBlockComponent`:

```ts
actionMode = 'link',
```

Resolve it alongside the other block-level presentation values:

```ts
const resolvedActionMode = actionMode === 'button' ? 'button' : 'link'
```

Replace the hard-coded programme action prop:

```tsx
<ProgrammeAction
  actionLabel={resolvedItemActionLabel}
  actionMode={resolvedActionMode}
  actionVariant={resolvedActionVariant}
  buttonClassName={buttonClassName}
  href={item.href}
  linkClassName={surface.link}
  openInNewTab={item.openInNewTab}
/>
```

- [ ] **Step 4: Run Program Matrix and shared card/button tests**

Run:

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/button-primary-variant.int.spec.tsx
```

Expected: all selected test files pass, including explicit Link, Button, and legacy Link fallback assertions.

- [ ] **Step 5: Run targeted static checks**

Run:

```bash
pnpm exec eslint src/blocks/ProgramMatrix/Component.tsx tests/int/program-matrix.int.spec.tsx
pnpm exec tsc --noEmit
git diff --check
```

Expected: all commands exit successfully with no diagnostics.

- [ ] **Step 6: Commit the runtime repair**

```bash
git add src/blocks/ProgramMatrix/Component.tsx tests/int/program-matrix.int.spec.tsx
git commit -m "fix(blocks): restore matrix card actions"
```

---

### Task 2: Represent Card Actions in the Admin Thumbnail

**Files:**
- Modify: `src/block-thumbnails/fixtures.tsx:2161-2205`
- Modify: `public/block-thumbnails/program-matrix.jpg`

**Interfaces:**
- Consumes: `ProgramMatrixBlockComponent` with `actionMode="button"`, `itemActionLabel`, and an item custom destination.
- Produces: an Admin picker thumbnail that visibly exercises the repaired programme-card action.

- [ ] **Step 1: Add one linked programme to the fixture**

In the `programMatrix` fixture, add these block props:

```tsx
actionMode="button"
itemActionLabel="View programme"
```

Add a destination to the first MBBS item:

```ts
linkType: 'custom',
url: '/programmes/mbbs',
```

Leave the remaining cards unlinked so the preview demonstrates that actions appear only when a destination exists.

- [ ] **Step 2: Extend the catalog test to lock the fixture contract**

In `tests/int/program-matrix.int.spec.tsx`, extend `has thumbnail definition and fixture coverage` with:

```ts
expect(thumbnailFixturesSource).toContain('actionMode="button"')
expect(thumbnailFixturesSource).toContain('itemActionLabel="View programme"')
expect(thumbnailFixturesSource).toContain("url: '/programmes/mbbs'")
```

- [ ] **Step 3: Run the catalog test**

Run:

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx
```

Expected: all Program Matrix tests pass.

- [ ] **Step 4: Regenerate only the Program Matrix thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=programMatrix pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/program-matrix.jpg` is regenerated at 1600×900 and visibly contains the MBBS button.

- [ ] **Step 5: Inspect the generated thumbnail and run focused checks**

Open `public/block-thumbnails/program-matrix.jpg` and confirm the matrix is not clipped, the button stays inside the MBBS card, and other cards contain no empty action space.

Run:

```bash
pnpm exec eslint src/block-thumbnails/fixtures.tsx tests/int/program-matrix.int.spec.tsx
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx
git diff --check
```

Expected: the visual inspection passes and every command exits successfully.

- [ ] **Step 6: Commit the thumbnail contract**

```bash
git add src/block-thumbnails/fixtures.tsx public/block-thumbnails/program-matrix.jpg tests/int/program-matrix.int.spec.tsx
git commit -m "test(blocks): preview matrix card action"
```

---

### Task 3: Complete Repository Context And Final Verification

**Files:**
- Potentially modify: `.agents/skills/project-context/references/project-inventory.json` only if the generated inventory changes.
- Inspect: `.agents/skills/project-context/references/change-impact-map.md`
- Inspect: `docs/guides/blocks.md`
- Inspect: `docs/architecture/feature-inventory.md`

**Interfaces:**
- Consumes: the completed runtime, tests, and thumbnail from Tasks 1 and 2.
- Produces: a context-checked, type-checked, lint-clean implementation with maintained documentation confirmed accurate.

- [ ] **Step 1: Refresh generated project context**

Run:

```bash
pnpm project-context:update
```

Expected: the command succeeds. Because no files or registrations were added, `project-inventory.json` should normally remain unchanged.

- [ ] **Step 2: Inspect final cross-file impact**

Read `.agents/skills/project-context/references/change-impact-map.md`, then run:

```bash
git status --short
git diff -- src/blocks/ProgramMatrix/Component.tsx src/block-thumbnails/fixtures.tsx public/block-thumbnails/program-matrix.jpg tests/int/program-matrix.int.spec.tsx .agents/skills/project-context/references/project-inventory.json
```

Expected: only the planned runtime, test, fixture, image, and any legitimate generated-inventory changes appear. `docs/guides/blocks.md` remains accurate because Button and Link Text behavior now matches its existing entry.

- [ ] **Step 3: Check maintained project context**

Run:

```bash
pnpm project-context:check
```

Expected: the project-context check passes.

- [ ] **Step 4: Run the final verification suite**

Run:

```bash
pnpm exec vitest run tests/int/program-matrix.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/button-primary-variant.int.spec.tsx tests/int/page-blocks.int.spec.ts
pnpm exec eslint src/blocks/ProgramMatrix/Component.tsx src/block-thumbnails/fixtures.tsx tests/int/program-matrix.int.spec.tsx
pnpm exec tsc --noEmit
git diff --check
```

Expected: all tests and static checks pass.

- [ ] **Step 5: Commit generated context only when it changed**

If `project-context:update` changed `project-inventory.json`, run:

```bash
git add .agents/skills/project-context/references/project-inventory.json
git commit -m "chore(context): refresh project inventory"
```

If it did not change, do not create an empty commit; report that project context remained current.
