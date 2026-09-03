# Lexical Content Tone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Soften every Lexical heading to `text-current/90` and keep ordinary Lexical content aligned with the News & Events excerpt at `text-current/80`.

**Architecture:** Preserve the current long-form size and leading contract. Update the shared semantic heading and caption roles, and apply `/80` paragraph/list color to both presets so all Lexical consumers follow the same tone hierarchy without changing component APIs or Payload data.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Tailwind Typography utilities, Payload Lexical RichText, Vitest.

## Global Constraints

- Keep the News & Events excerpt at `text-current/80`.
- Use `text-current/90` for Lexical H1–H6 headings.
- Use `text-current/80` for ordinary long-form and compact Lexical content.
- Keep long-form paragraphs and list items at `text-base sm:text-lg` with `leading-7`.
- Keep compact rich-text sizes, line heights, and spacing unchanged.
- Keep links semantic Primary, preformatted blocks on card foreground, and completed/struck states at their existing softer tone.
- Preserve all existing editor features, heading sizes, weights, spacing, focus styles, blockquote surfaces, code treatment, checklists, images, rules, and empty-paragraph suppression.
- Do not change Payload schema, generated types, or unrelated thumbnails.
- Do not stage or commit changes.

---

### Task 1: Apply the shared Lexical tone hierarchy

**Files:**

- Modify: `tests/int/rich-text-presentation.int.spec.tsx`
- Modify: `tests/int/news-event-story.int.spec.tsx`
- Modify: `src/components/rich-text/richTextStyles.ts`
- Modify: `.agents/skills/project-context/references/block-system.md`

**Interfaces:**

- Consumes: exported `longFormRichTextClasses` and `compactRichTextClasses` class strings.
- Produces: shared `/90` heading and `/80` ordinary-content color contracts with no exported API changes.

- [ ] **Step 1: Add failing tone-contract assertions**

In `tests/int/rich-text-presentation.int.spec.tsx`, derive exact class tokens so the old unsoftened
heading token does not pass as a substring of the new token:

```tsx
const longFormTokens = longFormRichTextClasses.split(/\s+/)
const compactTokens = compactRichTextClasses.split(/\s+/)

expect(longFormTokens).toContain('prose-headings:text-current/90')
expect(longFormTokens).not.toContain('prose-headings:text-current')
expect(compactTokens).toContain('prose-headings:text-current/90')
expect(compactTokens).not.toContain('prose-headings:text-current')

for (const className of [
  'prose-p:text-current/80',
  'prose-li:text-current/80',
  '[&_figcaption]:text-current/80',
]) {
  expect(longFormRichTextClasses).toContain(className)
}

for (const className of ['prose-p:text-current/80', 'prose-li:text-current/80']) {
  expect(compactRichTextClasses).toContain(className)
}

expect(longFormRichTextClasses).not.toContain('[&_figcaption]:text-current/65')
expect(longFormRichTextClasses).toContain('prose-a:text-primary')
expect(longFormRichTextClasses).toContain('prose-pre:text-card-foreground')
```

Keep the existing long-form responsive-size/leading assertions and all semantic-element tests.

In `tests/int/news-event-story.int.spec.tsx`, retain the existing exact excerpt assertion:

```tsx
expect(markup).toContain(
  'class="text-base leading-7 text-current/80 sm:text-lg" data-news-event-excerpt="true"',
)
```

- [ ] **Step 2: Run focused tests and confirm the heading/compact/caption assertions fail**

Run:

```bash
pnpm exec vitest run tests/int/rich-text-presentation.int.spec.tsx tests/int/news-event-story.int.spec.tsx
```

Expected: the shared presentation suite FAILS because headings still use unsoftened `text-current`,
compact paragraphs/lists do not declare `/80`, and captions remain `/65`; the excerpt assertion
fails until the component adopts `/80`.

- [ ] **Step 3: Implement the shared tone hierarchy**

In `src/components/rich-text/richTextStyles.ts`:

1. Change the shared heading color token while retaining family, weight, tracking, and balance:

```tsx
'prose-headings:tracking-tight prose-headings:text-balance prose-headings:text-current/90',
```

2. Change the shared caption tone from `/65` to `/80`:

```tsx
'[&_figcaption]:text-sm [&_figcaption]:leading-6 [&_figcaption]:text-current/80',
```

3. Keep the existing long-form paragraph/list declaration unchanged:

```tsx
'prose-p:my-3 prose-p:text-base prose-p:leading-7 prose-p:text-current/80 sm:prose-p:text-lg',
'prose-ul:my-4 prose-ol:my-4 prose-li:my-1 prose-li:text-base prose-li:leading-7 prose-li:text-current/80 sm:prose-li:text-lg',
```

4. Add color only to the compact paragraph/list declarations without changing their size, leading,
   or spacing:

```tsx
'prose-p:my-2 prose-p:text-current/80 prose-p:leading-relaxed prose-p:first:mt-0 prose-p:last:mb-0',
'prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-li:text-current/80 prose-li:leading-relaxed',
```

Keep `prose-a:text-primary`, `prose-pre:text-card-foreground`, `prose-strong:text-current`,
`prose-em:text-current`, and `prose-code` declarations unchanged. Strong, emphasis, and inline code
inherit the `/80` parent tone; links and preformatted blocks retain their semantic exceptions.

- [ ] **Step 4: Update the maintained rich-text color contract**

In `.agents/skills/project-context/references/block-system.md`, revise the shared Lexical paragraph
to state:

```markdown
Lexical H1–H6 use `text-current/90`; ordinary long-form and compact content use the excerpt-aligned `text-current/80`, while Primary links, card-surface preformatted blocks, and softer completed/struck states retain their semantic exceptions.
```

Keep the existing responsive long-form typography wording and do not edit historical plans or
Payload types.

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
