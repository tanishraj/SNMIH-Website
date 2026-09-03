# Unified Fixed Lexical Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every production Lexical field the same complete, always-visible fixed toolbar without changing available formatting features or stored content.

**Architecture:** Replace the fixed/inline editor factory with one canonical `projectEditor` and assign it explicitly to Article, News/Event, Rich Text block, and Q&A fields as well as Payload's global fallback. Keep frontend renderers and serialized Lexical data unchanged, simplify Admin CSS around one fixed-toolbar presentation, and enforce the schema contract recursively in Vitest.

**Tech Stack:** Payload CMS 3.85.2, `@payloadcms/richtext-lexical`, TypeScript, SCSS, Vitest

## Global Constraints

- Preserve every currently enabled Lexical feature.
- Reserve H1 for the surrounding Page or entry title; expose H2–H6.
- Do not change serialized Lexical JSON or migrate content.
- Do not change frontend rich-text typography or JSX rendering.
- Do not include the separate internal-link converter fix in this implementation.
- Do not create a Git commit; leave all changes in the working tree.

---

## File Structure

- `src/fields/bodyEditorConfig.ts`: owns the one canonical project Lexical editor.
- `src/payload.config.ts`: uses the canonical editor as Payload's global rich-text fallback.
- `src/collections/Articles.ts`: assigns the canonical editor to Article bodies.
- `src/collections/NewsEvents.ts`: assigns the canonical editor to News/Event bodies.
- `src/blocks/RichTextBlock/config.ts`: assigns the canonical editor to block content.
- `src/blocks/QaAccordion/config.ts`: assigns the canonical editor to Q&A answers.
- `src/app/(payload)/custom.scss`: owns the shared fixed-toolbar editor card and editing area.
- `tests/int/rich-text-presentation.int.spec.tsx`: enforces the editor feature, registration, and presentation contract.
- `.agents/skills/project-context/references/block-system.md`: records the Page-block Lexical contract.
- `.agents/skills/project-context/references/payload-model.md`: records the collection and global editor contract.
- `docs/guides/blocks.md`: explains the author-facing fixed-toolbar behavior.

---

### Task 1: Add the Canonical Editor Registration Contract

**Files:**

- Modify: `tests/int/rich-text-presentation.int.spec.tsx`

**Interfaces:**

- Consumes: `Articles.fields`, `NewsEvents.fields`, `RichTextBlock.fields`, and `QaAccordionBlock.fields` as Payload `Field[]` arrays.
- Produces: a recursive test contract requiring all four production paths to use the exported `projectEditor` object.

- [ ] **Step 1: Replace the old alias assertions with canonical fixed-toolbar assertions**

Add the production config imports and Payload field type:

```ts
import type { Field } from 'payload'

import { QaAccordionBlock } from '@/blocks/QaAccordion/config'
import { RichTextBlock } from '@/blocks/RichTextBlock/config'
import { Articles } from '@/collections/Articles'
import { NewsEvents } from '@/collections/NewsEvents'
import { projectEditor } from '@/fields/bodyEditorConfig'
```

Add this recursive helper above the test suites:

```ts
type RichTextFieldUse = {
  editor: unknown
  path: string
}

const collectRichTextFields = (fields: Field[], prefix: string): RichTextFieldUse[] =>
  fields.flatMap((field) => {
    const fieldName = 'name' in field && typeof field.name === 'string' ? field.name : ''
    const segment = field.type === 'array' && fieldName ? `${fieldName}[]` : fieldName
    const path = segment ? `${prefix}.${segment}` : prefix

    if (field.type === 'richText') {
      return [{ editor: field.editor, path }]
    }

    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => collectRichTextFields(tab.fields, path))
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      return collectRichTextFields(field.fields, path)
    }

    return []
  })
```

Replace the existing `shared Lexical editor configuration` assertions with:

```ts
describe('shared Lexical editor configuration', () => {
  it('uses one complete fixed-toolbar editor and reserves H1 for document titles', () => {
    const editorConfig = source('src/fields/bodyEditorConfig.ts')

    expect(editorConfig).toContain(
      "HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5', 'h6'] })",
    )
    expect(editorConfig).toContain('FixedToolbarFeature()')
    expect(editorConfig).toContain('export const projectEditor = lexicalEditor({')
    expect(editorConfig).not.toContain('InlineToolbarFeature')
    expect(editorConfig).not.toContain('embeddedContentEditor')
  })

  it('assigns the canonical editor to every production rich-text field', () => {
    const uses = [
      ...collectRichTextFields(Articles.fields, 'articles'),
      ...collectRichTextFields(NewsEvents.fields, 'newsEvents'),
      ...collectRichTextFields(RichTextBlock.fields, 'richText'),
      ...collectRichTextFields(QaAccordionBlock.fields, 'qaAccordion'),
    ].sort((left, right) => left.path.localeCompare(right.path))

    expect(uses.map(({ path }) => path)).toEqual([
      'articles.body',
      'newsEvents.body',
      'qaAccordion.items[].answer',
      'richText.content',
    ])

    for (const use of uses) {
      expect(use.editor, use.path).toBe(projectEditor)
    }
  })

  it('uses the canonical editor as Payload fallback', () => {
    const payloadConfig = source('src/payload.config.ts')

    expect(payloadConfig).toContain("import { projectEditor } from '@/fields/bodyEditorConfig'")
    expect(payloadConfig).toContain('editor: projectEditor')
    expect(payloadConfig).not.toContain('editor: lexicalEditor()')
  })
})
```

- [ ] **Step 2: Run the focused test and confirm the new contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/rich-text-presentation.int.spec.tsx
```

Expected: FAIL because `projectEditor` is not exported and the current block fields still use `embeddedContentEditor`.

---

### Task 2: Unify Every Lexical Field on the Fixed Toolbar

**Files:**

- Modify: `src/fields/bodyEditorConfig.ts`
- Modify: `src/payload.config.ts`
- Modify: `src/collections/Articles.ts`
- Modify: `src/collections/NewsEvents.ts`
- Modify: `src/blocks/RichTextBlock/config.ts`
- Modify: `src/blocks/QaAccordion/config.ts`
- Modify: `src/app/(payload)/custom.scss`

**Interfaces:**

- Consumes: Payload's `lexicalEditor` and the current complete feature list.
- Produces: `projectEditor: LexicalRichTextAdapterProvider`, reused by every production field and the global fallback.

- [ ] **Step 1: Replace the toolbar factory with one canonical editor**

In `src/fields/bodyEditorConfig.ts`, remove `InlineToolbarFeature`, the `ProjectEditorToolbar` type,
the `createProjectEditor` function, and both old exports. Define the editor directly:

```ts
/**
 * Every project-owned rich-text field uses one complete, always-visible toolbar.
 * H1 remains reserved for the surrounding Page or entry title.
 */
export const projectEditor = lexicalEditor({
  admin: {
    hideGutter: true,
    hideAddBlockButton: true,
    hideDraggableBlockElement: true,
    hideInsertParagraphAtEnd: true,
  },
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
    FixedToolbarFeature(),
  ],
})
```

- [ ] **Step 2: Assign `projectEditor` to every field and the Payload fallback**

In Articles, NewsEvents, RichTextBlock, and QaAccordion, replace the old editor imports with:

```ts
import { projectEditor } from '@/fields/bodyEditorConfig'
```

Replace each field assignment with:

```ts
editor: projectEditor,
```

In `src/payload.config.ts`, remove the direct `lexicalEditor` import, add:

```ts
import { projectEditor } from '@/fields/bodyEditorConfig'
```

and replace the global fallback with:

```ts
editor: projectEditor,
```

- [ ] **Step 3: Simplify the Admin scroller rule for one toolbar presentation**

In `src/app/(payload)/custom.scss`, replace both scroller branches with one shared rule:

```scss
// All project Lexical fields use the same fixed-toolbar editing area.
.editor-container .editor-scroller {
  padding: 16px;
  min-height: 250px;
  border-radius: 0;
}
```

Keep the fixed toolbar, gutter, placeholder, focus, and body typography rules unchanged.

- [ ] **Step 4: Run the focused contract and schema tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/rich-text-presentation.int.spec.tsx \
  tests/int/articles.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/qa-accordion.int.spec.ts
```

