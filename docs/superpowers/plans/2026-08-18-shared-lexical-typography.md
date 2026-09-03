# Shared Lexical Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give long-form Lexical content one theme-aware presentation across News & Events, Articles, and Rich Text blocks, retain compact accordion typography, and move News & Events sidebar metadata to the mono typography role.

**Architecture:** Add a client-safe presentation-only module exporting long-form and compact class presets. Consumers opt into the appropriate preset explicitly, preventing article spacing from leaking into compact components. The News & Events metadata component receives only typography refinements; its data, card surfaces, layout, and schema remain unchanged.

**Tech Stack:** React 19, Next.js 15, Payload CMS 3, Payload Lexical renderer, Tailwind CSS 4, `@tailwindcss/typography`, Vitest.

## Global Constraints

- Do not change Payload fields, enabled Lexical features, stored Lexical JSON, or the News & Events detail-template schema.
- Use existing `--font-display`, `--font-text`, and `--font-mono` theme tokens; do not introduce a font or hard-coded color.
- Long-form body text remains at least `text-base`; headings use responsive theme-scale utilities.
- Q&A answers retain compact sizing and spacing.
- Story Details headings stay display-family; labels and values use mono; only dates require tabular numerals; Share buttons stay sans/text-family.
- Shared presentation code must not import Payload, collection queries, routes, or `server-only` modules.
- Do not stage or commit changes unless the user explicitly requests it in the execution session.

---

### Task 1: Add Shared Lexical Presentation Presets

**Files:**
- Create: `src/components/rich-text/richTextStyles.ts`
- Create: `tests/int/rich-text-presentation.int.spec.tsx`

**Interfaces:**
- Consumes: `cn(...inputs): string` from `@/lib/utils` and the existing Tailwind typography plugin.
- Produces: `longFormRichTextClasses: string` and `compactRichTextClasses: string`.

- [ ] **Step 1: Write the failing presentation-contract test**

Create `tests/int/rich-text-presentation.int.spec.tsx`:

```tsx
import { describe, expect, it } from 'vitest'

import {
  compactRichTextClasses,
  longFormRichTextClasses,
} from '@/components/rich-text/richTextStyles'

describe('shared Lexical presentation', () => {
  it('defines the complete long-form semantic and responsive contract', () => {
    expect(longFormRichTextClasses).toContain('font-[family-name:var(--font-text)]')
    expect(longFormRichTextClasses).toContain(
      'prose-headings:font-[family-name:var(--font-display)]',
    )
    expect(longFormRichTextClasses).toContain('prose-h2:text-3xl')
    expect(longFormRichTextClasses).toContain('sm:prose-h2:text-4xl')
    expect(longFormRichTextClasses).toContain('prose-p:leading-8')
    expect(longFormRichTextClasses).toContain('prose-em:text-current')
    expect(longFormRichTextClasses).toContain('[&_u]:underline-offset-4')
    expect(longFormRichTextClasses).toContain('[&_s]:text-current/65')
    expect(longFormRichTextClasses).toContain('prose-li:marker:text-current/45')
    expect(longFormRichTextClasses).toContain('prose-a:text-primary')
    expect(longFormRichTextClasses).toContain('[&_a]:focus-visible:ring-2')
    expect(longFormRichTextClasses).toContain('prose-blockquote:bg-muted/60')
    expect(longFormRichTextClasses).toContain('prose-code:font-mono')
    expect(longFormRichTextClasses).toContain('prose-pre:overflow-x-auto')
    expect(longFormRichTextClasses).toContain('prose-hr:border-border')
    expect(longFormRichTextClasses).toContain('[&_img]:h-auto')
    expect(longFormRichTextClasses).toContain('[&_figcaption]:text-sm')
    expect(longFormRichTextClasses).toContain('[&_[role=checkbox]]:accent-primary')
    expect(longFormRichTextClasses).toContain('[&_[style*="padding-inline-start"]]:max-w-full')
  })

  it('keeps the compact preset dense while sharing semantic treatment', () => {
    expect(compactRichTextClasses).toContain('text-sm')
    expect(compactRichTextClasses).toContain('sm:text-base')
    expect(compactRichTextClasses).toContain('prose-p:my-2')
    expect(compactRichTextClasses).toContain('prose-li:my-1')
    expect(compactRichTextClasses).toContain('prose-a:text-primary')
    expect(compactRichTextClasses).toContain('prose-code:font-mono')
    expect(compactRichTextClasses).not.toContain('prose-h2:text-3xl')
  })
})
```

