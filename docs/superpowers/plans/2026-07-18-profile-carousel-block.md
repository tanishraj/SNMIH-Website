# Profile Carousel Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a theme-aligned Payload Profile Carousel block adapted from `@shadcnblocks/gallery27`, with a static grid for one through four profiles and a carousel for five through twelve.

**Architecture:** A server-side Payload adapter resolves actions and media into a canonical presentation model. A server presentation component owns the section, heading, static-grid decision, and shared profile card, while a focused client component owns only the shadcn/Embla carousel branch. The existing shared Button component remains authoritative.

**Tech Stack:** Payload CMS 3.85, Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn Carousel, Embla Carousel, Vitest, Playwright thumbnail rendering.

## Global Constraints

- Canonical Payload slug: `profileCarousel`; canonical interface: `ProfileCarouselBlock`.
- Content fields: optional eyebrow, required title, optional description, zero or one shared action, and one to twelve profiles.
- Profile fields: required image, required name, optional role, and required background position defaulting to Center.
- One through four profiles use a static one/two/four-column grid; five through twelve use a looping one/two/four-slide carousel.
- Preserve `src/components/ui/button.tsx`; do not accept the registry's radius replacement.
- Use standard block appearance, spacing, typography, action, media, and radius patterns.
- Use no autoplay, raw colors, custom fonts, or per-profile links.
- Provide block-level Text Below Image and Image Overlay variants with one shared overlay alignment.
- Keep every change unstaged and do not commit.

---

## File Structure

- Create `src/blocks/ProfileCarousel/config.ts`: Payload field schema and thumbnail metadata.
- Create `src/blocks/ProfileCarousel/Component.tsx`: Payload-to-presentation adapter.
- Create `src/components/profile-carousel.tsx`: server section, header, static grid, and shared card.
- Create `src/components/profile-carousel-client.tsx`: client-only shadcn Carousel branch.
- Create `src/components/ui/carousel.tsx`: shadcn Carousel primitive generated from the registry dependency.
- Give the carousel track Embla's mobile touch behavior (`pan-y pinch-zoom`) and disable native image dragging so Safari forwards horizontal gestures to the carousel.
- Create `tests/int/profile-carousel.int.spec.ts`: schema, rendering, behavior, media, and registration coverage.
- Modify `src/blocks/shared/contentActionsFields.ts`: allow a caller-specific `maxRows`, defaulting to two.
- Modify `src/collections/Pages.ts`: register Profile Carousel.
- Modify `src/blocks/renderPageBlocks.tsx`: render the new Payload union member.
- Modify `src/block-thumbnails/definitions.ts`: add canonical thumbnail metadata.
- Modify `src/block-thumbnails/fixtures.tsx`: add a local deterministic five-profile fixture.
- Modify `tests/int/page-blocks.int.spec.ts`: update the ordered page-block registry assertion.
- Modify `tests/int/block-thumbnails.int.spec.ts`: update complete manifest coverage and canonical metadata.
- Modify `package.json` and `pnpm-lock.yaml`: add `embla-carousel-react` through shadcn.
- Regenerate `src/payload-types.ts` and create `public/block-thumbnails/profile-carousel.jpg`.
- Remove the generated `src/components/gallery27.tsx` after adapting it so no upstream runtime identity remains.

### Task 1: Lock the schema and shared one-action contract

**Files:**

- Create: `tests/int/profile-carousel.int.spec.ts`
- Modify: `src/blocks/shared/contentActionsFields.ts`
- Create: `src/blocks/ProfileCarousel/config.ts`

**Interfaces:**

- Produces: `ProfileCarouselBlock: Block` with slug `profileCarousel`.
- Produces: `createContentActionsField({ maxRows?: number })`, preserving `maxRows: 2` by default.

- [ ] **Step 1: Write failing schema tests**

Assert the canonical identity, Content/Layout tab split, one-action maximum, profile row limits, required media/name fields, image-position option order, and layout defaults:

```ts
expect(ProfileCarouselBlock.slug).toBe('profileCarousel')
expect(actionsField?.maxRows).toBe(1)
expect(createContentActionsField().maxRows).toBe(2)
expect(profilesField).toMatchObject({ minRows: 1, maxRows: 12, type: 'array' })
expect(imagePositionField?.options?.map(({ value }) => value)).toEqual([
  'center',
  'top',
  'bottom',
  'left',
  'right',
])
expect(contentAlignmentField?.defaultValue).toBe('left')
expect(actionModeField?.defaultValue).toBe('link')
expect(sizeField?.defaultValue).toBe('default')
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts`

Expected: FAIL because `@/blocks/ProfileCarousel/config` does not exist.

