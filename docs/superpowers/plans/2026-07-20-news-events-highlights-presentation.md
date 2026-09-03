# News & Events Highlights Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add editor-controlled header alignment and make News & Events Highlights cards shorter and more concise.

**Architecture:** Extend the existing Payload block configuration with a required alignment value and pass it through the server presentation boundary to the presentational component. Keep the optional action in an independent right-aligned header column, preserve live-data fetching, reuse the text-alignment pattern already used by Profile Carousel, and enforce fixed responsive card-image heights plus a four-line excerpt clamp.

**Tech Stack:** Payload CMS 3, Next.js 16, React 19, Tailwind CSS 4, Vitest

## Global Constraints

- Apply the change only to the News & Events Highlights block.
- Keep News/Event card content left-aligned.
- Keep all existing live-data, item-count, theme, hover, and grid behavior.
- Use semantic theme tokens and existing shared spacing.
- Add no dependencies or global CSS.
- Keep changes unstaged.

---

### Task 1: Add alignment and compact card presentation

**Files:**

- Modify: `src/blocks/NewsEventsHighlights/config.ts`
- Modify: `src/blocks/NewsEventsHighlights/Presentation.tsx`
- Modify: `src/components/news-events/NewsEventsHighlights.tsx`
- Modify: `src/payload-types.ts`
- Modify: `tests/int/news-events-highlights.int.spec.tsx`

**Interfaces:**

- Consumes: `NewsEventsHighlightsBlockLike`, `ContentActions`, `PublicNewsEventCard`
- Produces: `NewsEventsHighlightsAlignment = 'center' | 'left' | 'right'` and an optional `alignment` presentation prop defaulting to `left`

- [ ] **Step 1: Extend the focused tests**

Add assertions that the Payload block has a required `contentAlignment` select with default `left`; render all alignment values and verify their data attributes and text classes, verify the independent action remains right-aligned, and verify `h-44 sm:h-48` image classes plus the `line-clamp-4` excerpt class.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-highlights.int.spec.tsx`

Expected: FAIL because alignment, fixed image heights, and the excerpt clamp are absent.

- [ ] **Step 3: Implement the Payload field and rendering contract**

Add `contentAlignment` to **Layout & Theme**, pass the resolved value to `NewsEventsHighlights`, render `ContentActions` with right alignment, apply the shared left/center/right text classes in a two-column desktop header, replace `aspect-[16/10]` with `h-44 sm:h-48`, and add `line-clamp-4` to the excerpt.

- [ ] **Step 4: Regenerate Payload types**

Run: `pnpm generate:types`

Expected: `NewsEventsHighlightsBlock` contains the optional generated `contentAlignment` property used by Payload documents.

- [ ] **Step 5: Verify the implementation**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-highlights.int.spec.tsx
pnpm exec eslint src/blocks/NewsEventsHighlights/config.ts src/blocks/NewsEventsHighlights/Presentation.tsx src/components/news-events/NewsEventsHighlights.tsx tests/int/news-events-highlights.int.spec.tsx
pnpm exec tsc --noEmit
pnpm build
git diff --check
```

Expected: all commands pass and no new changes are staged.