- [ ] **Step 2: Run the test and confirm the missing-module failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/rich-text-presentation.int.spec.tsx
```

Expected: FAIL because `@/components/rich-text/richTextStyles` does not exist.

- [ ] **Step 3: Implement the shared presets**

Create `src/components/rich-text/richTextStyles.ts`:

```ts
import { cn } from '@/lib/utils'

const semanticRichTextClasses = cn(
  'prose max-w-none text-current font-[family-name:var(--font-text)]',
  '[--tw-prose-body:currentColor] [--tw-prose-headings:currentColor]',
  '[--tw-prose-lead:color-mix(in_oklch,currentColor_70%,transparent)]',
  '[--tw-prose-links:var(--primary)] [--tw-prose-bold:currentColor]',
  '[--tw-prose-counters:color-mix(in_oklch,currentColor_70%,transparent)]',
  '[--tw-prose-bullets:var(--border)] [--tw-prose-hr:var(--border)]',
  '[--tw-prose-quotes:currentColor] [--tw-prose-quote-borders:var(--border)]',
  '[--tw-prose-captions:color-mix(in_oklch,currentColor_70%,transparent)]',
  '[--tw-prose-code:currentColor] [--tw-prose-pre-code:var(--card-foreground)]',
  '[--tw-prose-pre-bg:var(--card)]',
  'prose-headings:font-[family-name:var(--font-display)] prose-headings:font-semibold',
  'prose-headings:tracking-tight prose-headings:text-balance prose-headings:text-current',
  'prose-strong:font-semibold prose-strong:text-current prose-em:text-current',
  '[&_u]:decoration-current/50 [&_u]:underline-offset-4 [&_s]:text-current/65',
  'prose-a:break-words prose-a:font-medium prose-a:text-primary prose-a:underline',
  'prose-a:decoration-primary/40 prose-a:underline-offset-4 hover:prose-a:decoration-primary',
  '[&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2',
  '[&_a]:focus-visible:ring-ring [&_a]:focus-visible:ring-offset-2',
  'prose-ul:pl-6 prose-ol:pl-6 prose-li:marker:text-current/45',
  'prose-blockquote:rounded-r-[var(--radius)] prose-blockquote:border-border',
  'prose-blockquote:bg-muted/60 prose-blockquote:pr-5 prose-blockquote:text-current',
  '[&_blockquote_cite]:font-[family-name:var(--font-text)]',
  '[&_blockquote_cite]:text-sm [&_blockquote_cite]:not-italic',
  'prose-code:rounded-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5',
  'prose-code:font-mono prose-code:text-[0.875em] prose-code:font-medium',
  'prose-code:before:content-none prose-code:after:content-none',
  'prose-pre:overflow-x-auto prose-pre:rounded-[var(--radius)] prose-pre:border',
  'prose-pre:border-border prose-pre:bg-card prose-pre:p-4 prose-pre:text-card-foreground',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-normal',
  'prose-hr:border-border',
  '[&_figure]:max-w-full [&_img]:h-auto [&_img]:max-w-full',
  '[&_img]:rounded-[var(--radius)] [&_img]:border [&_img]:border-border',
  '[&_figcaption]:text-sm [&_figcaption]:leading-6 [&_figcaption]:text-current/65',
  '[&_[role=checkbox]]:accent-primary',
  '[&_[style*="text-align:center"]]:text-center',
  '[&_[style*="text-align:right"]]:text-right',
  '[&_[style*="padding-inline-start"]]:max-w-full',
)

export const longFormRichTextClasses = cn(
  semanticRichTextClasses,
  'prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-3xl sm:prose-h2:text-4xl',
  'prose-h3:mt-10 prose-h3:mb-3 prose-h3:text-2xl sm:prose-h3:text-3xl',
  'prose-h4:mt-8 prose-h4:mb-3 prose-h4:text-xl sm:prose-h4:text-2xl',
  'prose-p:my-5 prose-p:text-base prose-p:leading-8',
  'prose-ul:my-6 prose-ol:my-6 prose-li:my-2 prose-li:leading-7',
  'prose-blockquote:my-8 prose-blockquote:py-2',
  'prose-pre:my-8 prose-hr:my-10 prose-figure:my-8',
)