- [ ] **Step 3: Extend the shared action helper without changing existing callers**

Add `maxRows?: number` to `CreateContentActionsFieldOptions`, default it to `2`, and use that value in the returned Array field.

- [ ] **Step 4: Implement the Payload config**

Create `ProfileCarouselBlock` with `getBlockThumbnailAdmin('profileCarousel')`, a Content tab containing eyebrow, title, description, `createContentActionsField({ label: 'Action', maxRows: 1 })`, and profiles, plus a Layout & Theme tab containing appearance, action mode, content alignment, and size.

- [ ] **Step 5: Run the focused schema tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts`

Expected: schema tests PASS; presentation/registration tests may remain pending until later tasks.

### Task 2: Install and preserve the shadcn source boundary

**Files:**

- Create: `src/components/ui/carousel.tsx`
- Temporary create/remove: `src/components/gallery27.tsx`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Preserve unchanged: `src/components/ui/button.tsx`

**Interfaces:**

- Produces: shadcn `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselNext`, and `CarouselPrevious`.
- Produces: `embla-carousel-react` dependency.

- [ ] **Step 1: Record the existing Button checksum**

Run: `shasum src/components/ui/button.tsx`

Expected: one checksum used for the post-install comparison.

- [ ] **Step 2: Install Gallery 27 without overwrite mode**

Run: `pnpm dlx shadcn@latest add @shadcnblocks/gallery27 -y`

Expected: creates the Carousel primitive and Gallery 27 source, adds Embla, and skips the existing Button because `--overwrite` is absent.

- [ ] **Step 3: Verify the Button was preserved**

Run: `shasum src/components/ui/button.tsx`

Expected: checksum exactly matches Step 1.

- [ ] **Step 4: Remove the generated demo component after using it as the source reference**

Delete `src/components/gallery27.tsx` with `apply_patch`; retain `src/components/ui/carousel.tsx` and the dependency changes.

- [ ] **Step 5: Verify no upstream runtime identity remains**

Run: `rg -n "Gallery27|gallery27|font-calSans|person[1-5]\.jpeg" src package.json`

Expected: no matches.

### Task 3: Implement the static grid and focused carousel presentation

**Files:**

- Create: `src/components/profile-carousel.tsx`
- Create: `src/components/profile-carousel-client.tsx`
- Extend: `tests/int/profile-carousel.int.spec.ts`

**Interfaces:**

- Produces: `ProfileCarouselProfile`, `ProfileCarouselAlignment`, `ProfileCarouselImagePosition`, and `ProfileCarouselSize` types.
- Produces: `ProfileCarousel(props)` server presentation component.
- Consumes: shadcn Carousel primitives from Task 2.

- [ ] **Step 1: Add failing rendering tests**

Cover static and carousel branches, semantic typography, sizes, appearance, alignment, image positions, and accessible controls. Key assertions:

```ts
expect(staticHtml).toContain('data-profile-carousel-mode="static"')
expect(staticHtml).toContain('lg:grid-cols-4')
expect(staticHtml).not.toContain('aria-label="Previous profile"')
expect(carouselHtml).toContain('data-profile-carousel-mode="carousel"')
expect(carouselHtml.match(/md:basis-1\/2 lg:basis-1\/4/g)).toHaveLength(5)
expect(carouselHtml).toContain('aria-label="Previous profile"')
expect(carouselHtml).toContain('aria-label="Next profile"')
expect(carouselHtml).not.toMatch(/<h3[^>]*>Alex Morgan<\/h3>/)
```

- [ ] **Step 2: Run tests and verify the presentation imports fail**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts`

Expected: FAIL because the presentation components do not exist.

- [ ] **Step 3: Implement the server presentation and shared card**

Use `regularBlockMobilePaddingClasses`, `resolveBlockAppearanceClasses`, and the standard `max-w-screen-2xl px-4` container. Resolve these fixed class maps:

```ts
const imageHeightClasses = {
  compact: 'h-64 sm:h-72 md:h-80',
  default: 'h-72 sm:h-80 md:h-96',
  comfortable: 'h-80 sm:h-96 md:h-[28rem]',
} as const

const objectPositionClasses = {
  center: 'object-[center_center]',
  top: 'object-[center_top]',
  bottom: 'object-[center_bottom]',
  left: 'object-[left_center]',
  right: 'object-[right_center]',
} as const
```

Render the header once with the normalized regular-block title and description classes, a static `grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4` for up to four profiles, and the client carousel only for five or more. Profile names are `<p className="font-semibold ...">`; roles are smaller `text-sm leading-6 text-current/70` paragraphs.

