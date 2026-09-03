# Bank Details Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the existing uncommitted Bank Details block into the approved 36/64 institutional panel with admin-selected Text/Scanner mode, reversible desktop placement, generated QR content, and a deliberately small required-field set.

**Architecture:** Preserve the existing server-owned section shell and client-owned account tabs/clipboard state. Expand the pure normalizer so one formatter is the source of truth for Copy all and QR content, then add one focused QR presentation component and refactor the active-account panel around the approved Primary/white split. Keep catalog, renderer, section appearance, tab, thumbnail, generated-type, documentation, and project-context contracts in parity.

**Tech Stack:** Payload CMS 3, React 19, Next.js 16, Radix Tabs, Tailwind CSS 4, `qrcode.react`, lucide-react, Vitest, Testing Library, Payload generators, block-thumbnail tooling.

## Global Constraints

- Keep every change uncommitted and unstaged.
- Preserve unrelated working-tree changes.
- Payload slug remains `bankDetails`; generated interface remains `BankDetailsBlock`.
- Existing outer section appearance, heading, alignment, actions, spacing, account tabs, and footer actions remain unchanged.
- Text/Scanner mode and Left/Right panel position are editor settings with runtime defaults of `text` and `left`; neither renders a visitor-facing switch.
- The inner desktop panel is always 36/64; compact layouts always stack the contextual panel before the ledger.
- The accounts array, purpose, account holder, account number, and IFSC code are the only mandatory authored data.
- Bank name, branch/type, UPI ID, instructions, and contextual copy are optional and omit cleanly when blank.
- Copy all and Scanner QR consume the same normalized plain-text formatter.
- QR generation is local and makes no network request.
- Clipboard interaction uses `navigator.clipboard.writeText` only.
- Do not add a collection, global, endpoint, migration, uploaded QR asset, payment URI, or external banking integration.

---

## File Structure

- `src/blocks/BankDetails/types.ts`: authored, resolved, mode, position, and tab data contracts.
- `src/blocks/BankDetails/normalizeBankDetails.ts`: required-row filtering, optional-value normalization, and canonical credential payload formatting.
- `src/blocks/BankDetails/config.ts`: Payload Admin fields, defaults, conditional controls, and duplicate-purpose validation.
- `src/blocks/BankDetails/Component.tsx`: unchanged shared section shell plus mode/position/context normalization.
- `src/blocks/BankDetails/BankDetailsClient.tsx`: account tabs, approved panel composition, per-value clipboard behavior, and active-account coordination.
- `src/blocks/BankDetails/BankDetailsQRCode.tsx`: accessible local SVG QR presentation generated from the canonical formatter.
- `tests/int/bank-details.int.spec.tsx`: schema, normalization, modes, layout, QR, tabs, clipboard, and accessibility contracts.
- `package.json` and `pnpm-lock.yaml`: local QR renderer dependency.
- `src/block-thumbnails/fixtures.tsx` and `public/block-thumbnails/bank-details.jpg`: representative approved design.
- `src/payload-types.ts` and `src/app/(payload)/admin/importMap.js`: generated Payload contracts.
- `docs/guides/blocks.md`, `docs/architecture/feature-inventory.md`, and `.agents/skills/project-context/references/block-system.md`: editor and architecture documentation.

### Task 1: Schema, Types, and Canonical Credential Payload

**Files:**

- Modify: `src/blocks/BankDetails/types.ts`
- Modify: `src/blocks/BankDetails/normalizeBankDetails.ts`
- Modify: `src/blocks/BankDetails/config.ts`
- Modify: `tests/int/bank-details.int.spec.tsx`

**Interfaces:**

- Consumes: existing `BankAccountValue`, `BankDetailsBlockLike`, Payload field factories, and `validateBankAccounts`.
- Produces: `BankDetailsDisplayMode`, `BankDetailsPanelPosition`, optional resolved credential fields, `normalizeBankAccounts(accounts)`, and `formatBankAccountCopyText(account)` for the panel and QR tasks.

