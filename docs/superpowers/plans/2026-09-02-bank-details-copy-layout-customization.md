# Bank Details Copy and Mirrored Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the contextual Bank Details panel at 36% on either desktop side, let editors customize persistent ledger text through one structured Content group, and render the Copy all label at a smaller text size.

**Architecture:** Preserve all existing contextual field paths and add one optional `ledgerText` Payload group for new nested overrides. Normalize that group at the server boundary into a complete client-safe object, then use it in the existing client renderer while selecting mirrored 9/16 or 16/9 desktop grid tracks from `panelPosition`.

**Tech Stack:** Payload CMS 3.85, Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library.

## Global Constraints

- Keep the contextual panel at 36% and the white ledger at 64% for both desktop positions.
- Preserve contextual-first DOM and compact-screen order.
- Keep existing `officialAccountLabel`, `panelTitle`, and `panelDescription` stored paths unchanged.
- Expose persistent ledger text only; copy feedback, clipboard errors, QR captions, and QR fallback messages remain code-owned.
- Missing, malformed, or whitespace-only Ledger Text values use code-owned defaults.
- Preserve the credentials-only Copy all and QR payload exactly.
- Keep the fixed-white ledger readable in light and dark website modes.
- Keep existing 44px compact/tablet Copy-control targets.
- Do not create a data migration, endpoint, collection, global, or visitor-facing layout/text control.
- Do not stage or commit any changes.

---

## File Structure

- `src/blocks/BankDetails/config.ts`: owns the new `ledgerText` group and Admin defaults.
- `src/blocks/BankDetails/types.ts`: owns authored and resolved Ledger Text contracts.
- `src/blocks/BankDetails/normalizeBankDetails.ts`: owns defaults and per-field fallback normalization.
- `src/blocks/BankDetails/Component.tsx`: resolves Ledger Text at the server boundary.
- `src/blocks/BankDetails/BankDetailsClient.tsx`: renders custom labels, mirrored tracks, and smaller Copy all typography.
- `tests/int/bank-details.int.spec.tsx`: covers schema, defaults, custom rendering, compatibility, and layout geometry.
- `src/block-thumbnails/fixtures.tsx` and `public/block-thumbnails/bank-details.jpg`: exercise and show the right-position layout.
- `src/payload-types.ts`: generated Payload contract.
- `docs/guides/blocks.md`, `docs/architecture/feature-inventory.md`, and `.agents/skills/project-context/references/block-system.md`: maintained behavior contracts.
- `.agents/skills/project-context/references/project-inventory.json`: generated repository inventory.

---

### Task 1: Ledger Text schema and normalization

**Files:**
- Modify: `src/blocks/BankDetails/config.ts`
- Modify: `src/blocks/BankDetails/types.ts`
- Modify: `src/blocks/BankDetails/normalizeBankDetails.ts`
- Test: `tests/int/bank-details.int.spec.tsx`

**Interfaces:**
- Produces: `bankDetailsLedgerTextDefaults`, `normalizeBankDetailsLedgerText(value)`, `BankDetailsLedgerTextValue`, and `ResolvedBankDetailsLedgerText`.
- Consumes: existing `BankDetailsBlock.fields` traversal helpers in the focused integration test.

- [x] **Step 1: Add failing schema and normalizer tests**

Assert that `ledgerText` is a Content-tab group and that every nested field has the approved default. Add normalization assertions for a missing group, partial overrides, surrounding whitespace, blank overrides, and malformed runtime values.

```tsx
expect(findOwningTabLabel(BankDetailsBlock.fields, 'ledgerText')).toBe('Content')
expect(findNamedField(BankDetailsBlock.fields, 'ledgerTitle')).toMatchObject({
  defaultValue: 'Bank Account Information',
})
expect(normalizeBankDetailsLedgerText()).toEqual(bankDetailsLedgerTextDefaults)
expect(
  normalizeBankDetailsLedgerText({
    ledgerTitle: ' Transfer Account ',
    verifiedLabel: ' ',
  }),
).toMatchObject({
  ledgerTitle: 'Transfer Account',
  verifiedLabel: 'Verified',
})
```

