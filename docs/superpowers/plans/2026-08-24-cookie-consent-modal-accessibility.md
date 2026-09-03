# Cookie Consent Modal Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Cookie Consent Modal fully keyboard accessible with privacy-preserving dismissal and dependable focus restoration.

**Architecture:** Replace the Modal variant's hand-built dialog shell with the existing Radix Dialog primitive while retaining its visual presentation and consent callbacks. Keep the change local to `CookieConsentBanner.tsx`, verify behavior through one JSDOM interaction suite, and document the visitor contract.

**Tech Stack:** React 19, Next.js 16, Radix Dialog through `radix-ui`, Testing Library, Vitest, TypeScript, Tailwind CSS 4.

## Global Constraints

- Change only the Modal variant; Bottom Bar, Floating Card, and Corner Badge behavior must remain unchanged.
- Escape records `analytics_consent=denied` and closes the modal.
- Initial focus goes to `Reject non-essential`.
- Backdrop interaction must not dismiss the modal or write a consent decision.
- Focus returns to the previously active connected element after either decision.
- Add no dependency and no Payload field; generated Payload types must remain unchanged.
- Preserve `SameSite=Lax`, the one-year lifetime, conditional `Secure`, and the router refresh after acceptance.

---

## File Structure

- Modify `src/components/global/CookieConsentBanner.tsx`: Radix modal structure, focus lifecycle, and dismissal policy.
- Create `tests/int/cookie-consent-modal.int.spec.tsx`: focused visitor-interaction contract.
- Modify `docs/guides/cookie-consent.md`: operator-visible keyboard and dismissal behavior.
- Modify `.agents/skills/project-context/references/architecture.md`: maintained consent interaction contract.
- Regenerate `.agents/skills/project-context/references/project-inventory.json`: register the new integration test in maintained project knowledge.

### Task 1: Lock the accessible modal behavior with tests

**Files:**
- Create: `tests/int/cookie-consent-modal.int.spec.tsx`
- Test: `tests/int/cookie-consent-modal.int.spec.tsx`

**Interfaces:**
- Consumes: `CookieConsentBanner(config: CookieConsentConfig): JSX.Element | null` and the existing `analytics_consent` cookie contract.
- Produces: an interaction contract covering semantics, initial focus, focus containment, dismissal, cookie writes, focus restoration, and non-modal isolation.

- [ ] **Step 1: Create the focused integration suite**

