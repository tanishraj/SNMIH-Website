# Bank Details Purpose Eyebrow Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render each Bank Details account's Payment Purpose as the complete white-card eyebrow and remove Purpose Suffix authoring.

**Architecture:** Keep `accounts[].purpose` as the single source for both the account tab and its ledger eyebrow. Remove `ledgerText.purposeSuffix` from the Payload schema and server normalization contract, render the normalized purpose directly, and regenerate Payload types. Historical suffix properties require no migration because the removed property can remain inert in old documents.

**Tech Stack:** Payload CMS 3, React 19, Next.js 16, TypeScript, Vitest, Testing Library.

## Global Constraints

- Preserve the top-level section `eyebrow` field; it is unrelated to the per-account purpose eyebrow.
- Preserve every other Bank Details field, runtime default, layout, style, copy interaction, and QR behavior.
- Do not add a replacement eyebrow field or migrate stored content.
- Do not modify `.env`.
- Do not stage or commit changes.

---

## File Structure

- `tests/int/bank-details.int.spec.tsx`: proves the removed field is absent and the visitor eyebrow equals Payment Purpose exactly.
- `src/blocks/BankDetails/config.ts`: owns the Payload Admin Ledger Text fields.
- `src/blocks/BankDetails/types.ts`: owns the local server/client Bank Details value contracts.
- `src/blocks/BankDetails/normalizeBankDetails.ts`: owns runtime ledger-label defaults and normalization.
- `src/blocks/BankDetails/BankDetailsClient.tsx`: renders the white-card purpose eyebrow.
- `src/payload-types.ts`: generated Payload schema types.
- `.agents/skills/project-context/references/block-system.md`: documents the Bank Details authoring and rendering contract.
- `.agents/skills/project-context/references/project-inventory.json`: generated repository inventory.

### Task 1: Lock the simplified schema and rendering behavior

**Files:**
- Modify: `tests/int/bank-details.int.spec.tsx`

**Interfaces:**
- Consumes: `BankDetailsBlock.fields` and `BankDetailsBlockComponent`.
- Produces: regression coverage requiring no `purposeSuffix` schema field and exact `accounts[].purpose` eyebrow output.

- [x] **Step 1: Update the schema expectation**

Remove `purposeSuffix: 'account'` from `ledgerTextDefaults`, then add:

```ts
expect(findNamedField(BankDetailsBlock.fields, 'purposeSuffix')).toBeUndefined()
```

- [x] **Step 2: Update the rendering expectations**

Change the default and Scanner-mode assertions to expect the authored purpose exactly:

```ts
expect(screen.getByText('Admissions')).toBeTruthy()
```

Remove `purposeSuffix` from the customized `ledgerText` object and replace the combined-label assertion with:

```ts
expect(screen.getByText('Admissions')).toBeTruthy()
expect(screen.queryByText('Admissions payment details')).toBeNull()
```

- [x] **Step 3: Run the focused test and confirm the red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/bank-details.int.spec.tsx
```

Expected: FAIL because the schema still exposes `purposeSuffix` and the renderer still appends the default suffix.

### Task 2: Remove Purpose Suffix from the schema and runtime

**Files:**
- Modify: `src/blocks/BankDetails/config.ts`
- Modify: `src/blocks/BankDetails/types.ts`
- Modify: `src/blocks/BankDetails/normalizeBankDetails.ts`
- Modify: `src/blocks/BankDetails/BankDetailsClient.tsx`

**Interfaces:**
- Consumes: required normalized `ResolvedBankAccount.purpose`.
- Produces: a `ResolvedBankDetailsLedgerText` contract containing only persistent ledger labels and a purpose eyebrow containing only `account.purpose`.

- [x] **Step 1: Remove the Payload field and local type**

Delete this field from `ledgerText.fields` in `config.ts`:

```ts
{
  name: 'purposeSuffix',
  label: 'Purpose Suffix',
  type: 'text',
  defaultValue: 'account',
},
```

Delete this property from `BankDetailsLedgerTextValue` in `types.ts`:

```ts
purposeSuffix?: string | null
```

- [x] **Step 2: Remove suffix normalization**

Delete the following default and normalized result properties from `normalizeBankDetails.ts`:

```ts
purposeSuffix: 'account',
```

```ts
purposeSuffix:
  normalizeText(source.purposeSuffix) || bankDetailsLedgerTextDefaults.purposeSuffix,
```

- [x] **Step 3: Render Payment Purpose directly**

Replace the purpose eyebrow children in `BankDetailsClient.tsx` with:

```tsx
{account.purpose}
```

This removes both suffix interpolation and its literal joining space.

- [x] **Step 4: Run the focused test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/bank-details.int.spec.tsx
```

Expected: PASS.

### Task 3: Regenerate contracts and complete repository verification

**Files:**
- Modify: `src/payload-types.ts`
- Modify if required: `.agents/skills/project-context/references/block-system.md`
- Modify if generated: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: the updated registered Payload block schema.
- Produces: generated types and maintained project knowledge without `purposeSuffix`.

- [x] **Step 1: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `BankDetailsBlock.ledgerText` and `BankDetailsBlockSelect` no longer contain `purposeSuffix`.

- [x] **Step 2: Update the maintained Bank Details narrative**

If `block-system.md` describes suffix composition, replace it with the explicit contract that Payment Purpose is reused unchanged for the account tab and white-card eyebrow. Do not rewrite historical specs or plans.

- [x] **Step 3: Run focused and static verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/bank-details.int.spec.tsx
pnpm exec eslint src/blocks/BankDetails/config.ts src/blocks/BankDetails/types.ts src/blocks/BankDetails/normalizeBankDetails.ts src/blocks/BankDetails/BankDetailsClient.tsx tests/int/bank-details.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: every command exits successfully.

- [x] **Step 4: Complete the required project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
git diff --check
git status --short
```

Expected: project context is current, the diff has no whitespace errors, `.env` is unchanged, and no commit exists for this work.
