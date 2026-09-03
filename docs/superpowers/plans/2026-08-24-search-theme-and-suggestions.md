# Search Theme and Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Theme full-page Search result labels with the active client palette and reduce suggested searches to six validated, unique terms.

**Architecture:** Add one server-safe normalization/validation helper shared by Search Settings and the full Search page. Keep result icon mapping local to the Search page, remove arbitrary color strings from result data, and verify the behavior through schema/helper tests plus rendered Search-page contracts.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16 App Router, React 19 Server Components, Lucide React 1.23, Tailwind CSS 4, TypeScript 5.7, Vitest.

## Global Constraints

- `Search Settings > Suggested Searches` accepts at most six rows.
- Public suggestions trim whitespace, omit empty terms, de-duplicate case-insensitively, preserve first spelling/order, and cap at six.
- Existing global documents are not rewritten automatically.
- Duplicate Admin rows return a specific validation message.
- Full-page result badges use only semantic Primary theme classes and never violet, sky, emerald, or rose utilities.
- Page, Article, News/Event, and Review remain recognizable through visible labels plus decorative Lucide icons.
- News/Event classification labels and hierarchical Page URLs remain unchanged.
- The command-palette Search Dialog, search query behavior, result limits, and API behavior remain unchanged.
- Add no dependency and no CMS configuration field beyond the existing suggestion array.

---

## File Structure

- Create `src/lib/searchSuggestions.ts`: six-item limit, public normalization, and duplicate validation.
- Modify `src/globals/SearchSettings.ts`: consume the shared limit/validator and clarify Admin guidance.
- Create `tests/int/search-suggestions.int.spec.ts`: pure normalization, validation, and schema contract.
- Modify `src/app/(frontend)/search/page.tsx`: consume normalized suggestions and render semantic icon labels.
- Create `tests/int/search-page-design.int.spec.ts`: source-level guarantee against unrelated palette utilities.
- Modify `tests/int/search-hierarchical-routes.int.spec.tsx`: rendered legacy-suggestion, icon, label, and route contract.
- Regenerate `src/payload-types.ts`: confirm schema generation remains synchronized.
- Modify `docs/guides/search.md`, `docs/architecture/feature-inventory.md`, and `.agents/skills/project-context/references/payload-model.md`: operator and maintained architecture contracts.
- Regenerate `.agents/skills/project-context/references/project-inventory.json`: register new helper and tests.

### Task 1: Normalize and validate suggested searches

**Files:**
- Create: `src/lib/searchSuggestions.ts`
- Modify: `src/globals/SearchSettings.ts`
- Create: `tests/int/search-suggestions.int.spec.ts`

**Interfaces:**
- Produces: `MAX_SEARCH_SUGGESTIONS: 6`.
- Produces: `normalizeSuggestedSearchTerms(rows): string[]`.
- Produces: `validateSuggestedSearchTerms(rows): true | string`.
- Consumes: row objects shaped as `{ term?: string | null }` while tolerating unknown legacy values.

- [ ] **Step 1: Write the failing suggestion and schema contract**

Create `tests/int/search-suggestions.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { SearchSettings } from '@/globals/SearchSettings'
import {
  MAX_SEARCH_SUGGESTIONS,
  normalizeSuggestedSearchTerms,
  validateSuggestedSearchTerms,
} from '@/lib/searchSuggestions'

const getSuggestedSearchesField = () =>
  SearchSettings.fields.find(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === 'suggestedSearches',
  )

describe('Search suggestions', () => {
  it('caps the authoring field at six ordered terms', () => {
    const field = getSuggestedSearchesField()

    expect(MAX_SEARCH_SUGGESTIONS).toBe(6)
    expect(field).toMatchObject({
      maxRows: 6,
      type: 'array',
      validate: validateSuggestedSearchTerms,
    })
  })

  it('normalizes legacy rows without rewriting their stored document', () => {
    const rows = [
      { term: ' Admissions ' },
      { term: 'Research' },
      { term: 'admissions' },
      { term: '' },
      { term: null },
      { term: 'Campus Life' },
      { term: 'Scholarships' },
      { term: 'Faculty' },
      { term: 'Contact' },
      { term: 'Seventh unique term' },
    ]

    expect(normalizeSuggestedSearchTerms(rows)).toEqual([
      'Admissions',
      'Research',
      'Campus Life',
      'Scholarships',
      'Faculty',
      'Contact',
    ])
    expect(rows).toHaveLength(10)
  })

  it('rejects case-insensitive duplicate terms with actionable copy', () => {
    expect(validateSuggestedSearchTerms([{ term: 'Admissions' }, { term: ' admissions ' }])).toBe(
      'Suggested search "admissions" is duplicated. Use each term only once.',
    )
  })

  it('accepts empty state and six unique terms', () => {
    expect(validateSuggestedSearchTerms(undefined)).toBe(true)
    expect(
      validateSuggestedSearchTerms(
        ['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map((term) => ({ term })),
      ),
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/search-suggestions.int.spec.ts
```

