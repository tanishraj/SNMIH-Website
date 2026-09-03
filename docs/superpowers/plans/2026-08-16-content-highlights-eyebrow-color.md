# Content Highlights Eyebrow Color Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Content Highlights eyebrow use the block's primary accent while retaining shared surface-aware contrast behavior.

**Architecture:** Keep `SectionEyebrow` as the single eyebrow renderer and add the semantic color class only at the Content Highlights call site. Verify rendered markup rather than coupling the test to internal helper behavior.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, React DOM server rendering

## Global Constraints

- Keep using the shared `SectionEyebrow` component.
- Apply `text-primary` only to Content Highlights.
- Preserve the `surface` prop so SNMIH contrast overrides continue to work.
- Do not modify other blocks or the shared eyebrow component.

---

### Task 1: Align the Content Highlights eyebrow

**Files:**
- Modify: `tests/int/content-highlights.int.spec.tsx:135-158`
- Modify: `src/components/content-highlights.tsx:98-101`

**Interfaces:**
- Consumes: `SectionEyebrow({ className, surface, children })`
- Produces: Content Highlights eyebrow markup containing `text-primary`, `data-section-eyebrow="true"`, and the selected `data-section-eyebrow-surface` value.

- [ ] **Step 1: Write the failing rendering test**

Add this test after the presentation test:

```tsx
it('uses the primary accent for its surface-aware eyebrow', () => {
  const html = renderToStaticMarkup(
    <ContentHighlights
      appearance={{ background: 'subtle' }}
      eyebrow="Latest"
      items={[item('First')]}
      title="Highlights"
    />,
  )

  expect(html).toContain('data-section-eyebrow="true"')
  expect(html).toContain('data-section-eyebrow-surface="subtle"')
  expect(html).toContain('text-primary')
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: FAIL because the rendered eyebrow does not contain `text-primary`.

- [ ] **Step 3: Apply the semantic accent class**

Replace the eyebrow expression in `ContentHighlightsIntro` with:

```tsx
{eyebrow ? (
  <SectionEyebrow className="text-primary" surface={surface}>
    {eyebrow}
  </SectionEyebrow>
) : null}
```

- [ ] **Step 4: Run focused verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
pnpm exec eslint src/components/content-highlights.tsx tests/int/content-highlights.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: all tests pass, ESLint reports no findings for the changed files, and TypeScript exits successfully.

- [ ] **Step 5: Commit**

```bash
git add src/components/content-highlights.tsx tests/int/content-highlights.int.spec.tsx
git commit -m "fix(content-highlights): align eyebrow color"
```
