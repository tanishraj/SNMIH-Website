# Bank Details Block Design

**Date:** 2026-09-01
**Status:** Approved for implementation
**Selected direction:** Stable mirrored 36/64 Institutional Panel with Editorial Context,
Operational Ledger typography, and editor-owned persistent panel text

## Summary

Add a Page-compatible `bankDetails` block for publishing one to six ordered official payment
accounts. The block retains the project's existing section introduction, actions, appearance,
spacing, account tabs, and footer actions. Inside that unchanged section shell, it renders a fixed
36/64 split between a contextual Primary panel and a white bank-information panel, preserving those
proportions when the panels exchange desktop sides.

Editors choose one block-wide contextual mode in Payload Admin:

- **Text:** institutional guidance appears in the contextual panel.
- **Scanner:** a QR code generated from the active account appears in the contextual panel.

Editors may also place the contextual panel on the left or right. Neither choice is exposed as a
visitor-facing switch. On compact screens, the contextual panel always precedes the account details
in normal document flow.

Panel Mode and Panel Position are presentation controls and therefore live in the existing Theme
Settings tab with the other block-wide visual settings. Contextual labels, titles, descriptions,
accounts, instructions, and the grouped persistent ledger text remain in Content.

One valid account renders directly. Two or more valid accounts use the existing accessible content
tab rail above the panel. Copy and QR operations stay entirely in the browser or rendered document;
account data is never sent to an API or third party.

The block remains independent from Fee Structure and PG Fee Structure. Those blocks continue to
model fees only.

## Goals

- Publish trustworthy bank-transfer credentials in a structured, easy-to-scan format.
- Support one to six purpose-specific accounts in author order.
- Let editors select Text or Scanner presentation without adding visitor controls.
- Let editors reverse the desktop panel position while preserving a stable mobile reading order.
- Keep the contextual panel at 36% and the account ledger at 64% regardless of which desktop side
  owns the contextual panel.
- Keep panel presentation controls with the block's other Theme Settings rather than mixing them
  into authored content.
- Let editors customize persistent text across both panels without exposing transient clipboard and
  QR system messages as content fields.
- Require only the credentials needed for a usable bank transfer.
- Omit absent optional values cleanly instead of showing empty rows or placeholders.
- Keep every visible value selectable and individually copyable.
- Generate Scanner mode from the same normalized account data used by the visible ledger and Copy
  all action, preventing a separate QR asset from becoming stale.
- Separate the editorial context from the operational ledger through an upright display/sans title
  pairing, without decorative italics.
- Reuse the project's existing section, theme, tab, preview, renderer, thumbnail, documentation, and
  testing contracts.

## Non-goals

- Do not add bank fields to Fee Structure or PG Fee Structure.
- Do not process payments, verify transfers, calculate fees, or collect transaction references.
- Do not validate accounts against an external banking service or infer missing banking details.
- Do not mask, parse, or internally reformat account numbers, IFSC codes, or UPI IDs.
- Do not upload or store a separate QR image.
- Do not create a visitor-facing Text/Scanner toggle or panel-position control.
- Do not create a collection, global, endpoint, data migration, or external integration.
- Do not add independent card-surface, column-count, or mobile-layout controls.
- Do not expose copy-success, clipboard-error, QR-caption, or QR-unavailable messages to editors.

## Existing Project Contracts

The block extends the incumbent editorial and visual system:

- `blockCatalog.ts` owns Page and Reusable Section registration and places specialized blocks in
  Advanced Library.
- `blockAppearanceFields.ts` and `blockAppearance.ts` own outer section backgrounds, borders,
  contrast, and legacy normalization.
- `blockSpacing.ts` owns the regular responsive container and vertical-padding scale.
- `contentStyles.ts`, `SectionEyebrow`, `ContentActions`, and `BlockFooterActions` own the optional
  section introduction and actions.
- `contentTabRail.ts` and `ScrollableContentTabRail` own multi-account tab geometry, keyboard focus,
  width behavior, horizontal overflow, and radius-clipped edge fades.
