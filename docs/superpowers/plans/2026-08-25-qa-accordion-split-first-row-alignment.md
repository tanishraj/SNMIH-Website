# Q&A Accordion Split First-Row Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the first Q&A trigger’s large-screen top padding only in Split mode so it aligns with the section title while preserving existing mobile, later-row, and Stacked spacing.

**Architecture:** Keep the correction local to `QaAccordionTrigger` inside the existing item map. The renderer uses the already-resolved `isSplitLayout` flag plus `index === 0` to choose asymmetric large-screen padding, with server-rendering tests asserting the exact first-row, subsequent-row, and Stacked contracts.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS 4, Radix Accordion, Vitest, TypeScript 5.7.

## Global Constraints

- Do not change Payload schema, stored content, generated types, or Admin controls.
- Split first item keeps `py-6` below `lg` and uses `lg:pt-0 lg:pb-8` at `lg` and above.
- Split subsequent items retain `py-6 lg:py-8`.
- Stacked items retain `py-6 lg:py-8`, including the first item.
- Do not change question typography, icons, separators, answer padding, open state, focus behavior, or accordion interaction.
- Do not move the Q&A column or section title and do not alter section-content vertical alignment.
- Complete the project-context update/check loop required by `AGENTS.md`.

---

### Task 1: Split first-trigger desktop spacing

**Files:**
- Modify: `tests/int/qa-accordion.int.spec.ts`
- Modify: `src/blocks/QaAccordion/Component.tsx`
- Verify generated context: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: the existing `isSplitLayout: boolean` and zero-based `index` inside `validItems.map`.
- Produces: Split first-trigger classes `py-6 lg:pt-0 lg:pb-8`; all other trigger classes remain `py-6 lg:py-8`.

- [ ] **Step 1: Add failing server-rendering tests**

Add these tests inside `describe('Q&A Accordion block', ...)` in `tests/int/qa-accordion.int.spec.ts`:

```ts
const getAccordionTriggerClasses = (html: string) =>
  Array.from(html.matchAll(/<button[^>]*class="([^"]*)"/g), (match) => match[1])

it('removes desktop top padding only from the first Split trigger', () => {
  const html = renderToStaticMarkup(
    createElement(QaAccordionBlockComponent, {
      items: [
        { answer: createRichText('First answer'), question: 'First question' },
        { answer: createRichText('Second answer'), question: 'Second question' },
      ],
      layoutMode: 'split',
      title: 'Frequently asked questions',
    }),
  )
  const [firstTrigger, secondTrigger] = getAccordionTriggerClasses(html)

  expect(firstTrigger).toContain('py-6')
  expect(firstTrigger).toContain('lg:pt-0')
  expect(firstTrigger).toContain('lg:pb-8')
  expect(firstTrigger).not.toContain('lg:py-8')
  expect(secondTrigger).toContain('py-6')
  expect(secondTrigger).toContain('lg:py-8')
  expect(secondTrigger).not.toContain('lg:pt-0')
})

it('retains symmetric first-trigger padding in Stacked mode', () => {
  const html = renderToStaticMarkup(
    createElement(QaAccordionBlockComponent, {
      items: [{ answer: createRichText('Answer'), question: 'Question' }],
      layoutMode: 'stacked',
      title: 'Frequently asked questions',
    }),
  )
  const [firstTrigger] = getAccordionTriggerClasses(html)

  expect(firstTrigger).toContain('py-6')
  expect(firstTrigger).toContain('lg:py-8')
  expect(firstTrigger).not.toContain('lg:pt-0')
  expect(firstTrigger).not.toContain('lg:pb-8')
})
```

Place `getAccordionTriggerClasses` beside the existing `getTabs` and `getNamedField` test helpers so it is defined once outside the test body.

- [ ] **Step 2: Run the focused tests and verify the Split assertion fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/qa-accordion.int.spec.ts -t "padding"
```

Expected: the Split test fails because the first trigger still contains `lg:py-8`; the Stacked test passes.

- [ ] **Step 3: Apply conditional large-screen trigger padding**

In `src/blocks/QaAccordion/Component.tsx`, replace the trigger’s static `className` with:

```tsx
<QaAccordionTrigger
  className={cn(
    'justify-between py-6 text-left text-base font-semibold hover:no-underline sm:text-lg lg:text-xl',
    isSplitLayout && index === 0 ? 'lg:pt-0 lg:pb-8' : 'lg:py-8',
  )}
>
  <span className="pr-4">{item.question}</span>
</QaAccordionTrigger>
```

Do not change the surrounding `QaAccordionItem`, `QaAccordionContent`, item keys, values, or separator condition.

- [ ] **Step 4: Run focused Q&A and layout contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/qa-accordion.int.spec.ts \
  tests/int/block-layout-contracts.int.spec.tsx
```

Expected: both files pass, including the new Split and Stacked padding tests.

- [ ] **Step 5: Run layout, type, lint, and project-context verification**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/QaAccordion/Component.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/QaAccordion/Component.tsx tests/int/qa-accordion.int.spec.ts
pnpm project-context:update
pnpm project-context:check
git diff --check
```

Expected: the layout detector returns `[]`; TypeScript, ESLint, context check, and diff check exit 0. The context updater should be a no-op because no file/export inventory changed; if it updates the deterministic hash, inspect and include only the generated inventory change.

- [ ] **Step 6: Review scope and commit**

Run:

```bash
git status --short
git diff -- src/blocks/QaAccordion/Component.tsx tests/int/qa-accordion.int.spec.ts .agents/skills/project-context/references/project-inventory.json
```

Confirm the diff contains only the conditional trigger padding, its tests, and an optional generated inventory hash update. Then commit:

```bash
git add src/blocks/QaAccordion/Component.tsx tests/int/qa-accordion.int.spec.ts .agents/skills/project-context/references/project-inventory.json
git commit -m "fix(qa): align first split question"
```
