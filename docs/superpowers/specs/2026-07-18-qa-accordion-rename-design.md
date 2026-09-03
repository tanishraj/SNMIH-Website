# Q&A Accordion Rename Design

## Goal

Rename the existing FAQ block to Q&A Accordion as a complete canonical identity change, following the same clean replacement pattern used for SplitFeature to Feature Spotlight.

## Canonical identity

- Payload slug: `qaAccordion`.
- Payload interface: `QaAccordionBlock`.
- Config export: `QaAccordionBlock`.
- Render component: `QaAccordionBlockComponent`.
- Source directory: `src/blocks/QaAccordion/`.
- Admin labels: `Q&A Accordion` and `Q&A Accordions`.
- Thumbnail filename: `qa-accordion.jpg`.
- Frontend data attributes: `data-qa-accordion-*`.
- Placement field: `accordionPlacement`.

The canonical codebase must not retain `faq`, `FaqBlock`, `FaqBlockComponent`, `Faq/`, `faqPlacement`, `data-faq-*`, or `faq.jpg` compatibility identities.

## Code changes

- Rename the block directory, config exports, component types/functions, local helpers, and tests.
- Register only `QaAccordionBlock` in the Pages collection.
- Render only `blockType: 'qaAccordion'` in the page-block renderer.
- Rename the thumbnail definition, fixture key, preview route identity, asset file, and related tests.
- Update block registration and system-page exclusion assertions.
- Regenerate Payload types so only `QaAccordionBlock`, `QaAccordionBlockSelect`, and `blockType: 'qaAccordion'` remain.
- Preserve the block's current layout, theme, responsive behavior, fields, and styling except for the canonical placement-field name.

## Local data retention

The local Home page currently contains three `faq` blocks. A one-time local database rewrite will:

- change every `blockType: 'faq'` to `blockType: 'qaAccordion'`;
- rename each block's `faqPlacement` property to `accordionPlacement` without changing its value;
- update current page documents and stored page-version documents;
- preserve block IDs, content, actions, answers, layout settings, appearance, order, and draft/publish state.

This is a local-only project, so no persistent migration file or runtime compatibility alias will be added.

## Verification

- Confirm the Payload schema registers `qaAccordion` and does not register `faq`.
- Confirm the Home page still contains three Q&A Accordion blocks with the same block IDs and content.
- Confirm current page versions contain no `faq` block types or `faqPlacement` keys.
- Confirm the frontend renders all three blocks using `data-qa-accordion-*` attributes.
- Confirm the renamed thumbnail preview and asset work.
- Confirm generated types contain no FAQ block identity.
- Run focused integration tests, lint, and repository searches for obsolete runtime identifiers.
- Keep all changes unstaged.
