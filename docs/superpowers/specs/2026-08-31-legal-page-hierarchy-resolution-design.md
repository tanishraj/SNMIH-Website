# Legal Page Hierarchy Resolution Design

## Goal

Ensure the Privacy Policy and Terms and Conditions links rendered by the public frontend shell use
the complete selected Page hierarchy, including when Payload returns a populated selected Page whose
`parent` relationship is still an ID.

## Scope

This change is limited to the legal Page relationships owned by Site Settings and consumed by the
frontend shell, consent banner, Footer56, and FooterMinimal. Redirects and other `getPageHref`
consumers are unchanged. There is no schema or data migration.

## Design

The cached frontend-global loader resolves each configured legal Page URL while it already owns the
Payload instance. It uses the existing `getPageHrefFromSourceWithResolver` helper and supplies a
resolver that loads parent Pages by ID with `payload.findByID({ collection: 'pages', depth: 0 })`.
The helper continues until it reaches a Page without a parent, so the result does not depend on a
fixed relationship depth.

The loader returns the resolved Privacy Policy and Terms and Conditions URLs alongside the existing
global data. The root layout passes the Privacy Policy URL to the consent banner and passes both URLs
through the global-footer rendering boundary. Footer blocks remain presentation-only: they append
the fixed legal labels using the supplied URLs and continue suppressing duplicates by URL.

If a relationship is empty, is not populated, has no slug, or references a parent that cannot be
resolved, its URL is `null` and the corresponding automatic legal link is omitted. The frontend
shell must remain render-safe in all of these cases.

## Testing

Focused tests cover:

- a top-level legal Page;
- a selected legal Page whose parent is an ID;
- more than one parent level;
- an unresolved parent returning no URL;
- consent-banner and footer wiring using the loader-resolved URLs;
- omission and duplicate suppression behavior remaining intact.

Verification includes the focused integration tests, TypeScript, lint, project-context update/check,
and a production build. Payload types and the Admin import map do not need regeneration because the
content model and Admin components do not change.
