# Unified Motion Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every persistent hero and announcement motion surface the same reduced-motion, interaction-pause, and visible Pause/Play contract.

**Architecture:** Add one client-only motion policy hook and one semantic toggle component under `src/components/motion`. Each existing motion consumer remains responsible for its own timer, Embla controller, video refs, and layout, while consuming the same derived state and interaction handlers. Tests establish the shared precedence first, then cover each consumer independently before the maintained project context and full verification pass.

**Tech Stack:** React 19, TypeScript, Next.js 16 client components, Embla Carousel Autoplay, Framer Motion, Tailwind CSS 4, Lucide React, Vitest, Testing Library.

## Global Constraints

- Reduced motion has highest precedence and Play cannot override it.
- Explicit Pause persists until the component instance unmounts; hover and focus pauses are temporary and independent.
- Pause/Play controls use native buttons, Lucide icons, semantic theme tokens, context-specific accessible action labels, and a minimum 44×44 target.
- Hero manual arrows and dots remain usable in every motion state.
- A single hero video is controllable even when slide advancement is unavailable or disabled.
- Reduced-motion marquee output is one static, wrapping, non-duplicated track.
- Zero- and single-item announcements render no timer or motion control.
- No Payload fields, defaults, stored documents, editor settings, block registries, or generated Payload types change.
- Motion state is component-local and does not persist across navigation.
- The project remains one client per deployment.

---

### Task 1: Shared Motion Policy And Toggle

**Files:**

- Create: `src/components/motion/useControllableMotion.ts`
- Create: `src/components/motion/MotionToggle.tsx`
- Create: `tests/int/controllable-motion.int.spec.tsx`

**Interfaces:**

- Produces: `useControllableMotion({ enabled: boolean }): ControllableMotionState`.
- Produces: `ControllableMotionState` fields `isMotionAllowed`, `isUserPaused`, `prefersReducedMotion`, `showMotionControl`, `toggleUserPaused`, and `interactionProps`.
- Produces: `MotionToggle({ contextLabel, isPaused, onToggle, className?, variant? })` with `variant` restricted to `ghost | secondary`.
- Consumes: React `useCallback`, `useState`, and `useSyncExternalStore`; the shared `Button`; Lucide `Pause` and `Play`.

- [ ] **Step 1: Write the failing shared-policy tests**

Create a small test harness that exposes the hook state and spreads its interaction handlers over one region:

```tsx
function MotionHarness({ enabled = true }: { enabled?: boolean }) {
  const motion = useControllableMotion({ enabled })

  return (
    <div data-testid="motion-region" {...motion.interactionProps}>
      <output data-testid="motion-allowed">{String(motion.isMotionAllowed)}</output>
      <output data-testid="motion-paused">{String(motion.isUserPaused)}</output>
      {motion.showMotionControl ? (
        <MotionToggle
          contextLabel="test motion"
          isPaused={motion.isUserPaused}
          onToggle={motion.toggleUserPaused}
        />
      ) : null}
      <a href="/inside">Inside link</a>
    </div>
  )
}
```

Cover these assertions in `tests/int/controllable-motion.int.spec.tsx`:

```tsx
expect(screen.getByTestId('motion-allowed').textContent).toBe('true')
expect(screen.getByRole('button', { name: 'Pause test motion' })).toBeTruthy()

fireEvent.pointerEnter(screen.getByTestId('motion-region'))
expect(screen.getByTestId('motion-allowed').textContent).toBe('false')
fireEvent.pointerLeave(screen.getByTestId('motion-region'))
expect(screen.getByTestId('motion-allowed').textContent).toBe('true')

fireEvent.focus(screen.getByRole('link', { name: 'Inside link' }))
expect(screen.getByTestId('motion-allowed').textContent).toBe('false')
fireEvent.blur(screen.getByRole('link', { name: 'Inside link' }), { relatedTarget: null })
expect(screen.getByTestId('motion-allowed').textContent).toBe('true')

fireEvent.click(screen.getByRole('button', { name: 'Pause test motion' }))
expect(screen.getByTestId('motion-paused').textContent).toBe('true')
expect(screen.getByRole('button', { name: 'Play test motion' })).toBeTruthy()
expect(screen.getByRole('button').className).toContain('size-11')
```

