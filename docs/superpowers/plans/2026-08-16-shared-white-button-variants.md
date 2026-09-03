# Shared White Button Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fixed White Filled and White Outline variants to every CMS button field that consumes the shared button options.

**Architecture:** Extend the existing shared button variant definition, shared Payload option list, and CMS action union without adding block-specific styling. Keep the variants self-contained in `button.tsx`, then use the CTA thumbnail fixture on a brand surface as the visual regression sample.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, class-variance-authority, Payload CMS 3, Vitest, Playwright, pnpm

## Global Constraints

- Stored values are exactly `white` and `whiteOutline`.
- Admin labels are exactly **White Filled** and **White Outline**.
- White Filled keeps a white background and border regardless of active theme or surrounding section surface.
- White Filled uses `primary` text and icon color in light mode and `primary-foreground` in dark mode.
- White Outline uses a transparent background with a white border and white text.
- Button icons inherit the label color through `currentColor`; do not add a separate icon-color override.
- Both variants use a white focus border and translucent white focus ring.
- Existing variants, defaults, and surface-specific behavior must not change.
- Admin guidance must warn that white variants are intended for dark, brand, or image backgrounds.
- Do not add a dependency or a block-specific variant implementation.

---

## File Structure

- Modify `src/components/ui/button.tsx`: define the two visual variants in the canonical button component.
- Modify `src/blocks/shared/contentActionsFields.ts`: expose the two variants and editor guidance from the central Payload option source.
- Modify `src/lib/cmsLinks.ts`: accept and preserve both stored values through shared action resolution.
- Modify `tests/int/button-primary-variant.int.spec.tsx`: cover schema consumers, resolution, rendered styling, and selector isolation.
- Modify `src/block-thumbnails/fixtures.tsx`: show both variants on a brand CTA surface.
- Modify `public/block-thumbnails/cta-39.jpg`: regenerate the CTA admin thumbnail from the production fixture.
- Modify `src/payload-types.ts`: regenerate Payload's schema-derived unions.

---

### Task 1: Extend the shared button contract

**Files:**

- Modify: `tests/int/button-primary-variant.int.spec.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/blocks/shared/contentActionsFields.ts`
- Modify: `src/lib/cmsLinks.ts`

**Interfaces:**

- Consumes: `buttonVariantOptions`, `buttonVariantWithLinkOptions`, `CmsActionVariant`, `resolveCmsActions()`, `Button`, and `ContentActions`.
- Produces: `CmsActionVariant = 'default' | 'link' | 'outline' | 'primary' | 'secondary' | 'white' | 'whiteOutline'` and matching class-variance-authority keys.

- [ ] **Step 1: Add failing schema and action-resolution assertions**

Update the imports in `tests/int/button-primary-variant.int.spec.tsx`:

```tsx
import {
  buttonVariantOptions,
  buttonVariantWithLinkOptions,
  createContentActionsField,
} from '@/blocks/shared/contentActionsFields'
import { Button } from '@/components/ui/button'
```

In the existing schema-consumer test, require every checked shared consumer to contain the two new options while preserving its existing default:

```tsx
expect(pairs).toEqual(
  expect.arrayContaining([
    { label: 'Default', value: 'default' },
    { label: 'Primary', value: 'primary' },
    { label: 'White Filled', value: 'white' },
    { label: 'White Outline', value: 'whiteOutline' },
  ]),
)
```

Add a central-option test:

```tsx
it('adds fixed white variants to both shared option lists', () => {
  const expected = [
    { label: 'White Filled', value: 'white' },
    { label: 'White Outline', value: 'whiteOutline' },
  ]

  expect(buttonVariantOptions).toEqual(expect.arrayContaining(expected))
  expect(buttonVariantWithLinkOptions).toEqual(expect.arrayContaining(expected))
})
```

Keep the existing Primary resolution test and add a separate test for both white values:

```tsx
it('preserves both white variants through action resolution', () => {
  const actions = resolveCmsActions([
    {
      label: 'White filled',
      linkType: 'custom',
      mode: 'button',
      url: '/filled',
      variant: 'white',
    },
    {
      label: 'White outline',
      linkType: 'custom',
      mode: 'button',
      url: '/outline',
      variant: 'whiteOutline',
    },
  ])

  expect(actions.map(({ variant }) => variant)).toEqual(['white', 'whiteOutline'])

  const html = renderToStaticMarkup(createElement(ContentActions, { actions }))

  expect(html).toContain('data-action-variant="white"')
  expect(html).toContain('data-variant="white"')
  expect(html).toContain('data-action-variant="whiteOutline"')
  expect(html).toContain('data-variant="whiteOutline"')
})
```

- [ ] **Step 2: Add failing visual-class and selector-isolation assertions**

Add a renderer test to `tests/int/button-primary-variant.int.spec.tsx`:

```tsx
it('renders fixed white presentation and focus classes', () => {
  const filled = renderToStaticMarkup(
    createElement(Button, { variant: 'white' as never }, 'White filled'),
  )
  const outline = renderToStaticMarkup(
    createElement(Button, { variant: 'whiteOutline' as never }, 'White outline'),
  )

  expect(filled).toContain(
    'border-white bg-white text-primary dark:text-primary-foreground',
  )
  expect(filled).toContain('hover:bg-white/90')
  expect(filled).toContain('focus-visible:border-white')
  expect(filled).toContain('focus-visible:ring-white/30')

  expect(outline).toContain('border-white bg-transparent text-white')
  expect(outline).toContain('hover:bg-white/10')
  expect(outline).toContain('focus-visible:border-white')
  expect(outline).toContain('focus-visible:ring-white/30')
})
```

Extend the existing overlay-selector test after it collects `overlayButtonSelectors`:

```tsx
expect(
  overlayButtonSelectors.some(
    (selector) =>
      selector.includes("[data-variant='white']") ||
      selector.includes("[data-variant='whiteOutline']"),
  ),
).toBe(false)
```

- [ ] **Step 3: Run the focused test and verify the red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/button-primary-variant.int.spec.tsx --reporter=dot
```

Expected: FAIL because the shared options, action union, and button CVA do not yet accept `white` or `whiteOutline`.

- [ ] **Step 4: Add the shared Payload options and guidance**

In `src/blocks/shared/contentActionsFields.ts`, append the options to `buttonVariantOptions`:

```ts
export const buttonVariantOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Outline', value: 'outline' },
  { label: 'White Filled', value: 'white' },
  { label: 'White Outline', value: 'whiteOutline' },
] satisfies SelectField['options']
```

Replace `buttonVariantDescription` with:

```ts
export const buttonVariantDescription =
  "Default adapts to the surrounding section or image overlay. Primary always uses the site theme's primary color. White variants stay white and are intended for dark, brand, or image backgrounds."
```

Do not change `buttonVariantWithLinkOptions`; it already spreads `buttonVariantOptions` and will inherit both values.

- [ ] **Step 5: Extend the shared action union**

In `src/lib/cmsLinks.ts`, replace the union with:

```ts
export type CmsActionVariant =
  | 'default'
  | 'link'
  | 'outline'
  | 'primary'
  | 'secondary'
  | 'white'
  | 'whiteOutline'
```

No resolver branch is needed because `resolveCmsActions()` already preserves valid variant strings and defaults only nullish values.

- [ ] **Step 6: Add the canonical visual variants**

In the `variant` object in `src/components/ui/button.tsx`, add:

```ts
white:
  'border-white bg-white text-primary hover:bg-white/90 focus-visible:border-white focus-visible:ring-white/30 dark:text-primary-foreground',
whiteOutline:
  'border-white bg-transparent text-white hover:bg-white/10 focus-visible:border-white focus-visible:ring-white/30',
