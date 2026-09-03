# Block Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all legacy blocks while preserving the three system-page blocks.

**Architecture:** Remove legacy block registrations before regenerating Payload types, then delete their rendering paths and files. Keep the surrounding collections and shared CMS services intact.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16, React 19, TypeScript 5.7, Vitest, ESLint, pnpm

## Global Constraints

- Preserve `System404`, `SystemComingSoon`, `SystemMaintenance`, and shared system-page fields.
- Keep Pages, Reviews, Headers, Footers, Forms, and general navigation, link, media, and form infrastructure.
- Remove only logic exclusive to `Hero36`, `Form`, `ContentSpotlight`, `HeaderNavbar12`, or `Footer2` blocks.
- Never modify or stage the user's `src/styles/globals.css` change.
- Do not migrate stored database documents.

---

### Task 1: Remove legacy block schemas

**Files:**
- Modify: `src/collections/Pages.ts`, `src/collections/Reviews.ts`, `src/collections/Headers.ts`, `src/collections/Footers.ts`
- Modify: `src/hooks/migrateLegacyReusableLinks.ts`, `src/lib/mediaUsage.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Regenerate: `src/payload-types.ts`

**Interfaces:**
- Consumes: existing collection configs and generic CMS hooks.
- Produces: schemas and generated types containing only the three system block interfaces.

- [ ] **Step 1: Add the failing schema assertion**

Extend the existing block-slug collector test with:

```ts
expect(collectBlockSlugs(Pages.fields)).toEqual([])
expect(collectBlockSlugs(Reviews.fields)).toEqual([])
expect(collectBlockSlugs(Headers.fields)).toEqual([])
expect(collectBlockSlugs(Footers.fields)).toEqual([])
expect(collectBlockSlugs(SystemPages.fields)).toEqual([
  'system404', 'systemMaintenance', 'systemComingSoon',
])
```

- [ ] **Step 2: Prove it fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/system-page-blocks.int.spec.ts`

Expected: FAIL because four collections still register legacy blocks.

- [ ] **Step 3: Remove legacy schema references**

Remove legacy `layout` fields and imports from the four collections while preserving every other field, hook, access rule, and draft setting. Remove only the `hero36` migration branch and the `hero36`/`contentSpotlight` media scanners; keep generic logic.

- [ ] **Step 4: Regenerate and test**

Run: `pnpm generate:types && pnpm exec vitest run --config ./vitest.config.mts tests/int/system-page-blocks.int.spec.ts tests/int/media-governance.int.spec.ts`

Expected: PASS; generated types contain the three system blocks and none of the five deleted block interfaces.

- [ ] **Step 5: Commit**

```bash
git add src/collections src/hooks/migrateLegacyReusableLinks.ts src/lib/mediaUsage.ts src/payload-types.ts tests/int/system-page-blocks.int.spec.ts
git commit -m "refactor(blocks): remove legacy schemas"
```

### Task 2: Remove legacy renderers and files

**Files:**
- Modify: `src/blocks/RenderBlocks.tsx`
- Modify: `src/app/(frontend)/PageContent.tsx`, `src/app/(frontend)/layout.tsx`
- Modify: `src/components/reviews/ReviewPage.tsx`, `src/components/live-preview/PageLivePreview.tsx`
- Delete: `src/blocks/ContentSpotlight/`, `src/blocks/Form/`, `src/blocks/Hero36/`, `src/blocks/HeaderNavbar12/`, `src/blocks/Footer2/`
- Delete: `src/blocks/renderHeader.tsx`, `src/blocks/renderFooter.tsx`
- Delete: `src/components/hero36.tsx`, `src/components/footer2.tsx`

**Interfaces:**
- Consumes: regenerated `SystemPage['layout']`.
- Produces: `RenderBlocks` supporting only the three system block discriminants.

- [ ] **Step 1: Add the failing renderer assertion**

Read `RenderBlocks.tsx` in the existing integration test and assert:

```ts
for (const slug of ['system404', 'systemMaintenance', 'systemComingSoon']) {
  expect(source).toContain(`case '${slug}'`)
}
for (const slug of ['hero36', 'form', 'contentSpotlight']) {
  expect(source).not.toContain(`case '${slug}'`)
}
```

- [ ] **Step 2: Prove it fails**

Run the focused system-page test; expect failure on legacy renderer cases.

- [ ] **Step 3: Restrict rendering to system pages**

Set `RenderableBlock` to `NonNullable<SystemPage['layout']>[number]`, keep only the three system imports/cases, and remove page/review/live-preview calls whose layouts no longer exist. Remove header/footer renderer usage from the frontend layout while retaining collections and navigation helpers.

- [ ] **Step 4: Delete block-only files and audit references**

Delete every path listed above, then run:

```bash
rg -n "Hero36|hero36|FormBlock|ContentSpotlight|contentSpotlight|HeaderNavbar12|Footer2|renderHeader|renderFooter" src --glob '!src/styles/globals.css'
```

Expected: no exact deleted-symbol references; ordinary Forms collection references remain allowed.

- [ ] **Step 5: Test and commit**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/system-page-blocks.int.spec.ts && pnpm lint`

Expected: PASS, then commit:

```bash
git add src/blocks src/components src/app/'(frontend)' tests/int/system-page-blocks.int.spec.ts
git commit -m "refactor(blocks): remove legacy renderers"
```

### Task 3: Verify the clean foundation

**Files:**
- Regenerate if changed: `src/app/(payload)/admin/importMap.js`
- Verify: all tracked source and tests

**Interfaces:**
- Consumes: system-only schemas and renderer.
- Produces: a buildable repository ready for new blocks.

- [ ] **Step 1: Refresh generated integration files**

Run: `pnpm generate:importmap`

Expected: exit 0 and no deleted component imports.

- [ ] **Step 2: Run full verification**

Run: `pnpm test:int && pnpm build`

Expected: all integration tests pass and Next.js builds successfully.

- [ ] **Step 3: Audit the tree and working copy**

Run: `find src/blocks -maxdepth 2 -type f | sort && git status --short`

Expected: only three system block directories, `RenderBlocks.tsx`, and `systemPageFields.ts`; `src/styles/globals.css` remains modified and unstaged.

- [ ] **Step 4: Commit import-map changes only if present**

```bash
git add src/app/'(payload)'/admin/importMap.js
git diff --cached --quiet || git commit -m "chore(payload): refresh import map"
```
