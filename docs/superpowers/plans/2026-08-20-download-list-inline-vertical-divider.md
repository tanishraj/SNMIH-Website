# Download List Inline Vertical Divider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the Inline Download List divider vertical and its actions right-aligned at every width.

**Architecture:** Replace the container-query row switch with one stable grid anatomy. Preserve the
existing shared columns, optional file icon, content, actions, ruled item borders, and accessibility.

**Tech Stack:** React, TypeScript, Tailwind CSS 4, Vitest, project-context tooling.

## Global Constraints

- Do not stage or commit changes.
- Inline never renders a file-type badge.
- The divider is always vertical and actions are always in the far-right column.
- Text wraps in the flexible content column on narrow items.

---

### Task 1: Correct and verify the Inline anatomy

**Files:**

- Modify: `src/blocks/DownloadList/Presentation.tsx`
- Modify: `tests/int/download-list.int.spec.tsx`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`

**Interfaces:**

- With icon: `grid-cols-[auto_minmax(0,1fr)_auto_auto]`.
- Without icon: `grid-cols-[minmax(0,1fr)_auto_auto]`.
- Divider: `self-stretch border-l border-current/15`.
- Actions: final column with `self-center`.

- [ ] **Step 1: Change the Inline test to require a permanent vertical divider**

Assert the markup contains the icon and no-icon column definitions, `self-stretch border-l`, and
`self-center`; assert it contains neither `border-t` nor named-container breakpoint classes.

- [ ] **Step 2: Run the focused test and verify failure**

Run `pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "vertical Inline"`.

Expected: failure while the presentation still contains its horizontal fallback.

- [ ] **Step 3: Implement the stable Inline grid**

Remove `@container/download-item` and every `@xl/download-item` class. Use the Interfaces classes above
on the inner grid, divider, and actions.

- [ ] **Step 4: Update maintained behavior documentation**

Replace the below-to-right adaptive wording with the permanent vertical-divider/right-action contract
in all three maintained references.

- [ ] **Step 5: Refresh project context and verify**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList/Presentation.tsx tests/int/download-list.int.spec.tsx
pnpm exec prettier --check src/blocks/DownloadList/Presentation.tsx tests/int/download-list.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md
git diff HEAD --check
```

Expected: every command passes apart from the known non-blocking stale knowledge-graph warning.