```

Keep these definitions in the button component. Do not add selectors to `src/styles/custom.css`; the fixed colors must not depend on an ancestor surface.

- [ ] **Step 7: Format and rerun the focused test**

Run:

```bash
pnpm exec prettier --write src/components/ui/button.tsx src/blocks/shared/contentActionsFields.ts src/lib/cmsLinks.ts tests/int/button-primary-variant.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/button-primary-variant.int.spec.tsx --reporter=dot
```

Expected: PASS with all tests in `button-primary-variant.int.spec.tsx` green.

- [ ] **Step 8: Commit the shared contract**

```bash
git add src/components/ui/button.tsx src/blocks/shared/contentActionsFields.ts src/lib/cmsLinks.ts tests/int/button-primary-variant.int.spec.tsx
git commit -m "feat(button): add white variants"
```

---

### Task 2: Regenerate schema types and visual coverage

**Files:**

- Modify: `tests/int/button-primary-variant.int.spec.tsx`
- Modify: `src/payload-types.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/cta-39.jpg`

**Interfaces:**

- Consumes: the `white` and `whiteOutline` variants produced by Task 1.
- Produces: Payload-generated action unions containing both values and an admin thumbnail demonstrating both variants on a brand surface.

- [ ] **Step 1: Add a failing generated-type assertion**

Add this test to `tests/int/button-primary-variant.int.spec.tsx`:

```tsx
it('includes both white variants in generated Payload action unions', () => {
  const payloadTypes = readFileSync('src/payload-types.ts', 'utf8')

  expect(payloadTypes).toContain("'white'")
  expect(payloadTypes).toContain("'whiteOutline'")
})
```

- [ ] **Step 2: Run the focused test and verify the generated-type failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/button-primary-variant.int.spec.tsx --reporter=dot
```

Expected: FAIL only on the generated Payload type assertion.

- [ ] **Step 3: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: exit code 0 and `src/payload-types.ts` unions for shared CMS action fields include `white` and `whiteOutline`.

- [ ] **Step 4: Update the CTA visual fixture**

In the `cta39` fixture in `src/block-thumbnails/fixtures.tsx`:

```tsx
<Cta39BlockComponent
  actions={[
    {
      mode: 'button',
      label: 'Get started',
      linkType: 'custom',
      url: '/get-started',
      variant: 'white',
    },
    {
      mode: 'button',
      label: 'Talk to our team',
      linkType: 'custom',
      url: '/contact',
      variant: 'whiteOutline',
    },
  ]}
  appearance={{ background: 'brand', border: 'topAndBottom' }}
  description="Learn quickly, build confidently, and deliver with quality using a modern production workflow."
  eyebrow="Ready when you are"
  headerLayout="split"
  size="compact"
  splitContentAlignment="center"
  title="Turn goals into action with focused execution."
/>
```

- [ ] **Step 5: Format and regenerate the CTA thumbnail**

Run:

```bash
pnpm exec prettier --write src/payload-types.ts src/block-thumbnails/fixtures.tsx tests/int/button-primary-variant.int.spec.tsx
BLOCK_THUMBNAIL_BASE_URL=http://localhost:3000 BLOCK_THUMBNAIL_SLUG=cta39 pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/cta-39.jpg` is regenerated as a 1600×900 JPEG. If the thumbnail generator cannot open its IPC socket or browser under the sandbox, rerun only that command with the required local socket/browser permission.

- [ ] **Step 6: Inspect the generated desktop preview**

Open `public/block-thumbnails/cta-39.jpg` and confirm:

- The section is a brand surface.
- White Filled has white fill, a theme-aware dark brand foreground, and a white border.
- White Outline has transparent fill, white text, and a visible white border.
- The two variants are visually distinct.
- Text and actions remain aligned with the split CTA layout.

- [ ] **Step 7: Verify responsive layout at 390px**

