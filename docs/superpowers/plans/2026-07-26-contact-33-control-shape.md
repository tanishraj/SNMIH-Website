# Contact 33 Control Shape Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match every Contact 33 input control to the established Review Submission control height and border radius.

**Architecture:** Add a focused rendering contract to the existing Contact 33 integration test, then apply component-local Tailwind overrides to the two inputs, select trigger, and textarea. Shared shadcn primitives and all form behavior remain unchanged.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, shadcn Radix/Luma, Vitest

## Global Constraints

- Name and Email inputs use `h-11 rounded-md`.
- The Subject select trigger uses `h-11 w-full rounded-md`.
- The Message textarea uses `min-h-32 rounded-md`.
- Apply overrides only within Contact 33.
- Do not modify shared shadcn Input, Select, Textarea, Field, or Button primitives.
- Preserve field spacing, validation, semantic colors, button styling, responsive layout, and Payload form integration.

---

### Task 1: Align Contact 33 control shapes

**Files:**
- Modify: `tests/int/contact33-render.int.spec.tsx`
- Modify: `src/components/contact33.tsx`

**Interfaces:**
- Consumes: existing `Contact33BlockComponent` static rendering fixture.
- Produces: the approved component-local control height and radius contract.

- [ ] **Step 1: Write the failing rendering test**

Add this test to `tests/int/contact33-render.int.spec.tsx`:

```tsx
it('matches Review Submission control height and radius', () => {
  const html = renderToStaticMarkup(
    createElement(Contact33BlockComponent, {
      form: contactForm,
      image: { alt: 'Contact', url: '/contact.jpg' },
      imageAlt: 'Contact team',
      title: 'Contact us',
    } as never),
  )

  expect(html.match(/h-11 rounded-md/g)).toHaveLength(2)
  expect(html).toContain('h-11 w-full rounded-md')
  expect(html).toContain('min-h-32 rounded-md')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/contact33-render.int.spec.tsx
```

Expected: FAIL because Contact 33 currently inherits pill-shaped control radii and default
single-line heights.

- [ ] **Step 3: Apply the scoped control classes**

In `src/components/contact33.tsx`, apply these exact edits:

```diff
 <Input
   {...field}
   aria-invalid={fieldState.invalid || undefined}
+  className="h-11 rounded-md"
   id="contact33-name"

 <Input
   {...field}
   aria-invalid={fieldState.invalid || undefined}
+  className="h-11 rounded-md"
   id="contact33-email"

 <SelectTrigger
   aria-invalid={fieldState.invalid || undefined}
-  className="w-full"
+  className="h-11 w-full rounded-md"
   id="contact33-subject"

 <Textarea
   {...field}
   aria-invalid={fieldState.invalid || undefined}
-  className="min-h-32"
+  className="min-h-32 rounded-md"
   id="contact33-message"
```

Do not change the Button, FieldGroup gaps, validation state, submission handler, or shared UI
component files.

- [ ] **Step 4: Run focused verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/contact33-render.int.spec.tsx
pnpm exec eslint src/components/contact33.tsx tests/int/contact33-render.int.spec.tsx
git diff --check
```

Expected: eight existing tests plus the new control-shape test pass, ESLint exits 0, and the diff
check reports no whitespace errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/contact33.tsx tests/int/contact33-render.int.spec.tsx docs/superpowers/plans/2026-07-26-contact-33-control-shape.md
git commit -m "fix: align contact control shapes"
```
