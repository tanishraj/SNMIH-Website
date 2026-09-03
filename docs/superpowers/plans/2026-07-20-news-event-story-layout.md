# News Event Story Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align individual News & Events stories with the shared website container, regular-block typography, and semantic theme colors.

**Architecture:** Keep the existing server-rendered `NewsEventStory` and its public data contract unchanged. Replace its independent narrow layout constraints with the shared regular-block container and semantic Tailwind tokens, then lock the presentation contract with a focused server-render test.

**Tech Stack:** Next.js 16, React 19, Payload CMS 3, Tailwind CSS 4, Vitest

## Global Constraints

- Do not change News & Events data, routing, publishing, preview, or SEO behavior.
- Do not add dependencies.
- Keep all changes unstaged.
- Use the shared `max-w-screen-2xl px-4` website container.
- Keep the featured image responsive and retain its configured object position.

---

### Task 1: Normalize the individual story presentation

**Files:**

- Modify: `src/components/news-events/NewsEventStory.tsx`
- Create: `tests/int/news-event-story.int.spec.tsx`

**Interfaces:**

- Consumes: `PublicNewsEventDetail`, `regularBlockContainerClasses`, `RichText`
- Produces: `NewsEventStory({ entry }: { entry: PublicNewsEventDetail })`

- [ ] **Step 1: Write the failing presentation test**

Render a representative News story with `renderToStaticMarkup` and assert that the component uses `regularBlockContainerClasses`, regular-block title and description typography, semantic current-color prose, and no legacy `max-w-screen-xl`, `max-w-4xl`, `prose-neutral`, or `dark:prose-invert` classes.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/news-event-story.int.spec.tsx`

Expected: FAIL because the current story still renders the legacy narrow containers and neutral prose theme.

- [ ] **Step 3: Implement the shared layout and theme styles**

Wrap the story content in `regularBlockContainerClasses`; render title as `text-3xl ... sm:text-4xl`, excerpt as `text-base leading-7 text-current/70`, metadata with semantic current colors, and rich text with theme-inheriting prose selectors. Remove centered `max-w-4xl` wrappers so each story region participates in the website container.

- [ ] **Step 4: Verify the focused test, TypeScript, lint, and build**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-event-story.int.spec.tsx
pnpm exec eslint src/components/news-events/NewsEventStory.tsx tests/int/news-event-story.int.spec.tsx
pnpm exec tsc --noEmit
pnpm build
git diff --check
```

Expected: all commands pass and the new modifications remain unstaged.