Expected: FAIL because `src/lib/searchSuggestions.ts` does not exist and the schema still allows twelve rows.

- [ ] **Step 3: Implement the shared suggestion helper**

Create `src/lib/searchSuggestions.ts`:

```ts
export const MAX_SEARCH_SUGGESTIONS = 6

type SuggestedSearchRow = {
  term?: string | null
}

const getNormalizedTerm = (row: unknown): string => {
  if (!row || typeof row !== 'object' || !('term' in row)) return ''

  const term = (row as SuggestedSearchRow).term
  return typeof term === 'string' ? term.trim() : ''
}

export const normalizeSuggestedSearchTerms = (
  rows: null | readonly unknown[] | undefined,
): string[] => {
  const terms: string[] = []
  const seen = new Set<string>()

  for (const row of rows ?? []) {
    const term = getNormalizedTerm(row)
    if (!term) continue

    const normalizedTerm = term.toLocaleLowerCase()
    if (seen.has(normalizedTerm)) continue

    seen.add(normalizedTerm)
    terms.push(term)

    if (terms.length === MAX_SEARCH_SUGGESTIONS) break
  }

  return terms
}

export const validateSuggestedSearchTerms = (
  rows: null | unknown[] | undefined,
): string | true => {
  const seen = new Set<string>()

  for (const row of rows ?? []) {
    const term = getNormalizedTerm(row)
    if (!term) continue

    const normalizedTerm = term.toLocaleLowerCase()
    if (seen.has(normalizedTerm)) {
      return `Suggested search "${term}" is duplicated. Use each term only once.`
    }

    seen.add(normalizedTerm)
  }

  return true
}
```

- [ ] **Step 4: Wire the helper into Search Settings**

In `src/globals/SearchSettings.ts`, add:

```ts
import {
  MAX_SEARCH_SUGGESTIONS,
  validateSuggestedSearchTerms,
} from '@/lib/searchSuggestions'
```

Replace the suggestion array limit, description, and validation with:

```ts
      maxRows: MAX_SEARCH_SUGGESTIONS,
      validate: validateSuggestedSearchTerms,
      admin: {
        description:
          'Up to 6 ordered terms shown as clickable chips on the full Search page. Use each term only once.',
        initCollapsed: true,
      },
```

- [ ] **Step 5: Run the focused contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/search-suggestions.int.spec.ts tests/int/search-settings-access.int.spec.ts
```

Expected: both test files pass.

- [ ] **Step 6: Commit the suggestion contract**

```bash
git add src/lib/searchSuggestions.ts src/globals/SearchSettings.ts tests/int/search-suggestions.int.spec.ts
git commit -m "fix(search): limit suggested terms"
```

### Task 2: Theme and harden full-page Search results

**Files:**
- Modify: `src/app/(frontend)/search/page.tsx`
- Create: `tests/int/search-page-design.int.spec.ts`
- Modify: `tests/int/search-hierarchical-routes.int.spec.tsx`
- Regenerate: `src/payload-types.ts`

**Interfaces:**
- Consumes: `normalizeSuggestedSearchTerms(settings.suggestedSearches)` from Task 1.
- Produces: `getSearchResultIcon(type: string): LucideIcon`, with `FileText` fallback.
- Preserves: existing `SearchGroup.type: string`, labels, result links, result limits, and query behavior.

- [ ] **Step 1: Write the failing source design contract**

Create `tests/int/search-page-design.int.spec.ts`:

```ts
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  path.resolve(process.cwd(), 'src/app/(frontend)/search/page.tsx'),
  'utf8',
)

