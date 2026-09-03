# Q&A Accordion Split Action Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Anchor section-level actions to the bottom of the Q&A Accordion section-content column on large Split layouts without changing Stacked or compact behavior.

**Architecture:** Keep the existing component and public props. In Split mode, render the introduction and optional supporting content inside a flexible alignment region, then render the existing header actions once in a separate bottom region. The grid’s default stretch behavior supplies the adjacent Q&A height; normal flow handles long content safely.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4 responsive utilities, Radix Accordion, Vitest server-render contracts.

## Global Constraints

- Apply the behavior only to Split layout at `lg` and above.
- Preserve Top, Center, and Bottom alignment for the content group above the action.
- Keep the action in normal flow; do not use fixed heights or absolute positioning.
- Preserve Stacked layout, compact breakpoints, action styling, action semantics, and DOM/keyboard order.
- Do not change Payload schema, generated types, stored content, footer actions, or Contact Prompt actions.

---

### Task 1: Anchor Split section actions

**Files:**
- Modify: `src/blocks/QaAccordion/Component.tsx:78-347`
- Test: `tests/int/qa-accordion.int.spec.ts`
- Modify if behavior contract changes: `.agents/skills/project-context/references/block-system.md`
- Generated check: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: `resolvedLayout.layoutMode`, `resolvedLayout.sectionVerticalAlignment`, `resolvedHeaderActions`, `ContentActions`, and the existing `data-qa-accordion-*` test hooks.
- Produces: a `data-qa-accordion-content-group="true"` grouping hook and Split-only `data-qa-accordion-section-actions="true"` action region; no public API or stored-data changes.

- [ ] **Step 1: Write failing Split and Stacked render contracts**

Add focused tests that render one authored section action in each layout. The Split test must assert that the section column uses `lg:h-full`, the content group uses the selected large-screen justification, the action region uses `lg:mt-auto`, the action appears exactly once, and the action follows the content group. The Stacked test must assert that it does not render the Split-only action-region hook or height class and still renders the action once inside the introduction.

```ts
const countOccurrences = (value: string, search: string) => value.split(search).length - 1

it('anchors section actions to the bottom of the split content column', () => {
  const html = renderToStaticMarkup(
    createElement(QaAccordionBlockComponent, {
      actions: [{ label: 'See All', linkType: 'custom', url: '/questions' }],
      description: 'Plan your visit.',
      items: [{ answer: createRichText('Answer'), question: 'Question' }],
      layoutMode: 'split',
      sectionVerticalAlignment: 'center',
      title: 'Library questions',
    }),
  )

  expect(html).toContain('data-qa-accordion-section-content="true"')
  expect(html).toContain('lg:h-full')
  expect(html).toContain('data-qa-accordion-content-group="true"')
  expect(html).toContain('lg:justify-center')
  expect(html).toContain('data-qa-accordion-section-actions="true"')
  expect(html).toContain('lg:mt-auto')
  expect(countOccurrences(html, 'href="/questions"')).toBe(1)
  expect(html.indexOf('data-qa-accordion-content-group="true"')).toBeLessThan(
    html.indexOf('data-qa-accordion-section-actions="true"'),
  )
})

it('keeps section actions in the natural stacked introduction flow', () => {
  const html = renderToStaticMarkup(
    createElement(QaAccordionBlockComponent, {
      actions: [{ label: 'See All', linkType: 'custom', url: '/questions' }],
      items: [{ answer: createRichText('Answer'), question: 'Question' }],
      layoutMode: 'stacked',
      title: 'Library questions',
    }),
  )

  expect(html).not.toContain('data-qa-accordion-section-actions="true"')
  expect(html).not.toContain('lg:h-full')
  expect(countOccurrences(html, 'href="/questions"')).toBe(1)
})
```

- [ ] **Step 2: Run the focused tests and confirm the new Split contract fails**

Run:

```bash
pnpm exec vitest run tests/int/qa-accordion.int.spec.ts
```