```tsx
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CookieConsentBanner } from '@/components/global/CookieConsentBanner'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

const modalConfig = {
  enabled: true,
  variant: 'modal' as const,
  heading: 'Privacy choices',
  message: 'Choose whether analytics may run.',
  acceptLabel: 'Accept all',
  rejectLabel: 'Reject non-essential',
  learnMoreLabel: 'Read privacy policy',
  privacyPolicyUrl: '/privacy',
}

describe('Cookie Consent Modal', () => {
  beforeEach(() => {
    document.cookie = 'analytics_consent=; Max-Age=0; Path=/'
    refresh.mockReset()
  })

  afterEach(() => {
    cleanup()
    document.cookie = 'analytics_consent=; Max-Age=0; Path=/'
  })

  it('exposes labelled modal semantics and initially focuses rejection', async () => {
    render(<CookieConsentBanner {...modalConfig} />)

    const dialog = await screen.findByRole('dialog', { name: 'Privacy choices' })
    const reject = screen.getByRole('button', { name: 'Reject non-essential' })

    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByText('Choose whether analytics may run.')).toBeTruthy()
    await waitFor(() => expect(document.activeElement).toBe(reject))
  })

  it('does not allow background elements to retain focus', async () => {
    const outside = document.createElement('button')
    outside.textContent = 'Outside action'
    document.body.append(outside)

    render(<CookieConsentBanner {...modalConfig} />)
    const reject = await screen.findByRole('button', { name: 'Reject non-essential' })
    const accept = screen.getByRole('button', { name: 'Accept all' })

    await waitFor(() => expect(document.activeElement).toBe(reject))
    accept.focus()
    outside.focus()
    expect(document.activeElement).toBe(accept)
    reject.focus()
    outside.focus()
    expect(document.activeElement).toBe(reject)

    outside.remove()
  })

  it('treats Escape as rejection and restores previous focus', async () => {
    const opener = document.createElement('button')
    opener.textContent = 'Open preferences'
    document.body.append(opener)
    opener.focus()

    render(<CookieConsentBanner {...modalConfig} />)
    await screen.findByRole('dialog', { name: 'Privacy choices' })
    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.cookie).toContain('analytics_consent=denied')
    await waitFor(() => expect(document.activeElement).toBe(opener))

    opener.remove()
  })

  it('ignores backdrop interaction without writing consent', async () => {
    const { container } = render(<CookieConsentBanner {...modalConfig} />)
    await screen.findByRole('dialog', { name: 'Privacy choices' })
    const overlay = container.ownerDocument.querySelector('[data-cookie-consent-overlay="true"]')

    expect(overlay).not.toBeNull()
    fireEvent.pointerDown(overlay as Element)

    expect(screen.getByRole('dialog', { name: 'Privacy choices' })).toBeTruthy()
    expect(document.cookie).not.toContain('analytics_consent=')
  })

  it('preserves explicit accept and reject cookie behavior', async () => {
    const acceptView = render(<CookieConsentBanner {...modalConfig} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Accept all' }))

    await waitFor(() => expect(document.cookie).toContain('analytics_consent=granted'))
    expect(refresh).toHaveBeenCalledTimes(1)

    acceptView.unmount()
    document.cookie = 'analytics_consent=; Max-Age=0; Path=/'
    refresh.mockReset()

    render(<CookieConsentBanner {...modalConfig} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Reject non-essential' }))

    await waitFor(() => expect(document.cookie).toContain('analytics_consent=denied'))
    expect(refresh).not.toHaveBeenCalled()
  })

  it('does not move focus for the non-modal Bottom Bar variant', async () => {
    const current = document.createElement('button')
    current.textContent = 'Current action'
    document.body.append(current)
    current.focus()

    render(<CookieConsentBanner enabled variant="bottom-bar" />)
    await screen.findByRole('dialog', { name: 'Cookie consent' })

    expect(document.activeElement).toBe(current)
    current.remove()
  })
})
```