- [ ] **Step 4: Implement the client carousel**

Create a `'use client'` component using `opts={{ align: 'start', loop: true }}`. Each slide uses `pl-5 md:basis-1/2 lg:basis-1/4` inside a matching `-ml-5` track; controls retain Gallery 27's top-right arrangement and receive `aria-label="Previous profile"` and `aria-label="Next profile"`.

- [ ] **Step 5: Run the rendering tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts`

Expected: presentation tests PASS.

### Task 4: Add the Payload adapter and page pipeline

**Files:**

- Create: `src/blocks/ProfileCarousel/Component.tsx`
- Modify: `src/collections/Pages.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `tests/int/profile-carousel.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Regenerate: `src/payload-types.ts`

**Interfaces:**

- Produces: `ProfileCarouselBlockComponent` accepting the generated Payload block shape.
- Consumes: `resolveCmsActions`, `getMediaImageProps`, `ContentActions`, and `ProfileCarousel`.

- [ ] **Step 1: Add failing adapter and registration tests**

Assert that malformed profiles are omitted, media URLs and action variants resolve, `Pages` includes `profileCarousel` after `featureMatrix`, and `renderPageBlocks` emits `data-profile-carousel="true"`.

- [ ] **Step 2: Implement the adapter**

Trim title/name/role values, resolve each image with `getMediaImageProps({ fallbackAlt: profileName, preset: 'generic' })`, resolve actions, and return `null` if the title is empty or no valid profiles remain. Pass a `ContentActions` node with the selected alignment and mode.

- [ ] **Step 3: Register config and renderer branches**

Import `ProfileCarouselBlock` in Pages and insert it after Feature Matrix. Import `ProfileCarouselBlockComponent` in the renderer and add the `profileCarousel` switch case.

- [ ] **Step 4: Regenerate Payload types**

Run: `pnpm generate:types`

Expected: `src/payload-types.ts` contains `ProfileCarouselBlock`, `blockType: 'profileCarousel'`, and the agreed fields.

- [ ] **Step 5: Run page pipeline tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts tests/int/page-blocks.int.spec.ts`

Expected: PASS.

### Task 5: Add the real-render thumbnail

**Files:**

- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Create: `public/block-thumbnails/profile-carousel.jpg`

**Interfaces:**

- Produces: `getBlockThumbnailDefinition('profileCarousel')` with `profile-carousel.jpg`.
- Produces: deterministic local fixture containing five profiles.

- [ ] **Step 1: Add failing thumbnail manifest assertions**

Add `profileCarousel` to the exact registered-slug list and assert:

```ts
expect(getBlockThumbnailDefinition('profileCarousel')).toMatchObject({
  filename: 'profile-carousel.jpg',
  label: 'Profile Carousel',
  slug: 'profileCarousel',
})
```

- [ ] **Step 2: Add the definition and fixture**

Use `stageAlignment: 'top'`. Import the block adapter and render five profiles using only the existing local SVG thumbnail assets, with a title, description, one link action, and compact size.

- [ ] **Step 3: Generate all deterministic thumbnails**

Run: `pnpm generate:block-thumbnails`

Expected: reports `✓ profileCarousel -> public/block-thumbnails/profile-carousel.jpg` and retains exact 1600×900 JPEG outputs.

- [ ] **Step 4: Run thumbnail tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts`

Expected: PASS.

### Task 6: Final quality gate

**Files:** all files changed above.

- [ ] **Step 1: Format changed source and test files**

Run: `pnpm exec prettier --write src/blocks/ProfileCarousel src/components/profile-carousel.tsx src/components/profile-carousel-client.tsx src/components/ui/carousel.tsx src/blocks/shared/contentActionsFields.ts src/collections/Pages.ts src/blocks/renderPageBlocks.tsx src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx tests/int/profile-carousel.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts docs/superpowers/specs/2026-07-18-profile-carousel-block-design.md docs/superpowers/plans/2026-07-18-profile-carousel-block.md`

Expected: Prettier completes without errors.

- [ ] **Step 2: Run focused tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts`

Expected: PASS.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`

Expected: PASS, or report only verified unrelated pre-existing failures.

- [ ] **Step 4: Validate generated types and dependency state**

Run: `pnpm generate:types && pnpm install --lockfile-only`

Expected: generation succeeds and the lockfile is current.

- [ ] **Step 5: Check whitespace, canonical naming, and unstaged state**

Run: `git diff --check && rg -n "Gallery27|gallery27|font-calSans|person[1-5]\.jpeg" src package.json && git status --short`

Expected: `git diff --check` succeeds; the registry-identity search has no matches; Profile Carousel changes remain unstaged.