- Fee Structure and PG Fee Structure provide the closest section-shell and information-panel
  precedents, but their stored data remains independent.
- Production and live-preview block renderer switches remain explicit and separate.

## Payload Content Model

Create `BankDetailsBlock` with slug `bankDetails` and register it under Advanced Library. It is
available to Pages, Reusable Sections, and the standard-block portion of the News & Events Detail
Template through the canonical Page block catalog.

### Content tab

The standard section-introduction fields remain unchanged:

- `eyebrow`: optional text.
- `title`: optional text.
- `accentTitle`: optional italic accent title.
- `description`: optional textarea.
- `actions`: up to two shared Section Actions.

The inner Bank Details panel adds:

- `officialAccountLabel`: optional text used as the contextual-panel eyebrow. Existing saved values
  remain compatible; a trimmed empty value hides the eyebrow.
- `panelTitle`: optional text used as the contextual-panel title. Existing saved values remain
  compatible; a trimmed empty value hides the title.
- `panelDescription`: optional textarea shown below the contextual title.
- `ledgerText`: optional **Ledger Text** group whose fields customize persistent text on the white
  account ledger. Every field has an Admin default and the same runtime fallback:
  - `purposeSuffix`: `account`.
  - `ledgerTitle`: `Bank Account Information`.
  - `verifiedLabel`: `Verified`.
  - `accountHolderLabel`: `Account Holder`.
  - `accountNumberLabel`: `Account Number`.
  - `bankNameLabel`: `Bank Name`.
  - `ifscCodeLabel`: `IFSC Code`.
  - `branchLabel`: `Branch & Type`.
  - `upiIdLabel`: `UPI ID`.
  - `copyAllLabel`: `Copy all details`.
- `accounts`: required ordered array with one to six rows.
- `footerActions`: up to two shared Footer Actions.

`officialAccountLabel`, `panelTitle`, and `panelDescription` are available for both modes. In Scanner
mode they introduce the QR; in Text mode they introduce the guidance notice. None is required, and
the contextual panel remains valid with only its mode-specific content.

The Ledger Text group is organizational and stores only new nested values. It does not move or
rename the existing contextual fields. Missing, malformed, or whitespace-only Ledger Text values use
their code-owned defaults so historical blocks remain labelled and usable without a migration.

Each account row contains:

- `purpose`: **required** text used for account tabs, active-account context, and the Scanner caption.
- `accountHolder`: **required** text.
- `accountNumber`: **required** text so leading zeroes and authored punctuation remain intact.
- `ifscCode`: **required** text.
- `bankName`: optional text.
- `branch`: optional text, labelled `Branch & Type` in Admin and on the public panel.
- `upiId`: optional text.
- `instructions`: optional textarea used as the Text-mode notice for that account.

Only the accounts array, `purpose`, `accountHolder`, `accountNumber`, and `ifscCode` are mandatory.
The accounts array starts collapsed, and its row label exposes the trimmed purpose.

### Theme Settings tab

The existing section settings remain unchanged:

- Standard `appearance` group.
- `contentAlignment`: Left or Center for the optional outer introduction and its actions.
- `displayMode`, labelled **Panel Mode**: optional Text or Scanner select, defaulting at runtime and
  in Admin to Text.
- `panelPosition`, labelled **Panel Position**: optional Left or Right select, defaulting at runtime
  and in Admin to Left. It controls desktop placement only; compact layouts remain context first.
- `tabStyle`: Underline, Pills, or Boxed/Contained, visible only for multiple saved accounts.
- `tabWidth`: Content Width, Centered Auto Width, or Equal Full Width, visible only for multiple
  saved accounts.
- `size`: None, Compact, Default, or Comfortable section padding.

Theme Settings therefore groups all presentation controls in this order: section appearance,
section-content alignment, Panel Mode, Panel Position, conditional account-tab style and width, and
section padding. Moving the two fields between tabs changes only Admin organization; their stored
paths, values, defaults, generated field names, and runtime behavior remain unchanged.

