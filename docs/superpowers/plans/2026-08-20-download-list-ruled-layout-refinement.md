# Download List Ruled Layout Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine Download List by removing Table authoring, correcting Open/Framed outer rules, making the Inline badge opt-in, restoring the Boxed Card badge position, and replacing the circled Download icon with an animated trailing arrow.

**Architecture:** Preserve existing saved display values and resolve legacy `compact` to Inline List at the client boundary. Keep action destinations unchanged; presentation code alone owns the new default Download arrow, badge placement, and ruled-border geometry.

**Tech Stack:** Payload CMS fields and generated types, React, TypeScript, Tailwind CSS, Lucide React, Vitest, Testing Library, and the existing block-thumbnail generator.

## Global Constraints

- Do not commit, stage, unstage, or alter branch history.
- Selectable layouts are Inline List, Boxed Card Grid, Open Grid, and Framed Grid.
- Existing `compact` values render as Inline List without a migration.
- Inline `showInlineFileType` defaults to `false`.
- Boxed Card Grid places the file-type badge at the top right opposite the document icon.
- Open Grid shows top/bottom outer rules, no left/right outer borders, and all internal dividers.
- Framed Grid shows one complete square outer border and all internal dividers.
- Default Download icons use trailing `ArrowDown` with vertical hover/focus motion.
- Custom Lucide icons remain trailing and static; None remains iconless.
- Existing manual-action precedence, category filtering, 1–8 columns, and icon-size behavior remain unchanged.

---

### Task 1: Revise the Payload display controls

**Files:**

- Modify: `src/blocks/DownloadList/config.ts`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Produces `showInlineFileType?: boolean | null` with saved default `false`.
- Keeps `displayMode` runtime compatibility type including `compact`, while Admin options exclude it.

- [ ] **Step 1: Write failing schema tests**

Update the display-mode assertion to require these exact options:

```ts
;[
  { label: 'Inline List', value: 'list' },
  { label: 'Boxed Card Grid', value: 'cards' },
  { label: 'Open Grid', value: 'openGrid' },
  { label: 'Framed Grid', value: 'framedGrid' },
]
```

Add an assertion that `showInlineFileType` is a checkbox with `defaultValue: false` and that its condition returns true only for `displayMode: 'list'`.

- [ ] **Step 2: Run the focused suite and verify failure**

Run `pnpm exec vitest run tests/int/download-list.int.spec.tsx`.

Expected: schema assertions fail because Table is still selectable, Card Grid has its old label, and the Inline badge control is missing.

- [ ] **Step 3: Implement the schema changes**

Add a `isInlineList` condition beside `isGridMode`. Remove the `compact` option, relabel `cards`, and add:

```ts
{
  name: 'showInlineFileType',
  label: 'Show File Type Badge',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    condition: isInlineList,
    description: 'Shows the PDF or detected file-type badge above Inline List titles.',
  },
}
```

- [ ] **Step 4: Run the schema suite**

Expected: the focused suite passes its schema section.

---

### Task 2: Implement layout compatibility and badge placement

**Files:**

- Modify: `src/blocks/DownloadList/Component.tsx`
- Modify: `src/blocks/DownloadList/DownloadListClient.tsx`
- Modify: `src/blocks/DownloadList/Presentation.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- `DownloadListBlockLike` consumes `showInlineFileType?: boolean | null`.
- `DownloadListClient` and `DownloadListPresentation` receive `showInlineFileType: boolean`.
- `DownloadDisplayMode` retains `'compact'` so old Payload documents remain accepted.

- [ ] **Step 1: Write failing compatibility and placement tests**

Add focused assertions that:

- `compact` renders `data-download-presentation="inline"` and no `<table>`;
- Inline List omits `data-document-file-type` by default;
- Inline List includes the badge before the title when `showInlineFileType` is true;
- Boxed Card markup places the document icon before the badge and both before the title, with icon and badge in one top-row wrapper;
- Open and Framed ruled layouts still place the badge above the title.

- [ ] **Step 2: Run tests and verify failure**

Expected: legacy compact still renders Table, Inline always shows a badge, and Boxed Card lacks a shared top row.

- [ ] **Step 3: Normalize legacy display modes in the client**

Remove `compact` from the supported `displayModes` set. The existing fallback expression then maps `compact`, unknown, and missing values to `list` without changing the compatibility union.

Thread `showInlineFileType = false` from the server component through the client into presentation props.

- [ ] **Step 4: Restore Boxed Card's icon/badge top row**

In `GridDocumentItem`, branch only the top anatomy:

```tsx
{variant === 'card' ? (
  <div className="flex items-start justify-between gap-4" data-download-card-top-row="true">
    <DocumentIcon ... />
    <FileTypeBadge ... />
  </div>
) : (
  <DocumentIcon ... />
)}
```

For Boxed Card, render the title without a duplicate badge. For Open/Framed, retain the badge directly above the title.

- [ ] **Step 5: Make the Inline badge conditional and remove Table presentation**

Render `FileTypeBadge` inside Inline only when `showInlineFileType` is true. Delete `TablePresentation` and remove the `compact` dispatch branch from `DownloadListPresentation`.

- [ ] **Step 6: Run focused tests and TypeScript**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: all tests and type checking pass.

---

### Task 3: Correct ruled borders and Download arrow motion

**Files:**

- Modify: `src/blocks/DownloadList/Presentation.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Default Download icon data value changes from `circle-chevron-down` to `arrow-down`.
- Open/Framed continue using `data-download-grid-frame="open|framed"` for stable tests.

