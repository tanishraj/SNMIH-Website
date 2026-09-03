# Long-Form Prose and Excerpt Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align shared long-form Lexical paragraphs and list text with the News & Events excerpt's responsive size, line height, and supporting-copy tone.

**Architecture:** Update the single `longFormRichTextClasses` presentation contract so every existing long-form consumer inherits the same body role. Keep the News & Events excerpt and compact-rich-text preset unchanged, and protect the hierarchy with focused class-contract tests.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Tailwind Typography utilities, Payload Lexical RichText, Vitest.

## Global Constraints

- Apply the change globally to News & Events detail pages, Article pages, and Rich Text blocks through `longFormRichTextClasses`.
- Use `text-base sm:text-lg`, `leading-7`, and `text-current/70` for long-form paragraphs and list items.
- Preserve the existing H1–H6 family, scale, weight, color, and spacing hierarchy.
- Preserve strong text, links, blockquotes, code, preformatted blocks, checklists, images, captions, horizontal rules, and empty-paragraph handling.
- Do not change `compactRichTextClasses`, the News & Events excerpt classes, Payload schema, generated types, or unrelated thumbnails.
- Do not stage or commit changes.

---

### Task 1: Align the shared long-form body role

**Files:**

- Modify: `tests/int/rich-text-presentation.int.spec.tsx`
- Modify: `tests/int/news-event-story.int.spec.tsx`
- Modify: `src/components/rich-text/richTextStyles.ts`
- Modify: `.agents/skills/project-context/references/block-system.md`

**Interfaces:**

- Consumes: exported `longFormRichTextClasses` and `compactRichTextClasses` strings.
- Produces: a shared long-form paragraph/list typography contract with no component API or data-shape changes.

- [ ] **Step 1: Update tests to express the approved typography contract**

In `tests/int/rich-text-presentation.int.spec.tsx`, replace the old paragraph-leading assertion and add the approved paragraph/list body-role assertions:

```tsx
for (const className of [
  'prose-p:text-base',
  'sm:prose-p:text-lg',
  'prose-p:leading-7',
  'prose-p:text-current/70',
  'prose-li:text-base',
  'sm:prose-li:text-lg',
  'prose-li:leading-7',
  'prose-li:text-current/70',
  'prose-headings:text-current',
  'prose-strong:text-current',
]) {
  expect(longFormRichTextClasses).toContain(className)
}

expect(longFormRichTextClasses).not.toContain('prose-p:leading-8')
```

Retain every existing assertion for headings, semantics, rich elements, spacing, empty paragraphs,
and the compact preset.

In `tests/int/news-event-story.int.spec.tsx`, extend the ordering test to lock the unchanged excerpt
contract:

```tsx
expect(markup).toContain(
  'class="text-base leading-7 text-current/70 sm:text-lg" data-news-event-excerpt="true"',
)
```

- [ ] **Step 2: Run focused tests and confirm the shared long-form assertions fail**

Run:

```bash
pnpm exec vitest run tests/int/rich-text-presentation.int.spec.tsx tests/int/news-event-story.int.spec.tsx
```

Expected: the shared long-form suite FAILS because paragraphs still use `leading-8`, omit the
responsive `sm:text-lg`, and retain full current color; the unchanged excerpt assertion passes.

- [ ] **Step 3: Implement the shared paragraph and list typography**

In `src/components/rich-text/richTextStyles.ts`, replace the current paragraph/list typography
portion of `longFormRichTextClasses` with:

```tsx
'prose-p:my-3 prose-p:text-base prose-p:leading-7 prose-p:text-current/70 sm:prose-p:text-lg',
'prose-ul:my-4 prose-ol:my-4 prose-li:my-1 prose-li:text-base prose-li:leading-7 prose-li:text-current/70 sm:prose-li:text-lg',
```

Do not move these roles to `semanticRichTextClasses`, because `compactRichTextClasses` must remain
dense. Keep `prose-headings:text-current`, `prose-strong:text-current`, and link color declarations
unchanged so hierarchy remains explicit above muted body copy.

- [ ] **Step 4: Update the maintained shared-rich-text contract**

In `.agents/skills/project-context/references/block-system.md`, extend the shared Lexical
presentation paragraph with:

```markdown
Long-form paragraphs and list items share the responsive `text-base sm:text-lg`, `leading-7`, and supporting-copy tone used by News & Events excerpts, while headings and strong text retain full foreground emphasis.
```

Do not edit historical plans, Payload types, or Admin documentation because this is a frontend
presentation contract only.

- [ ] **Step 5: Format and run focused verification**

Run:

```bash
pnpm exec prettier --write src/components/rich-text/richTextStyles.ts tests/int/rich-text-presentation.int.spec.tsx tests/int/news-event-story.int.spec.tsx .agents/skills/project-context/references/block-system.md
pnpm exec vitest run tests/int/rich-text-presentation.int.spec.tsx tests/int/news-event-story.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json --scope type src/components/rich-text/richTextStyles.ts src/components/news-events/NewsEventStory.tsx
```

Expected: both focused suites PASS and the typography detector returns no unexplained findings.

- [ ] **Step 6: Run repository verification and refresh project context**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/components/rich-text/richTextStyles.ts src/components/news-events/NewsEventStory.tsx tests/int/rich-text-presentation.int.spec.tsx tests/int/news-event-story.int.spec.tsx
pnpm exec prettier --check src/components/rich-text/richTextStyles.ts src/components/news-events/NewsEventStory.tsx tests/int/rich-text-presentation.int.spec.tsx tests/int/news-event-story.int.spec.tsx .agents/skills/project-context/references/block-system.md
git diff --check
pnpm project-context:update
pnpm project-context:check
```

Expected: TypeScript, ESLint, Prettier, and diff checks PASS; project context is current. The existing
stale knowledge-graph commit warning is acceptable. Confirm that no unrelated generated files or
thumbnails changed and leave all changes unstaged and uncommitted.
