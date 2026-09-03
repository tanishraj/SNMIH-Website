# Hero Motion Control Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Announcement controls visually consistent and make the Hero Carousel Pause/Play control optional, exactly centered, interaction-revealed, and capable of locking all slide movement.

**Architecture:** Keep `useControllableMotion` as the source of automatic-motion and persistent-pause state. Add a native Payload checkbox that is passed through the existing server adapter to the Hero client, extend the shared Carousel with an explicit keyboard-navigation gate, and let the Hero use persistent pause to disable drag, keyboard, arrow, and dot navigation without disabling links or calls to action.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/Radix UI primitives, Embla Carousel 8.6, Vitest, Testing Library.

## Global Constraints

- Keep this a one-client-per-deployment starter; do not introduce tenant-aware configuration.
- `showPauseControl` is a native Payload checkbox labelled `Show Pause / Play Control` with `defaultValue: false`.
- Missing `showPauseControl` values resolve to false; do not add a data migration or backfill.
- The Hero control renders only when the field is true, reduced motion is inactive, and either multi-slide autoplay or background video provides meaningful motion.
- Place the Hero control at the exact horizontal and vertical center of the carousel viewport.
- Reveal the control on Hero hover and focus-within; keep it visible on no-hover/touch devices.
- Explicit Pause locks autoplay, video, drag, Arrow-key navigation, arrow buttons, and dot buttons; temporary hover/focus pause does not lock manual navigation.
- Explicit Pause must not disable Hero links or calls to action.
- Announcement Pause/Play and Dismiss targets must both be 44×44 with 16×16 Lucide icons.
- Reduced motion remains the highest-priority policy and hides the redundant Hero Pause/Play control.
- Use native disabled semantics for locked arrow and dot buttons and preserve their layout positions.
- Do not regenerate the Admin import map: the schema addition uses a native checkbox and adds no custom Admin component.
- Do not regenerate block thumbnails: the block-picker artwork and fixture output are unchanged.

---

## File Map

- `src/components/announcement/AnnouncementBar.tsx` — makes Dismiss match the shared 44×44 motion target.
- `src/blocks/HeroCarousel/config.ts` — defines the editor-facing `showPauseControl` checkbox.
- `src/blocks/HeroCarousel/Component.tsx` — resolves missing values to false and passes the option to the client boundary.
- `src/blocks/HeroCarousel/HeroCarouselClient.tsx` — gates, positions, reveals, and applies the explicit navigation lock.
- `src/components/ui/carousel.tsx` — exposes an explicit `keyboardNavigation` switch while preserving true as the shared default.
- `src/payload-types.ts` — generated schema contract containing `showPauseControl` and its select type.
- `tests/int/announcement-controls.int.spec.tsx` — verifies matched Announcement control dimensions and icon dimensions.
- `tests/int/carousel-blocks.int.spec.tsx` — verifies the Payload field and server-adapter fallback/passthrough.
- `tests/int/carousel-keyboard-navigation.int.spec.tsx` — verifies the shared Carousel keyboard gate independently.
- `tests/int/hero-carousel-motion.int.spec.tsx` — verifies field gating, centered disclosure, and complete explicit-pause locking.
- `.agents/skills/project-context/references/block-system.md` — records the refined editor and visitor motion contract.

### Task 1: Match Announcement Pause And Dismiss Controls

**Files:**
- Create: `tests/int/announcement-controls.int.spec.tsx`
- Modify: `src/components/announcement/AnnouncementBar.tsx:145-158`

**Interfaces:**
- Consumes: `MotionToggle`, whose established class contract includes `size-11` and whose default Lucide icon size is 16px.
- Produces: a Dismiss button with the same `size-11` target and default 16px Lucide icon.

- [ ] **Step 1: Write the failing control-parity test**

