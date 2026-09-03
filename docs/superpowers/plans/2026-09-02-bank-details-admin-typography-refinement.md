# Bank Details Admin and Typography Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Bank Details presentation controls into Theme Settings, make Copy all/QR credentials-only, and apply the approved Option A typography, eyebrow color, and compact-spacing treatment.

**Architecture:** Keep all stored field names and runtime defaults unchanged; only reorganize their Payload Admin tab placement. Continue using one pure formatter for Copy all and QR, then refine the existing client presentation with the shared surface-aware eyebrow contract and explicit responsive spacing.

**Tech Stack:** Payload CMS 3, React 19, Next.js 16, Tailwind CSS 4, `qrcode.react`, Vitest, Testing Library, Payload generators, block-thumbnail tooling.

## Global Constraints

- Keep every change uncommitted and unstaged.
- Preserve unrelated working-tree changes and the existing `bankDetails` slug/interface.
- Panel Mode and Panel Position retain their stored names, values, and defaults.
- Content retains authored panel labels, titles, descriptions, accounts, instructions, and actions.
- Theme Settings owns section appearance/alignment, Panel Mode, Panel Position, account-tab presentation, and section padding.
- Copy all and Scanner QR use the same credentials-only payload and exclude Payment Purpose.
- The contextual title uses the upright display family; the white-ledger title uses the upright sans family.
- Interior eyebrows and ledger metadata use the existing semantic surface-aware green accent.
- Compact Text mode keeps at least 2rem between the panel description and confirmation notice.
- Do not add a migration, endpoint, new stored field, visitor-facing mode control, or new dependency.

---

## File Structure

- `src/blocks/BankDetails/config.ts`: reorganize existing Admin fields between Content and Theme Settings.
- `src/blocks/BankDetails/normalizeBankDetails.ts`: keep one credentials-only Copy all/QR formatter.
- `src/blocks/BankDetails/BankDetailsClient.tsx`: implement Option A titles, semantic eyebrow/metadata colors, and compact notice spacing.
- `tests/int/bank-details.int.spec.tsx`: assert tab ownership, payload content, typography, color hooks, and spacing.
- `src/payload-types.ts`: regenerate Payload contracts after schema organization changes.
- `src/block-thumbnails/fixtures.tsx` and `public/block-thumbnails/bank-details.jpg`: preserve the representative fixture and regenerate its approved appearance.
- `docs/guides/blocks.md`, `docs/architecture/feature-inventory.md`, and `.agents/skills/project-context/references/block-system.md`: align maintained behavior documentation.
- `.agents/skills/project-context/references/project-inventory.json`: regenerate exact project facts.

### Task 1: Admin Placement and Credentials-Only Payload

**Files:**

- Modify: `tests/int/bank-details.int.spec.tsx`
- Modify: `src/blocks/BankDetails/config.ts`
- Modify: `src/blocks/BankDetails/normalizeBankDetails.ts`

**Interfaces:**

- Consumes: existing `BankDetailsBlock.fields` tab schema and `formatBankAccountCopyText(account)`.
- Produces: unchanged stored `displayMode`/`panelPosition` fields under Theme Settings and a formatter that begins with `Account holder`.

- [x] **Step 1: Add failing Admin-tab and payload tests**

  Add a helper that finds the owning tab label for a named field, then assert:

  ```ts
  expect(findOwningTabLabel(BankDetailsBlock.fields, 'displayMode')).toBe('Theme Settings')
  expect(findOwningTabLabel(BankDetailsBlock.fields, 'panelPosition')).toBe('Theme Settings')
  expect(findOwningTabLabel(BankDetailsBlock.fields, 'panelTitle')).toBe('Content')
  expect(formatBankAccountCopyText(account)).toBe(
    [
      'Account holder: SHREE NARAYAN FOUNDATION',
      'Account number: 50100411312877',
      'IFSC code: HDFC0007592',
      'Bank: HDFC Bank',
      'Branch & type: LEE ROAD (KOLKATA)',
      'UPI ID: snmih.admissions@sbi',
    ].join('\n'),
  )
  expect(formatBankAccountCopyText(account)).not.toContain('Payment purpose:')
  ```

- [x] **Step 2: Run the focused test and confirm the red state**

  Run:

  ```bash
  pnpm exec vitest run --config ./vitest.config.mts tests/int/bank-details.int.spec.tsx
  ```

  Expected: FAIL because both presentation fields still belong to Content and the formatter still emits Payment Purpose.

