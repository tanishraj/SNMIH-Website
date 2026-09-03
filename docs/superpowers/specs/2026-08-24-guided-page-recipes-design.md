# Guided Page Recipes Design

## Goal

Improve first-time Page creation in Payload Admin without limiting the existing block builder. Editors choose between a blank Page and one curated Landing Page recipe before entering the native Page editor.

This remains a one-client-per-deployment starter. Recipes are code-owned deployment defaults, not tenant data, a template marketplace, or a separate page-building system.

## Product Decisions

- The recipe chooser appears before the Page form.
- The first release contains exactly two recipes: Blank Page and Landing Page.
- Landing Page contains exactly two blocks in order: Page Header, then Breadcrumb.
- Page Header remains the topmost block.
- Page Header uses the entered Page title and suppresses its built-in breadcrumb.
- The standalone Breadcrumb uses automatic Page hierarchy resolution.
- Recipes initialize a draft only. After creation, editors can add, remove, duplicate, configure, and reorder any of the 53 registered Page blocks.
- Existing Pages never see the chooser.

## Editor Journey

Opening the configured Admin Page-create route (normally `/admin/collections/pages/create`) as a full Page shows a focused Page Setup view instead of the unsaved native document form.

The setup view contains:

1. a required Page title;
2. one labelled radio group with Blank Page and Landing Page cards;
3. a short purpose and included-block summary for each choice;
4. one primary Create Draft action; and
5. a Cancel action that returns to the Pages list using the configured Admin base route.

Blank Page is the default selection. The title input receives initial focus. Selecting a recipe never creates data. Submitting the setup form creates exactly one draft and redirects to the native edit route for the new Page.

While the request is active, controls are disabled and the primary action communicates progress. Validation and request failures keep the editor on the setup screen. Errors are announced through an `aria-live` region and displayed beside the relevant control or as a form-level message.

The recipe cards remain real radio controls with full-card labels. They support keyboard selection, visible focus, hover, selected, disabled, loading, and error states. The layout becomes one column on narrow screens and uses Payload Admin's established spacing and typography rather than frontend brand styling.

## Recipe Catalog

A server-owned module defines a small immutable catalog with stable recipe IDs, editor-facing labels, descriptions, block summaries, and layout factories.

### Blank Page

- ID: `blank`
- Layout: empty

### Landing Page

- ID: `landing`
- Layout order:
  1. `pageHeader`
  2. `breadcrumb`

The Page Header receives the normalized Page title. Its `topContent` is set to `eyebrow` with no eyebrow value so the component renders no internal top content. This avoids duplicating the standalone Breadcrumb while preserving the existing Page Header schema, which does not provide a `none` option.

The Breadcrumb uses automatic mode and its existing defaults for separator, alignment, size, visibility, section padding, and appearance. The recipe factory provides only values required to make the intended behavior explicit; shared block defaults remain authoritative for presentation.

The endpoint accepts only a recipe ID. It never accepts caller-supplied layout or block data. This keeps recipe structure governed by the deployed code and prevents the specialized endpoint from becoming a second arbitrary Page-creation API.

## Payload Admin Integration

Pages customizes only the default document view. When the full-page route represents a new Page, the custom view renders Page Setup. When a Page ID exists, it delegates to Payload's standard edit view with the original document slots and form state. Preview, live preview, API, version, versions, and other nested document views remain unchanged.

The dashboard's existing New Page link and Payload's collection-level Create New action continue targeting the configured full-page create route, so the primary Page-creation entry points reach the guided setup. Existing edit URLs continue to open the native editor directly.

Payload can also render Page creation inside a relationship document drawer. That embedded flow must retain Payload's native blank create form so a successful save can close the drawer and select the new relationship in its parent form. The recipe chooser does not replace drawer creation in this release. This explicit compatibility boundary avoids hijacking the parent editor or redirecting it away from unsaved work.

The custom Admin components are registered through Payload's import map. No Page fields are added and generated Payload document types should not change.

