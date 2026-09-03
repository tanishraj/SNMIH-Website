# News & Events Highlights Classification Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a strict optional classification scope to each News & Events Highlights block.

**Architecture:** Normalize relationship IDs at the block boundary, pass them into the existing Story/Event loader, and key live-preview snapshots by count plus scope. Extend the existing classification-reference guard to recognize Highlights blocks.

**Tech Stack:** Payload CMS 3.85, Next.js 16, React 19, TypeScript, Vitest.

## Global Constraints

- Empty selection means every active classification.
- A non-empty invalid selection must not widen to all classifications.
- Classification order does not change chronological carousel ordering.
- Do not write a migration script, stage, or commit.

---

### Task 1: Add the block relationship contract

**Files:**

- Modify: `src/blocks/NewsEventsHighlights/config.ts`
- Modify: `src/blocks/NewsEventsHighlights/Presentation.tsx`
- Modify: `tests/int/news-events-highlights.int.spec.tsx`

- [ ] Add a failing schema test for the active, has-many, bounded relationship.
- [ ] Add the Content-tab field and block-like type.
- [ ] Run the focused test until green.

### Task 2: Scope the production loader

**Files:**

- Modify: `src/blocks/NewsEventsHighlights/Component.tsx`
- Modify: `src/lib/newsEvents.ts`
- Modify: `tests/int/news-events-highlights.int.spec.tsx`
- Modify: `tests/int/news-events-highlights-loader.int.spec.ts`

- [ ] Test empty, selected, and invalid non-empty scopes.
- [ ] Resolve selected active classifications without changing automatic ordering.
- [ ] Run component and loader tests until green.

### Task 3: Scope live preview snapshots

**Files:**

- Modify: `src/lib/newsEventsPreviewShared.ts`
- Modify: `src/lib/newsEventsPreviewSnapshot.ts`
- Modify: `src/blocks/NewsEventsHighlights/PreviewComponent.tsx`
- Modify: `tests/int/news-events-highlights.int.spec.tsx`

- [ ] Replace count-only snapshot keys with count-and-classification scope keys.
- [ ] Test two equal-count blocks with different scopes and nested reusable sections.
- [ ] Run preview and renderer tests until green.

### Task 4: Guard classification deletion

**Files:**

- Modify: `src/hooks/newsEventClassificationReferences.ts`
- Modify: `tests/int/news-event-classifications.int.spec.ts`

- [ ] Add a failing Highlights-reference test.
- [ ] Recognize `newsEventsHighlights.classifications` alongside Calendar and Tabs relationships.
- [ ] Run classification tests until green.

### Task 5: Synchronize types, docs, and maintained context

**Files:**

- Modify: `src/payload-types.ts`
- Modify: `docs/guides/news-events.md`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/payload-model.md` only if ownership language changes.
- Modify: generated project inventory when required.

- [ ] Run `pnpm generate:types`.
- [ ] Update operator and block-system documentation.
- [ ] Run focused tests, TypeScript, ESLint, Prettier, and `git diff --check`.
- [ ] Run `pnpm project-context:update` and `pnpm project-context:check`.
