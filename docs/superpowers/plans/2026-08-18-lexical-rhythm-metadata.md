# Lexical Rhythm and Story Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce long-form H2–H6 sizes, establish smooth spacing across Lexical elements, hide `<p><br></p>`, and align News/Event metadata values with the normal text family.

**Architecture:** Keep all Lexical presentation changes inside the existing client-safe `richTextStyles.ts` presets so every consumer inherits the same DOM treatment. Keep the Story Details typography change local to `StoryDetail`, preserving its data and layout while separating mono labels from text-family values.

**Tech Stack:** React 19, Next.js 15, Payload Lexical, Tailwind CSS 4, `@tailwindcss/typography`, Vitest.

## Global Constraints

- H1 remains unavailable in project-owned editors.
- H2–H6 use `var(--font-text)` and the smaller approved responsive scale.
- Preserve the defensive legacy H1 style.
- Hide only paragraphs whose sole element child is `br`.
- Metadata labels remain mono uppercase at regular weight.
- Metadata values use `var(--font-text)` at medium weight; only dates use tabular numerals.
- Do not change the page-level title, overlay title, Story Details data, card layout, or the user-selected `30rem` sidebar width.
- Use theme and Tailwind scale tokens; do not introduce hardcoded pixel sizes, colors, or fonts.
- Preserve unrelated changes in the dirty shared worktree.
- Do not stage or commit.

---

### Task 1: Refine Shared Lexical Scale and Rhythm

**Files:**

- Modify: `tests/int/rich-text-presentation.int.spec.tsx`
- Modify: `src/components/rich-text/richTextStyles.ts`

**Interfaces:**

- Consumes: `longFormRichTextClasses` and `compactRichTextClasses` from the existing shared presentation module.
- Produces: smaller H2–H6 scales, balanced block rhythm, and one shared empty-paragraph selector.

- [ ] **Step 1: Update the presentation test to the smaller scale**

In `tests/int/rich-text-presentation.int.spec.tsx`, replace the long-form H2–H6 assertions with:

```tsx
for (const className of [
  'prose-h2:text-2xl',
  'sm:prose-h2:text-3xl',
  'prose-h3:text-xl',
  'sm:prose-h3:text-2xl',
  'prose-h4:text-lg',
  'sm:prose-h4:text-xl',
  'prose-h5:text-base',
  'sm:prose-h5:text-lg',
  'prose-h6:text-sm',
  'sm:prose-h6:text-base',
]) {
  expect(longFormRichTextClasses).toContain(className)
}
```

Keep the defensive H1 assertions unchanged. Add these rhythm assertions:

```tsx
for (const className of [
  '[&>*:first-child]:mt-0',
  '[&>*:last-child]:mb-0',
  '[&_p:has(>br:only-child)]:hidden',
  'prose-h2:mt-10',
  'prose-h6:mt-5',
  'prose-p:my-4',
  'prose-ul:my-5',
  'prose-ol:my-5',
  'prose-li:my-1.5',
  '[&_li>ul]:my-2',
  '[&_li>ol]:my-2',
  'prose-blockquote:my-6',
  'prose-pre:my-6',
  'prose-hr:my-8',
  'prose-figure:my-6',
]) {
  expect(longFormRichTextClasses).toContain(className)
}
```

Replace the compact hierarchy assertions with:

```tsx
for (const className of [
  'prose-h2:text-xl',
  'prose-h3:text-lg',
  'prose-h4:text-base',
  'prose-h5:text-sm',
  'prose-h6:text-xs',
]) {
  expect(compactRichTextClasses).toContain(className)
}

expect(compactRichTextClasses).toContain('[&_p:has(>br:only-child)]:hidden')
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/rich-text-presentation.int.spec.tsx
```

Expected: FAIL because the existing heading scales are larger, long-form block margins are wider, and no empty-paragraph selector exists.

- [ ] **Step 3: Add the shared boundary and empty-paragraph rules**

In `semanticRichTextClasses`, add:

```ts
'[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
'[&_p:has(>br:only-child)]:hidden',
```

This selector stays inside the shared prose wrapper and therefore cannot hide unrelated page paragraphs.

- [ ] **Step 4: Apply the approved long-form hierarchy and rhythm**

Keep the current defensive H1 class, then use:

```ts
'prose-h2:mt-10 prose-h2:mb-3 prose-h2:text-2xl sm:prose-h2:text-3xl',
'prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-xl sm:prose-h3:text-2xl',
'prose-h4:mt-7 prose-h4:mb-2 prose-h4:text-lg sm:prose-h4:text-xl',
'prose-h5:mt-6 prose-h5:mb-2 prose-h5:text-base sm:prose-h5:text-lg',
'prose-h6:mt-5 prose-h6:mb-2 prose-h6:text-sm sm:prose-h6:text-base',
'prose-p:my-4 prose-p:text-base prose-p:leading-8',
'prose-ul:my-5 prose-ol:my-5 prose-li:my-1.5 prose-li:leading-7',
'[&_li>ul]:my-2 [&_li>ol]:my-2',
'prose-blockquote:my-6 prose-blockquote:py-2',
'prose-pre:my-6 prose-hr:my-8 prose-figure:my-6',
```