Mock `window.matchMedia` with a mutable `matches` value and captured change listener. Verify reduced motion hides the control, keeps `isMotionAllowed` false, and reacts to a preference change after mount. Verify `enabled={false}` also hides the control and disallows motion. Add two focusable children and fire blur with the second child as `relatedTarget` to prove focus movement inside the region never resumes motion.
Focus the toggle, select Play while focus remains within the region, and verify motion remains disallowed until focus leaves. Unmount the harness and assert the exact media-query change listener was removed.

- [ ] **Step 2: Run the shared-policy test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/controllable-motion.int.spec.tsx
```

Expected: FAIL because `useControllableMotion` and `MotionToggle` do not exist.

- [ ] **Step 3: Implement the reduced-motion store and motion policy**

Implement the hook around this contract:

```tsx
'use client'

import type { FocusEventHandler, HTMLAttributes } from 'react'
import { useCallback, useState, useSyncExternalStore } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const getServerSnapshot = () => true

type MotionInteractionProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  'onBlurCapture' | 'onFocusCapture' | 'onPointerEnter' | 'onPointerLeave'
>

export type ControllableMotionState = {
  interactionProps: MotionInteractionProps
  isMotionAllowed: boolean
  isUserPaused: boolean
  prefersReducedMotion: boolean
  showMotionControl: boolean
  toggleUserPaused: () => void
}
```

`subscribe` must attach and remove the media query `change` listener. `getSnapshot` returns `true` when the browser API is unavailable so motion never starts before capability is known. Track pointer, focus, and user pause separately. Implement internal focus movement safely:

```tsx
const handleBlurCapture = useCallback<FocusEventHandler<HTMLDivElement>>((event) => {
  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
    setIsFocusPaused(false)
  }
}, [])

const isMotionAllowed =
  enabled && !prefersReducedMotion && !isUserPaused && !isPointerPaused && !isFocusPaused
```

Use stable callbacks and functional state for `toggleUserPaused`. Do not read or write cookies, storage, Payload data, or module-level mutable visitor state.

- [ ] **Step 4: Implement the shared 44×44 toggle**

Create `MotionToggle.tsx` with the exact public shape:

```tsx
'use client'

