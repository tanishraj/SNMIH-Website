# Back to Top Consent Coordination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reveal the Back to Top button after `64px` and dynamically move it above any visible consent surface that actually overlaps its bottom-right column.

**Architecture:** The existing Back to Top component will continue to own scroll visibility and consume a CSS custom-property offset without knowing consent state. Each non-modal consent surface will measure its rendered bounds, compare horizontal overlap with the fixed button, and publish its actual bottom obstruction through that property; `ResizeObserver`, viewport resize handling, and cleanup keep the coordination correct through responsive reflow and dismissal.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, DOM `ResizeObserver`, CSS custom properties, Vitest, Testing Library.

## Global Constraints

- Reveal after scrolling more than `64px` and hide again at or below `64px`.
- Use actual rendered geometry rather than fixed consent heights or configured side alone.
- Keep desktop left-positioned consent independent when it does not overlap.
- Handle nearly full-width mobile consent surfaces even when configured on the left.
- Keep modal consent above the button without publishing an offset.
- Preserve the shared Button, theme colors, radius, safe-area spacing, reduced-motion behavior, and public-only mounting.
- Remove observers, listeners, and the CSS custom property when the consent surface unmounts.
- Do not change Payload fields, generated types, or dependencies.
- Do not create a Git commit; leave changes available for review.

---

## File Structure

- Modify `tests/int/back-to-top-button.int.spec.tsx`: extend the focused contract for the `64px` threshold, measured consent collision, responsive overlap, modal exclusion, and cleanup.
- Modify `src/components/global/BackToTopButton.tsx`: change the visibility threshold and consume the temporary consent offset.
- Modify `src/components/global/CookieConsentBanner.tsx`: measure non-modal consent surfaces and publish the collision offset.
- Modify `.agents/skills/project-context/references/architecture.md`: replace the old viewport threshold contract and document consent collision avoidance.
- Refresh `.agents/skills/project-context/references/project-inventory.json` through the required updater.

### Task 1: Define the revised interaction contract

**Files:**
- Modify: `tests/int/back-to-top-button.int.spec.tsx`

**Interfaces:**
- Consumes: `BackToTopButton()` and `CookieConsentBanner(config)`.
- Produces: contracts for `64px` visibility and `--cookie-consent-back-to-top-offset` lifecycle.

- [x] **Step 1: Extend the test harness for consent geometry**

Add `waitFor`, the consent component, a router mock, mutable consent bounds, a rectangle helper, and a ResizeObserver callback harness:

```tsx
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CookieConsentBanner } from '@/components/global/CookieConsentBanner'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

let consentBounds = { left: 0, right: 360, top: 700 }
let resizeObserverCallback: ResizeObserverCallback | null

function makeRect({ left, right, top }: { left: number; right: number; top: number }) {
  return {
    bottom: 800,
    height: 800 - top,
    left,
    right,
    top,
    width: right - left,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect
}
```

In `beforeEach`, clear the consent cookie, install the observer, and return geometry for the button and consent surface:

```tsx
document.cookie = 'analytics_consent=; Max-Age=0; Path=/'
consentBounds = { left: 0, right: 360, top: 700 }
resizeObserverCallback = null

vi.stubGlobal(
  'ResizeObserver',
  class ResizeObserverMock {
    constructor(callback: ResizeObserverCallback) {
      resizeObserverCallback = callback
    }
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
  },
)

vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
  if (this.dataset.backToTop === 'true') return makeRect({ left: 300, right: 344, top: 740 })
  if (this.dataset.cookieConsentSurface) return makeRect(consentBounds)
  return makeRect({ left: 0, right: 0, top: 800 })
})
```

In `afterEach`, clear both the cookie and CSS property:

```tsx
document.cookie = 'analytics_consent=; Max-Age=0; Path=/'
document.documentElement.style.removeProperty('--cookie-consent-back-to-top-offset')
```