- [ ] **Step 2: Run the suite and confirm the current modal fails the new contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/cookie-consent-modal.int.spec.tsx
```

Expected: failures for initial focus, focus containment, Escape rejection, backdrop marker, and focus restoration.

- [ ] **Step 3: Commit the failing contract**

```bash
git add tests/int/cookie-consent-modal.int.spec.tsx
git commit -m "test(a11y): cover consent modal"
```

### Task 2: Implement the Radix modal contract

**Files:**
- Modify: `src/components/global/CookieConsentBanner.tsx`
- Test: `tests/int/cookie-consent-modal.int.spec.tsx`

**Interfaces:**
- Consumes: existing `VariantProps`, `onAccept`, `onReject`, and `Button` interfaces.
- Produces: a Radix-controlled `Modal` that sends every valid close request through `onReject` and restores the previously focused element.

- [ ] **Step 1: Add the Radix and React focus-lifecycle imports**

Replace the React and Radix-related imports with:

```tsx
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
```

Keep the existing Next.js, Lucide, Button, and utility imports unchanged.

- [ ] **Step 2: Replace the Modal function**

```tsx
function Modal({ config, onAccept, onReject }: VariantProps) {
  const { heading, message, acceptLabel, rejectLabel, learnMoreLabel, privacyPolicyUrl } = config
  const rejectButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  )

  useEffect(() => {
    const previousFocus = restoreFocusRef.current

    return () => {
      queueMicrotask(() => {
        if (previousFocus?.isConnected) previousFocus.focus()
      })
    }
  }, [])

  return (
    <DialogPrimitive.Root
      modal
      open
      onOpenChange={(open) => {
        if (!open) onReject()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          data-cookie-consent-overlay="true"
        />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-2xl"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            rejectButtonRef.current?.focus()
          }}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <ShieldCheck className="mb-3 size-8 text-primary" aria-hidden="true" />
          <DialogPrimitive.Title className="mb-2 text-base font-semibold text-foreground">
            {heading?.trim() || 'We value your privacy'}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm leading-6 text-muted-foreground">
            {message || 'We use cookies to analyse site performance and improve your experience.'}{' '}
            {privacyPolicyUrl ? (
              <Link
                href={privacyPolicyUrl}
                className="font-medium text-foreground underline underline-offset-2 hover:opacity-70"
              >
                {learnMoreLabel || 'Privacy Policy'}
              </Link>
            ) : null}
          </DialogPrimitive.Description>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
            <Button className="flex-1" onClick={onAccept}>
              {acceptLabel || 'Accept all'}
            </Button>
            <Button
              ref={rejectButtonRef}
              variant="outline"
              className="flex-1"
              onClick={onReject}
            >
              {rejectLabel || 'Reject non-essential'}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
```

- [ ] **Step 3: Run the focused suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/cookie-consent-modal.int.spec.tsx
```

Expected: all Cookie Consent Modal tests pass. If Radix emits a missing description or title warning, treat it as a failure and correct the semantic structure before continuing.

- [ ] **Step 4: Run static verification for the changed component**

Run:

```bash
pnpm exec eslint src/components/global/CookieConsentBanner.tsx tests/int/cookie-consent-modal.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: both commands exit 0 without new warnings or type errors.

- [ ] **Step 5: Commit the implementation**

```bash
git add src/components/global/CookieConsentBanner.tsx tests/int/cookie-consent-modal.int.spec.tsx
git commit -m "fix(a11y): complete consent modal"
```

### Task 3: Document and verify the maintained contract

**Files:**
- Modify: `docs/guides/cookie-consent.md`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Regenerate: `.agents/skills/project-context/references/project-inventory.json`
- Test: `tests/int/cookie-consent-modal.int.spec.tsx`

**Interfaces:**
- Consumes: the implemented Modal keyboard and consent behavior.
- Produces: editor-facing guidance and current repository knowledge that describe the same behavior.

- [ ] **Step 1: Extend the visitor behavior guide**

Append this paragraph to `## Visitor Behavior` in `docs/guides/cookie-consent.md`:

```markdown
The Modal variant moves initial focus to `Reject non-essential` and keeps keyboard focus inside the
dialog. Escape records rejection and closes the dialog; clicking the backdrop does not dismiss it.
After either explicit choice, focus returns to the previously active control when it still exists.
The other banner variants remain non-modal and do not take over keyboard focus.
```

- [ ] **Step 2: Record the runtime interaction contract**

Add this paragraph after the analytics paragraph in the `## Themes and Analytics` section of `.agents/skills/project-context/references/architecture.md`:

```markdown
The Cookie Consent Modal uses a focus-trapped dialog. It initially focuses rejection, treats Escape
as rejection, ignores backdrop dismissal, and restores the visitor's previous focus after a decision.
The Bottom Bar, Floating Card, and Corner Badge remain non-modal.
```

- [ ] **Step 3: Refresh and check maintained project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the inventory records `tests/int/cookie-consent-modal.int.spec.tsx`, project context reports current, and a stale optional knowledge graph is warning-only.

- [ ] **Step 4: Run the complete verification set**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/cookie-consent-modal.int.spec.tsx tests/int/admin-documentation.int.spec.ts tests/int/project-context-repository.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
```

Expected: focused tests and TypeScript pass; lint has no errors and introduces no new warning. If the focused interaction test reveals environment-only Radix timing, use `waitFor` around the asserted focus transition rather than weakening the behavior assertion.

- [ ] **Step 5: Inspect the final impact surface**

Run:

```bash
git diff --check
git status --short
```

Expected: only the component, focused test, guide, architecture reference, and regenerated inventory differ from the plan commit; no generated Payload type changes appear.

- [ ] **Step 6: Commit documentation and generated context**

```bash
git add docs/guides/cookie-consent.md .agents/skills/project-context/references/architecture.md .agents/skills/project-context/references/project-inventory.json
git commit -m "docs(a11y): document consent focus"
```