export const compactRichTextClasses = cn(
  semanticRichTextClasses,
  'text-sm leading-relaxed sm:text-base',
  'prose-headings:my-3 prose-headings:text-base',
  'prose-p:my-2 prose-p:leading-relaxed prose-p:first:mt-0 prose-p:last:mb-0',
  'prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-li:leading-relaxed',
  'prose-blockquote:my-3 prose-blockquote:py-1',
  'prose-pre:my-3 prose-hr:my-4 prose-figure:my-3',
)
```

- [ ] **Step 4: Run the focused test**

Run the Step 2 command again.

Expected: 2 tests PASS.

- [ ] **Step 5: Run the client-boundary detector**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: PASS; the shared module introduces no Payload or `server-only` path into live preview.

### Task 2: Adopt Presets And Refine Sidebar Metadata

**Files:**
- Modify: `src/components/news-events/NewsEventStory.tsx`
- Modify: `src/components/articles/ArticlePage.tsx`
- Modify: `src/blocks/RichTextBlock/Component.tsx`
- Modify: `src/blocks/QaAccordion/Component.tsx`
- Modify: `tests/int/rich-text-presentation.int.spec.tsx`
- Modify: `tests/int/news-event-story.int.spec.tsx`
- Modify: `tests/int/qa-accordion.int.spec.ts`

**Interfaces:**
- Consumes: `longFormRichTextClasses` and `compactRichTextClasses` from Task 1.
- Produces: all long-form consumers using the shared preset; compact Q&A content using the compact preset; mono Story Details metadata.

- [ ] **Step 1: Add failing consumer and metadata assertions**

Append to `tests/int/rich-text-presentation.int.spec.tsx`:

```tsx
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

it('is adopted by every long-form Lexical consumer', () => {
  for (const path of [
    'src/components/news-events/NewsEventStory.tsx',
    'src/components/articles/ArticlePage.tsx',
    'src/blocks/RichTextBlock/Component.tsx',
  ]) {
    expect(source(path)).toContain('longFormRichTextClasses')
  }
})

it('uses the compact preset for Q&A answers', () => {
  expect(source('src/blocks/QaAccordion/Component.tsx')).toContain('compactRichTextClasses')
})
```

In `tests/int/news-event-story.int.spec.tsx`, extend the sidebar test:

```tsx
expect(markup).toContain('data-news-event-detail-label="true"')
expect(markup).toContain('data-news-event-detail-value="true"')
expect(markup).toContain('font-mono text-xs')
expect(markup).toContain('font-mono text-sm')
expect(markup).toContain('tabular-nums')
expect(markup).toContain('prose-h2:text-3xl')
```

In `tests/int/qa-accordion.int.spec.ts`, extend the first rendering test:

```ts
expect(html).toContain('prose-p:my-2')
expect(html).toContain('prose-li:my-1')
expect(html).not.toContain('prose-h2:text-3xl')
```

- [ ] **Step 2: Run the affected tests and confirm the new assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/rich-text-presentation.int.spec.tsx \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/qa-accordion.int.spec.ts
```

Expected: FAIL because consumers still use local prose classes and metadata values are not mono.

- [ ] **Step 3: Replace local long-form class definitions with the shared preset**

In `src/components/news-events/NewsEventStory.tsx`:

```tsx
import { longFormRichTextClasses } from '@/components/rich-text/richTextStyles'
```

Delete `newsEventArticleRichTextClasses`, then replace its use:

```tsx
<div
  className={cn('min-w-0', longFormRichTextClasses)}
  data-news-event-rich-text="true"
>
  <RichText data={entry.body} />
</div>
```

In `src/components/articles/ArticlePage.tsx`:

```tsx
import { longFormRichTextClasses } from '@/components/rich-text/richTextStyles'
```

Replace the article body wrapper:

```tsx
<div className={longFormRichTextClasses}>
  <RichText data={article.body} />
</div>
```

In `src/blocks/RichTextBlock/Component.tsx`:

```tsx
import { longFormRichTextClasses } from '@/components/rich-text/richTextStyles'
```

Replace the prose wrapper:

```tsx
<div className={longFormRichTextClasses}>
  <RichText data={content} />
</div>
```

- [ ] **Step 4: Adopt the compact preset in Q&A Accordion**

In `src/blocks/QaAccordion/Component.tsx`:

```tsx
import { compactRichTextClasses } from '@/components/rich-text/richTextStyles'
```

Replace the answer prose wrapper and remove the old direct-paragraph override:

```tsx
<div className={cn(compactRichTextClasses, 'text-left')}>
  <RichText data={item.answer as RichTextData} />
</div>
```

- [ ] **Step 5: Apply the mono metadata roles**

Extend `StoryDetail` in `src/components/news-events/NewsEventStory.tsx`:

```tsx
function StoryDetail({
  icon,
  label,
  value,
  valueClassName,
  surface,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  valueClassName?: string
  surface: CardSurfaceClasses
}) {
  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
      <span
        aria-hidden="true"
        className={cn('mt-0.5 flex size-8 items-center justify-center bg-current/5', surface.icon)}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <dt
          className={cn(
            'font-mono text-xs font-semibold tracking-[0.14em] uppercase',
            surface.secondary,
          )}
          data-news-event-detail-label="true"
        >
          {label}
        </dt>
        <dd
          className={cn(
            'mt-1 break-words font-mono text-sm leading-5 font-medium',
            valueClassName,
          )}
          data-news-event-detail-value="true"
        >
          {value}
        </dd>
      </div>
    </div>
  )
}
```