## Validation and Normalization

Payload requires at least one account row and the four mandatory fields in every saved account.
Array validation rejects duplicate purpose values after outer-whitespace trimming and case folding.

A client-safe normalizer protects drafts, live preview, and historical malformed data:

1. Trim outer whitespace from every string.
2. Preserve internal characters and spacing exactly as authored.
3. Preserve account-row order.
4. Omit a row missing purpose, account holder, account number, or IFSC code.
5. Keep only the first complete occurrence of each normalized purpose.
6. Retain nonblank optional bank name, branch/type, UPI ID, and instructions values.
7. Use the Payload row ID when available and a deterministic source-index fallback otherwise.
8. Resolve unknown or absent mode to Text and unknown or absent position to Left.
9. Normalize every Ledger Text value independently, using its default when the group or value is
   absent, malformed, or whitespace-only.
10. Return no accounts when the source value is not an array.

The block renders nothing when no valid account remains. It never invents missing credentials or
substitutes another account.

## Visual and Responsive Contract

The optional outer section introduction remains identical to the Fee Structure and PG Fee Structure
section shell. It appears before account tabs and the inner panel; Footer Actions appear afterward.

### Account tabs

- One valid account omits the tab list.
- Two or more valid accounts use the shared tab rail in saved order.
- The first valid account is initially selected.
- Selecting an account updates the full ledger, Text notice, Scanner QR, and copy payload together.
- If live-preview edits remove the active row, selection resets to the first remaining account.
- Existing tab style, width, keyboard, and adaptive horizontal-overflow behavior remains unchanged.

### Stable 36/64 panel

At the `lg` breakpoint, the contextual panel occupies 36% and the account ledger occupies 64%.
`panelPosition="left"` uses `36/64` tracks and `panelPosition="right"` uses `64/36` tracks, so
reversing the desktop columns never transfers the ledger's wider track to the contextual panel.
Below `lg`, both
positions use one normal-flow column with the contextual panel first and the ledger second. Neither
region introduces an internal vertical scroller.

The complete frame uses the shared divider border, `rounded-card`, and clipped overflow. The
contextual panel uses the website Primary surface and paired foreground. The ledger intentionally
uses a white paper surface with dark credential text, muted metadata, and divider rules, matching the
approved reference while the outer section continues to honor its configured appearance.

The contextual title uses the existing display family in upright semibold form. The white-ledger
title uses the existing text/sans family in upright bold form. Neither
title is italic. This pairing keeps the left panel editorial and institutional while making the
credential ledger direct and operational.

Interior eyebrow and metadata color follows one disciplined semantic green accent. The contextual
eyebrow resolves against the Primary-colored `brand` surface through the shared `SectionEyebrow`
surface contract;
the account-purpose eyebrow and credential labels resolve against the fixed light ledger surface.
This replaces the current low-contrast blue/grey opacity treatment without adding a second accent or
hard-coded per-theme color.

### Contextual panel — Text mode

The Text panel contains, in order:

1. Optional official-account eyebrow.
2. Optional panel title.
3. Optional panel description.
4. The active account's optional instructions notice anchored to the bottom.

An empty notice is omitted without leaving a reserved box. If every optional text field is empty,
the contextual panel remains as a calm Primary surface rather than inventing copy.

Compact layouts preserve a visible minimum gap between the panel description and the instructions
notice even when the panel's content height becomes natural. Desktop keeps the notice bottom-anchored
and retains at least the same separation. The notice must never visually attach to the preceding
description.

### Contextual panel — Scanner mode

The Scanner panel contains the same optional eyebrow, title, and description followed by a generated
QR code for the active account. The QR encodes the exact normalized plain-text payload used by Copy
all; it is not a payment URI and does not imply payment processing. An accessible caption identifies
the purpose associated with the code.