- [x] **Step 3: Move the existing select fields into Theme Settings**

  Move the complete `displayMode` and `panelPosition` field objects without renaming them. Place them after `contentAlignment` and before conditional account-tab controls:

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
  },
  ```

  Keep `officialAccountLabel`, `panelTitle`, `panelDescription`, and `accounts` in Content.

- [x] **Step 4: Remove Payment Purpose from the shared formatter**

  Return only payment-routing information:

  ```ts
  return [
    `Account holder: ${account.accountHolder}`,
    `Account number: ${account.accountNumber}`,
    `IFSC code: ${account.ifscCode}`,
    ...(account.bankName ? [`Bank: ${account.bankName}`] : []),
    ...(account.branch ? [`Branch & type: ${account.branch}`] : []),
    ...(account.upiId ? [`UPI ID: ${account.upiId}`] : []),
  ].join('\n')
  ```

  Do not create a QR-only formatter; `BankDetailsQRCode` must continue consuming this function.

- [x] **Step 5: Re-run the focused test**

  Run the same Vitest command. Expected: Admin placement and payload assertions PASS.

### Task 2: Option A Typography, Semantic Accents, and Compact Spacing

**Files:**

- Modify: `tests/int/bank-details.int.spec.tsx`
- Modify: `src/blocks/BankDetails/BankDetailsClient.tsx`

**Interfaces:**

- Consumes: shared `SectionEyebrow`, `sectionEyebrowClasses`, `SectionEyebrowSurface`, and the existing Text/Scanner panel composition.
- Produces: upright display/sans titles, surface-aware green metadata, and a guaranteed compact notice gap.

- [x] **Step 1: Add failing presentation assertions**

  Assert rendered markup exposes stable hooks/classes:

  ```ts
  expect(contextTitle.className).toContain('font-[family-name:var(--font-display)]')
  expect(contextTitle.className).not.toContain('italic')
  expect(ledgerTitle.className).toContain('font-[family-name:var(--font-text)]')
  expect(ledgerTitle.className).not.toContain('italic')
  expect(officialLabel.getAttribute('data-section-eyebrow-surface')).toBe('brand')
  expect(purposeLabel.getAttribute('data-section-eyebrow-surface')).toBe('lightOverlay')
  expect(instructionsWrapper.className).toContain('mt-8')
  expect(instructionsWrapper.className).toContain('lg:mt-auto')
  ```

  Add `data-bank-details-context-title`, `data-bank-details-ledger-title`, and `data-bank-details-instructions` hooks where needed so tests assert behavior instead of text collisions.

- [x] **Step 2: Run the focused test and confirm the red state**

  Expected: FAIL on italic titles, missing surface hooks, and missing compact spacing.

- [x] **Step 3: Apply the approved contextual typography and spacing**

  Render `officialAccountLabel` with shared `SectionEyebrow surface="brand"`. Remove `italic` from the contextual title. For Text instructions, use:

  ```tsx
  <div
    className={hasIntroduction ? 'mt-8 sm:mt-10 lg:mt-auto lg:pt-10' : 'mt-auto'}
    data-bank-details-instructions="true"
  >
  ```

  This guarantees compact separation while retaining desktop bottom anchoring.

- [x] **Step 4: Apply the operational-ledger typography and semantic accents**

  Render the purpose through `SectionEyebrow surface="lightOverlay"`; render `Bank Account Information` with the explicit `font-[family-name:var(--font-text)]` token, bold weight, tight tracking, and no italic. Reuse `sectionEyebrowClasses` plus `data-section-eyebrow-surface="lightOverlay"` for `<dt>` metadata labels so the theme owns the green accent and contrast.

  Keep account values and numeral-specific mono styling unchanged.

  Preserve 44px minimum Copy-control targets on compact and tablet layouts, then return to the
  established compact button footprint at the desktop breakpoint.

  Keep the intentionally white ledger readable in both website schemes by using the shared
  `light-overlay-foreground` token for its text, controls, and dividers.

- [x] **Step 5: Re-run focused tests and lint**

  Run:

  ```bash
  pnpm exec vitest run --config ./vitest.config.mts tests/int/bank-details.int.spec.tsx
  pnpm exec eslint src/blocks/BankDetails tests/int/bank-details.int.spec.tsx
  pnpm exec tsc --noEmit
  ```

  Expected: all commands exit successfully.

### Task 3: Generated Artifacts, Documentation, and Final Verification

**Files:**

- Modify: `src/payload-types.ts`
- Verify: `src/app/(payload)/admin/importMap.js`
- Modify: `public/block-thumbnails/bank-details.jpg`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: completed Tasks 1–2.
- Produces: synchronized generated contracts, editor documentation, thumbnail, context inventory, and deployment verification.

- [x] **Step 1: Regenerate Payload contracts**

  Run:

  ```bash
  pnpm generate:types
  pnpm generate:importmap
  ```

  Expected: both commands exit successfully; generated field names/types remain stable because tab placement does not alter stored paths.

- [x] **Step 2: Update maintained behavior documentation**

  State explicitly that Panel Mode/Position live in Theme Settings, Copy all/QR omit Payment Purpose, Option A uses upright display/sans titles, semantic green eyebrows, and compact notice spacing.

- [x] **Step 3: Regenerate and visually inspect the block thumbnail**

  Run:

  ```bash
  BLOCK_THUMBNAIL_SLUG=bankDetails pnpm generate:block-thumbnails
  ```

  Inspect `public/block-thumbnails/bank-details.jpg` for title hierarchy, accent contrast, and notice separation at desktop. Inspect the local preview at a 390px viewport for the compact gap and absence of horizontal overflow.

- [x] **Step 4: Run cross-block regression tests**

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

- [x] **Step 5: Complete repository context maintenance**

  Run:

  ```bash
  pnpm project-context:update
  pnpm project-context:check
  ```

  Expected: the inventory is current; a stale knowledge-graph commit warning is non-blocking.

- [x] **Step 6: Run production verification and audit the diff**

  Run:

  ```bash
  pnpm lint
  pnpm build
  git diff --check
  git status --short --branch
  ```

  Expected: lint/build/diff checks pass, `develop` remains aligned with `origin/develop`, and every Bank Details change remains uncommitted and unstaged.
