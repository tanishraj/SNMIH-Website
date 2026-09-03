# Theme and Block Consistency Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make shared colors, surfaces, radii, actions, tabs, ratings, and status treatments predictable and accessible across every website theme without redesigning the established block library.

**Architecture:** Extend the existing semantic token bridge with an explicit success foreground, correct muted contrast at the preset source, and make the shared content-tab resolver aware of light versus brand surfaces. Migrate only audited outliers—Timeline, Leadership Profiles, Services 21, Tabs Content, and Quote—onto the shared contracts, then lock the behavior with source, rendering, accessibility, and contrast tests.

**Tech Stack:** Payload CMS 3, Next.js 16, React 19, Tailwind CSS 4, TypeScript, Vitest, Testing Library.

## Global Constraints

- Preserve all five themes: Default, Sunset, Blue, Kodama, and SNMIH.
- Preserve the one-client-per-deployment architecture and all 53 registered Page blocks.
- Preserve existing Payload field values and legacy tab-style normalization; no content migration.
- Use semantic theme tokens only for visitor-facing state, foreground, background, border, focus, and rating colors.
- Controls retain a minimum 44px interactive height and visible keyboard focus.
- Do not commit unless the user explicitly asks.

---

### Task 1: Repair semantic contrast tokens

**Files:**
- Modify: `src/styles/globals.css`
- Modify: `src/styles/themes/theme-default.css`
- Modify: `src/styles/themes/theme-sunset.css`
- Modify: `src/styles/themes/theme-blue.css`
- Modify: `src/styles/themes/theme-kodama.css`
- Modify: `src/styles/themes/theme-snmih.css`
- Modify: `tests/int/theme-contracts.int.spec.ts`

**Interfaces:**
- Produces: Tailwind `text-success-foreground` through `--color-success-foreground: var(--success-foreground)`.
- Produces: muted/muted-foreground and success/success-foreground pairs with contrast ratios of at least 4.5:1 in every theme and mode.

- [ ] Add failing contrast assertions for muted and success pairs and assert the new token bridge.
- [ ] Set light-theme muted foreground lightness to `0.52` while retaining each preset's chroma and hue.
- [ ] Add white light-mode and deep-green dark-mode success foreground tokens; darken SNMIH light success to `oklch(0.53 0.1415 147.76)`.
- [ ] Run `pnpm test:int -- tests/int/theme-contracts.int.spec.ts` and require all theme/mode matrices to pass.

### Task 2: Consolidate surface-aware tabs

**Files:**
- Modify: `src/blocks/shared/contentTabRail.ts`
- Modify: `src/blocks/TabsContent/TabsContentClient.tsx`
- Modify: `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`
- Modify: `src/blocks/FeeStructure/FeeStructureClient.tsx`
- Modify: `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`
- Modify: `src/blocks/GalleryAlbumTabs/galleryAlbumTabsShared.ts`
- Modify: Gallery Album Tabs callers if required by the new surface argument.
- Modify: `tests/int/tabs-content-active-color.int.spec.ts`
- Modify: `tests/int/block-surface-semantics.int.spec.ts`

**Interfaces:**
- Produces: `getContentTabRailClasses(variant, surface)` and `getContentTabClasses(variant, active, surface)` where `surface` is `light | brand` and defaults to `light`.
- Consumes: existing `ContentTabVariant` values `contained | pill | underline`.
- Preserves: Tabs Content mappings `boxed → contained`, `pills/segmented → pill`, and `underline → underline`.

- [ ] Write failing source and rendering assertions proving that shared tabs invert on brand surfaces.
- [ ] Add the surface parameter and semantic active/inactive/focus classes to the shared resolver.
- [ ] Replace Tabs Content's parallel tab colors and geometry with the shared resolver while retaining alignment and segmented minimum width.
- [ ] Pass the resolved surface from every shared-tab consumer.
- [ ] Run the focused tab and surface contract tests.

### Task 3: Migrate audited block outliers

**Files:**
- Modify: `src/blocks/Timeline/Component.tsx`
- Modify: `src/blocks/LeadershipProfiles/Component.tsx`
- Modify: `src/blocks/Services21/Component.tsx`
- Modify: `src/components/services21.tsx`
- Modify: `src/blocks/QuoteBlock/Component.tsx`
- Create: `tests/int/theme-block-outliers.int.spec.tsx`
- Modify: `tests/int/content-action-presentation.int.spec.tsx`
- Modify: `tests/int/leadership-profiles.int.spec.tsx`

**Interfaces:**
- Timeline consumes `bg-success text-success-foreground`.
- Leadership overlay labels consume the fixed overlay text contract rather than website-mode status colors.
- Services 21 keeps `BorderButton` corner art but consumes native `Button` variants plus the default card-surface override for brand sections.
- Services 21 service choices become real buttons activated by pointer, focus, or click and expose selected state.
- Quote ratings consume `rating-excellent`; the highlight variant uses a logical one-pixel accent rule.

- [ ] Add failing source/render assertions for every outlier.
- [ ] Replace Timeline and Leadership color exceptions with semantic foreground contracts.
- [ ] Remove Services 21's duplicated variant map and add keyboard-operable service buttons with visible focus.
- [ ] Replace hard-coded amber rating stars and the four-pixel physical-side quote border.
- [ ] Run the focused outlier, content-action, and Leadership tests.

### Task 4: Verify the system and refresh maintained context

**Files:**
- Update if generated facts change: `.agents/skills/project-context/references/project-inventory.json`
- Update if shared behavior changes: `.agents/skills/project-context/references/block-system.md`
- Update if theme ownership changes: `.agents/skills/project-context/references/architecture.md`

**Interfaces:**
- Consumes: all Task 1–3 contracts.
- Produces: a clean focused test, TypeScript, lint, detector, and project-context handoff.

- [ ] Run `pnpm exec tsc --noEmit`.
- [ ] Run the affected Vitest files together.
- [ ] Run `node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks src/components src/styles` once after edits.
- [ ] Run `pnpm project-context:update`, inspect the final diff against `change-impact-map.md`, and run `pnpm project-context:check`.
- [ ] Inspect the uncommitted diff and report any visual-browser verification that remains unavailable.