Create `tests/int/announcement-controls.int.spec.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnnouncementBar } from '@/components/announcement/AnnouncementBar'

describe('AnnouncementBar controls', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        removeEventListener: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    cleanup()
    window.sessionStorage.clear()
    vi.unstubAllGlobals()
  })

  it('gives Pause and Dismiss matching 44px targets and 16px icons', () => {
    render(
      <AnnouncementBar
        dismissible
        items={[{ description: 'First' }, { description: 'Second' }]}
      />,
    )

    const pause = screen.getByRole('button', { name: 'Pause announcements' })
    const dismiss = screen.getByRole('button', { name: 'Dismiss announcement' })

    expect(pause.className).toContain('size-11')
    expect(dismiss.className).toContain('size-11')
    expect(pause.querySelector('svg')?.classList.contains('lucide-pause')).toBe(true)
    expect(dismiss.querySelector('svg')?.classList.contains('lucide-x')).toBe(true)
    expect(pause.querySelector('svg')?.className.baseVal).not.toContain('size-')
    expect(dismiss.querySelector('svg')?.className.baseVal).not.toContain('size-')
  })
})
```

- [ ] **Step 2: Run the test and verify the mismatch**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/announcement-controls.int.spec.tsx
```

Expected: FAIL because Dismiss has `size-8` from `size="icon-sm"` and does not contain `size-11`.

- [ ] **Step 3: Increase the Dismiss target without changing bar layout**

In `src/components/announcement/AnnouncementBar.tsx`, keep the existing ghost styling and replace the Dismiss size contract:

```tsx
<Button
  aria-label="Dismiss announcement"
  className="size-11 rounded-lg text-current/90 hover:bg-current/10 hover:text-current"
  onClick={handleDismiss}
  size="icon-lg"
  type="button"
  variant="ghost"
>
  <X aria-hidden="true" />
</Button>
```

`size-11` deliberately overrides the shared `icon-lg` 40px dimensions while retaining the shared icon-button semantics and 16px default SVG rule.

- [ ] **Step 4: Run Announcement regression tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/announcement-controls.int.spec.tsx tests/int/global-announcement.int.spec.ts tests/int/rotating-announcement.int.spec.ts tests/int/marquee-announcement.int.spec.ts
```

Expected: all four files PASS.

- [ ] **Step 5: Commit the matched Announcement controls**

```bash
git add src/components/announcement/AnnouncementBar.tsx tests/int/announcement-controls.int.spec.tsx
git commit -m "fix(a11y): match announcement controls"
```

### Task 2: Add And Thread The Hero Admin Option

**Files:**
- Modify: `tests/int/carousel-blocks.int.spec.tsx`
- Modify: `tests/int/hero-carousel-motion.int.spec.tsx`
- Modify: `src/blocks/HeroCarousel/config.ts:198-222`
- Modify: `src/blocks/HeroCarousel/Component.tsx:76-132`
- Modify: `src/blocks/HeroCarousel/HeroCarouselClient.tsx:39-92,166-170,358-366`
- Modify (generated): `src/payload-types.ts`

**Interfaces:**
- Consumes: Payload `CheckboxField`; existing Hero server/client boundary; `ControllableMotionState.showMotionControl`.
- Produces: `showPauseControl?: boolean | null` in generated Payload data and `showPauseControl?: boolean` in `HeroCarouselClientProps`, with an effective runtime default of false.

- [ ] **Step 1: Write failing schema and adapter tests**

Extend the `TestField` type in `tests/int/carousel-blocks.int.spec.tsx` so the description can be inspected:

```ts
type TestField = {
  admin?: { description?: string }
  defaultValue?: unknown
  fields?: TestField[]
  label?: string
  maxRows?: number
  minRows?: number
  name?: string
  options?: Array<{ value: string }>
  relationTo?: string
  required?: boolean
  type?: string
}
```

Add this assertion after the existing `autoplay` assertion:

```ts
expect(getField(layoutTab.fields, 'showPauseControl')).toMatchObject({
  admin: {
    description:
      'Shows a centered Pause / Play control on hover or focus and on touch devices. Pause freezes autoplay, background video, and slide navigation.',
  },
  defaultValue: false,
  label: 'Show Pause / Play Control',
  type: 'checkbox',
})
```

Add a server-adapter source contract after the legacy alignment test. Source inspection is used here
because the shared reduced-motion hook intentionally renders server markup in its static state:

```ts
it('keeps the Hero Pause / Play control hidden unless editors enable it', () => {
  const source = readFileSync('src/blocks/HeroCarousel/Component.tsx', 'utf8')

  expect(source).toContain('showPauseControl?: boolean | null')
  expect(source).toContain('showPauseControl = false')
  expect(source).toContain('showPauseControl={showPauseControl ?? false}')
})
```

In `tests/int/hero-carousel-motion.int.spec.tsx`, add `showPauseControl` to every render that currently expects a Hero Pause/Play button. Add one new default-off test:

```tsx
it('hides the visitor control when the CMS option is absent', () => {
  render(<HeroCarouselClient autoplay slides={imageSlides} />)

  expect(screen.queryByRole('button', { name: /hero motion/i })).toBeNull()
})
```

Also pass `showPauseControl` to the reduced-motion test so it proves the browser preference suppresses
an editor-enabled control rather than merely exercising the default-off field.

