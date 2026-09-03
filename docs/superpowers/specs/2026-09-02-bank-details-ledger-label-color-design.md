# Bank Details Ledger Label Color Design

## Goal

Match the six Bank Details credential labels to the subdued slate treatment used by the Fee
Structure atlas instead of rendering them with the green eyebrow accent.

## Scope

The change applies only to the credential terms rendered inside the fixed-white Bank Account
Information ledger:

- Account Holder
- Account Number
- Bank Name
- IFSC Code
- Branch & Type
- UPI ID

The payment-purpose eyebrow, such as `Admissions account`, and the `Verified` status retain their
existing green accent. No authored text, Payload fields, account values, copy controls, or clipboard
behavior changes.

## Presentation

Each credential term keeps its existing mono family, 0.6875rem size, semibold weight, uppercase
treatment, and 0.14em tracking. Its color changes to `text-light-overlay-foreground/65`, the
fixed-white-ledger equivalent of the Fee Structure atlas's subdued foreground treatment.

The term no longer publishes `data-section-eyebrow-surface="lightOverlay"`, because that shared
surface hook intentionally resolves to the SNMIH green accent. The purpose eyebrow continues to use
that hook.

## Compatibility And Accessibility

The fixed-white ledger already uses the contrast-tested `light-overlay` foreground contract in both
website color modes. Deriving the label color from that same foreground keeps the result stable when
the surrounding website is dark. Semantic `dt`/`dd` markup and all accessible copy-control names
remain unchanged.

## Verification

The focused Bank Details integration test will assert that a credential term uses the muted
light-overlay foreground class and no longer carries the eyebrow surface-color attribute. It will
also assert that the purpose eyebrow still carries `lightOverlay`, guarding the intentionally mixed
accent hierarchy.

Run the focused integration test, scoped lint, TypeScript, the required project-context update/check
loop, and `git diff --check`. Regenerate no Payload types, import map, or thumbnail because the schema,
Admin components, and picker fixture do not change.