- [x] **Step 2: Change the visibility assertion to the approved threshold**

Replace the viewport-height scroll assertions with:

```tsx
setScrollY(64)
fireEvent.scroll(window)
flushAnimationFrame()
expect(button.getAttribute('aria-hidden')).toBe('true')

setScrollY(65)
fireEvent.scroll(window)
flushAnimationFrame()
expect(screen.getByRole('button', { name: 'Back to top' })).toBe(button)
```

- [x] **Step 3: Add failing consent collision contracts**

```tsx
it('moves above an overlapping bottom consent surface and clears after dismissal', async () => {
  render(
    <>
      <BackToTopButton />
      <CookieConsentBanner enabled variant="bottom-bar" />
    </>,
  )

  await screen.findByRole('dialog', { name: 'Cookie consent' })
  await waitFor(() =>
    expect(
      document.documentElement.style.getPropertyValue('--cookie-consent-back-to-top-offset'),
    ).toBe('100px'),
  )

  fireEvent.click(screen.getByRole('button', { name: 'Reject non-essential' }))

  await waitFor(() =>
    expect(
      document.documentElement.style.getPropertyValue('--cookie-consent-back-to-top-offset'),
    ).toBe(''),
  )
})

it('uses rendered overlap so a left floating card only offsets when it reaches the button', async () => {
  consentBounds = { left: 16, right: 280, top: 660 }
  render(
    <>
      <BackToTopButton />
      <CookieConsentBanner enabled variant="floating-card" position="bottom-left" />
    </>,
  )

  await screen.findByRole('dialog', { name: 'Cookie consent' })
  expect(
    document.documentElement.style.getPropertyValue('--cookie-consent-back-to-top-offset'),
  ).toBe('')

  consentBounds = { left: 16, right: 360, top: 660 }
  act(() => resizeObserverCallback?.([], {} as ResizeObserver))

  expect(
    document.documentElement.style.getPropertyValue('--cookie-consent-back-to-top-offset'),
  ).toBe('140px')
})

it('does not publish a collision offset for modal consent', async () => {
  render(
    <>
      <BackToTopButton />
      <CookieConsentBanner enabled variant="modal" heading="Privacy choices" />
    </>,
  )

  await screen.findByRole('dialog', { name: 'Privacy choices' })
  expect(
    document.documentElement.style.getPropertyValue('--cookie-consent-back-to-top-offset'),
  ).toBe('')
})
```

- [x] **Step 4: Run the focused test and verify the new contracts fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/back-to-top-button.int.spec.tsx
```

Expected: FAIL because visibility still uses `window.innerHeight`, consent surfaces do not publish offsets, and the button does not consume the CSS property.

### Task 2: Implement responsive consent collision avoidance

**Files:**
- Modify: `src/components/global/BackToTopButton.tsx`
- Modify: `src/components/global/CookieConsentBanner.tsx`

**Interfaces:**
- Consumes: `[data-back-to-top="true"]`, `[data-cookie-consent-surface]`, and the viewport dimensions.
- Produces: root CSS custom property `--cookie-consent-back-to-top-offset` containing a pixel obstruction distance or no value.

- [x] **Step 1: Update the button threshold and bottom-position expression**

Add the threshold constant and use it in visibility calculation:

```tsx
const BACK_TO_TOP_VISIBILITY_THRESHOLD = 64

const updateVisibility = () => {
  setIsVisible(window.scrollY > BACK_TO_TOP_VISIBILITY_THRESHOLD)
}
```

Update both responsive bottom classes to include the consent offset:

```tsx
'fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom)+var(--cookie-consent-back-to-top-offset,0px))] z-40 size-11 shadow-lg transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom)+var(--cookie-consent-back-to-top-offset,0px))]'
```

- [x] **Step 2: Add the consent-surface measurement hook**

Add these module-level constants and helper above the consent variants:

```tsx
const BACK_TO_TOP_SELECTOR = '[data-back-to-top="true"]'
const BACK_TO_TOP_OFFSET_PROPERTY = '--cookie-consent-back-to-top-offset'

