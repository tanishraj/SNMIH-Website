# Live Preview Block Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render every production Page block in live preview.

**Architecture:** Reuse the five client-safe production renderers directly in the live-preview dispatcher and enforce dispatcher parity with a source-level contract test plus rendering fixtures.

**Tech Stack:** React 19, Next.js 15, Payload block types, Vitest

## Global Constraints

- Do not stage or commit changes.
- Honor configured carousel autoplay and controls.
- Do not add Payload queries, snapshots, placeholders, or new renderer wrappers.
- Preserve Reusable Section recursion and the client/server boundary.

---

### Task 1: Add Dispatcher Parity Tests

**Files:**
- Modify: `tests/int/live-preview-renderer.int.spec.tsx`

- [ ] Add a source-level test that extracts `case 'blockType'` values from
`renderPageBlocks.tsx` and `renderLivePreviewPageBlocks.tsx` and expects identical sorted sets.
- [ ] Add one live-preview layout containing valid fixtures for `heroCarousel`,
`galleryCoverflow`, `testimonialGrid`, `awardsList`, and `aboutSection`.
- [ ] Assert identifying markup/content for every fixture, plus configured carousel controls.
- [ ] Add a Reusable Section fixture containing one formerly missing block and assert it renders.
- [ ] Run the focused test and verify failure.

### Task 2: Add The Five Live Preview Cases

**Files:**
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`

- [ ] Import `HeroCarouselBlockComponent`, `GalleryCoverflowBlockComponent`,
`TestimonialGridBlockComponent`, `AwardsListBlockComponent`, and
`AboutSectionBlockComponent`.
- [ ] Add direct switch cases using `key={key}` and `{...block}` in the same order as production.
- [ ] Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/live-preview-renderer.int.spec.tsx \
  tests/int/live-preview-import-boundary.int.spec.ts \
  tests/int/carousel-blocks.int.spec.tsx
```

### Task 3: Document And Verify

**Files:**
- Modify: `docs/guides/pages.md`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`

- [ ] State that every production Page block is available in live preview, including nested
Reusable Sections.
- [ ] Remove only the resolved live-preview limitation.
- [ ] Run focused lint, TypeScript, prior-fix regression tests, and `git diff --check`.
- [ ] Leave all files uncommitted.
