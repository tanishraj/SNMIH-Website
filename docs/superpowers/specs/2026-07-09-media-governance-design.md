# Media Governance Design

## Summary

This spec adds the missing governance layer around uploaded assets so the CMS starter is safer to hand off to non-technical marketing teams.

The goal is not to build a digital asset management platform. The goal is to make media operationally safe:

- operators can understand where an asset is used
- in-use assets cannot be deleted accidentally
- critical brand assets can be flagged for extra caution
- replacement and cleanup decisions become explicit instead of guesswork

This work keeps the existing single `media` collection and strengthens it with usage visibility and deletion guardrails.

## Why This Direction

Three approaches were considered.

### 1. Recommended: explicit usage resolver over known structured references

Track usage by scanning the collections, globals, and block fields that intentionally store Payload `media` relationships.

This gives predictable, field-level results and keeps the starter understandable for future client extensions.

### 2. Generic recursive reference scanning

Walk arbitrary stored JSON and try to infer every possible place a media ID may appear.

This looks more complete on paper, but it becomes fragile quickly. False positives and ambiguous paths make the operator surface harder to trust.

### 3. Database-heavy join logic

Push usage discovery into lower-level database queries and treat asset references like a generalized relational reporting problem.

This would overcomplicate a starter that needs clarity more than abstraction.

### Decision

Use an explicit usage resolver over known structured references.

## Product Contract

After this work:

- `media` remains the single upload collection
- every media entry can show whether it is used and where
- usage is reported at field level for structured Payload relationships
- deletion is blocked when an asset is still referenced
- unused assets can still be deleted normally
- operators can mark assets as critical and add replacement guidance

This is a safety layer for a marketing CMS starter, not a full DAM system.

## Architecture

### One Media Collection

Keep one `media` collection.

Do not split media into:

- public vs private assets
- brand assets vs content assets
- separate system-only libraries

The starter benefits more from one clear operating surface than from multiple specialized media silos.

### Explicit Usage Resolver

Usage should be derived by application logic that knows where structured `media` relationships exist today.

That resolver should inspect:

- top-level collection fields
- global fields
- nested structured fields inside arrays, groups, and blocks where relationships are explicitly defined

Examples of intended results:

- `Pages > Home > ogImage`
- `Articles > Pricing Strategy > featuredImage`
- `SEO Settings > defaultImage`

The resolver should not claim support for arbitrary code-only usage or freeform string references.

### Field-Level Visibility

Usage visibility should be field-level, not only document-level.

Operators need to know both:

- which entry references the asset
- which field path is responsible

Document-level summaries alone are not sufficient when the same entry contains multiple image-capable fields.

## Schema Changes

### Media Governance Fields

Add the following governance fields to `media`:

- `isCriticalAsset`
  - checkbox
  - optional
  - operator-facing caution flag for logos, default SEO imagery, legal assets, or other high-sensitivity files
- `replacementNotes`
  - textarea
  - optional
  - internal guidance for operators replacing or retiring the asset

### Admin-Facing Usage Fields

Expose read-only usage visibility on `media`:

- `usageSummary`
  - concise operator-facing summary such as used/unused and reference count
- `usageDetails`
  - structured read-only list of reference locations including source type, document label, and field path

These fields are for admin visibility and safe operations. They are not editorial content.

## Deletion Safety Model

Deletion should be blocked entirely when the media asset is still in use.

This protection is based on the same explicit resolver coverage defined in this spec. It is intended to be trustworthy for supported structured relationships, not for unsupported code-only references.

If an operator attempts deletion for a referenced asset:

- the delete operation fails
- the error explains that the asset is still referenced
- the response surfaces the known usage locations so the operator knows what must be changed first

If an asset has no detected usage:

- deletion proceeds normally

This is the correct tradeoff for a client-handoff-safe starter. It prevents silent website breakage during routine admin cleanup.

## Operator Workflow

The expected media workflow should be:

1. operator opens a media record
2. operator reviews `usageSummary` and `usageDetails`
3. operator decides whether the asset is safe to replace, retain, or delete
4. if needed, operator checks `replacementNotes`
5. deletion is only available in practice for unused assets

`isCriticalAsset` should act as a caution signal, not a second permission system. A critical asset can still be replaced or deleted if it is truly unused, but the admin surface should make that choice feel deliberate.

## Resolver Coverage

The resolver should cover the structured usage surfaces that matter for this starter today:

- pages
- articles
- reviews
- site settings
- SEO settings
- system pages
- nested block fields that hold `media` relationships

Coverage should follow actual configured relationship fields, not inferred naming conventions.

## Explicit Limits

This phase does not include:

- asset folders or hierarchical media libraries
- bulk archival workflows
- automatic replacement propagation
- duplicate detection
- arbitrary static code scanning for image URLs or IDs
- external DAM synchronization

Those may become future extensions, but they are not required for a safe foundational CMS layer.

## Error Handling

The deletion guard should fail clearly and operator-readably.

Requirements:

- no silent delete fallback
- no partial success behavior
- no generic "cannot delete" message without context

The operator should get enough information to resolve the blockage without needing a developer to inspect the database.

## Testing

Verification for this work should prove:

- field-level usage rows are returned for known media references
- references in collections, globals, and supported nested block structures are detected
- deletion is blocked for referenced assets
- deletion succeeds for unused assets
- normal upload and edit flows for media still work

Testing should focus on actual CMS behavior, not only utility-level happy paths.
