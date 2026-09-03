# Dynamic Page Header Breadcrumbs

## Goal

Make Page Header breadcrumbs follow the current CMS page hierarchy automatically while preserving an explicit custom override and a hidden state. The visible trail and breadcrumb structured data must share the same resolved source.

## Editor experience

Add a required `breadcrumbMode` select to the Page Header block's Content tab:

- `automatic` — default; derive the trail from the current Page and its ancestors.
- `custom` — render the existing manually configured `breadcrumbs` rows.
- `hidden` — render no visible breadcrumb and omit breadcrumb structured data for that Page Header.

The existing `breadcrumbs` array is visible in the admin only when `breadcrumbMode` is `custom`. Existing documents without `breadcrumbMode` resolve to `automatic`. Existing manual rows remain stored and become active again if an editor selects `custom`.

## Automatic trail

- Homepage: no breadcrumb.
- Root internal page: `Home / Current Page`.
- Nested page: `Home / Parent / … / Current Page`.
- Labels come from Page titles, not transformed slugs.
- Ancestors and Home are links; the current page is unlinked.
- Links use canonical paths built from the Page parent hierarchy.
- Invalid or incomplete parent relationships degrade to the valid portion of the trail without throwing.

## Architecture

Create a shared breadcrumb resolver that accepts the current Page and returns renderer-friendly items containing a label and optional URL. It must not query from inside the Page Header component.

`PageContent` passes the current Page into `renderPageBlocks`. The production renderer forwards the resolved automatic items to Page Header blocks, including Page Headers inside reusable sections. Live preview passes the live Page document into `renderLivePreviewPageBlocks` and follows the same contract.

Page Header selects its rendered items as follows:

- `automatic`: use the resolver output.
- `custom`: normalize the saved manual array with its existing page/custom-link behavior.
- `hidden`: use an empty list.

The catch-all page route uses the same automatic resolver when generating `BreadcrumbList` JSON-LD. This removes slug-derived display labels and prevents visible/structured breadcrumb drift. If a page intentionally hides or customizes its Page Header breadcrumb, structured data follows the first Page Header block's effective mode and trail. If no Page Header exists, structured data uses the automatic page hierarchy.

## Homepage identification

The route/page rendering layer explicitly supplies whether the rendered Page is the configured homepage. Automatic breadcrumbs are empty for that page even if its stored slug is non-root and `/` is provided through Layout Defaults.

## Accessibility

- Keep the semantic `<nav aria-label="Breadcrumb">` landmark.
- Render the current item with `aria-current="page"`.
- Keep separators decorative with `aria-hidden="true"`.
- Use links only for navigable ancestor items.

## Error handling

- Empty labels are removed.
- Missing ancestor documents or paths do not break page rendering.
- Circular ancestry is bounded defensively even though the Page schema already rejects cycles.
- Custom items with unresolved page relationships render as text rather than broken links.

## Testing

Add coverage for:

- Homepage automatic mode renders no breadcrumb.
- Root and multi-level pages resolve title-based trails and canonical links.
- Automatic mode is the runtime fallback when the field is absent.
- Custom mode retains current page/custom URL support.
- Hidden mode renders nothing.
- Current item is unlinked and has `aria-current="page"`.
- Structured data uses the shared resolved trail.
- Production and live-preview renderers provide the same Page Header context.
- Reusable Page Header blocks receive the containing page's trail.

## Out of scope

- A standalone breadcrumb block.
- Breadcrumb configuration for article, review, or News & Events templates.
- Per-ancestor label overrides in automatic mode.
- Database migration or removal of existing manual breadcrumb rows.