The QR is generated locally as an SVG or equivalent crisp document asset. It requires no media
upload, remote request, tracking pixel, or third-party QR service. The visible ledger remains beside
or below it, so scanning is an enhancement rather than the only way to obtain the credentials.

### White account ledger

The ledger stays white in every website color scheme and therefore uses the dedicated
`light-overlay-foreground` token for headings, values, controls, and dividers instead of inheriting
the theme-dependent Primary foreground.

The ledger header contains:

- Active purpose as compact metadata, rendered as `<purpose> <purposeSuffix>`.
- Editor-configurable ledger title, defaulting to `Bank Account Information`.
- Editor-configurable verification label, defaulting to `Verified`, marking the editor-published
  official account.

The semantic description list renders available fields in this order, using the corresponding
Ledger Text label and its default when an override is absent:

1. Account holder.
2. Account number.
3. Bank name, when present.
4. IFSC code.
5. Branch & Type, when present.
6. UPI ID, when present.

Every visible value gets its own icon-only Copy action with a value-specific accessible name. Copy
controls retain at least a 44px touch target below the desktop breakpoint while their visible icon
and compact desktop footprint remain unchanged. Absent
optional fields omit their complete row and divider. Account number, IFSC code, and UPI ID use the
established mono family and safe wrapping. No value is truncated or masked. A labelled Copy all
action follows the list and aligns to the inline end on wide screens. Its visible label defaults to
`Copy all details`, remains editor-configurable, and uses the smaller `text-xs` control typography
without reducing its existing compact-screen touch target.

## Clipboard and QR Payload

The normalized credentials-only payload preserves this order and omits unavailable optional lines:

```text
Account holder: <accountHolder>
Account number: <accountNumber>
IFSC code: <ifscCode>
Bank: <bankName>              # omitted when blank
Branch & type: <branch>       # omitted when blank
UPI ID: <upiId>               # omitted when blank
```

Payment purpose is excluded because it is page context rather than payment-routing information.
Instructions are excluded because they are guidance rather than credentials. Purpose remains visible
in the ledger header, account tabs, and QR caption. Individual Copy buttons write the exact normalized
displayed value. Copy all and Scanner mode consume the same pure credentials formatter so their
content cannot drift.

Clipboard interaction uses `navigator.clipboard.writeText` only when available. Successful actions
show `Copied` feedback and announce the copied field through one polite live region; feedback clears
after two seconds or when the active account changes. If clipboard access is unavailable or rejects,
the visible values remain selectable and the live region announces: `Copy unavailable. Select and
copy the value manually.`

Copied-state text, icon-only field-specific accessible copy names, clipboard recovery copy, Scanner
captions, and QR-unavailable messages remain code-owned operational strings. They are not part of
Ledger Text. The default accessible name of Copy all follows its customized visible label so the
control preserves label-in-name accessibility.

## Accessibility

- The block uses a semantic `<section>` and preserves the existing optional heading hierarchy.
- Account data uses `<dl>`, `<dt>`, and `<dd>`.
- Multiple accounts use the shared accessible tabs.
- Copy controls are native buttons with value-specific accessible names and visible focus.
- QR content has a concise accessible name and adjacent purpose context; the visible ledger provides
  an equivalent non-scanning path.
- Text and Scanner are editor-selected render modes, not hidden visitor states.
- Color is never the only account-selection, verification, or copy-status signal.
- Text contrast remains explicit across the Primary contextual surface and white ledger surface.
- Compact layouts require no horizontal page scrolling or pointer-precision interaction.
- Reduced motion disables nonessential transitions; the block introduces no automatic motion.

## Runtime Architecture

Keep responsibilities isolated:

- `src/blocks/BankDetails/config.ts`: Payload fields, Admin conditions, defaults, row labels, and
  duplicate-purpose validation.
- `src/blocks/BankDetails/types.ts`: authored and resolved client-safe contracts.
- `src/blocks/BankDetails/normalizeBankDetails.ts`: account normalization, Ledger Text normalization,
  and the single shared credential payload formatter.