- [ ] **Step 1: Replace the normalization expectations with the approved minimum contract**

  Add a valid row with only the mandatory fields, assert blank optional fields are omitted, and assert Copy all includes optional lines only when values exist:

  ```ts
  const minimumAccount = {
    purpose: 'Admissions',
    accountHolder: 'SHREE NARAYAN FOUNDATION',
    accountNumber: '50100411312877',
    ifscCode: 'HDFC0007592',
  }

  expect(normalizeBankAccounts([minimumAccount])).toEqual([
    {
      ...minimumAccount,
      id: 'bank-account-1',
    },
  ])

  expect(formatBankAccountCopyText(normalizeBankAccounts([{ ...minimumAccount, upiId: 'snmih@sbi' }])[0]!)).toBe(
    [
      'Payment purpose: Admissions',
      'Account holder: SHREE NARAYAN FOUNDATION',
      'Account number: 50100411312877',
      'IFSC code: HDFC0007592',
      'UPI ID: snmih@sbi',
    ].join('\n'),
  )
  ```

  Retain incomplete-row assertions for missing purpose, holder, account number, or IFSC. Remove expectations that missing bank name or branch invalidates a row.

- [ ] **Step 2: Add failing schema assertions for optional fields and editor settings**

  Assert these exact contracts:

  ```ts
  expect(findNamedField(BankDetailsBlock.fields, 'displayMode')).toMatchObject({
    type: 'select',
    defaultValue: 'text',
    options: [
      { label: 'Text', value: 'text' },
      { label: 'Scanner', value: 'scanner' },
    ],
  })
  expect(findNamedField(BankDetailsBlock.fields, 'panelPosition')).toMatchObject({
    type: 'select',
    defaultValue: 'left',
  })
  expect(findNamedField(BankDetailsBlock.fields, 'panelTitle')).not.toHaveProperty('required', true)
  expect(findNamedField(BankDetailsBlock.fields, 'bankName')).not.toHaveProperty('required', true)
  expect(findNamedField(BankDetailsBlock.fields, 'branch')).not.toHaveProperty('required', true)
  expect(findNamedField(BankDetailsBlock.fields, 'upiId')).toMatchObject({ type: 'text' })
  ```

  Also assert `purpose`, `accountHolder`, `accountNumber`, and `ifscCode` remain required.

- [ ] **Step 3: Run the focused test and confirm the red state**

  Run:

  ```bash
  pnpm exec vitest run --config ./vitest.config.mts tests/int/bank-details.int.spec.tsx
  ```

  Expected: FAIL because optional bank/branch rows are filtered and the new schema fields do not exist.

- [ ] **Step 4: Update the authored and resolved types**

  Add these unions and fields:

  ```ts
  export type BankDetailsDisplayMode = 'scanner' | 'text'
  export type BankDetailsPanelPosition = 'left' | 'right'

  export type BankAccountValue = {
    accountHolder?: string | null
    accountNumber?: string | null
    bankName?: string | null
    branch?: string | null
    id?: string | null
    ifscCode?: string | null
    instructions?: string | null
    purpose?: string | null
    upiId?: string | null
  }

  export type ResolvedBankAccount = {
    accountHolder: string
    accountNumber: string
    bankName?: string
    branch?: string
    id: string
    ifscCode: string
    instructions?: string
    purpose: string
    upiId?: string
  }
  ```

  Add `displayMode`, `panelDescription`, and `panelPosition` to `BankDetailsBlockLike` using the new unions.

- [ ] **Step 5: Update normalization and the shared formatter**

  Keep a row when the four mandatory strings are nonblank. Add optional values only when trimmed and build payload lines without placeholders:

  ```ts
  const optionalLines = [
    account.bankName ? `Bank: ${account.bankName}` : undefined,
    account.branch ? `Branch & type: ${account.branch}` : undefined,
    account.upiId ? `UPI ID: ${account.upiId}` : undefined,
  ].filter((line): line is string => Boolean(line))

  return [
    `Payment purpose: ${account.purpose}`,
    `Account holder: ${account.accountHolder}`,
    `Account number: ${account.accountNumber}`,
    `IFSC code: ${account.ifscCode}`,
    ...optionalLines,
  ].join('\n')
  ```

  Do not include `instructions` in this formatter.

- [ ] **Step 6: Update the Payload Content tab**

  Add optional select fields with defaults and descriptions:

  ```ts
  {
    name: 'displayMode',
    label: 'Panel Mode',
    type: 'select',
    defaultValue: 'text',
    options: [
      { label: 'Text', value: 'text' },
      { label: 'Scanner', value: 'scanner' },
    ],
  },
  {
    name: 'panelPosition',
    label: 'Panel Position',
    type: 'select',
    defaultValue: 'left',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ],
    admin: { description: 'Desktop only. The contextual panel remains first on smaller screens.' },
  },
  ```

  Add optional `panelDescription`, remove `required: true` from `panelTitle`, `bankName`, and
  `branch`, relabel branch as `Branch & Type`, and add optional `upiId` labelled `UPI ID`. Preserve
  the current account array, section fields, Theme Settings, and row-label registration.

