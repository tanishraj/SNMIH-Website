# Tabs Content Active Color Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the active label in the Tabs Content underline variant use the selected website theme's primary color.

**Architecture:** Preserve the existing Tabs Content component and all tab variants. Add a focused source contract, then replace the underline active state's `text-foreground` utility with the semantic `text-primary` utility so the label and existing `border-primary` underline resolve from the same theme token.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS 4 semantic utilities, Vitest, TypeScript

## Global Constraints

- Active underline labels must use `text-primary`.
- Active underline borders must remain `border-primary`.
- Inactive underline labels and hover behavior must remain unchanged.
- Pills and boxed variants must remain unchanged.
- SNMIH theme token values must remain unchanged.
- Do not stage or commit files.

---

### Task 1: Align the underline tab label with its primary underline

**Files:**

- Create: `tests/int/tabs-content-active-color.int.spec.ts`
- Modify: `src/blocks/TabsContent/TabsContentClient.tsx:60`
- Test: `tests/int/tabs-content-active-color.int.spec.ts`

**Interfaces:**

- Consumes: the underline variant's active-state Tailwind class string in `TabsContentClient`
- Produces: an active underline state containing `border-primary text-primary` while preserving all other tab-state classes

- [ ] **Step 1: Write the failing source-contract test**

Create `tests/int/tabs-content-active-color.int.spec.ts`:

```ts
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Tabs Content active color', () => {
  it('uses the primary theme color for the active underline label and border', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/TabsContent/TabsContentClient.tsx'),
      'utf8',
    )

    expect(source).toContain("? 'border-primary text-primary'")
    expect(source).not.toContain("? 'border-primary text-foreground'")
    expect(source).toContain(
      "'border-transparent text-muted-foreground hover:text-foreground hover:border-border'",
    )
    expect(source).toContain("? 'bg-primary text-primary-foreground'")
    expect(source).toContain("? 'bg-background text-foreground shadow-sm'")
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/tabs-content-active-color.int.spec.ts
```

Expected: FAIL because the active underline state still contains `border-primary text-foreground`.

- [ ] **Step 3: Make the semantic class correction**

In the underline branch of `TabsContentClient`, replace only the active-state string:

```tsx
isActive
  ? 'border-primary text-primary'
  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/tabs-content-active-color.int.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Run formatting, lint, and type checks**

Run:

```bash
pnpm exec prettier --check src/blocks/TabsContent/TabsContentClient.tsx tests/int/tabs-content-active-color.int.spec.ts docs/superpowers/specs/2026-08-11-tabs-content-active-color-design.md docs/superpowers/plans/2026-08-11-tabs-content-active-color.md
pnpm exec eslint src/blocks/TabsContent/TabsContentClient.tsx tests/int/tabs-content-active-color.int.spec.ts
pnpm exec tsc --noEmit
git diff --check
```

Expected: all commands exit successfully with no formatting, lint, type, or whitespace errors.

- [ ] **Step 6: Review the unstaged worktree diff**

Run:

```bash
git status --short
git diff -- src/blocks/TabsContent/TabsContentClient.tsx tests/int/tabs-content-active-color.int.spec.ts
```

Expected: the component contains only the active underline text-token change, the focused regression test is present, and no command has staged or committed the work.