Expected: all selected test files pass.

- [ ] **Step 5: Run TypeScript and focused lint checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint \
  src/fields/bodyEditorConfig.ts \
  src/payload.config.ts \
  src/collections/Articles.ts \
  src/collections/NewsEvents.ts \
  src/blocks/RichTextBlock/config.ts \
  src/blocks/QaAccordion/config.ts \
  tests/int/rich-text-presentation.int.spec.tsx
```

Expected: both commands exit successfully with no new warnings.

---

### Task 3: Synchronize Documentation and Generated Contracts

**Files:**

- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/payload-model.md`
- Modify: `docs/guides/blocks.md`
- Verify/regenerate: `src/payload-types.ts`
- Verify/regenerate: `src/app/(payload)/admin/importMap.js`
- Update: `.agents/skills/project-context/references/project-inventory.json` when generated by the context workflow

**Interfaces:**

- Consumes: the implemented `projectEditor` authoring contract.
- Produces: synchronized maintained documentation, generated Payload artifacts, and project context.

- [ ] **Step 1: Update maintained Lexical documentation**

Update the shared Lexical paragraph in `block-system.md` and `docs/guides/blocks.md` to state:

```md
Every project-owned Lexical field uses the same complete, always-visible fixed toolbar. Article,
News/Event, and Rich Text content use the long-form frontend preset, while Q&A answers retain the
compact frontend preset; toolbar consistency does not change stored content or public typography.
```

Replace the existing `bodyEditorConfig.ts` bullet in `payload-model.md` with:

```md
- [bodyEditorConfig.ts](../../../../src/fields/bodyEditorConfig.ts) defines one complete fixed-toolbar
  Lexical editor used explicitly by Article bodies, News/Event bodies, Rich Text blocks, Q&A answers,
  and the Payload fallback. H1 remains reserved for the surrounding document title.
```

- [ ] **Step 2: Regenerate Payload artifacts**

Run:

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected: both commands succeed. Stored field shapes remain unchanged; any generated diff must be
limited to deterministic synchronization with the already-configured repository.

- [ ] **Step 3: Run the project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the check reports `Project context is current`; a stale optional knowledge-graph warning is acceptable.

- [ ] **Step 4: Run the complete affected verification set**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/rich-text-presentation.int.spec.tsx \
  tests/int/articles.int.spec.ts \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/page-blocks.int.spec.ts \
  tests/int/qa-accordion.int.spec.ts \
  tests/int/block-catalog.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
```

Expected: all focused tests and TypeScript pass; lint introduces no new warnings.

- [ ] **Step 5: Inspect the final change set without committing**

Run:

```bash
git diff --check
git status --short
git diff -- \
  src/fields/bodyEditorConfig.ts \
  src/payload.config.ts \
  src/collections/Articles.ts \
  src/collections/NewsEvents.ts \
  src/blocks/RichTextBlock/config.ts \
  src/blocks/QaAccordion/config.ts \
  'src/app/(payload)/custom.scss' \
  tests/int/rich-text-presentation.int.spec.tsx \
  .agents/skills/project-context/references/block-system.md \
  .agents/skills/project-context/references/payload-model.md \
  docs/guides/blocks.md
```

Expected: no whitespace errors, no unrelated source changes, and no Git commit created.