- [ ] **Step 7: Re-run the focused tests and lint the data layer**

  Run:

  ```bash
  pnpm exec vitest run --config ./vitest.config.mts tests/int/bank-details.int.spec.tsx
  pnpm exec eslint src/blocks/BankDetails/config.ts src/blocks/BankDetails/types.ts src/blocks/BankDetails/normalizeBankDetails.ts tests/int/bank-details.int.spec.tsx
  ```

  Expected: schema/normalization cases PASS; panel-layout cases may remain red until Task 2. ESLint reports no errors in the changed data-layer files.

### Task 2: Scanner QR and Approved 36/64 Panel

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/blocks/BankDetails/BankDetailsQRCode.tsx`
- Modify: `src/blocks/BankDetails/Component.tsx`
- Modify: `src/blocks/BankDetails/BankDetailsClient.tsx`
- Modify: `tests/int/bank-details.int.spec.tsx`

**Interfaces:**

- Consumes: Task 1's `BankDetailsDisplayMode`, `BankDetailsPanelPosition`, `ResolvedBankAccount`, and `formatBankAccountCopyText(account)`.
- Produces: `BankDetailsQRCode({ account })` and a `BankDetailsClient` that renders Text or Scanner mode, reversible desktop columns, all visible optional rows, and shared copy feedback.

- [ ] **Step 1: Add failing visitor behavior tests**

  Cover these observable contracts:

  ```ts
  expect(panel.className).toContain('lg:grid-cols-[minmax(0,9fr)_minmax(0,16fr)]')
  expect(panel.getAttribute('data-panel-position')).toBe('right')
  expect(context.className).toContain('lg:order-2')
  expect(details.className).toContain('lg:order-1')
  expect(screen.queryByRole('button', { name: /scanner mode/i })).toBeNull()
  expect(screen.queryByRole('button', { name: /text mode/i })).toBeNull()
  ```

  Add separate Text and Scanner cases. Text renders instructions at the contextual-panel bottom and
  no QR. Scanner renders a QR for `formatBankAccountCopyText(account)` and no instructions notice.
  Assert missing optional bank/branch/UPI rows are absent, supplied values appear in the approved
  order, every visible value has an accessible Copy button, and the white ledger includes the
  `Bank Account Information` heading and `Verified` label.

- [ ] **Step 2: Run the focused test and confirm the red state**

  Run:

  ```bash
  pnpm exec vitest run --config ./vitest.config.mts tests/int/bank-details.int.spec.tsx
  ```

  Expected: FAIL on the old 40/60 panel, missing modes/position, absent UPI row, and missing QR.

- [ ] **Step 3: Install the local SVG QR renderer**

  Run:

  ```bash
  pnpm add qrcode.react
  ```

  Expected: `qrcode.react` is added to `dependencies`, `pnpm-lock.yaml` is updated, and no install
  script failure occurs.

- [ ] **Step 4: Implement the focused QR component**

  Create `BankDetailsQRCode.tsx` with a real SVG QR, an accessible caption, and a deterministic
  oversized-payload fallback. A QR at error-correction level M supports substantially more than the
  normal bank payload; use a conservative 1,800-byte ceiling so malformed historical strings cannot
  make the renderer throw:

  ```tsx
  import { QRCodeSVG } from 'qrcode.react'

  import { formatBankAccountCopyText } from './normalizeBankDetails'
  import type { ResolvedBankAccount } from './types'

  export function BankDetailsQRCode({ account }: { account: ResolvedBankAccount }) {
    const payload = formatBankAccountCopyText(account)

    if (new TextEncoder().encode(payload).byteLength > 1_800) {
      return (
        <p className="text-sm text-current/75" data-bank-details-qr-unavailable="true" role="status">
          QR unavailable. Use the visible bank details instead.
        </p>
      )
    }

    return (
      <figure className="flex flex-col items-center gap-3" data-bank-details-qr="true">
        <div className="rounded-compact bg-white p-3 text-[#092956]">
          <QRCodeSVG aria-hidden="true" level="M" size={184} value={payload} />
        </div>
        <figcaption className="text-center text-sm text-current/75">
          Scan the {account.purpose} account details
        </figcaption>
      </figure>
    )
  }
  ```

  Keep the visible ledger as the equivalent non-scanning path.

- [ ] **Step 5: Resolve mode, position, and contextual copy in the server shell**

  In `Component.tsx`, normalize with exact fallbacks:

  ```ts
  const resolvedDisplayMode = displayMode === 'scanner' ? 'scanner' : 'text'
  const resolvedPanelPosition = panelPosition === 'right' ? 'right' : 'left'
  const resolvedPanelDescription = panelDescription?.trim()
  ```

  Pass those values with the existing resolved title/official label and normalized accounts to
  `BankDetailsClient`. Do not change the outer section classes, introduction, actions, or footer.

- [ ] **Step 6: Refactor the active account panel**

  Introduce file-local `BankDetailsContextPanel` and `BankDetailsLedger` helpers with these explicit
  interfaces:

  ```ts
  type BankDetailsContextPanelProps = {
    account: ResolvedBankAccount
    displayMode: BankDetailsDisplayMode
    officialAccountLabel?: string
    panelDescription?: string
    panelPosition: BankDetailsPanelPosition
    panelTitle?: string
  }

  type BankDetailsLedgerProps = {
    account: ResolvedBankAccount
    copyState: CopyState
    onCopy: (copyKey: CopyKey, value: string) => Promise<void>
    panelPosition: BankDetailsPanelPosition
  }
  ```

  Compose those helpers with this stable topology:

  ```tsx
  <div
    className="overflow-hidden rounded-card border border-border lg:grid lg:grid-cols-[minmax(0,9fr)_minmax(0,16fr)]"
    data-bank-details-panel="true"
    data-panel-position={panelPosition}
  >
    <BankDetailsContextPanel
      account={account}
      displayMode={displayMode}
      officialAccountLabel={officialAccountLabel}
      panelDescription={panelDescription}
      panelPosition={panelPosition}
      panelTitle={panelTitle}
    />
    <BankDetailsLedger
      account={account}
      copyState={copyState}
      onCopy={onCopy}
      panelPosition={panelPosition}
    />
  </div>
  ```

  `BankDetailsContextPanel` owns the `order-1 ... bg-primary ...` classes and adds `lg:order-2` only
  for Right. Its content order is eyebrow, italic display title, description, then mode content. Text
  instructions use `mt-auto`; Scanner mode renders `BankDetailsQRCode`.

  `BankDetailsLedger` owns the `order-2 ... bg-white text-[#10233e] ...` classes and adds
  `lg:order-1` only for Right. It renders active purpose, `Bank Account Information`, `Verified`, a
  responsive two-column `dl`, one row for each available value, one value-specific icon-only Copy
  control per row, the polite status region, and Copy all details. The ordered row definitions are
  account holder, account number, optional bank name, IFSC, optional branch/type, and optional UPI ID.

- [ ] **Step 7: Generalize clipboard state without changing feedback semantics**

  Define keys for every credential plus `all`:

  ```ts
  type CopyKey =
    | 'accountHolder'
    | 'accountNumber'
    | 'bankName'
    | 'ifscCode'
    | 'branch'
    | 'upiId'
    | 'all'
  ```

  Use code-owned labels such as `Copy account holder`, `Copy bank name`, and `Copy UPI ID`. Preserve
  the two-second timer, account-change reset, focus behavior, exact clipboard failure message, and
  one polite live region. Copy all continues to use `formatBankAccountCopyText(activeAccount)`.

- [ ] **Step 8: Run focused tests and lint the component layer**

  Run:

  ```bash
  pnpm exec vitest run --config ./vitest.config.mts tests/int/bank-details.int.spec.tsx
  pnpm exec eslint src/blocks/BankDetails tests/int/bank-details.int.spec.tsx
  ```

  Expected: all Bank Details tests PASS and ESLint reports no errors.

### Task 3: Generated Contracts, Thumbnail, and Maintained Documentation

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/bank-details.jpg`
- Modify: `src/payload-types.ts` (generated)
- Modify: `src/app/(payload)/admin/importMap.js` (generated)
- Modify: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json` (generated)

**Interfaces:**

- Consumes: Tasks 1–2 schema and public component.
- Produces: accurate editor preview, Payload/Admin generated contracts, operator guidance, feature inventory, and project-context facts.

- [ ] **Step 1: Update the production thumbnail fixture**

  Use one representative account with the new optional fields and approved Text/Left mode:

  ```tsx
  <BankDetailsBlockComponent
    accounts={[{
      accountHolder: 'Example Medical Institute',
      accountNumber: '000000000000',
      bankName: 'Example Bank',
      branch: 'Demo Branch',
      id: 'preview',
      ifscCode: 'TEST0000000',
      instructions: 'Sample payment details for block preview only.',
      purpose: 'Preview account',
      upiId: 'demo@invalid',
    }]}
    displayMode="text"
    officialAccountLabel="Demo account"
    panelDescription="Use the account information for admissions and official student fee payments."
    panelPosition="left"
    panelTitle="Bank transfer details"
  />
  ```

- [ ] **Step 2: Regenerate Payload types and Admin import map**

  Run:

  ```bash
  pnpm generate:types
  pnpm generate:importmap
  ```

  Expected: `BankDetailsBlock` contains optional `displayMode`, `panelPosition`, `panelDescription`,
  `bankName`, `branch`, and `upiId`; the RowLabel import remains present.

- [ ] **Step 3: Regenerate only the Bank Details thumbnail**

  Run:

  ```bash
  BLOCK_THUMBNAIL_SLUG=bankDetails pnpm generate:block-thumbnails
  ```

  Expected: `public/block-thumbnails/bank-details.jpg` remains a 1600×900 JPEG and visibly reflects
  the approved 36/64 Text-mode layout.

- [ ] **Step 4: Update public and internal documentation**

  In all three narrative documents, replace the former fixed 40/60 required-six-field contract with:

  ```text
  Bank Details uses an admin-selected Text or locally generated Scanner mode inside a stable 36/64
  Primary/white panel. Editors can reverse desktop panel placement. Purpose, account holder, account
  number, and IFSC are required; bank name, branch/type, UPI ID, contextual copy, and instructions
  are optional and disappear cleanly when blank. Copy all and QR share one normalized payload.
  Existing section appearance, actions, spacing, and multi-account tabs remain unchanged.
  ```

  Preserve documented block totals and registrations unless a generator proves they changed.

- [ ] **Step 5: Refresh and check project context**

  Run:

  ```bash
  pnpm project-context:update
  pnpm project-context:check
  ```

  Expected: the generated inventory matches the current source and the project-context check passes.

- [ ] **Step 6: Run artifact and registration contracts**

  Run:

  ```bash
  pnpm exec vitest run --config ./vitest.config.mts \
    tests/int/bank-details.int.spec.tsx \
    tests/int/block-catalog.int.spec.ts \
    tests/int/page-blocks.int.spec.ts \
    tests/int/block-thumbnails.int.spec.ts \
    tests/int/block-thumbnail-fixtures.int.spec.ts
  ```

  Expected: all selected integration tests PASS.

### Task 4: Final Verification and Uncommitted Handoff

**Files:**

- Inspect: all files changed by Tasks 1–3
- Inspect: `docs/superpowers/specs/2026-09-01-bank-details-block-design.md`
- Inspect: `docs/superpowers/plans/2026-09-01-bank-details-block.md`

**Interfaces:**

- Consumes: the complete reworked block and maintained artifacts.
- Produces: a verified uncommitted working tree with an evidence-backed handoff.

- [ ] **Step 1: Run TypeScript and repository lint**

  Run:

  ```bash
  pnpm exec tsc --noEmit
  pnpm lint
  ```

  Expected: both commands exit successfully. If an unrelated pre-existing failure remains, record
  its exact file and message separately from Bank Details results.

- [ ] **Step 2: Run the production build**

  Run:

  ```bash
  pnpm build
  ```

  Expected: Next.js completes compilation, type checks, page generation, and build output with exit
  code 0.

- [ ] **Step 3: Inspect the complete diff and generated scope**

  Run:

  ```bash
  git diff --check
  git status --short
  git diff -- src/blocks/BankDetails tests/int/bank-details.int.spec.tsx package.json pnpm-lock.yaml
  ```

  Expected: no whitespace errors, no staged files, no accidental changes outside the documented
  Bank Details/generated/documentation surfaces, and no secret values.

- [ ] **Step 4: Re-run the project-context completion loop after final edits**

  Run:

  ```bash
  pnpm project-context:update
  pnpm project-context:check
  ```

  Expected: both commands pass and any generated inventory change is left uncommitted.

- [ ] **Step 5: Report the uncommitted handoff**

  Report the implemented behavior, dependency addition, tests/build results, documentation and
  project-context changes, and any unrelated verification blockers. Explicitly confirm that no
  files were staged or committed.