- [ ] **Step 1: Write failing border and motion tests**

Assert that Open Grid's wrapper contains top/bottom border classes but no left/right/full-border class. Assert that Framed Grid contains exactly one `border` outer wrapper, has `rounded-none`, and internal item dividers remain present.

For the default Download icon, assert `data-document-action-icon="arrow-down"`, two-arrow clipped markup matching `ActionArrow`, named `group-hover/button` and `group-focus-visible/button` translate-y classes, and `motion-reduce:transition-none`. Assert a custom icon does not receive those motion classes.

- [ ] **Step 2: Run tests and verify failure**

Expected: Open has no explicit top/bottom rules, Framed follows theme radius, and the circled icon remains static.

- [ ] **Step 3: Implement a vertical Download arrow animation**

Import `ArrowDown` instead of `CircleChevronDown`. For a resolved default Download icon, render a clipped `size-4` span with two stacked arrows:

- the resting arrow translates downward and fades on group hover/focus;
- the entering arrow starts above with zero opacity and translates to zero on group hover/focus;
- both use `duration-200 ease-out` and disable transitions for reduced motion.

Set `data-document-action-icon="arrow-down"` on the wrapper. Leave custom DynamicIcon rendering unchanged and static.

- [ ] **Step 4: Implement exact Open and Framed outer borders**

Use one wrapper for both ruled grids:

- Open: `border-y border-current/15`, no `border`, `border-x`, `border-l`, or `border-r` on the wrapper.
- Framed: `rounded-none border border-current/15`.

Keep the existing negative trailing-edge clipping and item `border-r border-b` classes so internal dividers remain continuous without doubled outer edges.

- [ ] **Step 5: Run focused tests, ESLint, and the design detector**

Expected: all pass and the detector returns `[]`.

---

### Task 4: Regenerate contracts, thumbnail, docs, and context

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Regenerate: `src/payload-types.ts`
- Regenerate: `public/block-thumbnails/download-list.jpg`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`

- [ ] **Step 1: Update fixture and documentation**

Keep Framed Grid in the thumbnail to expose the complete square outline. Ensure it demonstrates the Boxed/ruled badge hierarchy as applicable and the new trailing ArrowDown. Update operator and architecture docs to describe four selectable layouts, legacy compact fallback, Inline badge default Off, and exact Open/Framed boundaries.

- [ ] **Step 2: Regenerate Payload types**

Run `pnpm generate:types` and verify `showInlineFileType` appears while `displayMode` selectable types no longer include `compact`. Keep the handwritten runtime compatibility union accepting `compact`.

- [ ] **Step 3: Regenerate and inspect the thumbnail**

Run `BLOCK_THUMBNAIL_SLUG=downloadList pnpm generate:block-thumbnails`. Confirm the outer frame is square, internal rules are continuous, the Download arrow points down at the label's right, and no content clips.

- [ ] **Step 4: Run the project-context loop**

Run `pnpm project-context:update` and `pnpm project-context:check`. Only the known stale knowledge-graph warning may remain.

- [ ] **Step 5: Run final verification**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/DownloadListClient.tsx src/blocks/DownloadList/Presentation.tsx src/blocks/DownloadList/config.ts src/blocks/DownloadList/resolveActions.ts src/blocks/DownloadList/types.ts src/block-thumbnails/fixtures.tsx tests/int/download-list.int.spec.tsx
pnpm exec prettier --check src/blocks/DownloadList src/block-thumbnails/fixtures.tsx tests/int/download-list.int.spec.tsx src/payload-types.ts docs/guides/blocks.md .agents/skills/project-context/references/block-system.md
git diff --check
git diff --cached --check
```

Expected: every command exits successfully. Inspect `git status --short` and both staged/unstaged diffs without changing the index, then report the result and confirm no commit was created.
