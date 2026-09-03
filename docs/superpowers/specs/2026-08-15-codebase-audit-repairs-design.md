# Codebase Audit Repairs Design

## Objective

Resolve every actionable issue found in the August 2026 codebase audit while preserving the existing Payload CMS block architecture and public behavior unless an existing admin control explicitly promises different behavior.

## Scope

The repair covers:

- Payload block configuration and frontend renderer alignment.
- Study Pathways registration, tests, documentation, formatting, and admin thumbnail coverage.
- Generated Payload type compatibility at renderer boundaries.
- Stale block counts and incomplete operator documentation.
- Existing integration-test contract drift identified by the audit.
- Application lint errors and relevant lint warnings.
- Repository lint noise caused by checked-in agent and preview tooling.
- Removal of the public example route.

The repair does not redesign block visuals, change collection access rules, introduce a new block registry abstraction, or alter unrelated historical planning documents.

## Architecture

Keep the current explicit architecture: block schemas remain in each block directory, Pages and Reusable Sections continue to register blocks explicitly, and production and live-preview renderers continue to use exhaustive `blockType` switches. Strengthen the contracts around those boundaries instead of introducing a cross-environment registry that could mix server-only and client-capable imports.

Generated Payload interfaces remain the canonical data contracts. Block adapters may use focused structural types when they normalize legacy data, but public and live-preview renderer calls must type-check without `any` casts.

## Block Contract Repairs

### Content Highlights

The existing `accentTitle` admin field remains supported. `ContentHighlightsBlockComponent` will accept, normalize, and pass it to the existing `ContentHighlights` presentation component. A rendering regression test will prove that editor-authored accent text appears in output.

### Header Navbar Sticky Behavior

The existing `sticky` checkbox becomes functional:

- `true` or an absent legacy value keeps the current sticky behavior.
- `false` renders the header in normal document flow.
- The announcement-derived top offset applies only to a sticky header.
- The active header collection continues to allow one Header Navbar block, so `GlobalHeader` can derive the behavior directly from the first layout block without adding new global state.

Tests will cover enabled, disabled, and legacy-missing values.

### Typed Renderer Boundaries

Testimonial Grid, Awards List, and About Section will accept the corresponding generated Payload block shapes, or compatible aliases derived from those generated types. Production and live-preview renderers will pass these blocks without `as any`. Existing legacy-value normalization stays inside the block adapters.

## Study Pathways Completion

Study Pathways remains available on Pages and Reusable Sections and in both renderers. Add focused tests for:

- Schema identity, row constraints, fields, defaults, and option values.
- Public and live-preview registration.
- Generated Payload type presence.
- Two-, three-, and four-card split behavior.
- Header layout, alignment, card height, media positioning, overlays, links, actions, and invalid/incomplete data handling.
- Thumbnail manifest and fixture coverage.

Generate the required `public/block-thumbnails/study-pathways.jpg` as an exact 1600 by 900 JPEG using the existing repeatable thumbnail command.

## Test and Documentation Alignment

The canonical current count is 48 page block choices, including Reusable Section. Reusable Sections expose the same set except the recursive Reusable Section block, for 47 choices.

Tests should verify membership and renderer parity dynamically and use the canonical count only where the count itself is operator-facing behavior. Remove stale expectations for 43, 45, and 47 page choices.

Update the maintained feature inventory and page-block guide to include all 48 page blocks, including Banner CTA, Academic Programmes, Study Pathways, Breadcrumb, and Accreditation Cards. Header, footer, and system-page documentation remains separate.

Reconcile style-contract tests with the shared current implementation:

- Shared content descriptions use the chosen canonical line-height in one exported constant and dependent block tests assert that shared contract.
- About Section assertions account for its responsive text sizing without depending on an obsolete exact class substring.
- Tabs Content theme assertions validate behavior or semantic class outcomes rather than fragile nested-ternary source formatting.

No visual style change will be made solely to satisfy a stale string assertion unless the shared contract demonstrates that the implementation regressed.

## React and Next.js Repairs

For Stats Strip, reduced-motion output will be derived during rendering or initialized without synchronously setting state from an effect. Animation state remains event- or timer-driven, and reduced-motion users immediately receive the final metric value.

For Event Gallery autoplay, reaching the final slide will stop playback through navigation/timer logic rather than a synchronous state write inside the autoplay effect. Keyboard, manual navigation, restart, and timer cleanup behavior remain intact.

The frontend error page will use Next.js `Link` for the internal homepage navigation.

## Repository Hygiene

Remove `src/app/my-route/route.ts`, which exposes the starter example endpoint and has no production responsibility.

Extend ESLint ignores to cover checked-in `.claude/**` and `.superpowers/**` tooling, while continuing to lint application source, tests, and project scripts. Resolve the audited application warnings where they indicate real type or expression problems; do not edit vendored agent tooling.

Run Prettier on the files touched by the repair, including Pages and Study Pathways.

## Error Handling and Compatibility

- Existing stored block documents with omitted optional values retain current defaults.
- Existing Content Highlights accent titles begin rendering; no migration is needed because the field already exists in generated types.
- Existing headers with no saved `sticky` value remain sticky.
- Reusable Section recursion protection and maximum renderer depth remain unchanged.
- Invalid legacy block option values continue to fall back inside their adapters.
- Removing the example route intentionally changes `/my-route` from a public JSON response to the application not-found response.

## Verification

Use test-driven changes for each behavioral repair. Final verification includes:

1. Focused block, header, Study Pathways, thumbnail, style-contract, Stats Strip, Event Gallery, and error-page tests.
2. `pnpm exec tsc --noEmit`.
3. `pnpm exec eslint src tests scripts`.
4. `pnpm exec prettier --check` for changed authored files.
5. `pnpm run test:int`.
6. Database-backed integration tests when the environment permits MongoMemoryServer to bind a local port; otherwise report the environment limitation separately from application failures.

Success means no known admin control is silently ignored, all registered blocks have production/live-preview/reusable-section parity where applicable, the picker has every declared image, maintained documentation matches source, and authored application checks pass.
