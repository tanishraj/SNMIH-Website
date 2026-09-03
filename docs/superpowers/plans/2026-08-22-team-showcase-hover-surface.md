# Team Showcase Hover Surface Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the shadcnblocks Team 11 hover-bio card with an opaque semantic surface for default and explicitly themed team members.

**Architecture:** Keep the existing Team 11-derived grid and Framer Motion overlay. Resolve the hovered member's surface in the parent render loop, map only the transparent Default surface to the project's Card tokens, and apply the resulting opaque class set to the animated wrapper.

**Tech Stack:** React 19, TypeScript, Next.js Image, Tailwind CSS 4, Framer Motion, shadcn semantic tokens, Vitest, Testing Library.

## Global Constraints

- Preserve the shadcnblocks Team 11 hover-bio interaction.
- Preserve the current grid, member fields, image treatment, responsive column logic, and Framer Motion transition.
- Default raised cards use `bg-card text-card-foreground`.
- Primary, Secondary, Muted, and Accent raised cards retain their configured semantic surfaces.
- Preserve the desktop-only hover overlay and the existing non-hover mobile presentation.
- Do not add configuration fields, dependencies, links, buttons, or focus targets.
- Do not stage or commit changes.

---

### Task 1: Add the hover-surface interaction contract

**Files:**
- Create: `tests/int/team-showcase-hover-surface.int.spec.tsx`

**Interfaces:**
- Consumes: `TeamShowcase` from `@/components/team-showcase` and the existing mouse-enter/grid mouse-leave interaction.
- Produces: a regression contract for `data-team-showcase-hover-surface`, Default Card tokens, explicit Primary tokens, desktop-only visibility, and overlay removal on mouse leave.

- [x] **Step 1: Create the failing interaction test**

Create `tests/int/team-showcase-hover-surface.int.spec.tsx` with:

```tsx
// @vitest-environment jsdom

import type { PropsWithChildren } from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <span aria-label={alt} data-image-src={src} role="img" />
  ),
}))

type MotionDivProps = PropsWithChildren<{
  className?: string
  'data-team-showcase-hover-surface'?: string
}>

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      'data-team-showcase-hover-surface': surface,
    }: MotionDivProps) => (
      <div className={className} data-team-showcase-hover-surface={surface}>
        {children}
      </div>
    ),
  },
}))

import { TeamShowcase } from '@/components/team-showcase'

afterEach(() => cleanup())

const member = {
  description: 'Supports teaching, research, and patient care.',
  image: '/team/member.jpg',
  name: 'Dr Example',
  role: 'Professor',
}

describe('Team Showcase hover surfaces', () => {
  it('raises a default member on an opaque Card surface and clears it on grid leave', () => {
    const { container } = render(
      <TeamShowcase appearance={{ background: 'subtle' }} members={[member]} />,
    )

    fireEvent.mouseEnter(container.querySelector('li') as HTMLLIElement)

    const overlay = container.querySelector('[data-team-showcase-hover-surface="default"]')
    expect(overlay?.className).toContain('bg-card text-card-foreground')
    expect(overlay?.className).toContain('hidden')
    expect(overlay?.className).toContain('md:block')

    fireEvent.mouseLeave(container.querySelector('ul') as HTMLUListElement)
    expect(container.querySelector('[data-team-showcase-hover-surface]')).toBeNull()
  })

  it('keeps an explicit Primary surface on the raised member', () => {
    const { container } = render(
      <TeamShowcase members={[{ ...member, cardBackground: 'primary' }]} />,
    )

    fireEvent.mouseEnter(container.querySelector('li') as HTMLLIElement)

    const overlay = container.querySelector('[data-team-showcase-hover-surface="primary"]')
    expect(overlay?.className).toContain('bg-primary text-primary-foreground')
  })
})
```

- [x] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/team-showcase-hover-surface.int.spec.tsx
```

Expected: FAIL because the animated wrapper does not yet expose `data-team-showcase-hover-surface` or an opaque semantic background.

### Task 2: Restore the semantic Team 11 hover layer

**Files:**
- Modify: `src/components/team-showcase.tsx:141-175`
- Test: `tests/int/team-showcase-hover-surface.int.spec.tsx`

**Interfaces:**
- Consumes: `resolveCardSurface(member.cardBackground, sectionBackground)` and its `value` and `className` result.
- Produces: an opaque class set and `data-team-showcase-hover-surface={hoverSurface.value}` on the existing Framer Motion wrapper.

- [x] **Step 1: Resolve the member's raised surface inside the map**

Immediately inside `members.map((member, index) => {`, add:

```tsx
const hoverSurface = resolveCardSurface(member.cardBackground, sectionBackground)
const hoverSurfaceClassName =
  hoverSurface.value === 'default'
    ? 'bg-card text-card-foreground'
    : hoverSurface.className
```

- [x] **Step 2: Apply the resolved surface to the animated wrapper**

Replace the hover wrapper's current `className` prop and add its data contract:

```tsx
className={cn(
  'pointer-events-none absolute inset-0 z-10 hidden h-max overflow-hidden rounded-2xl shadow-lg md:block',
  hoverSurfaceClassName,
)}
data-team-showcase-hover-surface={hoverSurface.value}
```

Do not alter `layoutId`, transition settings, hover state handlers, member-card content, or the `md:block` boundary.

- [x] **Step 3: Run the focused interaction test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/team-showcase-hover-surface.int.spec.tsx
```

Expected: both hover-surface tests PASS.

- [x] **Step 4: Run Team Showcase and semantic-surface regressions**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/team-showcase-hover-surface.int.spec.tsx tests/int/block-layout-contracts.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/block-surface-semantics.int.spec.ts
```

Expected: all selected test files PASS.

### Task 3: Verify design and repository contracts

**Files:**
- Update: `.agents/skills/project-context/references/project-inventory.json` only if the generated inventory changes.
- Inspect: `.agents/skills/project-context/references/block-system.md`
- Inspect: `.agents/skills/project-context/references/change-impact-map.md`

**Interfaces:**
- Consumes: the completed Team Showcase hover-surface contract.
- Produces: verified TypeScript, lint, design-detector, project-context, and clean-diff results.

- [x] **Step 1: Run TypeScript and lint**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: TypeScript exits successfully. ESLint reports zero errors; the existing unrelated Google Tag Manager warning may remain.

- [x] **Step 2: Run the focused design detector**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/components/team-showcase.tsx
```

Expected: `[]` or no actionable layout findings.

- [x] **Step 3: Complete the project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the inventory is current and the check passes. Update `block-system.md` only if the final change alters its documented Team Showcase contract; a stale optional knowledge-graph warning does not fail the task.

- [x] **Step 4: Inspect the final diff without staging or committing**

Run:

```bash
git diff --check
git diff -- src/components/team-showcase.tsx tests/int/team-showcase-hover-surface.int.spec.tsx .agents/skills/project-context/references/project-inventory.json
git status --short
```

Expected: no whitespace errors; the scoped diff contains only the approved hover-surface repair, its regression test, generated project-context changes if any, and already-present user work. Do not run `git add` or `git commit`.
