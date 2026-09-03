# Complete Lexical Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose H2–H6 consistently in every project-owned Payload Lexical editor, reserve H1 for page titles, and give every supported rendered element a complete theme-aware typography treatment without Playfair headings.

**Architecture:** Keep one shared editor-feature factory in `bodyEditorConfig.ts`, with fixed-toolbar and inline-toolbar variants that differ only in admin presentation. Keep one client-safe rich-text presentation module with long-form and compact class presets; both presets target Payload's semantic JSX output while consumers continue choosing the density appropriate to their surface.

**Tech Stack:** Payload CMS 3, Payload Lexical, React 19, Next.js 15, Tailwind CSS 4, `@tailwindcss/typography`, Vitest.

## Global Constraints

- H1 is reserved for the page or entry title and must not appear in any project-owned Lexical heading menu.
- Article, News & Event, Rich Text block, and Q&A editors expose H2, H3, H4, H5, and H6.
- Rendered legacy H1 content remains styled defensively.
- Every rich-text heading uses `var(--font-text)`; rendered Lexical content must not use `var(--font-display)` or Playfair.
- Code retains `var(--font-mono)` through the existing `font-mono` token.
- Use semantic theme tokens and Tailwind scale tokens; do not add hardcoded colors or pixel font sizes.
- Do not add font-family, font-size, or color controls to the editor.
- Do not replace Payload's JSX converters or alter stored Lexical JSON.
- Q&A keeps a compact hierarchy; Article, News/Event, and Rich Text remain long-form.
- Preserve unrelated files in the dirty shared worktree.
- Do not stage or commit changes unless the user explicitly requests it.

---

### Task 1: Make Project-Owned Lexical Feature Lists Explicit

**Files:**

- Modify: `tests/int/rich-text-presentation.int.spec.tsx`
- Modify: `src/fields/bodyEditorConfig.ts`
- Modify: `src/blocks/RichTextBlock/config.ts`
- Modify: `src/blocks/QaAccordion/config.ts`

**Interfaces:**

- Produces: `bodyEditor`, a fixed-toolbar `RichTextField['editor']` used by Article and News & Event body fields.
- Produces: `embeddedContentEditor`, an inline-toolbar `RichTextField['editor']` used by Rich Text blocks and Q&A answers.
- Both editors expose the same content features and `HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5', 'h6'] })`.

- [ ] **Step 1: Add failing editor-configuration contract tests**

Extend `tests/int/rich-text-presentation.int.spec.tsx` with:

```tsx
describe('shared Lexical editor configuration', () => {
  it('offers H2 through H6 while reserving H1 for page titles', () => {
    const editorConfig = source('src/fields/bodyEditorConfig.ts')

    expect(editorConfig).toContain(
      "HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5', 'h6'] })",
    )
    expect(editorConfig).toContain("export const bodyEditor = createProjectEditor('fixed')")
    expect(editorConfig).toContain(
      "export const embeddedContentEditor = createProjectEditor('inline')",
    )
  })

  it('uses the explicit embedded editor for block-owned rich text fields', () => {
    for (const path of ['src/blocks/RichTextBlock/config.ts', 'src/blocks/QaAccordion/config.ts']) {
      const config = source(path)

      expect(config).toContain("import { embeddedContentEditor } from '@/fields/bodyEditorConfig'")
      expect(config).toContain('editor: embeddedContentEditor')
      expect(config).not.toContain('lexicalEditor(')
    }
  })
})
```

