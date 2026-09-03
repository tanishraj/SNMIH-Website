# Hero Banner Alignment Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Hero Banner content element follow one deterministic left, center, or right axis.

**Architecture:** Preserve the existing outer shell and text-alignment maps, then add an alignment-aware margin map for constrained title and description elements. Give the content column an explicit full width plus the selected maximum width for every alignment, while leaving the action row stretched and justified by its existing alignment map.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vitest, React DOM server rendering

## Global Constraints

- Preserve existing title, description, eyebrow, button, overlay, height, spacing, and theme behavior.
- Preserve the current `horizontalAlignment` and `contentWidth` Payload values and fallbacks.
- Do not change Payload fields, generated types, saved data, theme tokens, or Hero Carousel behavior.
- Apply the correction consistently to left, center, and right alignment.
- Do not add dependencies or hardcoded theme values.

---

## File Structure

- Modify `tests/int/hero-banner-render.int.spec.ts`: verify shell, constrained element, content-width, and action alignment for all three horizontal modes.
- Modify `src/blocks/HeroBanner/Component.tsx`: add the constrained-element margin map and make content-column width explicit.

### Task 1: Correct the Hero Banner alignment contract

**Files:**
- Test: `tests/int/hero-banner-render.int.spec.ts:1-137`
- Modify: `src/blocks/HeroBanner/Component.tsx:56-228`

**Interfaces:**
- Consumes: the existing `HeroBannerBlockComponent` props, including `horizontalAlignment?: 'left' | 'center' | 'right' | null` and `contentWidth?: 'narrow' | 'default' | 'wide' | null`.
- Produces: unchanged component props and markup semantics with deterministic alignment classes on the shell, content column, title, description, and action row.

- [x] **Step 1: Add a failing alignment matrix test**

Append this test to `tests/int/hero-banner-render.int.spec.ts`:

~~~tsx
it.each([
  ['left', 'justify-start', 'mr-auto'],
  ['center', 'justify-center', 'mx-auto'],
  ['right', 'justify-end', 'ml-auto'],
] as const)(
  'aligns the complete Hero Banner content axis to %s',
  (horizontalAlignment, shellClass, constrainedItemClass) => {
    const html = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Campus', url: '/media/campus.jpg' } as never,
        buttons: [
          { label: 'Apply now', linkType: 'custom', url: '/apply', variant: 'default' },
        ] as never,
        contentWidth: 'wide',
        description: 'A deliberately constrained description.',
        eyebrow: 'Admissions',
        horizontalAlignment,
        title: 'A deliberately constrained title.',
      }),
    )

    expect(html).toContain(`data-hero-banner-horizontal="${horizontalAlignment}"`)
    expect(html).toContain(shellClass)
    expect(html).toContain('flex w-full flex-col gap-8 max-w-5xl')
    expect(html).toMatch(new RegExp(`<h1 class="[^"]*${constrainedItemClass}`))
    expect(html).toMatch(
      new RegExp(
        `<p class="[^"]*${constrainedItemClass}[^"]*" data-hero-banner-description="true"`,
      ),
    )
    expect(html).toMatch(
      new RegExp(`<div class="[^"]*${shellClass}[^"]*" data-hero-banner-actions="true"`),
    )
  },
)
~~~

- [x] **Step 2: Run the focused test and verify the center/right contract fails**

Run:

~~~bash
pnpm exec vitest run tests/int/hero-banner-render.int.spec.ts --config ./vitest.config.mts
~~~

Expected: FAIL because the content column still uses `lg:flex-1` with a center-only width branch and the title and description do not contain `mr-auto`, `mx-auto`, or `ml-auto`.

- [x] **Step 3: Add the constrained-element alignment map**

In `src/blocks/HeroBanner/Component.tsx`, place this map after `textAlignmentClasses`:

~~~tsx
const constrainedItemAlignmentClasses = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
} as const
~~~

This map controls only elements that already have a maximum reading width.

- [x] **Step 4: Make the content column width explicit for every alignment**

Replace the content-column class expression:

~~~tsx
className={cn(
  'flex w-full flex-col gap-8',
  contentWidthClasses[resolvedContentWidth],
  textAlignmentClasses[resolvedHorizontalAlignment],
)}
~~~

Remove the `resolvedHorizontalAlignment !== 'center' ? 'lg:max-w-xl' : ...` branch. The outer
`horizontalShellClasses` map continues to position this now-explicitly-sized column.

- [x] **Step 5: Position the constrained title and description boxes**

Add the margin map to the title:

~~~tsx
className={cn(
  'font-semibold tracking-tight text-balance',
  titleSizeClasses[resolvedHeight],
  textToneClasses[resolvedThemeMode].title,
  titleWidthClasses[resolvedContentWidth],
  constrainedItemAlignmentClasses[resolvedHorizontalAlignment],
)}
~~~

Add the same map to the description and remove the center-only maximum-width override:

~~~tsx
className={cn(
  'text-balance',
  descriptionSizeClasses[resolvedHeight],
  descriptionWidthClasses[resolvedContentWidth],
  textToneClasses[resolvedThemeMode].description,
  constrainedItemAlignmentClasses[resolvedHorizontalAlignment],
)}
~~~

Do not change the eyebrow or action markup. Their full-width containers already use
`textAlignmentClasses` and `actionAlignmentClasses`.

- [x] **Step 6: Run the focused Hero Banner suite**

Run:

~~~bash
pnpm exec vitest run tests/int/hero-banner-render.int.spec.ts --config ./vitest.config.mts
~~~

Expected: all Hero Banner render tests PASS for content, theme overrides, optional content, and the left/center/right alignment matrix.

- [x] **Step 7: Run targeted static verification**

Run:

~~~bash
pnpm exec eslint src/blocks/HeroBanner/Component.tsx tests/int/hero-banner-render.int.spec.ts
pnpm exec tsc --noEmit
git diff --check
~~~

Expected: all commands exit successfully without Hero Banner errors or whitespace problems.

- [x] **Step 8: Review scope and preserve the existing theme contract**

Run:

~~~bash
git diff -- src/blocks/HeroBanner/Component.tsx tests/int/hero-banner-render.int.spec.ts
~~~

Expected: the runtime diff contains one alignment map and class composition changes only. It does not alter overlays, colors, typography, buttons, media handling, Payload configuration, or Hero Carousel code.

- [ ] **Step 9: Commit the implementation when requested**

~~~bash
git add src/blocks/HeroBanner/Component.tsx tests/int/hero-banner-render.int.spec.ts
git commit -m "fix(hero): align banner content axis"
~~~

Expected: one focused implementation commit. Keep the announcement implementation and plan outside this commit unless the user explicitly requests a combined commit.