describe('full Search page design contract', () => {
  it('uses the deployment theme instead of unrelated result palettes', () => {
    expect(source).not.toMatch(/(?:violet|sky|emerald|rose)-(?:100|300|700|950)/)
    expect(source).toContain('border-primary/20 bg-primary/10')
    expect(source).toContain('text-primary')
  })

  it('uses visible labels and decorative type icons', () => {
    expect(source).toContain('FileText')
    expect(source).toContain('Newspaper')
    expect(source).toContain('CalendarDays')
    expect(source).toContain('Star')
    expect(source).toContain('aria-hidden="true"')
    expect(source).toContain('{item.label}')
  })

  it('supports legacy suggestions and keyboard-visible chips', () => {
    expect(source).toContain('normalizeSuggestedSearchTerms')
    expect(source).toContain('data-search-suggestion="true"')
    expect(source).toContain('focus-visible:ring-2')
  })
})
```

- [ ] **Step 2: Expand the rendered Search-page contract**

In `tests/int/search-hierarchical-routes.int.spec.tsx`, replace the `findGlobal` mock in `beforeEach`
with:

```ts
    mocks.findGlobal.mockResolvedValue({
      id: 'search-settings',
      suggestedSearches: [
        { term: ' Admissions ' },
        { term: 'Research' },
        { term: 'admissions' },
        { term: 'Campus Life' },
        { term: 'Scholarships' },
        { term: 'Faculty' },
        { term: 'Contact' },
        { term: 'Hidden legacy term' },
      ],
    })
```

Append these assertions to the existing `renders full hierarchical Page URLs on the search page`
test:

```ts
    expect(html.match(/data-search-suggestion="true"/g)).toHaveLength(6)
    expect(html).toContain('Admissions')
    expect(html).not.toContain('Hidden legacy term')
    expect(html).toContain('lucide-file-text')
    expect(html).toContain('lucide-newspaper')
    expect(html).toContain('lucide-calendar-days')
    expect(html).toContain('lucide-star')
    expect(html).toContain('border-primary/20 bg-primary/10')
```

- [ ] **Step 3: Run both contracts and confirm they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/search-page-design.int.spec.ts tests/int/search-hierarchical-routes.int.spec.tsx
```

Expected: failures for the hard-coded palettes, missing icons/semantic classes, and eight rendered legacy suggestions.

- [ ] **Step 4: Add semantic icon ownership and remove arbitrary accent data**

At the top of `src/app/(frontend)/search/page.tsx`, add:

```tsx
import {
  CalendarDays,
  FileText,
  Newspaper,
  Star,
  type LucideIcon,
} from 'lucide-react'
```

Add the shared suggestion import:

```tsx
import { normalizeSuggestedSearchTerms } from '@/lib/searchSuggestions'
```

Remove `accent: string` from `SearchItem`. Remove every `accent` property from Page, Article,
News/Event, and Review result construction.

Add after `SearchGroup`:

```tsx
const SEARCH_RESULT_ICONS: Record<string, LucideIcon> = {
  page: FileText,
  article: Newspaper,
  'news-event': CalendarDays,
  review: Star,
}

const getSearchResultIcon = (type: string): LucideIcon => SEARCH_RESULT_ICONS[type] ?? FileText
```

- [ ] **Step 5: Normalize suggestions and strengthen chip focus visibility**

Replace the current `suggestedTerms` map/filter chain with:

```tsx
  const suggestedTerms = normalizeSuggestedSearchTerms(settings.suggestedSearches)
```

Add `data-search-suggestion="true"` to each suggestion Link and replace its classes with:

```tsx
className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
  query === term
    ? 'border-foreground/30 bg-background text-foreground'
    : 'border-border bg-background/60 text-muted-foreground'
}`}
```

- [ ] **Step 6: Render semantic badges with responsive label space**

Inside `groups.map`, add before the section return:

```tsx
const ResultIcon = getSearchResultIcon(group.type)
```

Convert the concise arrow callback to a block callback so the section is returned after defining the
icon. Replace each result Link and its trailing metadata container with:

```tsx
<Link
  href={item.href}
  className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted sm:flex-row sm:justify-between sm:gap-6"
>
  <div className="min-w-0">
    <p className="font-medium text-foreground group-hover:underline group-hover:underline-offset-2">
      {item.title}
    </p>
    {item.excerpt && item.excerpt !== item.title ? (
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.excerpt}</p>
    ) : null}
  </div>
  <div className="flex shrink-0 items-center gap-2 self-end sm:self-start sm:pt-0.5">
    <span className="inline-flex max-w-48 items-center gap-1.5 rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-right text-xs leading-4 font-semibold whitespace-normal text-primary">
      <ResultIcon aria-hidden="true" className="size-3.5 shrink-0" />
      {item.label}
    </span>
    <svg
      aria-hidden="true"
      className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  </div>