- `src/blocks/BankDetails/Component.tsx`: server-owned standard section shell and normalized-data
  boundary.
- `src/blocks/BankDetails/BankDetailsClient.tsx`: account tabs, panel composition, copy feedback, and
  active-account coordination.
- A focused QR presentation utility/component: deterministic local QR generation from the shared
  formatter, with no network or storage dependency.

The public component must remain server-renderable so account values are visible before hydration.
Only tabs and clipboard feedback require client state. QR generation must not delay or hide the
visible ledger.

## Registration and Documentation

Implementation updates the standard Page-block surfaces:

- Canonical Advanced Library registration through `blockCatalog.ts`.
- Equal production and live-preview renderer cases.
- Production-component thumbnail fixture, thumbnail definition, and 1600×900 JPEG.
- Generated Payload types and Admin import map.
- Focused schema, normalization, rendering, QR, tabs, clipboard, responsive, and accessibility tests.
- Block operator guide, feature inventory, maintained block-system contract, and generated project
  inventory.

No database migration is required. The new nested Ledger Text fields have Admin defaults and runtime
fallbacks, current saved `bankDetails` rows remain compatible, and formerly required bank
name/branch values remain valid as optional values.

## Failure and Edge-case Behavior

- Zero valid accounts: render nothing.
- One valid account: omit tabs.
- Two to six valid accounts: use tabs in resolved order.
- Duplicate purposes that bypass schema validation: keep the first valid occurrence.
- Blank optional section or panel content: omit its elements and wrappers.
- Missing bank name, branch/type, or UPI ID: omit the corresponding row and payload line.
- Unknown mode/position from malformed or older content: use Text/Left.
- Missing, malformed, or blank Ledger Text overrides: use the corresponding persistent-text default.
- QR generation failure: keep the visible ledger and show no broken image; Scanner panel retains its
  authored context and an accessible unavailable message.
- Long values: wrap without truncation; copy controls remain reachable.
- Clipboard failure: retain visible selectable values and announce manual-copy guidance.
- Hydration failure: the first account and its credentials remain readable; interactive tabs/copy
  feedback may be unavailable.
- A block-level runtime exception remains contained by the existing production
  `BlockErrorBoundary`.

## Verification

Focused tests cover:

- Schema names, registration, standard section fields, mode/position placement under Theme Settings,
  optional mode/position defaults, minimum required fields, optional credential fields, account
  limits, and conditional tab controls.
- Duplicate-purpose validation and normalization of valid, incomplete, malformed, duplicate,
  ordered, optional, and internally spaced values.
- Shared credentials-only Copy all/QR payload output with optional-line omission and no payment
  purpose line.
- Text and Scanner rendering without a visitor-facing mode switch.
- Left/right desktop order, fixed 36/64 proportions, and contextual-first compact stacking.
- Custom Ledger Text rendering, per-field historical fallbacks, and unchanged code-owned transient
  interaction/QR messages.
- Upright display/sans title pairing, semantic surface-aware eyebrow/metadata accents, and guaranteed
  compact-screen spacing before the instructions notice.
- Conditional Text notice and generated Scanner QR behavior.
- Semantic account ledger, conditional rows, per-value accessible Copy actions, Copy all feedback,
  smaller Copy all label typography, clipboard rejection, and timer/account-change reset.
- Single/multiple account behavior and live-preview active-row removal.
- Outer section appearance/alignment/spacing/actions and tab configuration remaining unchanged.
- Production/live-preview parity, Reusable Section registration, thumbnails, generated types, and
  maintained documentation.

Implementation verification includes focused Vitest files, applicable block catalog/renderer/theme
contracts, generated types and import map, lint, TypeScript, a production build, block thumbnail
generation, `pnpm project-context:update`, and `pnpm project-context:check`.

## Workflow Constraint

Leave the specification, plan, implementation, generated artifacts, and documentation changes
uncommitted unless the user explicitly asks for a commit.
