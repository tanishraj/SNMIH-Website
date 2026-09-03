# Bank Details Purpose Eyebrow Simplification

## Goal

Use each bank account's existing **Payment Purpose** as the complete eyebrow on the white account-information card. Remove the separate **Purpose Suffix** authoring option and its runtime fallback.

## Design

- Keep `accounts[].purpose` as the required, visitor-facing text used by both the account tab and the white-card eyebrow.
- Render the normalized purpose directly, without appending another value or a literal joining space.
- Remove `ledgerText.purposeSuffix` from the Payload block schema, local types, defaults, and normalization.
- Preserve the existing top-level `eyebrow` field, which belongs to the optional section heading and is unrelated to the per-account purpose eyebrow.
- Leave all other ledger labels, account fields, layouts, copy behavior, QR behavior, and styling unchanged.

## Existing Content

No data migration is required. Previously stored `ledgerText.purposeSuffix` values become unused after the schema field is removed; Payload can safely ignore that extra historical property when reading existing documents. Saving an edited block will naturally omit the removed field.

## Generated Artifacts and Documentation

Regenerate Payload types so `purposeSuffix` is removed from `BankDetailsBlock.ledgerText`. Update the Bank Details narrative only where it describes the suffix-based composition.

## Verification

- Assert that the Payload schema no longer exposes **Purpose Suffix**.
- Assert that the card eyebrow equals the authored Payment Purpose exactly.
- Assert that custom ledger labels still work without a suffix property.
- Run the focused Bank Details integration suite, Payload type generation, lint, project-context update/check, and whitespace checks.
