# Content Highlights Card Eyebrow Alignment Implementation Plan

> **For agentic workers:** Execute this plan inline because the suggested execution sub-skills are unavailable. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Content Highlights card eyebrows use the exact typography and surface-aware color treatment used by Editorial Reasons item numbers.

**Architecture:** Keep `contentItemMetadataClasses` as the single shared source of typography. Remove only the Content Highlights-local overrides while retaining placement-specific spacing and the existing surface data attribute.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, Payload CMS

## Global Constraints

- Do not change Payload configuration or generated types.
- Do not change Editorial Reasons.
- Preserve inline and stacked placement behavior.
- Preserve numbered, custom, and hidden eyebrow modes.
- Do not stage or commit files.

---

### Task 1: Align the card eyebrow treatment

**Files:**

- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `src/components/content-highlights.tsx`

**Interfaces:**

- Consumes: `contentItemMetadataClasses` from `src/blocks/shared/contentStyles.ts`.
- Produces: Content Highlights marker markup with Editorial Reasons typography and unchanged surface semantics.

- [x] **Step 1: Add a failing integration assertion**

Update the existing card eyebrow surface-contract test to require the shared Editorial Reasons classes and reject the Content Highlights-only overrides:

```tsx
expect(markerTags[0]).toContain('font-mono text-xs font-medium tracking-[0.14em] text-current/65')
expect(markerTags[0]).not.toContain('font-semibold')
expect(markerTags[0]).not.toContain('uppercase')
expect(markerTags[0]).not.toContain('tracking-[0.18em]')
expect(markerTags[0]).not.toContain('text-current/70')
```

- [x] **Step 2: Run the focused test and verify the new assertion fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: the card eyebrow typography assertion fails because the current markup still contains the local overrides.

- [x] **Step 3: Remove the local typography overrides**

In `HighlightBody`, retain the shared class and placement utility only:

```tsx
className={cn(contentItemMetadataClasses, eyebrowPlacement === 'inline' && 'pt-1')}
```

- [x] **Step 4: Run focused and related tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx tests/int/editorial-reasons.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
```

Expected: all selected test files pass.

- [x] **Step 5: Run static and design checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/components/content-highlights.tsx tests/int/content-highlights.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json --scope type src/components/content-highlights.tsx
git diff --check
```

Expected: TypeScript and ESLint exit successfully, the detector returns no unexplained findings, and the diff check reports no whitespace errors.
