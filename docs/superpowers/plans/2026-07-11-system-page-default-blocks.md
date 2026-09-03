# System Page Default Blocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current system-page presentation with one minimal full-page, centered status pattern shared across `404`, `Maintenance`, and `Coming Soon`.

**Architecture:** Keep the existing `System Pages` collection and block-type enforcement, but collapse the schema back to a tiny shared field set and replace the richer system-page components with one shared full-page renderer. Mark system screens in the DOM so the frontend layout can hide the normal header and footer automatically for custom system pages and built-in fallbacks.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16 app router, TypeScript, Vitest, shadcn/ui (`button`, optional `badge`)

## Global Constraints

- Do not change `System Pages` slugs or `Website Modes` slugs.
- Preserve typed block enforcement: `404` only maps to `system404`, `Maintenance` only maps to `systemMaintenance`, `Coming Soon` only maps to `systemComingSoon`.
- Use one shared full-page, centered structure across all system screen types.
- Remove rich layout fields that are no longer part of the design.
- Hide the normal public-site header and footer whenever a system page or system-mode fallback is rendered.
- Preserve built-in fallback screens when no custom `System Page` is configured.

---

### Task 1: Simplify The System Page Block Schema

**Files:**
- Modify: `src/blocks/systemPageFields.ts`
- Modify: `src/blocks/System404/config.ts`
- Modify: `src/blocks/SystemMaintenance/config.ts`
- Modify: `src/blocks/SystemComingSoon/config.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `src/payload-types.ts`

**Interfaces:**
- Consumes:
  - `createCmsLinkFields(): Field[]`
  - current block slugs `system404`, `systemMaintenance`, `systemComingSoon`
- Produces:
  - one shared system-page field set:
    - `badge`
    - `heading`
    - `description`
    - `supportingNote`
    - `primaryAction`
    - `secondaryAction`
  - no `helpLinks`, `serviceMessage`, `expectedBackAt`, `eyebrow`, `signupNote`, or `image`

- [ ] **Step 1: Rewrite the schema test around the simplified shared field set**
- [ ] **Step 2: Run it to confirm the current richer schema fails**
- [ ] **Step 3: Simplify the field factory and block configs**
- [ ] **Step 4: Regenerate types**
- [ ] **Step 5: Re-run the schema test**
- [ ] **Step 6: Commit**

### Task 2: Replace The Rich Layouts With One Minimal Full-Page Renderer

**Files:**
- Modify: `src/components/system-page-hero.tsx`
- Modify: `src/blocks/System404/Component.tsx`
- Modify: `src/blocks/SystemMaintenance/Component.tsx`
- Modify: `src/blocks/SystemComingSoon/Component.tsx`
- Delete: `src/blocks/systemPageBlockProps.ts`
- Delete: `src/components/ui/card.tsx`
- Modify: `src/app/(frontend)/SystemFallbackPage.tsx`
- Modify: `tests/int/system-page-rendering.int.spec.ts`

**Interfaces:**
- Consumes:
  - generated block types from `payload-types.ts`
  - shadcn `Button`
  - optional shadcn `Badge`
- Produces:
  - one shared minimal system-screen component
  - centered actions and centered copy for all system page types
  - built-in fallback screens rendered through the same component

- [ ] **Step 1: Rewrite the rendering test to assert the simplified centered content model**
- [ ] **Step 2: Run it to confirm the current richer renderer fails**
- [ ] **Step 3: Replace the rich layout components with one minimal full-page system-screen renderer**
- [ ] **Step 4: Remove now-unused helpers and card dependency from this feature path**
- [ ] **Step 5: Re-run the rendering test**
- [ ] **Step 6: Commit**

### Task 3: Hide Header/Footer For System Screens And Re-verify Regressions

**Files:**
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `src/styles/globals.css`
- Modify: `src/app/(frontend)/PageContent.tsx`
- Modify: `tests/int/page-routing.int.spec.ts`
- Modify: `tests/int/media-governance.int.spec.ts`
- Modify: `tests/int/system-page-rendering.int.spec.ts`

**Interfaces:**
- Consumes:
  - system-page render paths through `PageContent`, `SystemModeFallbackPage`, and `DefaultNotFoundPage`
  - current frontend layout chrome
- Produces:
  - DOM marker for system screens
  - automatic header/footer suppression when the marker is present
  - regression coverage that still validates routing and content behavior after field removal

- [ ] **Step 1: Add the system-screen DOM marker and chrome wrappers**
- [ ] **Step 2: Add CSS that hides header/footer and removes top padding when a system screen is active**
- [ ] **Step 3: Update any tests that depended on removed system-page image fields**
- [ ] **Step 4: Run focused tests for system-page blocks, rendering, routing, and media governance**
- [ ] **Step 5: Run the full integration suite**
- [ ] **Step 6: Run lint**
- [ ] **Step 7: Commit**
