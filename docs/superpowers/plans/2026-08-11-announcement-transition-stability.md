# Announcement Transition Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure rotating announcements never display outgoing and incoming text simultaneously.

**Architecture:** Keep interval and hover-pause ownership in `RotatingAnnouncementContent`, but replace the parallel previous/current CSS layers with one keyed Framer Motion child. `AnimatePresence` uses `mode="wait"` so the outgoing child unmounts before the incoming child mounts, while the persistent outer wrapper preserves the bar's dimensions.

**Tech Stack:** React 19, TypeScript, Framer Motion 12, Tailwind CSS, Vitest, Testing Library

## Global Constraints

- Preserve the existing interval semantics and two-second minimum.
- Preserve vertical and horizontal movement directions.
- Preserve hover pause, links, typography, colors, truncation, and bar dimensions.
- Do not add packages, Payload fields, migrations, or Hero Banner changes.
- Respect reduced-motion preference by replacing content without fade or slide movement.

---

## File Structure

- Modify `tests/int/rotating-announcement.int.spec.ts`: cover the transition boundary, sequential completion, pause behavior, direction modes, and reduced motion.
- Modify `src/components/announcement/RotatingAnnouncementContent.tsx`: own the active index and render one presence-managed announcement item.

### Task 1: Make announcement transitions sequential

**Files:**
- Modify: `tests/int/rotating-announcement.int.spec.ts:1-120`
- Modify: `src/components/announcement/RotatingAnnouncementContent.tsx:1-153`

**Interfaces:**
- Consumes: `RotatingAnnouncementContent({ intervalMs, items, mode })` with the existing public prop types.
- Produces: the same component interface, one persistent `data-testid="announcement-rotator"` wrapper, and one readable announcement child at any instant.

- [x] **Step 1: Add the failing transition-boundary test**

Mock Framer Motion above the component import so its props remain observable:

~~~tsx
let prefersReducedMotion = false

vi.mock('framer-motion', async () => {
  const React = await import('react')

  return {
    AnimatePresence: ({ children, mode }: { children: React.ReactNode; mode?: string }) => (
      <div data-presence-mode={mode}>{children}</div>
    ),
    motion: {
      div: React.forwardRef<
        HTMLDivElement,
        React.HTMLAttributes<HTMLDivElement> & {
          animate?: unknown
          exit?: unknown
          initial?: unknown
          transition?: { duration?: number }
        }
      >(function MotionDiv({ animate, exit, initial, transition, ...props }, ref) {
        return <div data-duration={transition?.duration} ref={ref} {...props} />
      }),
    },
    useReducedMotion: () => prefersReducedMotion,
  }
})
~~~

Reset `prefersReducedMotion = false` in `beforeEach`, then add:

~~~tsx
it('uses wait-mode presence and renders one announcement layer', () => {
  const { container } = render(
    createElement(RotatingAnnouncementContent, {
      intervalMs: 2000,
      items: [
        { description: 'First description', title: 'First title' },
        { description: 'Second description', title: 'Second title' },
      ],
    }),
  )

  expect(container.querySelector('[data-presence-mode="wait"]')).toBeTruthy()
  expect(screen.getAllByTestId('announcement-item')).toHaveLength(1)

  act(() => {
    vi.advanceTimersByTime(2000)
  })

  expect(screen.getAllByTestId('announcement-item')).toHaveLength(1)
})
~~~

- [x] **Step 2: Run the focused test and confirm the contract fails**

Run:

~~~bash
pnpm exec vitest run tests/int/rotating-announcement.int.spec.ts --config ./vitest.config.mts
~~~

Expected: FAIL because the component has no wait-mode presence wrapper or `announcement-item` test identifier, and the current transition branch mounts two readable layers.

- [x] **Step 3: Replace parallel CSS layers with one wait-mode presence child**

Change the imports:

~~~tsx
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
~~~

Replace `TRANSITION_MS` with a sequential half-duration so exit plus entry still totals 320 ms:

