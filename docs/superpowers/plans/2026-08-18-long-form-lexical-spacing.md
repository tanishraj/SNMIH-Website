# Long-form Lexical Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make shared long-form Lexical content slightly denser without changing typography, surrounding layouts, or compact Q&A content.

**Architecture:** Keep the behavior inside the existing client-safe `longFormRichTextClasses` preset so Article details, News/Event details, and Rich Text blocks remain consistent. Lock the exact token-based spacing sequence in the shared presentation integration test, then run every affected consumer contract and the repository-required project-context loop.

**Tech Stack:** React 19, Next.js 15, Tailwind CSS 4, `@tailwindcss/typography`, Payload Lexical, Vitest.

## Global Constraints

- Modify only long-form Lexical element spacing.
- Preserve heading sizes, fonts, weights, tracking, line heights, and the shared 28px H2 token.
- Preserve empty-paragraph suppression and first/last-child boundary normalization.
- Preserve compact Q&A spacing.
- Use Tailwind spacing tokens; do not add component-level pixel values.
- Preserve unrelated work in the dirty shared worktree.
- Do not stage or commit changes.

---

### Task 1: Tighten the Shared Long-form Lexical Rhythm

**Files:**

- Modify: `tests/int/rich-text-presentation.int.spec.tsx`
- Modify: `tests/int/news-event-story.int.spec.tsx`
- Modify: `src/components/rich-text/richTextStyles.ts`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: `longFormRichTextClasses: string` from `src/components/rich-text/richTextStyles.ts`.
- Produces: the same exported class string with tighter long-form spacing; no signature, schema, or consumer changes.

- [ ] **Step 1: Update the long-form spacing contract first**

In `tests/int/rich-text-presentation.int.spec.tsx`, replace the existing long-form spacing assertions with the following exact values:

```tsx
for (const className of [
  'prose-h2:mt-9',
  'prose-h2:mb-2.5',
  'prose-h3:mt-7',
  'prose-h3:mb-2.5',
  'prose-h4:mt-6',
  'prose-h4:mb-1.5',
  'prose-h5:mt-5',
  'prose-h5:mb-1.5',
  'prose-h6:mt-4',
  'prose-h6:mb-1.5',
  'prose-p:my-3',
  'prose-ul:my-4',
  'prose-ol:my-4',
  'prose-li:my-1',
  '[&_ul_ul]:my-1.5',
  '[&_ul_ol]:my-1.5',
  '[&_ol_ul]:my-1.5',
  '[&_ol_ol]:my-1.5',
  'prose-blockquote:my-5',
  'prose-pre:my-5',
  'prose-figure:my-5',
  'prose-hr:my-6',
]) {
  expect(longFormRichTextClasses).toContain(className)
}
```

Keep the existing size, font, semantic DOM, compact-preset, and editor-configuration assertions unchanged.
Also retain an explicit compact-preset assertion for `[&_ul_ul]:my-2` so the long-form override cannot
silently tighten Q&A content.

In `tests/int/news-event-story.int.spec.tsx`, update the rendered long-form contract from
`prose-h2:mt-10` to `prose-h2:mt-9` after the shared presentation change is implemented.

- [ ] **Step 2: Run the focused test and confirm the spacing contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/rich-text-presentation.int.spec.tsx
```

Expected: FAIL because `longFormRichTextClasses` still contains the wider heading, paragraph, list, nested-list, quote, code, figure, and rule margins.

- [ ] **Step 3: Apply the tighter token-based spacing**

In `src/components/rich-text/richTextStyles.ts`, preserve every semantic class and replace only the spacing portion of `longFormRichTextClasses` with:

```tsx
export const longFormRichTextClasses = cn(
  semanticRichTextClasses,
  'prose-h1:mt-14 prose-h1:mb-5 prose-h1:text-4xl sm:prose-h1:text-5xl',
  'prose-h2:mt-9 prose-h2:mb-2.5 prose-h2:text-2xl sm:prose-h2:text-prose-h2',
  'prose-h3:mt-7 prose-h3:mb-2.5 prose-h3:text-xl sm:prose-h3:text-2xl',
  'prose-h4:mt-6 prose-h4:mb-1.5 prose-h4:text-lg sm:prose-h4:text-xl',
  'prose-h5:mt-5 prose-h5:mb-1.5 prose-h5:text-base sm:prose-h5:text-lg',
  'prose-h6:mt-4 prose-h6:mb-1.5 prose-h6:text-sm sm:prose-h6:text-base',
  'prose-p:my-3 prose-p:text-base prose-p:leading-8',
  'prose-ul:my-4 prose-ol:my-4 prose-li:my-1 prose-li:leading-7',
  '[&_ul_ul]:my-1.5 [&_ul_ol]:my-1.5 [&_ol_ul]:my-1.5 [&_ol_ol]:my-1.5',
  'prose-blockquote:my-5 prose-blockquote:py-2',
  'prose-pre:my-5 prose-hr:my-6 prose-figure:my-5',
)
```

Leave the shared `semanticRichTextClasses` nested-list spacing unchanged:

```tsx
'[&_ul_ul]:my-2 [&_ul_ol]:my-2 [&_ol_ul]:my-2 [&_ol_ol]:my-2',
```

The later long-form override supplies `my-1.5`; do not change `compactRichTextClasses`.

- [ ] **Step 4: Run focused consumer tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/rich-text-presentation.int.spec.tsx \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/qa-accordion.int.spec.ts \
  tests/int/page-blocks.int.spec.ts
```

Expected: PASS. The long-form consumers use the tighter shared contract, while the compact Q&A assertions remain unchanged.

- [ ] **Step 5: Run static and UI-quality checks**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint \
  src/components/rich-text/richTextStyles.ts \
  tests/int/rich-text-presentation.int.spec.tsx
pnpm exec prettier --check \
  src/components/rich-text/richTextStyles.ts \
  tests/int/rich-text-presentation.int.spec.tsx \
  docs/superpowers/specs/2026-08-18-long-form-lexical-spacing-design.md \
  docs/superpowers/plans/2026-08-18-long-form-lexical-spacing.md
node .agents/skills/impeccable/scripts/detect.mjs --json --scope type \
  src/components/rich-text/richTextStyles.ts
git diff --check
```

Expected: TypeScript, ESLint, Prettier, and diff checks pass; the UI detector returns an empty JSON array.

- [ ] **Step 6: Refresh and verify project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the inventory is refreshed, project context is current, and the existing stale knowledge-graph message may remain a non-blocking warning.

- [ ] **Step 7: Review the scoped diff without staging or committing**

Run:

```bash
git diff -- \
  src/components/rich-text/richTextStyles.ts \
  tests/int/rich-text-presentation.int.spec.tsx \
  docs/superpowers/specs/2026-08-18-long-form-lexical-spacing-design.md \
  docs/superpowers/plans/2026-08-18-long-form-lexical-spacing.md \
  .agents/skills/project-context/references/project-inventory.json
git status --short
```

Expected: only the approved long-form spacing contract, its tests and planning documents, and the generated project-context inventory are attributable to this task. Leave every change uncommitted and unstaged.
