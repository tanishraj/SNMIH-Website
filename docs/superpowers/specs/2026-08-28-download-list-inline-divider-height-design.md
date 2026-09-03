# Download List Inline Divider Height Design

## Goal

Make every Download List Inline action divider fill the equalized height of its card row, including rows whose neighboring card contains taller content.

## Cause

The grid equalizes sibling `<li>` heights within each row, but the inner item grid currently keeps only its intrinsic content height. The divider's `self-stretch` therefore stretches against the shorter inner grid instead of the full equalized card height.

## Design

- Add `h-full` to the existing inner item grid identified by `data-download-inline-item-container="true"`.
- Keep the divider class exactly `self-stretch border-l border-current/15`.
- Do not add a fixed or minimum height; card height remains content-driven and responsive.
- Do not change grid columns, padding, action alignment, document-icon behavior, typography, borders, or other Download List presentation modes.

## Verification

- Extend the existing Inline divider integration contract to require `h-full` on the inner item container.
- Preserve the existing assertion for the divider's `self-stretch` class.
- Run focused Download List tests, TypeScript, ESLint, Prettier, the layout detector, and the required project-context update/check loop.