</Link>
```

- [ ] **Step 7: Run focused Search tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/search-suggestions.int.spec.ts tests/int/search-page-design.int.spec.ts tests/int/search-hierarchical-routes.int.spec.tsx tests/int/search-dialog-design.int.spec.ts
```

Expected: all four test files pass, including the unchanged Search Dialog contract.

- [ ] **Step 8: Regenerate Payload types and run static checks**

Run:

```bash
pnpm generate:types
pnpm exec tsc --noEmit
pnpm exec eslint src/app/\(frontend\)/search/page.tsx src/globals/SearchSettings.ts src/lib/searchSuggestions.ts tests/int/search-suggestions.int.spec.ts tests/int/search-page-design.int.spec.ts tests/int/search-hierarchical-routes.int.spec.tsx
```

Expected: generation, TypeScript, and ESLint exit 0. `src/payload-types.ts` may remain byte-identical
because the array's stored shape did not change; that is a valid synchronized result.

- [ ] **Step 9: Commit the Search-page presentation**

```bash
git add src/app/\(frontend\)/search/page.tsx tests/int/search-page-design.int.spec.ts tests/int/search-hierarchical-routes.int.spec.tsx src/payload-types.ts
git commit -m "fix(search): use client theme labels"
```

### Task 3: Document and verify the complete Search contract

**Files:**
- Modify: `docs/guides/search.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/payload-model.md`
- Regenerate: `.agents/skills/project-context/references/project-inventory.json`
- Verify: all files changed by Tasks 1–3.

**Interfaces:**
- Consumes: the six-term authoring limit, defensive normalization, and semantic result-label behavior.
- Produces: aligned operator documentation and maintained project knowledge.

- [ ] **Step 1: Document Search Settings and themed results**

Add this section after `## What Search Finds` in `docs/guides/search.md`:

```markdown
## Suggested Searches And Result Labels

`Search Settings` accepts up to six ordered suggested terms. The full Search page presents them as
keyboard-focusable chips. Use each term only once; matching ignores capitalization and surrounding
spaces. Older settings with additional or duplicate rows display only their first six unique,
non-empty terms until an editor trims and republishes the global.

Full-page result labels use the active website theme with a content-type icon and visible text.
News/Event results keep their configured classification label. Result types never depend on color
alone, and changing the deployment theme automatically updates their presentation.
```

Also add `Reviews` to the `Both surfaces search across` list and add a `Reviews` row to the fields
table using `Title, review title, reviewer name`, matching the current source queries.

- [ ] **Step 2: Update feature inventory and maintained Payload context**

In `docs/architecture/feature-inventory.md`, replace the Search Settings description with:

```markdown
| Configuration | Search Settings       | Up to 6 unique operator-managed suggested terms shown on the full Search page              |
```

In `.agents/skills/project-context/references/payload-model.md`, replace the Search Settings global
description with:

```markdown
8. SearchSettings — up to six unique operator-managed suggested search terms, governed by the Site
   Settings capability with draft/version recovery; public rendering trims, de-duplicates, and caps
   legacy rows defensively.
```

- [ ] **Step 3: Refresh maintained project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `project-inventory.json` registers `src/lib/searchSuggestions.ts` and both new Search test
files; project context reports current, with a stale optional knowledge graph allowed as a warning.

- [ ] **Step 4: Run the final verification set**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/search-suggestions.int.spec.ts tests/int/search-page-design.int.spec.ts tests/int/search-hierarchical-routes.int.spec.tsx tests/int/search-dialog-design.int.spec.ts tests/int/search-settings-access.int.spec.ts tests/int/admin-documentation.int.spec.ts tests/int/project-context-repository.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Expected: all focused tests, TypeScript, lint, and the production build pass. The existing Google Tag
Manager lint advisory may remain; this work must introduce no additional warning.

- [ ] **Step 5: Inspect the final change-impact surface**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: only the approved helper, Search settings/page, focused tests, generated types if changed,
operator docs, maintained Payload reference, and generated project inventory differ from the plan
commit.

- [ ] **Step 6: Commit documentation and maintained context**

```bash
git add docs/guides/search.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/payload-model.md .agents/skills/project-context/references/project-inventory.json
git commit -m "docs(search): document themed suggestions"
```
