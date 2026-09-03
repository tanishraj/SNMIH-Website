# Back to Top Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible, theme-aware Back to Top button to every public website page.

**Architecture:** A focused client component will own viewport-threshold observation and scroll activation while the public server layout mounts it once beside the existing global controls. The component will reuse the shared Button primitive, track only derived visibility, throttle measurements through `requestAnimationFrame`, and select smooth or immediate scrolling from the visitor's reduced-motion preference.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn-style shared Button, Lucide React, Vitest, Testing Library.

## Global Constraints

- Render on every public page without an editor-facing setting.
- Do not render in Payload Admin or development-only block thumbnail routes.
- Reveal after one viewport height of scrolling.
- Respect `prefers-reduced-motion: reduce` by using immediate scrolling.
- Use semantic theme tokens and the shared control radius in light and dark modes.
- Keep the control below cookie consent, dialogs, and other modal layers.
- Do not move keyboard focus automatically after activation.
- Do not add dependencies, Payload schema fields, migrations, or generated-type changes.
- Do not create a Git commit; leave the implementation available for user review.

---

## File Structure

- Create `src/components/global/BackToTopButton.tsx`: public client control, visibility observer, reduced-motion-aware activation, and presentation.
- Modify `src/app/(frontend)/layout.tsx`: mount the control once in the public frontend shell.
- Create `tests/int/back-to-top-button.int.spec.tsx`: interaction, accessibility, styling, listener cleanup, and layout-wiring contracts.
- Update `.agents/skills/project-context/references/project-inventory.json` only if the project-context update reports generated structural changes.

### Task 1: Add the global Back to Top control

**Files:**
- Create: `tests/int/back-to-top-button.int.spec.tsx`
- Create: `src/components/global/BackToTopButton.tsx`
- Modify: `src/app/(frontend)/layout.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`, `cn` from `@/lib/utils`, and `ArrowUp` from `lucide-react`.
- Produces: `BackToTopButton(): React.JSX.Element`, mounted without props in the public frontend layout.

- [x] **Step 1: Write the failing interaction and layout contract**

```tsx
import fs from 'node:fs'
import path from 'node:path'
import { act } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BackToTopButton } from '@/components/global/BackToTopButton'

let animationFrames: FrameRequestCallback[]

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value })
}

function flushAnimationFrame() {
  const callbacks = animationFrames.splice(0)
  act(() => callbacks.forEach((callback) => callback(0)))
}

describe('BackToTopButton', () => {
  beforeEach(() => {
    animationFrames = []
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    setScrollY(0)
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        animationFrames.push(callback)
        return animationFrames.length
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('scrollTo', vi.fn())
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    )
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('reveals after one viewport and hides the inactive control from interaction', () => {
    const { container } = render(<BackToTopButton />)
    const button = container.querySelector('[data-back-to-top="true"]') as HTMLButtonElement

    expect(button.getAttribute('aria-hidden')).toBe('true')
    expect(button.tabIndex).toBe(-1)

    setScrollY(800)
    fireEvent.scroll(window)
    flushAnimationFrame()

    expect(screen.getByRole('button', { name: 'Back to top' })).toBe(button)
    expect(button.getAttribute('aria-hidden')).toBeNull()
    expect(button.tabIndex).toBe(0)
  })

  it('uses smooth scrolling unless reduced motion is requested', () => {
    const { rerender } = render(<BackToTopButton />)
    const button = document.querySelector('[data-back-to-top="true"]') as HTMLButtonElement

    fireEvent.click(button)
    expect(window.scrollTo).toHaveBeenLastCalledWith({ behavior: 'smooth', top: 0 })

    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList)
    rerender(<BackToTopButton />)
    fireEvent.click(button)

    expect(window.scrollTo).toHaveBeenLastCalledWith({ behavior: 'auto', top: 0 })
  })

  it('uses the shared themed control and mobile safe-area positioning', () => {
    const { container } = render(<BackToTopButton />)
    const button = container.querySelector('[data-back-to-top="true"]') as HTMLButtonElement

    expect(button.dataset.slot).toBe('button')
    expect(button.className).toContain('z-40')
    expect(button.className).toContain('size-11')
    expect(button.className).toContain('env(safe-area-inset-bottom)')
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('removes global listeners and a queued frame on unmount', () => {
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    const view = render(<BackToTopButton />)

    fireEvent.scroll(window)
    view.unmount()

    expect(removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
  })

  it('is mounted once in the public frontend layout', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/(frontend)/layout.tsx'),
      'utf8',
    )

    expect(source).toContain(
      "import { BackToTopButton } from '@/components/global/BackToTopButton'",
    )
    expect(source.match(/<BackToTopButton \/>/g)).toHaveLength(1)
  })
})
```

- [x] **Step 2: Run the focused test and verify the missing component fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/back-to-top-button.int.spec.tsx
```

Expected: FAIL because `@/components/global/BackToTopButton` does not exist.

- [x] **Step 3: Implement the focused client component**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let animationFrame: number | null = null

    const updateVisibility = () => {
      setIsVisible(window.scrollY >= window.innerHeight)
    }

    const scheduleUpdate = () => {
      if (animationFrame !== null) return

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null
        updateVisibility()
      })
    }

    updateVisibility()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches

    window.scrollTo({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      top: 0,
    })
  }

  return (
    <Button
      type="button"
      size="icon-lg"
      aria-hidden={isVisible ? undefined : true}
      aria-label="Back to top"
      title="Back to top"
      tabIndex={isVisible ? 0 : -1}
      data-back-to-top="true"
      onClick={scrollToTop}
      className={cn(
        'fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 size-11 shadow-lg transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      <ArrowUp aria-hidden="true" />
    </Button>
  )
}
```

- [x] **Step 4: Mount the component once in the public frontend layout**

Add the import with the other global components:

```tsx
import { BackToTopButton } from '@/components/global/BackToTopButton'
```

Mount it after the public content shell and before the cookie consent layer:

```tsx
        </div>
        <BackToTopButton />
        <CookieConsentBanner
```

- [x] **Step 5: Run the focused test and verify it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/back-to-top-button.int.spec.tsx
```

Expected: PASS for all BackToTopButton interaction and layout contracts.

- [x] **Step 6: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/components/global/BackToTopButton.tsx 'src/app/(frontend)/layout.tsx' tests/int/back-to-top-button.int.spec.tsx
```

Expected: both commands exit successfully with no type or lint errors.

- [x] **Step 7: Refresh and validate maintained project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both commands exit successfully. Keep any generated inventory change only if it reflects the new component or test; otherwise report the update as a checked no-op.

- [x] **Step 8: Review the final diff without committing**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only the planned implementation, test, planning documents, and any legitimate project-context inventory update are present alongside pre-existing user changes.