Expected: the new Split test fails because the component has no content-group/action-region hooks or full-height bottom-action classes; existing tests remain passing.

- [ ] **Step 3: Implement the responsive content and action regions**

Replace the `self-*` mapping with justification for the new flexible content region:

```ts
const sectionVerticalAlignmentClasses: Record<
  QaAccordionSectionVerticalAlignment,
  string
> = {
  bottom: 'lg:justify-end',
  center: 'lg:justify-center',
  top: 'lg:justify-start',
}
```

Build a content group that contains the introduction and optional supporting content. In Split mode, omit `resolvedHeaderActions` from the introduction and render them once after the content group:

```tsx
const sectionContentGroup = (
  <div
    className={cn(
      'flex flex-col gap-8 lg:gap-12',
      isSplitLayout && [
        'lg:flex-1',
        sectionVerticalAlignmentClasses[resolvedLayout.sectionVerticalAlignment],
      ],
    )}
    data-qa-accordion-content-group="true"
  >
    <div className={cn(contentIntroClasses, contentAlignmentClasses[resolvedContentAlignment])}>
      <h2 className={contentSectionHeadingClasses}>
        {resolvedAccentTitle ? (
          <>
            <span className="block font-[inherit]">{title}</span>
            <em className="block font-[inherit]">{resolvedAccentTitle}</em>
          </>
        ) : (
          title
        )}
      </h2>
      {description?.trim() ? (
        <p className={contentSectionDescriptionClasses}>{description.trim()}</p>
      ) : null}
      {!isSplitLayout ? (
        <ContentActions
          actions={resolvedHeaderActions}
          alignment={resolvedContentAlignment}
          data-qa-accordion-header-actions="true"
        />
      ) : null}
    </div>
    {supportingContent}
  </div>
)
```

Render the section-content column and Split action region in normal flow:

```tsx
<div
  className={cn(
    'order-1 flex flex-col',
    isSplitLayout
      ? [sidePlacementClasses[resolvedAccordionPlacement], 'lg:h-full']
      : 'mb-10 w-full lg:mb-16',
  )}
  data-qa-accordion-section-content="true"
>
  {sectionContentGroup}
  {isSplitLayout ? (
    <ContentActions
      actions={resolvedHeaderActions}
      alignment={resolvedContentAlignment}
      className="mt-4 lg:mt-auto"
      data-qa-accordion-header-actions="true"
      data-qa-accordion-section-actions="true"
    />
  ) : null}
</div>
```

`ContentActions` returns `null` for an empty list, so no empty action region is emitted. The base `mt-4` preserves the established compact introduction-to-action interval; `lg:mt-auto` anchors the action after the flexible content region on large Split layouts.

- [ ] **Step 4: Run focused block contracts**

Run:

```bash
pnpm exec vitest run tests/int/qa-accordion.int.spec.ts tests/int/block-layout-contracts.int.spec.tsx
```

Expected: both files pass, including Split placement/alignment, Stacked compatibility, legacy normalization, and first-row alignment contracts.

- [ ] **Step 5: Run static and mechanical layout checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/QaAccordion/Component.tsx tests/int/qa-accordion.int.spec.ts
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/QaAccordion/Component.tsx
```

Expected: TypeScript and ESLint exit successfully; the detector returns no unexplained layout findings.

- [ ] **Step 6: Refresh and verify maintained project context**

Update `block-system.md` only if the final behavior adds a durable Q&A layout contract, then run:

```bash
pnpm project-context:update
pnpm project-context:check
git diff --check
```

Expected: maintained context passes. An existing stale optional knowledge-graph warning is acceptable; generated inventory changes only if deterministic facts changed.

- [ ] **Step 7: Commit the implementation**

```bash
git add src/blocks/QaAccordion/Component.tsx tests/int/qa-accordion.int.spec.ts .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json docs/superpowers/plans/2026-08-25-qa-accordion-split-action-alignment.md
git commit -m "fix(qa): anchor split section actions"
```