Pass the date-specific numeric treatment:

```tsx
<StoryDetail
  icon={<CalendarDays className="size-4" />}
  label={isEvent ? 'Event Date' : 'Date'}
  surface={surface}
  value={<time dateTime={entry.dateISO}>{dateLabel}</time>}
  valueClassName="tabular-nums"
/>
```

- [ ] **Step 6: Run the affected tests**

Run the Step 2 command again.

Expected: all presentation, story, and Q&A tests PASS.

- [ ] **Step 7: Verify other render contracts and client boundaries**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/news-events-detail-template.int.spec.tsx \
  tests/int/live-preview-import-boundary.int.spec.ts \
  tests/int/block-surface-semantics.int.spec.ts
```

Expected: all tests PASS.

### Task 3: Document And Verify The Shared Contract

**Files:**
- Modify: `docs/guides/blocks.md`
- Modify: `docs/guides/news-events.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: the finished shared presets and adopted consumers from Tasks 1–2.
- Produces: current operator/developer documentation and a verified project-context inventory.

- [ ] **Step 1: Update operator documentation**

Add this behavior to the Rich Text and News & Events guidance:

```markdown
Long-form Lexical content uses one shared theme-aware typography preset across Article details,
News & Events details, and Rich Text Page blocks. It covers H2–H4, paragraphs, inline formatting,
lists/checklists, links and focus states, blockquotes, code, rules, uploaded images, captions,
alignment, indentation, and overflow protection. Q&A answers use the matching compact preset.
```

In the News & Events guide, also document:

```markdown
Story Details uses the theme mono family for metadata labels and values; dates use tabular numerals.
Card headings and Share actions retain their established display and text families.
```

- [ ] **Step 2: Update the maintained block-system reference**

Add a concise contract under Shared Configuration and Presentation:

```markdown
`richTextStyles.ts` owns client-safe long-form and compact Lexical presentation presets. Article,
News/Event, and Rich Text block bodies use the long-form preset; Q&A answers use the compact preset.
The presets depend only on semantic theme and typography tokens and remain safe for live preview.
```

- [ ] **Step 3: Run formatting, lint, type, and detector checks**

Run:

```bash
pnpm exec prettier --check \
  src/components/rich-text/richTextStyles.ts \
  src/components/news-events/NewsEventStory.tsx \
  src/components/articles/ArticlePage.tsx \
  src/blocks/RichTextBlock/Component.tsx \
  src/blocks/QaAccordion/Component.tsx \
  tests/int/rich-text-presentation.int.spec.tsx \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/qa-accordion.int.spec.ts \
  docs/guides/blocks.md docs/guides/news-events.md \
  .agents/skills/project-context/references/block-system.md

pnpm exec eslint \
  src/components/rich-text/richTextStyles.ts \
  src/components/news-events/NewsEventStory.tsx \
  src/components/articles/ArticlePage.tsx \
  src/blocks/RichTextBlock/Component.tsx \
  src/blocks/QaAccordion/Component.tsx \
  tests/int/rich-text-presentation.int.spec.tsx \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/qa-accordion.int.spec.ts

pnpm exec tsc --noEmit --pretty false

node .agents/skills/impeccable/scripts/detect.mjs \
  src/components/rich-text/richTextStyles.ts \
  src/components/news-events/NewsEventStory.tsx \
  src/components/articles/ArticlePage.tsx \
  src/blocks/RichTextBlock/Component.tsx \
  src/blocks/QaAccordion/Component.tsx
```

Expected: every command exits 0 with no unexplained design finding.

- [ ] **Step 4: Run the complete affected test set**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/rich-text-presentation.int.spec.tsx \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/qa-accordion.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/news-events-detail-template.int.spec.tsx \
  tests/int/live-preview-import-boundary.int.spec.ts \
  tests/int/block-surface-semantics.int.spec.ts
```

Expected: all files and tests PASS.

- [ ] **Step 5: Complete the project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
git diff --check
```

Expected: project context is current. The known stale knowledge-graph message may remain a warning;
`git diff --check` produces no output.

- [ ] **Step 6: Review the final change impact**

Compare the final diff against `.agents/skills/project-context/references/change-impact-map.md` and
confirm:

- all long-form consumers use the shared preset;
- compact Q&A content does not inherit long-form spacing;
- mono metadata is limited to Story Details;
- no schema/type generation is needed because Payload configuration did not change;
- no unrelated dirty-worktree files were modified;
- no files were staged or committed.
