# Download List Inline Divider Height Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Download List Inline action divider fill the equalized height of every grid card.

**Architecture:** Keep the existing list/grid and divider structure intact. Add `h-full` only to the inner item grid so it inherits the equalized `<li>` height, allowing the existing `self-stretch` divider to fill that height without fixed sizing.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS v4, Vitest.

## Global Constraints

- Add `h-full` only to the Inline item container identified by `data-download-inline-item-container="true"`.
- Keep the divider class `self-stretch border-l border-current/15` unchanged.
- Add no fixed or minimum height.
- Do not change other Download List layouts, columns, padding, actions, icon behavior, typography, or borders.
- Do not stage or commit changes.

---

### Task 1: Equalize the Inline item container height

**Files:**

- Modify: `tests/int/download-list.int.spec.tsx:1090`
- Modify: `src/blocks/DownloadList/Presentation.tsx:424`

**Interfaces:**

- Consumes: the existing Inline `<li>` grid-cell height and `data-download-inline-item-container="true"` inner grid.
- Produces: an inner grid that fills its equalized parent card height.

- [ ] **Step 1: Extend the existing Inline divider contract**

Add this assertion to `uses a vertical Inline divider with actions fixed on the right`:

```tsx
expect(html).toContain('grid h-full min-w-0 items-start gap-4 p-5')
```

Keep the existing assertion:

```tsx
expect(html).toContain('self-stretch border-l border-current/15')
```

- [ ] **Step 2: Run the focused test and verify it fails**

```bash
pnpm vitest run tests/int/download-list.int.spec.tsx
```

Expected: `uses a vertical Inline divider with actions fixed on the right` fails because the inner grid does not contain `h-full`.

- [ ] **Step 3: Apply the minimal height inheritance fix**

Change the inner item grid classes in `InlinePresentation` to:

```tsx
className={cn(
  'grid h-full min-w-0 items-start gap-4 p-5',
  showDocumentIcon
    ? 'grid-cols-[auto_minmax(0,1fr)_auto_auto]'
    : 'grid-cols-[minmax(0,1fr)_auto_auto]',
)}
```

Do not change the `<li>`, divider, or action classes.

- [ ] **Step 4: Run the focused test and verify it passes**

```bash
pnpm vitest run tests/int/download-list.int.spec.tsx
```

Expected: all Download List integration tests pass.

### Task 2: Verify layout and repository contracts

**Files:**

- Inspect: `.agents/skills/project-context/references/change-impact-map.md`
- Update if generated: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the completed Inline item height behavior from Task 1.
- Produces: verified frontend and maintained-context contracts.

- [ ] **Step 1: Run TypeScript, focused lint, and formatting**

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList/Presentation.tsx tests/int/download-list.int.spec.tsx
pnpm exec prettier --check src/blocks/DownloadList/Presentation.tsx tests/int/download-list.int.spec.tsx docs/superpowers/specs/2026-08-28-download-list-inline-divider-height-design.md docs/superpowers/plans/2026-08-28-download-list-inline-divider-height.md
```

Expected: all commands exit successfully.

- [ ] **Step 2: Run the layout detector**

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/DownloadList/Presentation.tsx
```

Expected: `[]`.

- [ ] **Step 3: Complete the project-context loop**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current. A stale optional knowledge-graph warning may remain.

- [ ] **Step 4: Inspect the final diff**

```bash
git diff --check
git diff -- src/blocks/DownloadList/Presentation.tsx tests/int/download-list.int.spec.tsx .agents/skills/project-context/references/project-inventory.json
git status --short
```

Expected: no whitespace errors and only the intended Inline height/test delta plus any deterministic context hash update. Do not stage or commit.