- [x] **Step 2: Run the focused test and confirm the red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/bank-details.int.spec.tsx
```

Expected: FAIL because the group, defaults, types, and normalizer do not exist.

- [x] **Step 3: Add authored/resolved Ledger Text contracts and defaults**

Define the approved keys in `types.ts`:

```ts
export type BankDetailsLedgerTextValue = {
  accountHolderLabel?: string | null
  accountNumberLabel?: string | null
  bankNameLabel?: string | null
  branchLabel?: string | null
  copyAllLabel?: string | null
  ifscCodeLabel?: string | null
  ledgerTitle?: string | null
  purposeSuffix?: string | null
  upiIdLabel?: string | null
  verifiedLabel?: string | null
}

export type ResolvedBankDetailsLedgerText = {
  [Key in keyof BankDetailsLedgerTextValue]-?: string
}
```

Add `ledgerText?: BankDetailsLedgerTextValue | null` to `BankDetailsBlockLike`.

Define defaults and normalize every value independently in `normalizeBankDetails.ts`:

```ts
export const bankDetailsLedgerTextDefaults: ResolvedBankDetailsLedgerText = {
  accountHolderLabel: 'Account Holder',
  accountNumberLabel: 'Account Number',
  bankNameLabel: 'Bank Name',
  branchLabel: 'Branch & Type',
  copyAllLabel: 'Copy all details',
  ifscCodeLabel: 'IFSC Code',
  ledgerTitle: 'Bank Account Information',
  purposeSuffix: 'account',
  upiIdLabel: 'UPI ID',
  verifiedLabel: 'Verified',
}
```

`normalizeBankDetailsLedgerText` accepts unknown/missing historical input, trims strings, and uses the corresponding default for every invalid or blank value.

- [x] **Step 4: Add the `ledgerText` Payload group**

Add an optional group after `panelDescription` and before `accounts`:

```ts
{
  name: 'ledgerText',
  label: 'Ledger Text',
  type: 'group',
  admin: {
    description: 'Customize persistent labels on the white account-information panel.',
  },
  fields: [
    { name: 'purposeSuffix', label: 'Purpose Suffix', type: 'text', defaultValue: 'account' },
    {
      name: 'ledgerTitle',
      label: 'Ledger Title',
      type: 'text',
      defaultValue: 'Bank Account Information',
    },
    { name: 'verifiedLabel', label: 'Verification Label', type: 'text', defaultValue: 'Verified' },
    { name: 'accountHolderLabel', label: 'Account Holder Label', type: 'text', defaultValue: 'Account Holder' },
    { name: 'accountNumberLabel', label: 'Account Number Label', type: 'text', defaultValue: 'Account Number' },
    { name: 'bankNameLabel', label: 'Bank Name Label', type: 'text', defaultValue: 'Bank Name' },
    { name: 'ifscCodeLabel', label: 'IFSC Code Label', type: 'text', defaultValue: 'IFSC Code' },
    { name: 'branchLabel', label: 'Branch & Type Label', type: 'text', defaultValue: 'Branch & Type' },
    { name: 'upiIdLabel', label: 'UPI ID Label', type: 'text', defaultValue: 'UPI ID' },
    { name: 'copyAllLabel', label: 'Copy All Label', type: 'text', defaultValue: 'Copy all details' },
  ],
}
```

- [x] **Step 5: Re-run the focused test**

Run the focused Vitest command. Expected: schema and normalizer assertions pass; renderer assertions added in Task 2 are not present yet.

---

### Task 2: Mirrored desktop tracks and configurable rendering

**Files:**
- Modify: `src/blocks/BankDetails/Component.tsx`
- Modify: `src/blocks/BankDetails/BankDetailsClient.tsx`
- Test: `tests/int/bank-details.int.spec.tsx`

**Interfaces:**
- Consumes: `normalizeBankDetailsLedgerText(ledgerText)` and `ResolvedBankDetailsLedgerText` from Task 1.
- Produces: a complete `ledgerText` prop at the client boundary and position-aware desktop grid tracks.

- [x] **Step 1: Add failing renderer and layout tests**

Cover defaults through an old-style payload, custom overrides, left/right track classes, contextual-first mobile order, and the Copy all `text-xs` class.

```tsx
expect(leftFrame?.className).toContain(
  'lg:grid-cols-[minmax(0,9fr)_minmax(0,16fr)]',
)
expect(rightFrame?.className).toContain(
  'lg:grid-cols-[minmax(0,16fr)_minmax(0,9fr)]',
)
expect(screen.getByText('Transfer Account')).toBeTruthy()
expect(screen.getByText('Published')).toBeTruthy()
expect(screen.getByText('Holder name')).toBeTruthy()
expect(screen.getByRole('button', { name: 'Copy credentials' }).textContent).toContain(
  'Copy credentials',
)
expect(screen.getByRole('button', { name: 'Copy credentials' }).className).toContain(
  'text-xs',
)
```

- [x] **Step 2: Run the focused test and confirm the red state**

Expected: FAIL because the renderer ignores Ledger Text, right position still uses 9/16 tracks, and Copy all retains `text-sm`.

- [x] **Step 3: Normalize Ledger Text at the server boundary**

Destructure `ledgerText` in `BankDetailsBlockComponent`, resolve it once, and pass the complete object:

```tsx
const resolvedLedgerText = normalizeBankDetailsLedgerText(ledgerText)