- [ ] **Step 5: Apply the compact hierarchy**

Keep the defensive compact H1 class, then use:

```ts
'prose-h2:mt-4 prose-h2:mb-2 prose-h2:text-xl',
'prose-h3:mt-3 prose-h3:mb-2 prose-h3:text-lg',
'prose-h4:mt-3 prose-h4:mb-1.5 prose-h4:text-base',
'prose-h5:mt-3 prose-h5:mb-1.5 prose-h5:text-sm',
'prose-h6:mt-3 prose-h6:mb-1.5 prose-h6:text-xs',
```

Retain the compact paragraph, list, blockquote, code, rule, and figure rhythm already present.

- [ ] **Step 6: Run the focused test and typography detector**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/rich-text-presentation.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json --scope type src/components/rich-text/richTextStyles.ts
```

Expected: the test passes and the detector returns an empty JSON array.

---

### Task 2: Refine Story Details Label and Value Roles

**Files:**

- Modify: `tests/int/news-event-story.int.spec.tsx`
- Modify: `src/components/news-events/NewsEventStory.tsx`

**Interfaces:**

- Consumes: `StoryDetail` label, value, optional `valueClassName`, and existing `CardSurfaceClasses`.
- Produces: regular mono labels and consistent text-family values without changing card data or layout.

- [ ] **Step 1: Update the story contract test**

In the Story Details assertion block, replace the old mono checks with:

```tsx
expect(markup).toContain('font-mono text-xs font-normal')
expect(markup).toContain('font-[family-name:var(--font-text)] text-sm')
expect(markup).not.toContain('font-mono text-sm')
expect(markup.match(/tabular-nums/g)).toHaveLength(1)
expect(markup).toContain('prose-h2:mt-10')
```

- [ ] **Step 2: Run the story test and verify the expected failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-event-story.int.spec.tsx
```

Expected: FAIL because labels are semibold, values are mono, and the rendered long-form H2 still has the previous margin until Task 1 is applied.

- [ ] **Step 3: Update the label and value classes**

In `StoryDetail`, change the label classes to:

```ts
'font-mono text-xs font-normal tracking-[0.14em] uppercase'
```

Change the value classes to:

```ts
'mt-1 break-words font-[family-name:var(--font-text)] text-sm leading-5 font-medium'
```

Keep `valueClassName="tabular-nums"` only on the date row.

- [ ] **Step 4: Run the story test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-event-story.int.spec.tsx
```

Expected: all Story tests pass, including the `30rem` sidebar assertion.

---

### Task 3: Document and Verify the Final Contract

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify via tooling: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the final presentation and metadata contracts from Tasks 1–2.
- Produces: current operator guidance, project knowledge, and a verified uncommitted handoff.

- [ ] **Step 1: Update maintained documentation**

Update the existing Lexical paragraph in both maintained references to state:

```md
Long-form H2–H6 use a compact descending text-family scale with tuned heading, paragraph, list, quote, code, image, and rule rhythm. The shared preset suppresses Payload's empty `<p><br></p>` output. Story Details keeps regular mono labels while values use the normal text family; only date values use tabular numerals.
```

Retain the documented `30rem` sidebar width.

- [ ] **Step 2: Run focused integration tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/rich-text-presentation.int.spec.tsx \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/news-events-detail-template.int.spec.tsx \
  tests/int/qa-accordion.int.spec.ts \
  tests/int/page-blocks.int.spec.ts
```

Expected: all focused tests pass.

- [ ] **Step 3: Run static checks**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint \
  src/components/rich-text/richTextStyles.ts \
  src/components/news-events/NewsEventStory.tsx \
  tests/int/rich-text-presentation.int.spec.tsx \
  tests/int/news-event-story.int.spec.tsx
pnpm exec prettier --check \
  src/components/rich-text/richTextStyles.ts \
  src/components/news-events/NewsEventStory.tsx \
  tests/int/rich-text-presentation.int.spec.tsx \
  tests/int/news-event-story.int.spec.tsx \
  docs/guides/blocks.md \
  .agents/skills/project-context/references/block-system.md
git diff --check
```

Expected: TypeScript, ESLint, Prettier, and whitespace checks pass.

- [ ] **Step 4: Refresh and check project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current. The known stale knowledge-graph commit warning may remain.

- [ ] **Step 5: Inspect the scoped diff without staging**

Run:

```bash
git diff -- \
  src/components/rich-text/richTextStyles.ts \
  src/components/news-events/NewsEventStory.tsx \
  tests/int/rich-text-presentation.int.spec.tsx \
  tests/int/news-event-story.int.spec.tsx \
  docs/guides/blocks.md \
  .agents/skills/project-context/references/block-system.md \
  .agents/skills/project-context/references/project-inventory.json
git status --short
```

Expected: the scoped diff contains only the approved refinement layered over existing worktree changes. Do not stage or commit.