import { Pause, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type MotionToggleProps = {
  className?: string
  contextLabel: string
  isPaused: boolean
  onToggle: () => void
  variant?: 'ghost' | 'secondary'
}
```

Render `Button` with `type="button"`, `size="icon-lg"`, `className={cn('size-11 touch-manipulation', className)}`, and `aria-label={`${isPaused ? 'Play' : 'Pause'} ${contextLabel}`}`. Render only one Lucide icon for the next action and mark it `aria-hidden="true"`. Do not add tooltip state or a second visible text label.

- [ ] **Step 5: Run the shared-policy test and verify it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/controllable-motion.int.spec.tsx
```

Expected: PASS for policy precedence, focus containment, preference changes, accessible labels, and the 44×44 contract.

- [ ] **Step 6: Commit the shared motion foundation**

```bash
git add src/components/motion/useControllableMotion.ts src/components/motion/MotionToggle.tsx tests/int/controllable-motion.int.spec.tsx
git commit -m "feat(a11y): add controllable motion policy"
```

### Task 2: Rotating Announcement Control

**Files:**

- Modify: `src/components/announcement/RotatingAnnouncementContent.tsx`
- Modify: `tests/int/rotating-announcement.int.spec.ts`

**Interfaces:**

- Consumes: `useControllableMotion({ enabled: items.length > 1 })`.
- Consumes: `MotionToggle` with `contextLabel="announcements"` and `variant="ghost"`.
- Produces: timer and Framer transition behavior governed by `isMotionAllowed` and `prefersReducedMotion`.

- [ ] **Step 1: Extend rotating-announcement tests first**

Replace the Framer-only reduced-motion mock with a `matchMedia` mock compatible with Task 1. Add tests that verify:

```tsx
expect(screen.getByRole('button', { name: 'Pause announcements' })).toBeTruthy()
fireEvent.click(screen.getByRole('button', { name: 'Pause announcements' }))
act(() => vi.advanceTimersByTime(8000))
expect(screen.getByText('First description')).toBeTruthy()
expect(screen.getByRole('button', { name: 'Play announcements' })).toBeTruthy()
```

Focus the current announcement link, advance two intervals, and assert content is stable; blur outside, advance one interval, and assert rotation resumes. Pause by pointer and focus together, release only one, and assert it remains paused. Under reduced motion, advance timers and assert the first item remains rendered, transition duration is `0`, and no Pause/Play control exists. For one item, assert no control and no interval-driven replacement.
Rerender a paused multiple-item rotator with one item and assert the old timer is cleared, the remaining item is stable, and the control disappears.

- [ ] **Step 2: Run the rotating-announcement test and verify the new assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/rotating-announcement.int.spec.ts
```

Expected: FAIL because rotation still ignores reduced motion/focus and has no visible control.

- [ ] **Step 3: Apply the shared policy to the rotator**

Remove local `isPaused` and Framer `useReducedMotion`. Create:

```tsx
const motionState = useControllableMotion({ enabled: items.length > 1 })
const motionDisabled = motionState.prefersReducedMotion
```

Guard the interval with `if (!motionState.isMotionAllowed) return` and depend on `items.length`, `motionState.isMotionAllowed`, and `sanitizedInterval`. Spread `motionState.interactionProps` over a flex wrapper that contains a `min-w-0 flex-1 overflow-hidden` message viewport and the toggle. Render:

```tsx
{
  motionState.showMotionControl ? (
    <MotionToggle
      className="text-current hover:bg-current/10"
      contextLabel="announcements"
      isPaused={motionState.isUserPaused}
      onToggle={motionState.toggleUserPaused}
      variant="ghost"
    />
  ) : null
}
```

Retain `AnimatePresence mode="wait"`, sanitized intervals, horizontal/vertical offsets, current truncation behavior, and external-link handling.

- [ ] **Step 4: Run the rotating-announcement tests and verify they pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/controllable-motion.int.spec.tsx tests/int/rotating-announcement.int.spec.ts
```

Expected: PASS with no timer advancement during reduced motion, pointer pause, focus pause, or explicit pause.

- [ ] **Step 5: Commit rotating announcements**

```bash
git add src/components/announcement/RotatingAnnouncementContent.tsx tests/int/rotating-announcement.int.spec.ts
git commit -m "fix(a11y): control announcement rotation"
```

### Task 3: Marquee Static Fallback And Control

**Files:**

- Modify: `src/components/announcement/MarqueeAnnouncementContent.tsx`
- Modify: `tests/int/marquee-announcement.int.spec.ts`

**Interfaces:**

- Consumes: `useControllableMotion({ enabled: items.length > 1 })`.
- Consumes: `MotionToggle` with `contextLabel="marquee"` and `variant="ghost"`.
- Produces: animated duplicate tracks only for multiple items without reduced motion; otherwise one static primary track.

- [ ] **Step 1: Write marquee behavior tests first**

Add the same mutable `matchMedia` harness used by the shared-policy tests. Preserve the existing multiple-item duplicate-track assertion, then add:

```tsx
expect(screen.getByRole('button', { name: 'Pause marquee' })).toBeTruthy()
fireEvent.click(screen.getByRole('button', { name: 'Pause marquee' }))
expect(screen.getAllByTestId('announcement-marquee-track')[0]?.getAttribute('style')).toContain(
  'animation-play-state: paused',
)
expect(screen.getByRole('button', { name: 'Play marquee' })).toBeTruthy()
```

Verify focus and pointer pauses remain independent. Verify the duplicate track is `aria-hidden="true"` and duplicate links have `tabindex="-1"`. With reduced motion enabled, assert exactly one track, no motion control, no `animate-marquee` class, no `width: max-content` dependency, and wrapping classes. With one item, assert the same static single-track/no-control contract even when reduced motion is false.
Rerender an animated multiple-item marquee with one item and assert duplicate content and the control are both removed without resetting unrelated component state.

- [ ] **Step 2: Run the marquee test and verify the new assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/marquee-announcement.int.spec.ts
```

Expected: FAIL because the current marquee always duplicates and animates, including one-item and reduced-motion states.

- [ ] **Step 3: Implement animated and static marquee branches**

Create `motionState` with `enabled: items.length > 1`. Define:

```tsx
const rendersStaticTrack = items.length === 1 || motionState.prefersReducedMotion
```

The root becomes a flexible motion region with `motionState.interactionProps`. The viewport remains `min-w-0 flex-1 overflow-hidden`. When `rendersStaticTrack` is true, render one `MarqueeTrack` with `animated={false}`, `duplicate={false}`, and wrapping layout. Otherwise render both tracks and pass `isPaused={!motionState.isMotionAllowed}`. Extend `MarqueeTrack` with an `animated: boolean` prop and derive classes:

```tsx
className={cn(
  'items-center gap-4',
  animated
    ? 'flex shrink-0 animate-marquee whitespace-nowrap pr-4'
    : 'flex min-w-0 flex-wrap whitespace-normal',
)}
```

Apply animation duration and play state only to animated tracks. Keep duplicate content hidden from assistive technology and outside the tab order. Render `MotionToggle` only from `showMotionControl` using current-color semantic styles.

- [ ] **Step 4: Run announcement motion tests and verify they pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/controllable-motion.int.spec.tsx tests/int/rotating-announcement.int.spec.ts tests/int/marquee-announcement.int.spec.ts
```

Expected: PASS for static fallbacks, interaction pauses, persistent controls, and duplicate accessibility.

- [ ] **Step 5: Commit marquee accessibility**

```bash
git add src/components/announcement/MarqueeAnnouncementContent.tsx tests/int/marquee-announcement.int.spec.ts
git commit -m "fix(a11y): control announcement marquee"
```

### Task 4: Hero Slide And Video Motion Control

**Files:**

- Modify: `src/blocks/HeroCarousel/HeroCarouselClient.tsx`
- Create: `tests/int/hero-carousel-motion.int.spec.tsx`
- Modify: `tests/int/carousel-blocks.int.spec.tsx`

**Interfaces:**

- Consumes: `useControllableMotion({ enabled: slideAutoplayEnabled || hasBackgroundVideo })`.
- Consumes: `MotionToggle` with `contextLabel="hero motion"` and `variant="secondary"`.
- Produces: one stable Embla Autoplay plugin with `playOnInit: false` and imperative `play()`/`stop()` control.
- Produces: indexed `HTMLVideoElement` refs where only the selected video may play while motion is allowed.

- [ ] **Step 1: Add failing Hero motion behavior tests**

Mock `@/components/ui/carousel` with a lightweight region that exposes a fake `CarouselApi`. The fake API must provide `selectedScrollSnap`, `scrollSnapList`, `on`, `off`, `scrollPrev`, `scrollNext`, `scrollTo`, and `plugins: () => ({ autoplay: { play, stop } })`. Mock `embla-carousel-autoplay` and retain the supplied options for assertions.

Test these contracts:

```tsx
expect(autoplayFactory).toHaveBeenCalledWith({
  delay: 6000,
  playOnInit: false,
  stopOnInteraction: false,
})
expect(autoplayController.play).toHaveBeenCalled()

fireEvent.click(screen.getByRole('button', { name: 'Pause hero motion' }))
expect(autoplayController.stop).toHaveBeenCalled()
expect(screen.getByRole('button', { name: 'Play hero motion' })).toBeTruthy()
```

Verify pointer and focus each stop the controller and resume only after both temporary pauses clear. Verify reduced motion never calls `play` and hides the toggle while previous/next/dot buttons remain available. Verify `showDots={false}` still renders the motion control.

Stub `HTMLMediaElement.prototype.play` and `.pause`. For a single video slide with `autoplay={false}`, assert the motion control is present and the active video plays after preference resolution. Pause explicitly and assert `.pause()` is called. For two video slides, emit a fake selection change and assert the former video pauses before the newly active video plays. Make `play()` reject once and assert rendering remains stable with no unhandled rejection.
Unmount a playing video Hero and assert video pause and Embla stop cleanup both run.

- [ ] **Step 2: Run Hero motion tests and verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/hero-carousel-motion.int.spec.tsx tests/int/carousel-blocks.int.spec.tsx
```

Expected: FAIL because Hero autoplay starts inside the plugin, videos use the `autoPlay` attribute, and no shared motion control exists.

- [ ] **Step 3: Put Embla autoplay under the shared policy**

Derive motion availability:

```tsx
const slideAutoplayEnabled = autoplay && slides.length > 1
const hasBackgroundVideo = slides.some((slide) => Boolean(slide.backgroundVideoUrl))
const motionState = useControllableMotion({
  enabled: slideAutoplayEnabled || hasBackgroundVideo,
})
```

Create a stable plugin with:

```tsx
const autoplayPlugin = useMemo(
  () => Autoplay({ delay: 6000, playOnInit: false, stopOnInteraction: false }),
  [],
)
const plugins = useMemo(
  () => (slideAutoplayEnabled ? [autoplayPlugin] : undefined),
  [autoplayPlugin, slideAutoplayEnabled],
)
```

In an effect, obtain `api?.plugins().autoplay`; call `play()` only when `slideAutoplayEnabled && motionState.isMotionAllowed`, otherwise call `stop()`. Cleanup calls `stop()` so reconfiguration and unmount cannot leave a timer active. Spread `motionState.interactionProps` over the `Carousel` root.

- [ ] **Step 4: Govern videos with active-slide refs**

Remove the `autoPlay` attribute. Add `const videoRefs = useRef<Array<HTMLVideoElement | null>>([])` and attach each video by slide index. In an effect over `selectedIndex`, `slides`, and `motionState.isMotionAllowed`, pause every inactive video. Play only the selected video when motion is allowed:

```tsx
const playResult = video.play()
if (playResult) {
  void playResult.catch(() => undefined)
}
```

Cleanup pauses every current video. Retain `loop`, `muted`, `playsInline`, and source behavior. Do not add sound, timeline controls, poster fields, or editor settings.

- [ ] **Step 5: Build the lower Hero control zone**

Replace the dots-only absolute row with one lower control zone rendered when dots or motion control are available. Use a three-column logical layout so dots remain centered and the toggle sits at the inline end without overlap:

```tsx
<div className="absolute inset-x-0 bottom-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:px-8 lg:px-12">
  <span aria-hidden="true" />
  <div className="flex items-center justify-center gap-3">{dotButtons}</div>
  <div className="justify-self-end">
    <MotionToggle
      contextLabel="hero motion"
      isPaused={motionState.isUserPaused}
      onToggle={motionState.toggleUserPaused}
      variant="secondary"
    />
  </div>
</div>
```

Render each conditional child only when applicable. When dots are disabled, preserve the empty center track and keep the motion toggle at the inline end. Manual arrows and dots retain existing labels and `aria-current` behavior.

- [ ] **Step 6: Run focused Hero and announcement tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/hero-carousel-motion.int.spec.tsx tests/int/carousel-blocks.int.spec.tsx tests/int/controllable-motion.int.spec.tsx tests/int/rotating-announcement.int.spec.ts tests/int/marquee-announcement.int.spec.ts
```

Expected: PASS for Hero plugin lifecycle, video lifecycle, manual controls, all announcement behaviors, and shared policy precedence.

- [ ] **Step 7: Commit Hero motion accessibility**

```bash
git add src/blocks/HeroCarousel/HeroCarouselClient.tsx tests/int/hero-carousel-motion.int.spec.tsx tests/int/carousel-blocks.int.spec.tsx
git commit -m "fix(a11y): control hero motion"
```

### Task 5: Documentation, Project Context, And Release Verification

**Files:**

- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify if generated facts change: `.agents/skills/project-context/references/project-inventory.json`
- Inspect: `.agents/skills/project-context/references/change-impact-map.md`

**Interfaces:**

- Consumes: the completed motion policy and all three consumer contracts.
- Produces: maintained documentation describing the shared visitor-facing automatic-motion behavior.

- [ ] **Step 1: Document the maintained motion contract**

Add a concise `Automatic Motion` subsection to `block-system.md` stating that Hero Carousel, Rotating Announcement, and Marquee Announcement share reduced-motion precedence, persistent component-local Pause/Play, and temporary pointer/focus pauses. Record that single Hero videos remain controllable, reduced-motion videos remain paused, reduced-motion marquees render one static wrapping track, and announcement controls require multiple items. Do not copy the historical design spec into the maintained reference.

- [ ] **Step 2: Run formatting and focused static checks**

Run:

```bash
pnpm exec prettier --check src/components/motion/useControllableMotion.ts src/components/motion/MotionToggle.tsx src/components/announcement/RotatingAnnouncementContent.tsx src/components/announcement/MarqueeAnnouncementContent.tsx src/blocks/HeroCarousel/HeroCarouselClient.tsx tests/int/controllable-motion.int.spec.tsx tests/int/rotating-announcement.int.spec.ts tests/int/marquee-announcement.int.spec.ts tests/int/hero-carousel-motion.int.spec.tsx tests/int/carousel-blocks.int.spec.tsx .agents/skills/project-context/references/block-system.md
pnpm exec tsc --noEmit
pnpm lint
```

Expected: all commands exit `0`. If Prettier reports only formatting differences, run `pnpm exec prettier --write` with the same explicit file list, then rerun the check.

- [ ] **Step 3: Run the complete integration suite**

Run:

```bash
pnpm test:int
```

Expected: all integration test files pass. Any environment-only Mongo binding failure must be reported separately and must not be described as a product pass.

- [ ] **Step 4: Perform bounded browser verification**

Run the existing development server and inspect one Hero Carousel plus both Announcement modes at desktop and mobile widths. In one batched pass verify visible 44×44 controls, no overlap with dots/actions/dismiss controls, keyboard focus pausing, long announcement truncation/wrapping, and reduced-motion static output. Fix all observed defects in one batch and perform at most one confirmation pass. If the in-app browser or local CMS data is unavailable, report the exact limitation and rely on component tests without claiming visual verification.

- [ ] **Step 5: Complete the project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
git diff --check
git status --short
```

Expected: project context reports current, `git diff --check` exits `0`, and only intentional source, tests, maintained documentation, and generated inventory changes remain. A stale knowledge-graph commit hash is a warning unless structural graph facts changed.

- [ ] **Step 6: Review the final diff against the change-impact map**

Confirm all of the following before handoff:

```text
- No Payload schema, config, generated types, or import map changed.
- Hero production and live-preview paths both consume the same client component.
- AnnouncementBar and Announcement block both consume the same announcement components.
- Every automatic-motion timer, plugin, listener, and video is cleaned up.
- Semantic theme tokens and existing button variants are preserved.
- No unrelated user changes are staged.
```

- [ ] **Step 7: Commit documentation and generated context changes**

```bash
git add .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
git commit -m "docs(a11y): document motion policy"
```

If `project-inventory.json` is unchanged, omit it from `git add`. If the implementation is intentionally being delivered as one reviewed commit, combine only the motion feature's already-reviewed commits without staging unrelated work.
