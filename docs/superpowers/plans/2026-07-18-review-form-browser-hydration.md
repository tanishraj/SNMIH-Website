# Review Form Browser Hydration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent externally injected `__gcruniqueid` form attributes from producing a Review Submission hydration warning without hiding unrelated hydration mismatches.

**Architecture:** Keep the Review Submission block server-rendered and interactive. Apply React's one-level `suppressHydrationWarning` escape hatch directly to the five DOM elements observed to be mutated by the browser, and verify the behavior by hydrating server markup after injecting the external attribute.

**Tech Stack:** Next.js 16.2, React 19, TypeScript, shadcn form primitives, Vitest, Testing Library.

## Global Constraints

- Suppress only the Review Submission form, reviewer-name input, reviewer-email input, review-body textarea, and hidden honeypot input.
- Do not modify the shared `Input`, `Textarea`, or `Field` primitives.
- Do not disable SSR or remove browser-injected attributes with a script.
- Do not change Payload configuration, form values, validation, submission behavior, accessibility, or styling.
- Keep all changes unstaged and uncommitted.

---

## File Structure

- Modify `src/blocks/ReviewSubmission/Component.tsx`: opt the five browser-mutated elements into targeted hydration-warning suppression.
- Modify `tests/int/review-submission-render.int.spec.ts`: reproduce the external attribute mutation between server rendering and hydration and assert that no mismatch is reported.
- Retain `docs/superpowers/specs/2026-07-18-review-form-browser-hydration-design.md` as the approved behavior contract.

### Task 1: Suppress only the externally mutated review-form attributes

**Files:**

- Modify: `tests/int/review-submission-render.int.spec.ts`
- Modify: `src/blocks/ReviewSubmission/Component.tsx:324-573`
- Verify: `docs/superpowers/specs/2026-07-18-review-form-browser-hydration-design.md`

**Interfaces:**

- Consumes: `ReviewSubmissionBlockComponent` and the existing fallback review-field definitions rendered when only `title` is supplied.
- Produces: unchanged Review Submission HTML and behavior with `suppressHydrationWarning` set on exactly five affected DOM elements.

- [ ] **Step 1: Add a failing hydration regression test**

Extend the imports in `tests/int/review-submission-render.int.spec.ts`:

```ts
import { createElement } from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
```

Add cleanup for the hydrated tree and console spy:

```ts
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
```

Add this test to the existing `review submission block` suite:

```ts
it('ignores browser-injected form identifiers during hydration', async () => {
  vi.stubGlobal(
    'ResizeObserver',
    class ResizeObserverMock {
      disconnect() {}
      observe() {}
      unobserve() {}
    },
  )

  const element = createElement(ReviewSubmissionBlockComponent, {
    form: {
      fields: [],
      slug: 'reviews',
      submitButtonLabel: 'Submit review',
      successMessage: 'Thanks for your review.',
      title: 'Reviews',
    },
    title: 'Share your experience',
  })
  const container = document.createElement('div')
  container.innerHTML = renderToString(element)
  document.body.append(container)

  const mutatedElements = [
    container.querySelector('form'),
    container.querySelector('#reviewer-name'),
    container.querySelector('#reviewer-email'),
    container.querySelector('#review-body'),
    container.querySelector('input[name="website"]'),
  ]

  expect(mutatedElements.every(Boolean)).toBe(true)
  mutatedElements.forEach((element, index) => {
    element?.setAttribute('__gcruniqueid', String(index + 1))
  })

  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  render(element, { container, hydrate: true })

  await waitFor(() => {
    expect(container.querySelector('form')).not.toBeNull()
  })

  const hydrationOutput = consoleError.mock.calls.flat().join(' ')
  expect(hydrationOutput).not.toContain('__gcruniqueid')
  expect(hydrationOutput).not.toContain('hydrated but some attributes')
})
```

- [ ] **Step 2: Run the regression test and verify the intended failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/review-submission-render.int.spec.ts`

Expected: FAIL because React reports the injected `__gcruniqueid` attributes during hydration.

- [ ] **Step 3: Add targeted suppression to the five affected elements**

Update only these elements in `src/blocks/ReviewSubmission/Component.tsx`:

```tsx
<form
  className="flex w-full flex-col gap-7"
  suppressHydrationWarning
  onSubmit={handleSubmit}
>
```

```tsx
<Input
  aria-invalid={Boolean(errors.reviewerName) || undefined}
  className="h-11 rounded-md"
  id="reviewer-name"
  placeholder={nameField.placeholder}
  required={nameField.required}
  suppressHydrationWarning
  type="text"
  value={values.reviewerName}
  onChange={(event) => updateValue('reviewerName', event.target.value)}
/>
```

```tsx
<Input
  aria-invalid={Boolean(errors.reviewerEmail) || undefined}
  className="h-11 rounded-md"
  id="reviewer-email"
  placeholder={emailField.placeholder}
  required={emailField.required}
  suppressHydrationWarning
  type="email"
  value={values.reviewerEmail}
  onChange={(event) => updateValue('reviewerEmail', event.target.value)}
/>
```

```tsx
<Textarea
  aria-invalid={Boolean(errors.reviewBody) || undefined}
  className="min-h-32 rounded-md"
  id="review-body"
  maxLength={1000}
  placeholder={bodyField.placeholder}
  required={bodyField.required}
  rows={6}
  suppressHydrationWarning
  value={values.reviewBody}
  onChange={(event) => updateValue('reviewBody', event.target.value)}
/>
```

```tsx
<input
  aria-hidden="true"
  autoComplete="off"
  className="hidden"
  name={FORM_HONEYPOT_FIELD_NAME}
  suppressHydrationWarning
  tabIndex={-1}
  type="text"
  value=""
  readOnly
/>
```

- [ ] **Step 4: Run Review Submission tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/review-submission-render.int.spec.ts tests/int/review-submission.int.spec.ts`

Expected: both files PASS, including the injected-attribute hydration regression.

- [ ] **Step 5: Run focused formatting and lint checks**

Run:

```bash
pnpm exec prettier --write src/blocks/ReviewSubmission/Component.tsx tests/int/review-submission-render.int.spec.ts docs/superpowers/specs/2026-07-18-review-form-browser-hydration-design.md docs/superpowers/plans/2026-07-18-review-form-browser-hydration.md
pnpm exec eslint src/blocks/ReviewSubmission/Component.tsx tests/int/review-submission-render.int.spec.ts
git diff --check
```

Expected: Prettier, ESLint, and the whitespace check pass.

- [ ] **Step 6: Verify the narrow scope and unstaged state**

Run: `rg -n "suppressHydrationWarning" src/blocks/ReviewSubmission/Component.tsx src/components/ui/input.tsx src/components/ui/textarea.tsx && git status --short`

Expected: five matches appear only in `ReviewSubmission/Component.tsx`; shared UI primitives remain unchanged, and all hydration-fix files remain unstaged and uncommitted.