Render `http://localhost:3000/block-thumbnail-previews/cta39` through local Chrome at a 390×844 viewport, replacing the fixed thumbnail stage width with 390px for this temporary inspection only. Confirm that the two buttons remain readable, do not overflow, and preserve their distinct treatments after the split layout stacks.

- [ ] **Step 8: Run static and integration verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/components/ui/button.tsx src/blocks/shared/contentActionsFields.ts src/lib/cmsLinks.ts src/block-thumbnails/fixtures.tsx tests/int/button-primary-variant.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/button-primary-variant.int.spec.tsx tests/int/content-action-presentation.int.spec.tsx tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts --reporter=dot
pnpm test:int
```

Expected:

- TypeScript exits 0.
- ESLint exits 0.
- Focused button, action, and thumbnail tests pass.
- The integration suite passes. Database-backed suites that cannot bind a port in the sandbox must be rerun with local-port permission and pass.

- [ ] **Step 9: Review the final diff and commit generated artifacts**

Run:

```bash
git diff --check
git status --short
```

Confirm that only `tests/int/button-primary-variant.int.spec.tsx`, `src/payload-types.ts`, `src/block-thumbnails/fixtures.tsx`, and `public/block-thumbnails/cta-39.jpg` remain after Task 1's commit.

Commit:

```bash
git add tests/int/button-primary-variant.int.spec.tsx src/payload-types.ts src/block-thumbnails/fixtures.tsx public/block-thumbnails/cta-39.jpg
git commit -m "test(button): cover white variants"
```

---

### Task 3: Use the theme brand foreground in White Filled

**Files:**

- Modify: `tests/int/button-primary-variant.int.spec.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/blocks/Services21/Component.tsx`
- Modify: `public/block-thumbnails/cta-39.jpg`

**Interfaces:**

- Consumes: the existing `white` and `whiteOutline` variants and the theme tokens `primary` and `primary-foreground`.
- Produces: a fixed-white filled button whose label and any `currentColor` icon use the theme's dark brand foreground in both color modes.

- [ ] **Step 1: Change the shared renderer test to require branded foreground tokens**

In `tests/int/button-primary-variant.int.spec.tsx`, replace the White Filled class assertion:

```tsx
expect(filled).toContain(
  'border-white bg-white text-primary hover:bg-white/90 focus-visible:border-white focus-visible:ring-white/30 dark:text-primary-foreground',
)
expect(filled).not.toContain('text-black')
```

Add an icon-inheritance assertion using the production content renderer:

```tsx
const withIcon = renderToStaticMarkup(
  <Button variant="white">
    <ActionButtonContent label="Continue" showArrow />
  </Button>,
)

expect(withIcon).toContain('data-action-arrow="true"')
expect(withIcon).toContain('text-primary')
expect(withIcon).toContain('dark:text-primary-foreground')
expect(withIcon).not.toMatch(/data-action-arrow="true"[^>]*class="[^"]*text-/)
```

Import the production icon wrapper at the top of the test:

```tsx
import { ActionButtonContent } from '@/components/ActionButtonContent'
```

Keep the existing White Outline assertions unchanged:

```tsx
expect(outline).toContain('border-white bg-transparent text-white')
```

- [ ] **Step 2: Add a regression test for the Services21 decorated-button path**

Import the block component:

```tsx
import { Services21BlockComponent } from '@/blocks/Services21/Component'
```

Add this test:

```tsx
it('uses the branded white-filled foreground in decorated service actions', () => {
  const html = renderToStaticMarkup(
    <Services21BlockComponent
      actions={[
        {
          label: 'Explore services',
          linkType: 'custom',
          mode: 'button',
          showArrow: true,
          url: '/services',
          variant: 'white',
        },
      ]}
      services={[
        {
          image: { alt: 'Clinical service', url: '/media/clinical-service.jpg' },
          title: 'Clinical service',
        },
      ]}
      title="Services"
    />,
  )

  expect(html).toContain('data-variant="white"')
  expect(html).toContain('text-primary')
  expect(html).toContain('dark:text-primary-foreground')
  expect(html).not.toContain('text-black')
  expect(html).toContain('data-action-arrow="true"')
})
```

- [ ] **Step 3: Run the focused test and verify the red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/button-primary-variant.int.spec.tsx --reporter=dot
```