<BankDetailsClient
  accounts={resolvedAccounts}
  ledgerText={resolvedLedgerText}
  // existing props remain unchanged
/>
```

- [x] **Step 4: Render every persistent ledger string from the resolved contract**

Thread `ResolvedBankDetailsLedgerText` through `BankDetailsClient`, `BankAccountPanel`, and
`BankDetailsLedger`. Use it for the purpose suffix, ledger title, verification label, six
description-term labels, and Copy all visible label. The default Copy all accessible name follows
that visible label; copied-state text, icon-only field names, errors, QR caption, and QR fallback
remain code-owned.

Update `CopyControl` with an optional `visibleLabel` and add `text-xs` only for `copyKey === 'all'`:

```tsx
className={cn(
  'min-h-11 text-light-overlay-foreground lg:min-h-8',
  isCopyAll && 'text-xs',
  // existing surface and touch-target classes
)}

{isCopyAll ? (copied ? 'Copied' : visibleLabel) : null}
```

Resolve the Copy all accessible name from `visibleLabel` while it is idle, and retain the existing
code-owned copied announcement after activation.

- [x] **Step 5: Mirror the desktop grid tracks**

Keep child DOM order and existing order classes, but select the track definition from `panelPosition`:

```tsx
className={cn(
  'overflow-hidden rounded-card border border-border lg:grid',
  panelPosition === 'right'
    ? 'lg:grid-cols-[minmax(0,16fr)_minmax(0,9fr)]'
    : 'lg:grid-cols-[minmax(0,9fr)_minmax(0,16fr)]',
)}
```

- [x] **Step 6: Re-run focused tests, TypeScript, and scoped lint**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/bank-details.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/BankDetails tests/int/bank-details.int.spec.tsx
```

Expected: all commands exit successfully.

---

### Task 3: Generated artifacts, documentation, visual QA, and regression checks

**Files:**
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/bank-details.jpg`
- Modify: `src/payload-types.ts`
- Verify: `src/app/(payload)/admin/importMap.js`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: completed schema and renderer behavior from Tasks 1–2.
- Produces: synchronized Payload contracts, Admin preview, maintained documentation, and deployment evidence.

- [x] **Step 1: Exercise the right-position state in the thumbnail fixture**

Set `panelPosition="right"` for the Bank Details thumbnail fixture and keep the production component
as the fixture target. Retain the default Ledger Text values so the thumbnail documents historical
fallback output as well as the corrected geometry.

- [x] **Step 2: Regenerate Payload contracts and the Admin import map**

Run:

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected: generated types include the optional nested `ledgerText` object; the import map remains valid.

- [x] **Step 3: Regenerate and inspect the Bank Details thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=bankDetails pnpm generate:block-thumbnails
```

Verify visually that the right-side blue panel is the narrower 36% track, the white ledger is the wider 64% track, the frame radius remains intact, and the Copy all label is visibly smaller without reducing its button target.

- [x] **Step 4: Update maintained behavior documentation**

Document the mirrored 36/64 tracks, optional Ledger Text group and defaults, historical fallback behavior, persistent-only customization boundary, and smaller Copy all typography in the operator guide, feature inventory, and block-system reference.

- [x] **Step 5: Run cross-block regression tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/bank-details.int.spec.tsx \
  tests/int/block-catalog.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: all selected files pass.

- [x] **Step 6: Complete project-context maintenance**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the inventory updates for the new nested fields and the context check reports current.

- [x] **Step 7: Run final verification and inspect the worktree**

Run:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
git diff --check
git status --short
git diff --cached --name-only
```

Expected: lint, TypeScript, build, and diff checks pass; all changes remain unstaged and uncommitted.
