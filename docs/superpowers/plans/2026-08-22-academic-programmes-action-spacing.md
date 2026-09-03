# Academic Programmes Ruled Action Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guarantee a comfortable gap between programme-card descriptions and the ruled Grid/List action divider without changing other Academic Programmes action variants.

**Architecture:** Split the ruled action into an outer layout spacer and an inner divided action row. The outer layer owns bottom alignment and responsive-safe spacing; the inner layer retains the divider, link layout, typography, and arrow.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, Next.js 15.

## Global Constraints

- Change only the ruled Grid/List card action.
- Keep the inline action used with bottom-positioned programme details unchanged.
- Keep the Detailed Cards action unchanged.
- Preserve existing typography, colors, divider styling, link treatment, card height matching, responsive behavior, accessibility, and link semantics.
- Do not stage or commit changes.

---

### Task 1: Guarantee spacing before the ruled action divider

**Files:**
- Modify: `tests/int/academic-programmes-client.int.spec.tsx`
- Modify: `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx:169-200`

**Interfaces:**
- Consumes: `ProgrammeCard`, `metadataPosition`, `usesInlineAction`, `dividerClassName`, and the existing `data-academic-programme-action` test contract.
- Produces: `data-academic-programme-action-spacing="ruled"` on the non-interactive spacer while retaining `data-academic-programme-action="ruled"` on the divided action row.

- [x] **Step 1: Add the failing ruled-action spacing test**

Add this focused case to `tests/int/academic-programmes-client.int.spec.tsx` after the existing bottom-aligned action test:

```tsx
it('keeps guaranteed space before a bottom-aligned ruled action divider', () => {
  const { container } = render(
    <AcademicProgrammesClient
      background="none"
      columns="3"
      contentAlignment="left"
      metadataPosition="flow"
      programmes={[
        {
          ctaLabel: 'Explore MBBS',
          description: 'Build a strong foundation in medical science and clinical practice.',
          facts: [],
          href: '/programmes/mbbs',
          id: 'mbbs',
          openInNewTab: false,
          title: 'MBBS',
        },
      ]}
      showFilter={false}
      viewMode="grid"
    />,
  )

  const spacer = container.querySelector('[data-academic-programme-action-spacing="ruled"]')
  const action = container.querySelector('[data-academic-programme-action="ruled"]')

  expect(spacer?.className).toContain('mt-auto')
  expect(spacer?.className).toContain('pt-8')
  expect(spacer?.classList.contains('border-t')).toBe(false)
  expect(action?.classList.contains('border-t')).toBe(true)
  expect(action?.classList.contains('pt-5')).toBe(true)
})
```

- [x] **Step 2: Run the focused test and confirm the contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes-client.int.spec.tsx
```

Expected: FAIL because `data-academic-programme-action-spacing="ruled"` does not exist yet.

- [x] **Step 3: Separate ruled-action spacing from its divider**

Replace the current `actionElement` definition in `AcademicProgrammesClient.tsx` with:

```tsx
const actionContent = (
  <span
    className={cn(
      'text-sm font-semibold',
      usesInlineAction
        ? 'inline-flex items-center gap-2'
        : 'flex w-full items-center justify-between',
      !usesDefaultSurface && surface.link,
    )}
  >
    <span className="underline decoration-current decoration-2 underline-offset-4">
      {programme.ctaLabel}
    </span>
    <ActionArrow />
  </span>
)
const actionElement = programme.href ? (
  usesInlineAction ? (
    <div className="mt-5" data-academic-programme-action="inline">
      {actionContent}
    </div>
  ) : (
    <div
      className={cn(
        programme.description || hasMetadata ? 'pt-8' : 'pt-6',
        metadataPosition === 'flow' && 'mt-auto',
      )}
      data-academic-programme-action-spacing="ruled"
    >
      <div
        className={cn('border-t pt-5', dividerClassName)}
        data-academic-programme-action="ruled"
      >
        {actionContent}
      </div>
    </div>
  )
) : null
```

This preserves the single linked card and action DOM order. `pt-8` guarantees `2rem` before the divider when a description or metadata precedes it; content-light cards retain the existing compact `1.5rem` separation through `pt-6`.

- [x] **Step 4: Run the focused client contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes-client.int.spec.tsx
```

Expected: all Academic Programmes client tests PASS, including the unchanged inline and Detailed Cards assertions.

### Task 2: Verify repository and design contracts

**Files:**
- Update: `.agents/skills/project-context/references/project-inventory.json` only if generated inventory changes.
- Inspect: `.agents/skills/project-context/references/change-impact-map.md`

**Interfaces:**
- Consumes: the completed ruled-action DOM contract from Task 1.
- Produces: verified TypeScript, lint, layout-detector, project-context, and clean-diff results.

- [x] **Step 1: Run the broader Academic Programmes regression suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/block-surface-semantics.int.spec.ts
```

Expected: all selected test files PASS.

- [x] **Step 2: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: TypeScript exits successfully. ESLint reports zero errors; the existing unrelated Google Tag Manager warning may remain.

- [x] **Step 3: Run the focused layout detector**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx
```

Expected: `[]` or no actionable layout findings.

- [x] **Step 4: Complete the project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the generated inventory is current and the check passes. A stale optional knowledge-graph warning does not fail the task.

- [x] **Step 5: Inspect the final scoped diff without staging or committing**

Run:

```bash
git diff --check
git diff -- src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx tests/int/academic-programmes-client.int.spec.tsx .agents/skills/project-context/references/project-inventory.json
git status --short
```

Expected: no whitespace errors; only the approved spacing contract, its test, generated context changes if any, and the already-present user work remain. Do not run `git add` or `git commit`.
