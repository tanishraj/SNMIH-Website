# Block Components Theme Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize all reusable and system page block components so they consistently use the existing semantic theme tokens and respond correctly to theme-color and dark-mode changes without changing their Payload schemas.

**Architecture:** Keep the current block boundaries and data contracts intact. Apply a conservative normalization pass in the shared block renderers and supporting primitives, using the existing shadcn token model (`background`, `foreground`, `accent`, `muted`, `sidebar`, `border`, `shadow`, `radius`) instead of introducing new styling systems or schema churn.

**Tech Stack:** Payload CMS, Next.js App Router, React Server Components + client components, Tailwind CSS v4, shadcn/ui, Vitest

## Global Constraints

- Do not change block schemas or editor-facing field contracts unless token normalization is impossible without it.
- Prefer existing semantic tokens over raw color values or manual `dark:` overrides.
- Preserve current rendering behavior and interaction patterns unless a styling bug depends on changing the implementation.
- Follow local shadcn composition and token conventions already present in `src/components/ui`.
- Verification must use focused integration tests for touched blocks.

---

### Task 1: Normalize announcement surfaces and token inheritance

**Files:**

- Modify: `src/components/announcement/AnnouncementBar.tsx`
- Modify: `src/components/announcement/MarqueeAnnouncementContent.tsx`
- Modify: `src/components/announcement/RotatingAnnouncementContent.tsx`
- Test: `tests/int/global-announcement.int.spec.ts`
- Test: `tests/int/marquee-announcement.int.spec.ts`
- Test: `tests/int/rotating-announcement.int.spec.ts`

**Interfaces:**

- Consumes: existing `AnnouncementBar`, `MarqueeAnnouncementContent`, and `RotatingAnnouncementContent` props
- Produces: unchanged announcement block/global interfaces with accent-based semantic shell styling

- [ ] Update the announcement shell to use the approved semantic bar treatment: accent surface, accent foreground, and border token.
- [ ] Replace announcement child token references that still assume `primary` foreground with equivalent `accent` foreground references so shell and child content stay aligned.
- [ ] Keep the current mobile/desktop structure, pause-on-hover behavior, and link behavior unchanged.
- [ ] Update/add assertions in the focused announcement tests so they verify the normalized token classes instead of the older primary-based shell.

### Task 2: Normalize header and navigation surfaces without changing behavior

**Files:**

- Modify: `src/components/header/HeaderNavbar.tsx`
- Modify: `src/components/header/HeaderNavMenu.tsx`
- Modify: `src/components/header/HeaderMobileMenu.tsx`
- Test: `tests/int/header-navbar-render.int.spec.ts`

**Interfaces:**

- Consumes: existing `HeaderNavbar`, `HeaderNavMenu`, and `HeaderMobileMenu` props
- Produces: unchanged header block behavior with token-driven surfaces, borders, hover states, and mobile sheet rhythm

- [ ] Audit the header shell, desktop navigation, and mobile sheet markup for any remaining one-off surface assumptions.
- [ ] Normalize the shell and menu surfaces to rely on the existing `background`, `popover`, `muted`, `border`, and theme shadow tokens already defined in the local shadcn primitives.
- [ ] Keep the accepted desktop/mobile interaction model intact: child menus, sticky behavior, blur, CTA rendering, and mobile expansion logic must not regress.
- [ ] Update the header integration assertions only where the rendered semantic classes intentionally changed.

### Task 3: Normalize hero and feature-spotlight content surfaces

**Files:**

- Modify: `src/blocks/HeroInstitutional/Component.tsx`
- Modify: `src/blocks/FeatureSpotlight/Component.tsx`
- Test: `tests/int/hero-institutional-render.int.spec.ts`
- Test: `tests/int/feature-spotlight-render.int.spec.ts`

**Interfaces:**

- Consumes: existing hero and feature-spotlight block props from Payload
- Produces: unchanged layout and CTA behavior with token-aligned text, surfaces, and media wrappers

- [ ] Keep hero overlay veils custom, but make sure the block shell and readable content layers use the existing semantic tokens consistently.
- [ ] Preserve the current CTA variant mapping in hero while keeping the button appearance driven by shadcn variants.
- [ ] Normalize feature-spotlight surfaces and media wrappers so the block reads correctly in both plain and muted variants across themes.
- [ ] Preserve the accepted animated text-link CTA behavior in feature-spotlight while keeping the colors token-driven.
- [ ] Refresh focused render assertions only where normalized classes or attributes change.

### Task 4: Normalize stats, footer, and system page supporting primitives

**Files:**

- Modify: `src/blocks/StatsStrip/Component.tsx`
- Modify: `src/blocks/Footer56/Component.tsx`
- Modify: `src/components/system-pages/primitives/SystemPageActions.tsx`
- Modify: `src/components/system-pages/primitives/SystemPageCopy.tsx`
- Modify: `src/components/system-pages/primitives/SystemPageStatus.tsx`
- Modify: `src/components/system-pages/primitives/SystemPageShell.tsx`
- Test: `tests/int/stats-strip-render.int.spec.ts`
- Test: `tests/int/system-page-rendering.int.spec.ts`
- Test: `tests/int/global-footer.int.spec.ts`

**Interfaces:**

- Consumes: existing stats/footer/system page block props and shared system page primitive props
- Produces: unchanged block and fallback rendering behavior with token-consistent surfaces, borders, and text hierarchy

- [ ] Review stats strip row borders, footer link/icon/text surfaces, and system page primitive typography/surfaces for any remaining token drift.
- [ ] Apply only conservative class updates; do not redesign the accepted footer or system page layouts.
- [ ] Keep stats sequencing, multi-row dividers, footer site-settings integration, and system page CTA behavior unchanged.
- [ ] Update tests only where the normalized semantic classes changed or where additional assertions improve regression coverage.

### Task 5: Run focused verification for the normalization pass

**Files:**

- No source changes required unless fixes are found

**Interfaces:**

- Consumes: current repository test/lint scripts
- Produces: validated normalization pass with failures fixed before handoff

- [ ] Run the focused Vitest surface for touched blocks: announcement, header, hero, feature-spotlight, stats, system pages, and footer.
- [ ] Run lint or targeted static checks on the touched files if the project exposes a suitable command.
- [ ] If a failure exposes a normalization regression, patch the owning component and rerun the relevant focused test before handoff.
- [ ] Summarize the exact files changed and the verification results in the implementation handoff.