- [ ] **Step 2: Run the focused test and verify the expected failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/rich-text-presentation.int.spec.tsx
```

Expected: FAIL because the current shared heading list stops at H4 and both block configs still instantiate `lexicalEditor()` directly.

- [ ] **Step 3: Replace the body-only configuration with a shared editor factory**

Replace `src/fields/bodyEditorConfig.ts` with:

```ts
import {
  AlignFeature,
  BlockquoteFeature,
  BoldFeature,
  ChecklistFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

type ProjectEditorToolbar = 'fixed' | 'inline'

const createProjectEditor = (toolbar: ProjectEditorToolbar) =>
  lexicalEditor({
    ...(toolbar === 'fixed'
      ? {
          admin: {
            hideGutter: true,
            hideAddBlockButton: true,
            hideDraggableBlockElement: true,
            hideInsertParagraphAtEnd: true,
          },
        }
      : {}),
    features: [
      ParagraphFeature(),
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5', 'h6'] }),
      BlockquoteFeature(),
      HorizontalRuleFeature(),
      BoldFeature(),
      ItalicFeature(),
      UnderlineFeature(),
      StrikethroughFeature(),
      InlineCodeFeature(),
      OrderedListFeature(),
      UnorderedListFeature(),
      ChecklistFeature(),
      LinkFeature({ enabledCollections: ['pages'] }),
      UploadFeature({ enabledCollections: ['media'] }),
      AlignFeature(),
      IndentFeature(),
      toolbar === 'fixed' ? FixedToolbarFeature() : InlineToolbarFeature(),
    ],
  })

export const bodyEditor = createProjectEditor('fixed')
export const embeddedContentEditor = createProjectEditor('inline')
```

Keep a concise module comment explaining that H1 belongs to the document title and both variants deliberately share the same writing features.

- [ ] **Step 4: Adopt the embedded editor in both block schemas**

In `src/blocks/RichTextBlock/config.ts`, remove the Payload Lexical import, add:

```ts
import { embeddedContentEditor } from '@/fields/bodyEditorConfig'
```

and change the content field to:

```ts
{
  name: 'content',
  label: 'Content',
  type: 'richText',
  required: true,
  editor: embeddedContentEditor,
}
```

In `src/blocks/QaAccordion/config.ts`, make the same import replacement and change the answer field to:

```ts
{
  name: 'answer',
  type: 'richText',
  editor: embeddedContentEditor,
  required: true,
}
```

- [ ] **Step 5: Run the editor contract test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/rich-text-presentation.int.spec.tsx
```

Expected: PASS, including H2–H6 and both embedded-editor adoption assertions.

- [ ] **Step 6: Review checkpoint without staging or committing**

Run:

```bash
git diff -- src/fields/bodyEditorConfig.ts src/blocks/RichTextBlock/config.ts src/blocks/QaAccordion/config.ts tests/int/rich-text-presentation.int.spec.tsx
```

Expected: only the explicit shared-editor configuration and its focused tests appear.

---

### Task 2: Complete the Shared Lexical DOM Presentation

**Files:**

- Modify: `tests/int/rich-text-presentation.int.spec.tsx`
- Modify: `src/components/rich-text/richTextStyles.ts`

**Interfaces:**

- Consumes: Payload's default semantic JSX output and `cn(...inputs): string` from `@/lib/utils`.
- Produces: `longFormRichTextClasses: string` for Article, News/Event, and Rich Text content.
- Produces: `compactRichTextClasses: string` for Q&A answers.

- [ ] **Step 1: Replace the presentation assertions with the complete DOM contract**

Update the long-form test to assert:

```tsx
expect(longFormRichTextClasses).toContain('prose-headings:font-[family-name:var(--font-text)]')
expect(longFormRichTextClasses).not.toContain('var(--font-display)')

for (const className of [
  'prose-h1:text-4xl',
  'sm:prose-h1:text-5xl',
  'prose-h2:text-3xl',
  'sm:prose-h2:text-4xl',
  'prose-h3:text-2xl',
  'sm:prose-h3:text-3xl',
  'prose-h4:text-xl',
  'sm:prose-h4:text-2xl',
  'prose-h5:text-lg',
  'sm:prose-h5:text-xl',
  'prose-h6:text-base',
  'sm:prose-h6:text-lg',
]) {
  expect(longFormRichTextClasses).toContain(className)
}

for (const className of [
  'prose-p:leading-8',
  'prose-ul:pl-6',
  'prose-ol:pl-6',
  'prose-blockquote:bg-muted/60',
  'prose-strong:font-semibold',
  'prose-em:text-current',
  '[&_span[style*="underline"]]:underline-offset-4',
  '[&_span[style*="line-through"]]:text-current/65',
  'prose-code:font-mono',
  'prose-a:text-primary',
  '[&_picture]:max-w-full',
  '[&_img]:max-w-full',
  'prose-hr:border-border',
  '[&_.list-check]:list-none',
  '[&_li[role=checkbox]_input]:accent-primary',
  '[&_li[aria-checked=true]_label]:line-through',
  '[&_li[role=checkbox]_br]:hidden',
]) {
  expect(longFormRichTextClasses).toContain(className)
}
```

Update the compact test to assert its independent hierarchy:

```tsx
for (const className of [
  'prose-h1:text-3xl',
  'prose-h2:text-2xl',
  'prose-h3:text-xl',
  'prose-h4:text-lg',
  'prose-h5:text-base',
  'prose-h6:text-sm',
]) {
  expect(compactRichTextClasses).toContain(className)
}

expect(compactRichTextClasses).not.toContain('var(--font-display)')
expect(compactRichTextClasses).not.toContain('prose-h2:text-3xl')
```

- [ ] **Step 2: Run the focused test and verify the expected typography failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/rich-text-presentation.int.spec.tsx
```

Expected: FAIL because headings still use `var(--font-display)`, H1/H5/H6 scales are missing, compact headings are flattened, and the checklist/decorated-span selectors are incomplete.

- [ ] **Step 3: Update the semantic shared classes**

In `src/components/rich-text/richTextStyles.ts`:

1. Replace the heading family utility with:

```ts
'prose-headings:font-[family-name:var(--font-text)] prose-headings:font-semibold',
```

2. Preserve the existing semantic prose variables, focus states, code treatment, blockquote treatment, alignment, and indentation.

3. Replace the current underline/strikethrough and checklist coverage with:

```ts
'[&_u]:decoration-current/50 [&_u]:underline-offset-4',
'[&_s]:text-current/65',
'[&_span[style*="underline"]]:decoration-current/50',
'[&_span[style*="underline"]]:underline-offset-4',
'[&_span[style*="line-through"]]:text-current/65',
'[&_.list-check]:list-none [&_.list-check]:pl-0',
'[&_li[role=checkbox]]:my-2 [&_li[role=checkbox]]:flex',
'[&_li[role=checkbox]]:items-start [&_li[role=checkbox]]:gap-3',
'[&_li[role=checkbox]]:pl-0',
'[&_li[role=checkbox]_input]:mt-1 [&_li[role=checkbox]_input]:size-4',
'[&_li[role=checkbox]_input]:shrink-0',
'[&_li[role=checkbox]_input]:accent-primary',
'[&_li[role=checkbox]_label]:min-w-0 [&_li[role=checkbox]_label]:flex-1',
'[&_li[aria-checked=true]_label]:text-current/65',
'[&_li[aria-checked=true]_label]:line-through',
'[&_li[role=checkbox]_br]:hidden',
```

4. Complete responsive upload markup support with:

```ts
'[&_figure]:max-w-full [&_picture]:block [&_picture]:max-w-full',
'[&_img]:h-auto [&_img]:max-w-full',
```

- [ ] **Step 4: Add the complete long-form and compact heading scales**

Use these exact long-form classes:

```ts
'prose-h1:mt-14 prose-h1:mb-5 prose-h1:text-4xl sm:prose-h1:text-5xl',
'prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-3xl sm:prose-h2:text-4xl',
'prose-h3:mt-10 prose-h3:mb-3 prose-h3:text-2xl sm:prose-h3:text-3xl',
'prose-h4:mt-8 prose-h4:mb-3 prose-h4:text-xl sm:prose-h4:text-2xl',
'prose-h5:mt-7 prose-h5:mb-2 prose-h5:text-lg sm:prose-h5:text-xl',
'prose-h6:mt-6 prose-h6:mb-2 prose-h6:text-base sm:prose-h6:text-lg',
```

Replace the compact flattened heading rule with:

```ts
'prose-h1:my-4 prose-h1:text-3xl',
'prose-h2:my-4 prose-h2:text-2xl',
'prose-h3:my-3 prose-h3:text-xl',
'prose-h4:my-3 prose-h4:text-lg',
'prose-h5:my-3 prose-h5:text-base',
'prose-h6:my-3 prose-h6:text-sm',
```

- [ ] **Step 5: Run the focused presentation test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/rich-text-presentation.int.spec.tsx
```

Expected: PASS for editor features, heading fonts and scales, semantic element coverage, and consumer adoption.

- [ ] **Step 6: Run the bounded typography detector**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope type src/components/rich-text/richTextStyles.ts src/components/news-events/NewsEventStory.tsx src/components/articles/ArticlePage.tsx src/blocks/RichTextBlock/Component.tsx src/blocks/QaAccordion/Component.tsx
```

Expected: no unexplained typography findings. Resolve only findings caused by this change; document unrelated existing findings in the handoff.

- [ ] **Step 7: Review checkpoint without staging or committing**

Run:

```bash
git diff -- src/components/rich-text/richTextStyles.ts tests/int/rich-text-presentation.int.spec.tsx
```

Expected: the diff contains the full semantic DOM coverage and the approved H1–H6 defensive scale, with no component-specific duplication.

---

### Task 3: Regenerate Admin Artifacts, Document the Contract, and Verify

**Files:**

- Modify if generated output changes: `src/payload-types.ts`
- Modify if generated output changes: `src/app/(payload)/admin/importMap.js`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify via project-context tooling: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the approved editor feature and presentation contracts from Tasks 1–2.
- Produces: current admin artifacts, operator documentation, generated project inventory, and a verified handoff.

- [ ] **Step 1: Regenerate Payload types and the admin import map**

Run:

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected: both commands succeed. Generated files may remain unchanged because the stored rich-text field shapes and imported feature component set are unchanged.

- [ ] **Step 2: Update the operator documentation**

Add this contract to the Lexical/Rich Text guidance in `docs/guides/blocks.md`:

```md
Project-owned Lexical editors reserve H1 for the surrounding page or entry title and expose H2–H6. Article, News/Event, and Rich Text content use the shared long-form presentation; Q&A answers use the compact presentation. Both presets style Payload's semantic paragraph, list, checklist, blockquote, emphasis, link, code, image, and horizontal-rule output. Rich-text headings use the text-family token rather than the display family.
```

Replace the existing Lexical paragraph in `.agents/skills/project-context/references/block-system.md` with the same ownership facts, retaining the current News/Event metadata note.

- [ ] **Step 3: Run focused integration suites**

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

- [ ] **Step 4: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint \
  src/fields/bodyEditorConfig.ts \
  src/blocks/RichTextBlock/config.ts \
  src/blocks/QaAccordion/config.ts \
  src/components/rich-text/richTextStyles.ts \
  tests/int/rich-text-presentation.int.spec.tsx
pnpm exec prettier --check \
  src/fields/bodyEditorConfig.ts \
  src/blocks/RichTextBlock/config.ts \
  src/blocks/QaAccordion/config.ts \
  src/components/rich-text/richTextStyles.ts \
  tests/int/rich-text-presentation.int.spec.tsx \
  docs/guides/blocks.md \
  .agents/skills/project-context/references/block-system.md
git diff --check
```

Expected: TypeScript, ESLint, Prettier, and whitespace checks pass.

- [ ] **Step 5: Refresh and check project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current. The known stale knowledge-graph commit warning may remain, but must not conceal any new context error.

- [ ] **Step 6: Inspect the final scoped diff and worktree state**

Run:

```bash
git diff -- \
  src/fields/bodyEditorConfig.ts \
  src/blocks/RichTextBlock/config.ts \
  src/blocks/QaAccordion/config.ts \
  src/components/rich-text/richTextStyles.ts \
  tests/int/rich-text-presentation.int.spec.tsx \
  docs/guides/blocks.md \
  .agents/skills/project-context/references/block-system.md \
  .agents/skills/project-context/references/project-inventory.json \
  src/payload-types.ts \
  'src/app/(payload)/admin/importMap.js'
git status --short
```

Expected: only intended files from this implementation appear in the scoped diff; unrelated dirty worktree changes remain untouched. Do not stage or commit.
