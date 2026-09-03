# Lexical Blockquote Tone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render shared Lexical blockquotes with the theme-aware `text-current/80` foreground tone and align long-form quotes with the paragraph and excerpt scale.

**Architecture:** Keep blockquote color and surface treatment in the shared semantic preset, then add responsive sizing only to the long-form preset. Protect the shared tone, long-form scale, and compact isolation with the existing rich-text presentation suite without changing component APIs, Payload schema, or generated types.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Tailwind Typography utilities, Payload Lexical RichText, Vitest.

## Global Constraints

- Apply `prose-blockquote:text-current/80` through the shared semantic preset.
- Align long-form blockquotes at `text-base`, `leading-7`, and `sm:text-lg`.
- Keep compact blockquotes on the existing dense preset.
- Preserve the existing blockquote background, border, padding, spacing, font family, and responsive behavior.
- Preserve `/90` headings, `/80` ordinary content and excerpt text, Primary links, card-foreground preformatted blocks, and softer completed or struck states.
- Do not change Payload fields, editor features, generated types, or component data flow.
- Do not stage or commit changes.

---

### Task 1: Update the shared Lexical blockquote tone

**Files:**

- Modify: `tests/int/rich-text-presentation.int.spec.tsx`
- Modify: `src/components/rich-text/richTextStyles.ts`
- Modify: `.agents/skills/project-context/references/block-system.md`

**Interfaces:**

- Consumes: exported `longFormRichTextClasses` and `compactRichTextClasses` class strings.
- Produces: a shared `prose-blockquote:text-current/80` presentation contract with no exported API changes.

- [ ] **Step 1: Write the failing shared-contract assertion**

Add the exact class to the semantic contract list in
`tests/int/rich-text-presentation.int.spec.tsx`:

```tsx
'prose-blockquote:bg-muted/60',
'prose-blockquote:text-current/80',
'prose-blockquote:text-base',
'sm:prose-blockquote:text-lg',
'prose-blockquote:leading-7',
```

Also ensure the old exact token is absent without accidentally matching the new token as a
substring:

```tsx
expect(longFormRichTextClasses.split(/\s+/)).not.toContain('prose-blockquote:text-current')
expect(compactRichTextClasses.split(/\s+/)).not.toContain('prose-blockquote:text-current')
expect(compactRichTextClasses.split(/\s+/)).not.toContain('prose-blockquote:text-base')
expect(compactRichTextClasses.split(/\s+/)).not.toContain('sm:prose-blockquote:text-lg')
expect(compactRichTextClasses.split(/\s+/)).not.toContain('prose-blockquote:leading-7')
```

- [ ] **Step 2: Run the focused test and verify the new assertion fails**

Run:

```bash
pnpm exec vitest run tests/int/rich-text-presentation.int.spec.tsx
```

Expected: FAIL because the shared preset still contains the exact
`prose-blockquote:text-current` token.

- [ ] **Step 3: Implement the shared blockquote tone**

In `src/components/rich-text/richTextStyles.ts`, retain the existing surface and padding utilities
while replacing only the foreground token:

```tsx
'prose-blockquote:bg-muted/60 prose-blockquote:pr-5 prose-blockquote:text-current/80',
```

Do not change the long-form or compact spacing declarations:

```tsx
'prose-blockquote:my-5 prose-blockquote:py-2 prose-blockquote:text-base prose-blockquote:leading-7 sm:prose-blockquote:text-lg',
'prose-blockquote:my-3 prose-blockquote:py-1',
```

- [ ] **Step 4: Update the maintained project contract**

In `.agents/skills/project-context/references/block-system.md`, extend the shared Lexical tone
paragraph to state that blockquotes use `text-current/80`, while headings remain `text-current/90`
and ordinary long-form and compact content remain `text-current/80`; semantic exceptions remain
unchanged.

- [ ] **Step 5: Format and run focused verification**

Run:

```bash
pnpm exec prettier --write src/components/rich-text/richTextStyles.ts tests/int/rich-text-presentation.int.spec.tsx .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-18-lexical-blockquote-tone-design.md docs/superpowers/plans/2026-08-18-lexical-blockquote-tone.md
pnpm exec vitest run tests/int/rich-text-presentation.int.spec.tsx tests/int/news-event-story.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json --scope type src/components/rich-text/richTextStyles.ts src/components/news-events/NewsEventStory.tsx
```

Expected: both focused suites PASS and the typography detector returns `[]`.

- [ ] **Step 6: Run repository verification and refresh project context**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/components/rich-text/richTextStyles.ts tests/int/rich-text-presentation.int.spec.tsx
pnpm exec prettier --check src/components/rich-text/richTextStyles.ts tests/int/rich-text-presentation.int.spec.tsx .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-18-lexical-blockquote-tone-design.md docs/superpowers/plans/2026-08-18-lexical-blockquote-tone.md
git diff --check
pnpm project-context:update
pnpm project-context:check
```

Expected: TypeScript, ESLint, Prettier, and diff checks PASS; project context is current. The
existing stale knowledge-graph commit warning is acceptable. Confirm that no unrelated generated
files or thumbnails changed and leave all changes unstaged and uncommitted.