function useBackToTopOffsetSource(measurementKey?: unknown) {
  const surfaceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const surface = surfaceRef.current
    const root = document.documentElement
    if (!surface) return

    const updateOffset = () => {
      const button = document.querySelector<HTMLElement>(BACK_TO_TOP_SELECTOR)
      if (!button) {
        root.style.removeProperty(BACK_TO_TOP_OFFSET_PROPERTY)
        return
      }

      const surfaceRect = surface.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()
      const overlapsButtonColumn =
        surfaceRect.left < buttonRect.right && surfaceRect.right > buttonRect.left

      if (!overlapsButtonColumn) {
        root.style.removeProperty(BACK_TO_TOP_OFFSET_PROPERTY)
        return
      }

      const obstruction = Math.max(0, Math.ceil(window.innerHeight - surfaceRect.top))
      if (obstruction === 0) {
        root.style.removeProperty(BACK_TO_TOP_OFFSET_PROPERTY)
        return
      }

      root.style.setProperty(BACK_TO_TOP_OFFSET_PROPERTY, `${obstruction}px`)
    }

    updateOffset()
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateOffset)
    resizeObserver?.observe(surface)
    window.addEventListener('resize', updateOffset)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateOffset)
      root.style.removeProperty(BACK_TO_TOP_OFFSET_PROPERTY)
    }
  }, [measurementKey])

  return surfaceRef
}
```

- [x] **Step 3: Register all non-modal fixed consent surfaces**

In `BottomBar`, attach a stable measurement source:

```tsx
const surfaceRef = useBackToTopOffsetSource()

<div
  ref={surfaceRef}
  data-cookie-consent-surface="bottom-bar"
```

In `FloatingCard`, attach the same source regardless of configured side so mobile width is measured:

```tsx
const surfaceRef = useBackToTopOffsetSource()

<div
  ref={surfaceRef}
  data-cookie-consent-surface="floating-card"
```

In `CornerBadge`, use expansion state as the measurement key so the fallback remains correct without ResizeObserver:

```tsx
const surfaceRef = useBackToTopOffsetSource(expanded)

<div
  ref={surfaceRef}
  data-cookie-consent-surface="corner-badge"
```

Do not attach the hook or data attribute to `Modal`.

- [x] **Step 4: Run the focused test and verify all contracts pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/back-to-top-button.int.spec.tsx
```

Expected: PASS for the existing accessibility, motion, cleanup, and layout contracts plus the revised threshold and consent collision contracts.

### Task 3: Update the maintained contract and verify

**Files:**
- Modify: `.agents/skills/project-context/references/architecture.md`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: the completed public-shell behavior.
- Produces: current maintained architecture and inventory references.

- [x] **Step 1: Update the architecture description**

Replace the existing Back to Top paragraph with:

```markdown
- The public frontend layout mounts one theme-aware Back to Top control outside the content shell.
  It appears after `64px` of scrolling, stays below consent and modal layers, and switches from
  smooth to immediate scrolling when the visitor prefers reduced motion. Visible non-modal consent
  surfaces publish their measured bottom obstruction only when their rendered bounds overlap the
  button column, keeping the control clear through responsive reflow. Admin and block thumbnail
  route groups do not inherit it.
```

- [x] **Step 2: Run static and focused verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/components/global/BackToTopButton.tsx src/components/global/CookieConsentBanner.tsx tests/int/back-to-top-button.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/back-to-top-button.int.spec.tsx tests/int/cookie-consent-modal.int.spec.tsx
```

Expected: TypeScript and lint exit successfully; both focused suites pass.

- [x] **Step 3: Refresh and validate project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both commands exit successfully. The optional stale knowledge-graph warning may remain.

- [x] **Step 4: Review the final diff without committing**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and no unrelated edits.