## Draft-Creation Endpoint

Pages exposes a focused authenticated collection endpoint for recipe creation. The request body contains only:

- `title`: required string, trimmed and rejected when empty;
- `recipe`: the stable `blank` or `landing` ID.

The endpoint rejects malformed JSON, unsupported recipes, missing users, and users without Page-management capability. It performs the Page create through the request's Payload instance with the authenticated user, `overrideAccess: false`, the current request, and `draft: true`. Payload's draft API intentionally permits incomplete required block data so recipe structure can be saved without fake client claims or filler copy. Existing Page access, slug generation, workflow defaults, audit behavior, navigation synchronization, and other collection hooks remain in force.

Recipe validation occurs before mutation. Layout factories receive the normalized title and return server-owned data. A successful response returns the created Page ID and a configuration-aware Admin edit destination derived from Payload's configured Admin route. The client redirects only after success.

The UI prevents ordinary double submission by disabling its controls after the first submit. The server remains the source of truth: two independently repeated valid requests are two explicit create operations, consistent with Payload's ordinary create endpoint. This design does not add a hidden idempotency field or persistent request-token model solely for the setup view.

## Error Handling

- Client validation catches an empty normalized title before requesting creation.
- The server repeats all validation and returns a safe status and concise message.
- Access failures return `401` or `403` without revealing recipe or collection internals.
- Invalid recipe input returns `400` and creates no Page.
- Payload validation failures return a safe form-level error; detailed diagnostics stay in server logs.
- A failed create leaves no partially created recipe because the Page and layout are one Payload create operation.
- Redirect failure does not retry creation automatically; the successful response contains the Page ID so the UI can offer an explicit link to the created draft.

## Compatibility and Boundaries

- No migration is required.
- No persisted recipe field is added to Pages.
- Existing Page documents, URLs, renderers, previews, versions, and layouts are unchanged.
- Relationship-drawer Page creation retains Payload's native blank form and parent-form selection behavior.
- Direct REST, GraphQL, and Local API Page creation retain their existing contracts.
- The canonical 53-block Page registry remains unchanged and completely available after recipe creation.
- Reusable Sections and the News & Events Detail Template do not gain recipe creation.
- Recipes are not editable CMS records and are not shared across deployments at runtime.
- Recipe application is create-time only; there is no later Apply Recipe command that could overwrite editorial work.

## Verification

Focused contracts will verify:

- the recipe catalog contains exactly `blank` and `landing`;
- Blank returns an empty layout;
- Landing returns Page Header followed by Breadcrumb;
- Landing copies the normalized Page title into Page Header;
- Landing suppresses Page Header's internal breadcrumb;
- the standalone Breadcrumb uses automatic mode;
- recipe factories return fresh layout objects and cannot leak mutation between requests;
- the Admin setup replaces only new-Page default editing;
- relationship-drawer creation delegates to Payload's native editor;
- authenticated users with `manage_pages` can create recipe drafts;
- anonymous, unauthorized, malformed, empty-title, and unknown-recipe requests are rejected without mutation;
- the created record is a draft and retains the exact layout order;
- loading, validation, request-error, keyboard, and redirect states behave accessibly;
- existing Page schema, block catalog, renderer, live-preview, and access contracts remain green.

Implementation verification includes Payload import-map generation, TypeScript, lint, focused tests, the full integration suite, and the required project-context update/check loop. Generated Payload types are regenerated only if the final schema changes unexpectedly.

## Documentation Impact

The block-system reference and block guide will describe the create-time recipes and clarify that the complete catalog remains available afterward. Architecture documentation will note the custom Page create view and protected draft-creation endpoint. The generated project inventory will be refreshed through the project-context workflow.

## Out of Scope

- Additional recipes
- CMS-managed recipe definitions
- Per-role or per-tenant recipe catalogs
- A template marketplace
- Applying recipes to existing Pages
- Locking recipe blocks or limiting the 53-block catalog
- Recipe analytics, favorites, recents, or personalization
- Public frontend redesign