~~~tsx
const TRANSITION_DURATION_SECONDS = 0.16
~~~

Replace the component state, effects, animation-class resolution, and conditional render with:

~~~tsx
const [currentIndex, setCurrentIndex] = useState(0)
const [isPaused, setIsPaused] = useState(false)
const prefersReducedMotion = useReducedMotion()

useEffect(() => {
  if (isPaused || items.length <= 1) return

  const intervalId = window.setInterval(() => {
    setCurrentIndex((index) => (index + 1) % items.length)
  }, sanitizedInterval)

  return () => window.clearInterval(intervalId)
}, [isPaused, items.length, sanitizedInterval])

const safeCurrentIndex = currentIndex % items.length
const currentItem = items[safeCurrentIndex]
const initialOffset = mode === 'horizontal' ? { x: 8, y: 0 } : { x: 0, y: 8 }
const exitOffset = mode === 'horizontal' ? { x: -8, y: 0 } : { x: 0, y: -8 }
const motionDisabled = prefersReducedMotion === true

return (
  <div
    className="relative min-w-0 flex-1 overflow-hidden py-0.5"
    data-testid="announcement-rotator"
    onMouseEnter={() => setIsPaused(true)}
    onMouseLeave={() => setIsPaused(false)}
  >
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={safeCurrentIndex}
        animate={{ opacity: 1, x: 0, y: 0 }}
        data-testid="announcement-item"
        exit={motionDisabled ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...exitOffset }}
        initial={motionDisabled ? false : { opacity: 0, ...initialOffset }}
        transition={{
          duration: motionDisabled ? 0 : TRANSITION_DURATION_SECONDS,
          ease: 'easeOut',
        }}
      >
        <AnnouncementItem item={currentItem} />
      </motion.div>
    </AnimatePresence>
  </div>
)
~~~

Delete `previousIndex`, `currentIndexRef`, `timeoutRef`, the synchronization effect, timeout cleanup, invisible sizing copy, and the parallel outgoing/incoming layers. Do not modify `AnnouncementItem`.

- [x] **Step 4: Add reduced-motion coverage**

Add:

~~~tsx
it('disables transition duration when reduced motion is preferred', () => {
  prefersReducedMotion = true

  render(
    createElement(RotatingAnnouncementContent, {
      items: [
        { description: 'First description' },
        { description: 'Second description' },
      ],
    }),
  )

  expect(screen.getByTestId('announcement-item').getAttribute('data-duration')).toBe('0')
})
~~~

Keep the existing single-item, rotation, hover-pause, and horizontal-mode tests. Update only post-interval timer advances if the real presence timing requires flushing the 160-millisecond exit and entry phases.

- [x] **Step 5: Run the focused regression suite**

Run:

~~~bash
pnpm exec vitest run tests/int/rotating-announcement.int.spec.ts --config ./vitest.config.mts
~~~

Expected: all rotating-announcement tests PASS, including wait mode, one-layer rendering, preserved rotation behavior, and reduced motion.

- [x] **Step 6: Run targeted static verification**

Run:

~~~bash
pnpm exec eslint src/components/announcement/RotatingAnnouncementContent.tsx tests/int/rotating-announcement.int.spec.ts
pnpm exec tsc --noEmit
~~~

Expected: both commands exit successfully with no announcement-related errors.

- [x] **Step 7: Review the diff for scope and visual-contract preservation**

Run:

~~~bash
git diff --check
git diff -- src/components/announcement/RotatingAnnouncementContent.tsx tests/int/rotating-announcement.int.spec.ts
~~~

Expected: no whitespace errors; the diff contains only sequential presence logic and focused tests, with no schema, theme, announcement copy, or Hero Banner changes.

- [ ] **Step 8: Commit the implementation when requested**

~~~bash
git add src/components/announcement/RotatingAnnouncementContent.tsx tests/int/rotating-announcement.int.spec.ts
git commit -m "fix(announcement): prevent transition overlap"
~~~

Expected: one focused implementation commit. Do not commit automatically if the user has asked to review the working tree first.