Expected: FAIL because White Filled still emits `text-black` in both the canonical button and the Services21 decorated-button mapping.

- [ ] **Step 4: Replace the canonical White Filled foreground**

In `src/components/ui/button.tsx`, replace only the `white` variant value:

```ts
white:
  'border-white bg-white text-primary hover:bg-white/90 focus-visible:border-white focus-visible:ring-white/30 dark:text-primary-foreground',
```

Do not modify `whiteOutline`; its text and icons remain fixed white.

- [ ] **Step 5: Keep the Services21 override aligned with the canonical variant**

In `src/blocks/Services21/Component.tsx`, replace only `buttonClassNameByVariant.white`:

```ts
white:
  'border-white bg-white text-primary hover:bg-white/90 focus-visible:border-white focus-visible:ring-white/30 dark:text-primary-foreground',
```

This local mapping is required because Services21 deliberately supplies custom classes to `BorderButton`. Do not add icon-specific classes; its corner art and action arrow both inherit `currentColor`.

- [ ] **Step 6: Format and run focused verification**

Run:

```bash
pnpm exec prettier --write src/components/ui/button.tsx src/blocks/Services21/Component.tsx tests/int/button-primary-variant.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/components/ui/button.tsx src/blocks/Services21/Component.tsx tests/int/button-primary-variant.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/button-primary-variant.int.spec.tsx tests/int/content-action-presentation.int.spec.tsx --reporter=dot
```

Expected: TypeScript and ESLint exit 0, and both focused test files pass.

- [ ] **Step 7: Regenerate and inspect the CTA visual fixture**

Run:

```bash
BLOCK_THUMBNAIL_BASE_URL=http://localhost:3000 BLOCK_THUMBNAIL_SLUG=cta39 pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/cta-39.jpg` shows a white filled button with the active theme's brand-colored text and a White Outline button with white text. Inspect the 1600×900 JPEG and a temporary 390×844 render; labels and icons must remain readable without overflow.

- [ ] **Step 8: Verify cross-theme contrast**

Use local Chrome to read `--primary` in light mode and `--primary-foreground` in dark mode for Default, Blue, Kodama, SNMIH, and Sunset. Convert each computed color to sRGB and calculate WCAG contrast against white.

Expected minimum results from the approved design audit:

```text
Default light: 4.95:1
Default dark: 19.80:1
Blue light: 6.83:1
Blue dark: 19.76:1
Kodama light: 8.00:1
Kodama dark: 19.81:1
SNMIH light: 14.29:1
SNMIH dark: 14.29:1
Sunset light: 5.88:1
Sunset dark: 15.67:1
```

Every value must remain at or above WCAG AA's 4.5:1 requirement for button labels.

- [ ] **Step 9: Run the complete integration suite**

Run:

```bash
pnpm test:int
```

Expected: all integration tests pass. If MongoDB-backed suites cannot bind a local port in the sandbox, rerun the complete command with local-port permission.

- [ ] **Step 10: Review and commit the foreground refinement**

Run:

```bash
git diff --check
git status --short
```

Confirm that only these files changed:

```text
src/components/ui/button.tsx
src/blocks/Services21/Component.tsx
tests/int/button-primary-variant.int.spec.tsx
public/block-thumbnails/cta-39.jpg
```

Commit:

```bash
git add src/components/ui/button.tsx src/blocks/Services21/Component.tsx tests/int/button-primary-variant.int.spec.tsx public/block-thumbnails/cta-39.jpg
git commit -m "fix(button): use branded white foreground"
```
