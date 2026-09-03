# Contact Form Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the editor-facing Contact 33 block to Contact Form without changing its stored Payload identity.

**Architecture:** Update only Payload label metadata and thumbnail presentation metadata. Preserve the `contact33` slug and every runtime identifier so existing pages continue rendering without data migration.

**Tech Stack:** Payload CMS 3, TypeScript, Vitest, ESLint

## Global Constraints

- Payload singular label: `Contact Form`.
- Payload plural label: `Contact Forms`.
- Thumbnail label: `Contact Form`.
- Thumbnail alternate text: `Contact Form block preview`.
- Internal block slug: `contact33` (unchanged).
- Type, component, directory, file, form-submission, layout, and DOM identifiers remain unchanged.
- No database migration or content rewrite.

---

### Task 1: Rename the Contact Form editor metadata

**Files:**
- Modify: `tests/int/contact33-config.int.spec.ts:124`
- Modify: `tests/int/block-thumbnails.int.spec.ts:158-164`
- Modify: `src/blocks/Contact33/config.ts:73-76`
- Modify: `src/block-thumbnails/definitions.ts:122-128`
- Verify unchanged: `src/payload-types.ts`

**Interfaces:**
- Consumes: `Contact33Block.labels` from `src/blocks/Contact33/config.ts` and `getBlockThumbnailDefinition('contact33')` from `src/block-thumbnails/definitions.ts`.
- Produces: Payload labels `{ singular: 'Contact Form', plural: 'Contact Forms' }` and thumbnail metadata `{ label: 'Contact Form', alt: 'Contact Form block preview', slug: 'contact33' }`.

- [ ] **Step 1: Write failing assertions for the new Payload and thumbnail labels**

In `tests/int/contact33-config.int.spec.ts`, add the label assertion immediately before `expect(tabs?.type).toBe('tabs')`:

```ts
expect(Contact33Block.labels).toEqual({
  plural: 'Contact Forms',
  singular: 'Contact Form',
})
```

In `tests/int/block-thumbnails.int.spec.ts`, update the existing Contact 33 expectation:

```ts
expect(getBlockThumbnailDefinition('contact33')).toMatchObject({
  alt: 'Contact Form block preview',
  filename: 'contact-33.jpg',
  label: 'Contact Form',
  slug: 'contact33',
  stageAlignment: 'top',
})
```

- [ ] **Step 2: Run the focused tests and verify the metadata assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/contact33-config.int.spec.ts tests/int/block-thumbnails.int.spec.ts
```

Expected: two assertion failures showing the current `Contact 33` labels where `Contact Form` is expected.

- [ ] **Step 3: Update the Payload block labels**

In `src/blocks/Contact33/config.ts`, retain `slug`, `interfaceName`, and thumbnail registration while changing only `labels`:

```ts
export const Contact33Block: Block = {
  slug: 'contact33',
  interfaceName: 'Contact33Block',
  admin: getBlockThumbnailAdmin('contact33'),
  labels: {
    singular: 'Contact Form',
    plural: 'Contact Forms',
  },
```

- [ ] **Step 4: Update the thumbnail presentation metadata**

In `src/block-thumbnails/definitions.ts`, keep the existing asset filename and slug:

```ts
defineThumbnail({
  alt: 'Contact Form block preview',
  filename: 'contact-33.jpg',
  label: 'Contact Form',
  slug: 'contact33',
  stageAlignment: 'top',
}),
```

- [ ] **Step 5: Verify generated Payload types remain stable**

Run:

```bash
pnpm generate:types
git diff --exit-code -- src/payload-types.ts
```

Expected: type generation succeeds and `git diff` exits `0`, confirming that editor labels do not alter the generated data contract.

- [ ] **Step 6: Run focused regression tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/contact33-config.int.spec.ts tests/int/contact33-render.int.spec.tsx tests/int/block-thumbnails.int.spec.ts
```

Expected: all three test files pass.

- [ ] **Step 7: Run lint and diff validation**

Run:

```bash
pnpm exec eslint src/blocks/Contact33/config.ts src/block-thumbnails/definitions.ts tests/int/contact33-config.int.spec.ts tests/int/block-thumbnails.int.spec.ts
git diff --check
```

Expected: both commands exit `0` with no errors.

- [ ] **Step 8: Verify the local admin-facing name**

With the development server running on port 3000, run:

```bash
curl --noproxy '*' -sS -o /tmp/contact-form-admin.html -w '%{http_code}\n' http://localhost:3000/admin
curl --noproxy '*' -sS http://localhost:3000/block-thumbnail-previews/contact33 | rg 'Contact Form'
```

Expected: the admin request returns `200` and the preview response contains `Contact Form`.

- [ ] **Step 9: Commit the implementation**

```bash
git add src/blocks/Contact33/config.ts src/block-thumbnails/definitions.ts tests/int/contact33-config.int.spec.ts tests/int/block-thumbnails.int.spec.ts
git commit -m "feat: label contact form block"
```

Expected: one implementation commit containing only the four naming and test files.