- [ ] **Step 2: Run the focused tests and verify the missing contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/carousel-blocks.int.spec.tsx tests/int/hero-carousel-motion.int.spec.tsx
```

Expected: FAIL because the schema, server adapter, and client prop do not define `showPauseControl`.

- [ ] **Step 3: Add the native Payload checkbox**

In `src/blocks/HeroCarousel/config.ts`, insert this field immediately after `autoplay`:

```ts
{
  name: 'showPauseControl',
  label: 'Show Pause / Play Control',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    description:
      'Shows a centered Pause / Play control on hover or focus and on touch devices. Pause freezes autoplay, background video, and slide navigation.',
  },
} satisfies CheckboxField,
```

- [ ] **Step 4: Thread the field through the existing component boundary**

In `src/blocks/HeroCarousel/Component.tsx`, insert the nullable field beside `showArrows` and
`showDots`:

```ts
showPauseControl?: boolean | null
```

Insert the legacy-safe default between `showDots = true` and the closing destructuring brace:

```ts
showDots = true,
showPauseControl = false,
}: HeroCarouselBlockLike) {
```

Insert this prop beside the existing `showArrows` and `showDots` client props:

```tsx
showPauseControl={showPauseControl ?? false}
```

In `src/blocks/HeroCarousel/HeroCarouselClient.tsx`, insert the client prop beside `showArrows` and
`showDots`:

```ts
showPauseControl?: boolean
```

Insert its default between `showDots = true` and `slides`:

```ts
showDots = true,
showPauseControl = false,
slides,
```

Gate the existing Hero control without changing its placement yet:

```ts
const showHeroMotionControl = showPauseControl && motionState.showMotionControl
const showLowerControls = showDotControls || showHeroMotionControl
```

Replace both existing Hero checks of `motionState.showMotionControl` in the lower control zone with `showHeroMotionControl`.

- [ ] **Step 5: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: exit 0. Confirm both generated shapes contain the field:

```bash
rg -n "showPauseControl" src/payload-types.ts
```

Expected: matches in `HeroCarouselBlock` and `HeroCarouselBlockSelect`.

- [ ] **Step 6: Run schema, renderer, and Hero motion tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/carousel-blocks.int.spec.tsx tests/int/hero-carousel-motion.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/page-blocks.int.spec.ts
```

Expected: all four files PASS, including existing production/live-preview parity.

- [ ] **Step 7: Commit the editor option and generated contract**

```bash
git add src/blocks/HeroCarousel/config.ts src/blocks/HeroCarousel/Component.tsx src/blocks/HeroCarousel/HeroCarouselClient.tsx src/payload-types.ts tests/int/carousel-blocks.int.spec.tsx tests/int/hero-carousel-motion.int.spec.tsx
git commit -m "feat(hero): add optional pause control"
```

### Task 3: Add An Explicit Carousel Keyboard Gate

**Files:**
- Create: `tests/int/carousel-keyboard-navigation.int.spec.tsx`
- Modify: `src/components/ui/carousel.tsx:14-21,43-87`

**Interfaces:**
- Consumes: existing `Carousel` props and internal ArrowLeft/ArrowRight handler.
- Produces: `keyboardNavigation?: boolean`, defaulting to true, which suppresses only the shared Arrow-key selection handler when false.

- [ ] **Step 1: Write the failing shared Carousel test**

Create `tests/int/carousel-keyboard-navigation.int.spec.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const emblaHarness = vi.hoisted(() => {
  const api = {
    canScrollNext: vi.fn(() => true),
    canScrollPrev: vi.fn(() => true),
    off: vi.fn(),
    on: vi.fn(() => api),
    scrollNext: vi.fn(),
    scrollPrev: vi.fn(),
  }
  const carouselRef = vi.fn()

  return { api, carouselRef }
})

vi.mock('embla-carousel-react', () => ({
  default: vi.fn(() => [emblaHarness.carouselRef, emblaHarness.api]),
}))

import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'

describe('Carousel keyboard navigation', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('keeps Arrow navigation on by default and can explicitly disable it', () => {
    const view = render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>One</CarouselItem>
          <CarouselItem>Two</CarouselItem>
        </CarouselContent>
      </Carousel>,
    )

    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowRight' })
    expect(emblaHarness.api.scrollNext).toHaveBeenCalledTimes(1)

    view.rerender(
      <Carousel keyboardNavigation={false}>
        <CarouselContent>
          <CarouselItem>One</CarouselItem>
          <CarouselItem>Two</CarouselItem>
        </CarouselContent>
      </Carousel>,
    )

    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowLeft' })
    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowRight' })

    expect(emblaHarness.api.scrollPrev).not.toHaveBeenCalled()
    expect(emblaHarness.api.scrollNext).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the test and verify the prop is missing**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/carousel-keyboard-navigation.int.spec.tsx
```

Expected: FAIL because ArrowLeft and ArrowRight still call the Embla API after
`keyboardNavigation={false}`.

- [ ] **Step 3: Add the opt-out while preserving the default**

In `src/components/ui/carousel.tsx`, extend the local prop contract and destructuring:

```ts
type CarouselProps = {
  keyboardNavigation?: boolean
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: 'horizontal' | 'vertical'
  setApi?: (api: CarouselApi) => void
}

function Carousel({
  keyboardNavigation = true,
  orientation = 'horizontal',
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & CarouselProps) {
```

Guard the existing handler and include the new dependency:

```ts
const handleKeyDown = React.useCallback(
  (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!keyboardNavigation) return

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollPrev()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollNext()
    }
  },
  [keyboardNavigation, scrollPrev, scrollNext],
)
```

Do not place `keyboardNavigation` in context or forward it to the DOM.

- [ ] **Step 4: Run the focused test and TypeScript**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/carousel-keyboard-navigation.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit the shared keyboard gate**

```bash
git add src/components/ui/carousel.tsx tests/int/carousel-keyboard-navigation.int.spec.tsx
git commit -m "feat(carousel): allow keyboard lock"
```

### Task 4: Center, Reveal, And Lock The Hero Control

**Files:**
- Modify: `tests/int/hero-carousel-motion.int.spec.tsx`
- Modify: `src/blocks/HeroCarousel/HeroCarouselClient.tsx:88-374`

**Interfaces:**
- Consumes: `showPauseControl?: boolean`; `ControllableMotionState.isUserPaused`; `Carousel.keyboardNavigation?: boolean`; Embla `watchDrag` option.
- Produces: `showHeroMotionControl: boolean`, a centered disclosure overlay, and a complete manual-navigation lock tied only to explicit Pause.

- [ ] **Step 1: Expose Carousel lock inputs in the Hero test harness**

Update the mocked `Carousel` signature in `tests/int/hero-carousel-motion.int.spec.tsx`:

```tsx
Carousel: ({
  children,
  keyboardNavigation,
  opts,
  plugins: _plugins,
  setApi,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  keyboardNavigation?: boolean
  opts?: { loop?: boolean; watchDrag?: boolean }
  plugins?: unknown
  setApi?: (api: typeof carouselHarness.api) => void
}) => {
  React.useEffect(() => {
    setApi?.(carouselHarness.api)
  }, [setApi])

  return React.createElement(
    'div',
    {
      ...props,
      'data-keyboard-navigation': String(keyboardNavigation),
      'data-watch-drag': String(opts?.watchDrag),
    },
    children,
  )
},
```

- [ ] **Step 2: Write failing centered-disclosure and lock tests**

Add these tests to `tests/int/hero-carousel-motion.int.spec.tsx`:

```tsx
it('centers the configured control and exposes hover, focus, and touch disclosure classes', () => {
  render(<HeroCarouselClient autoplay showPauseControl slides={imageSlides} />)

  const overlay = screen.getByTestId('hero-motion-control-overlay')
  const button = screen.getByRole('button', { name: 'Pause hero motion' })

  expect(overlay.className).toContain('absolute inset-0')
  expect(overlay.className).toContain('items-center justify-center')
  expect(overlay.className).toContain('pointer-events-none')
  expect(button.className).toContain('pointer-events-auto')
  expect(button.className).toContain('opacity-0')
  expect(button.className).toContain('group-hover/hero:opacity-100')
  expect(button.className).toContain('group-focus-within/hero:opacity-100')
  expect(button.className).toContain('[@media(hover:none)]:opacity-100')
})

it('locks every slide-selection input only after explicit Pause', async () => {
  render(<HeroCarouselClient autoplay showPauseControl slides={imageSlides} />)

  const hero = screen.getByTestId('hero-carousel')
  const previous = screen.getByRole('button', { name: 'Previous slide' })
  const next = screen.getByRole('button', { name: 'Next slide' })
  const firstDot = screen.getByRole('button', { name: 'Go to slide 1' })

  expect(hero.getAttribute('data-keyboard-navigation')).toBe('true')
  expect(hero.getAttribute('data-watch-drag')).toBe('true')
  expect((previous as HTMLButtonElement).disabled).toBe(false)
  expect((next as HTMLButtonElement).disabled).toBe(false)
  expect((firstDot as HTMLButtonElement).disabled).toBe(false)

  fireEvent.pointerEnter(hero)
  fireEvent.click(next)
  expect(carouselHarness.api.scrollNext).toHaveBeenCalledTimes(1)

  fireEvent.click(screen.getByRole('button', { name: 'Pause hero motion' }))

  expect(hero.getAttribute('data-keyboard-navigation')).toBe('false')
  expect(hero.getAttribute('data-watch-drag')).toBe('false')
  expect((previous as HTMLButtonElement).disabled).toBe(true)
  expect((next as HTMLButtonElement).disabled).toBe(true)
  expect((firstDot as HTMLButtonElement).disabled).toBe(true)

  fireEvent.click(next)
  fireEvent.click(firstDot)
  expect(carouselHarness.api.scrollNext).toHaveBeenCalledTimes(1)
  expect(carouselHarness.api.scrollTo).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: 'Play hero motion' }))

  expect(hero.getAttribute('data-keyboard-navigation')).toBe('true')
  expect(hero.getAttribute('data-watch-drag')).toBe('true')
  expect((next as HTMLButtonElement).disabled).toBe(false)
  expect((firstDot as HTMLButtonElement).disabled).toBe(false)
})
```

Retain the existing reduced-motion, video rejection, selected-video, cleanup, and pointer/focus independence tests. Ensure every test that expects the Hero control passes `showPauseControl`.

- [ ] **Step 3: Run the Hero test and verify the new behavior fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/hero-carousel-motion.int.spec.tsx
```

Expected: FAIL because the control remains in the lower-right grid and navigation remains enabled after Pause.

- [ ] **Step 4: Derive the explicit lock and pass it to Embla and Carousel**

In `src/blocks/HeroCarousel/HeroCarouselClient.tsx`, derive the two distinct states:

```ts
const showHeroMotionControl = showPauseControl && motionState.showMotionControl
const isNavigationLocked = motionState.isUserPaused
```

Update the root Carousel so the group owns disclosure and explicit Pause controls drag and keyboard navigation:

```tsx
<Carousel
  className={cn('group/hero overflow-hidden', overlay.text.title)}
  data-testid="hero-carousel"
  keyboardNavigation={!isNavigationLocked}
  opts={{ loop: slides.length > 1, watchDrag: !isNavigationLocked }}
  plugins={plugins}
  setApi={setApi}
  {...motionState.interactionProps}
>
```

`watchDrag` must depend only on `isUserPaused`, not `isMotionAllowed`, so hover/focus and reduced-motion visitors retain manual navigation.

- [ ] **Step 5: Disable configured arrow and dot controls without removing them**

Add the native disabled property to both arrow buttons:

```tsx
disabled={isNavigationLocked}
```

Add it to each dot button:

```tsx
disabled={isNavigationLocked}
```

Keep the existing click handlers, labels, `aria-current`, and render conditions. Native disabled behavior prevents the handlers from firing and preserves layout.

- [ ] **Step 6: Separate the lower dot rail from the centered motion overlay**

Make the lower-zone condition depend only on dots:

```ts
const showDotControls = showDots && slides.length > 1
```

Render the existing bottom grid only when `showDotControls` is true, remove its empty first and final columns, and center the dot list directly:

```tsx
{showDotControls ? (
  <div
    className={cn(
      'absolute inset-x-0 bottom-8 flex items-center justify-center gap-3 px-4 md:px-8 lg:px-12',
      overlay.text.title,
    )}
  >
    {scrollSnaps.map((_, index) => (
      <button
        aria-current={selectedIndex === index ? 'true' : undefined}
        aria-label={`Go to slide ${index + 1}`}
        className={cn(
          'size-2.5 rounded-md border border-current transition-colors',
          selectedIndex === index ? 'bg-current' : 'bg-transparent',
        )}
        disabled={isNavigationLocked}
        key={index}
        onClick={() => api?.scrollTo(index)}
        type="button"
      />
    ))}
  </div>
) : null}
```

Add the centered carousel-level overlay as a sibling after the lower dots:

```tsx
{showHeroMotionControl ? (
  <div
    className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
    data-testid="hero-motion-control-overlay"
  >
    <MotionToggle
      className="pointer-events-auto opacity-0 transition-opacity duration-200 group-hover/hero:opacity-100 group-focus-within/hero:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100"
      contextLabel="hero motion"
      isPaused={motionState.isUserPaused}
      onToggle={motionState.toggleUserPaused}
      variant="secondary"
    />
  </div>
) : null}
```

- [ ] **Step 7: Run focused behavior and renderer tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/hero-carousel-motion.int.spec.tsx tests/int/carousel-keyboard-navigation.int.spec.tsx tests/int/carousel-blocks.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/page-blocks.int.spec.ts
```

Expected: all five files PASS.

- [ ] **Step 8: Run TypeScript and lint for the interaction change**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: TypeScript exits 0; lint exits 0 with no new warnings attributable to these files.

- [ ] **Step 9: Commit the centered lock behavior**

```bash
git add src/blocks/HeroCarousel/HeroCarouselClient.tsx tests/int/hero-carousel-motion.int.spec.tsx
git commit -m "fix(hero): center and lock pause control"
```

### Task 5: Update The Maintained Contract And Verify The Tranche

**Files:**
- Modify: `.agents/skills/project-context/references/block-system.md:54-66`
- Potential generated update: `.agents/skills/project-context/references/project-inventory.json` only if `pnpm project-context:update` reports factual changes.

**Interfaces:**
- Consumes: the completed Hero schema and runtime behavior from Tasks 2–4.
- Produces: current project knowledge and a release-ready verified change set.

- [ ] **Step 1: Update the Automatic Motion narrative**

Replace the Hero portion of `.agents/skills/project-context/references/block-system.md` with this current contract:

```md
Hero slide advancement follows its Autoplay setting, while background video remains an independent
motion source. Editors may enable a centered Pause/Play control; the option defaults off and missing
legacy values remain off. When meaningful motion exists, the control appears on Hero hover or
focus-within and remains available on no-hover touch devices. Reduced motion hides the redundant
control and leaves automatic motion stopped. Explicit Pause stops autoplay and video and locks drag,
Arrow-key, arrow-button, and dot-button slide selection without disabling Hero links or actions;
temporary hover/focus pauses automatic motion without locking manual navigation. Only the active
video may play.

Announcement Pause/Play remains visible whenever multiple items can move, and its 44×44 target now
matches the adjacent Dismiss control. Multiple rotating announcements stop their replacement timer
whenever motion is disallowed. Multiple marquee announcements use duplicated visual tracks only
while motion is available; reduced motion and single-item marquees render one static wrapping track.
Zero- and single-item announcements never render a motion control.
```

- [ ] **Step 2: Refresh generated project knowledge**

Run:

```bash
pnpm project-context:update
git status --short
```

Expected: update exits 0. If `project-inventory.json` changes, inspect it and retain only accurate generated changes caused by this tranche; a no-op inventory update is valid.

- [ ] **Step 3: Run the complete integration suite**

```bash
pnpm test:int
```

Expected: all integration files PASS.

- [ ] **Step 4: Re-run generated types, static checks, and production build**

```bash
pnpm generate:types
git diff --exit-code -- src/payload-types.ts
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Expected: generated types have no unstaged drift; TypeScript and build exit 0; lint reports no new warnings attributable to changed files.

- [ ] **Step 5: Complete the project-context check and final diff audit**

```bash
pnpm project-context:check
git diff --check
git status --short
git diff --stat HEAD
```

Expected: project context is current; a stale knowledge-graph notice is acceptable only when reported as the repository's documented warning; whitespace check exits 0; the status contains only intended Task 5 documentation/generated-context changes.

- [ ] **Step 6: Perform browser verification when a browser is available**

Verify a Hero with `Show Pause / Play Control` off, then on, using image and video slides:

1. At rest on a hover-capable viewport, the enabled control is visually hidden.
2. Hover or keyboard focus reveals it at the exact viewport center.
3. Pause freezes autoplay/video and prevents drag, Arrow keys, arrow clicks, and dot clicks.
4. Hero links and calls to action remain operable while paused.
5. Play restores configured navigation without first changing the selected slide.
6. A touch/no-hover viewport keeps the enabled control visible.
7. Reduced motion stops automatic motion and hides the control.
8. Announcement Pause and Dismiss controls have matching targets and icon scale.

If the browser runtime is unavailable, record that limitation and rely on the focused interaction tests, TypeScript, full integration suite, and build rather than claiming visual verification.

- [ ] **Step 7: Commit maintained project knowledge**

```bash
git add .agents/skills/project-context/references/block-system.md
git add .agents/skills/project-context/references/project-inventory.json
git commit -m "docs(a11y): update hero motion contract"
```

If `project-inventory.json` did not change, omit its `git add` command. Do not stage unrelated working-tree files.
