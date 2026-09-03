# Curated Block Catalog Design

## Objective

Replace the Page editor's undifferentiated 53-block choice with a curated, job-based composition vocabulary while preserving every existing block and the starter's one-client-per-deployment model.

The implementation will use Payload's native searchable block drawer, thumbnails, grouping, keyboard behavior, and responsive behavior. It will not replace the core Blocks field or introduce tenant-aware configuration.

## Audience and Outcome

The primary audience is a first-time or occasional content editor who knows the page they need to make but does not know the project's component names. The editor should be able to choose an appropriate block by intent, without comparing dozens of equally weighted options.

Success means:

- the recommended vocabulary contains 18 deliberately selected blocks;
- no recommended group contains more than five choices;
- recommended groups appear before the advanced library;
- all remaining blocks remain searchable and editable;
- a developer can adapt the vocabulary in one code-owned location for a new client deployment; and
- saved Page, Reusable Section, and News/Event template content requires no migration.

## Selected Interaction

The block drawer will keep Payload's native search input and thumbnail cards. Blocks will be presented in the following order and groups:

1. **Start**
   - Page Header
   - Hero Banner
   - Reusable Section
2. **Explain**
   - Rich Text
   - About Section
   - Feature Spotlight
   - Content Highlights
   - Academic Programmes
3. **Explore**
   - News & Events Tabs
   - Department Profiles
   - Gallery Album Tabs
   - Q&A Accordion
4. **Prove**
   - Stats Strip
   - Testimonial Spotlight
   - Accreditation Cards
5. **Convert**
   - Banner CTA
   - Contact 24
   - Download List
6. **Advanced Library**
   - every other Page-compatible block, in an intentional stable order

The group names describe editorial jobs rather than implementation structure. Advanced Library is a native final group, not a permission boundary or a custom collapsed interface. Searching continues to match Payload's block labels and shows matching results in their assigned groups.

Existing layouts containing advanced blocks remain valid and fully editable. The catalog will not use `filterOptions` to deny blocks, because a role- or state-dependent filter could prevent an editor from saving an existing document.

## Code-Owned Client Vocabulary

The approved vocabulary is source-controlled configuration, not editable CMS data. A developer selects and orders the recommended blocks while preparing a one-client deployment. Site managers and content editors cannot promote or demote blocks from the Admin panel.

This keeps the public design vocabulary aligned with the client implementation, makes review possible in version control, and avoids adding a second settings workflow. The operator guide will identify the single catalog location and the contracts that must pass after changing it.

## Architecture

A server-only block catalog will own the canonical schema registries used by Payload configuration. It may import block config objects, but it must not import production React renderers, live-preview renderers, or client-only modules.

The catalog will expose intentionally separate composition lists:

- **Page blocks:** the complete Page-compatible catalog, including Reusable Section.
- **Reusable Section blocks:** the same catalog without Reusable Section, preventing direct recursive selection.
- **News/Event detail blocks:** the complete Page-compatible catalog plus News & Events Content.

The News & Events Content block will appear first under a dedicated **Template Core** group in the News/Event detail-template editor. The remaining standard blocks retain the same intent groups used by Pages. The existing publication validation requiring exactly one News & Events Content block remains authoritative.

Grouping will be applied by producing shallow, Admin-metadata-enriched block config objects. Block fields, labels, slugs, interfaces, thumbnail metadata, and validation functions remain unchanged. The grouping helper must preserve existing `admin` properties and merge only the group value.

Production and live-preview rendering registries remain explicit and separate. This design centralizes server-side Payload schema registration only; it does not create a cross-environment universal registry.

## Data and Compatibility

The change affects Payload Admin metadata and server-side schema assembly only. It does not change:

- stored block data or document structure;
- block slugs or generated interfaces;
- public rendering or live-preview behavior;
- collection access, workflow, hooks, or cache invalidation;
- public routes or APIs; or
- block thumbnail assets.

No database migration or compatibility renderer is required. Existing documents can contain any registered block regardless of whether that block is recommended or advanced.

## Failure Behavior and Invariants

Catalog drift must fail automated contracts. The implementation will enforce these invariants:

- every Page-compatible block slug is registered exactly once;
- every registered block receives exactly one intent group;
- the recommended set contains exactly the approved 18 blocks;
- group and block order is deterministic;
- Reusable Section is present in Pages and absent from Reusable Sections;
- News & Events Content is present only in the specialized detail-template registry;
- thumbnail metadata survives category decoration;
- duplicate or unknown catalog entries fail clearly; and
- Page, Reusable Section, and News/Event template parity differs only by their documented special blocks.

The implementation should fail during tests or configuration construction when catalog metadata is incomplete. It must not silently place an unknown block into Advanced Library because that would conceal registration drift.

## Accessibility and UX Constraints

Payload's native drawer remains responsible for focus management, search interaction, keyboard navigation, and responsive layout. The project will not fork or visually override these behaviors in this tranche.

Group labels must be short, distinct, and based on editor intent. Thumbnail alternative text and existing block labels remain intact. No color alone will distinguish recommended from advanced blocks.

## Testing and Verification

Focused tests will cover catalog membership, category assignment, ordering, duplicate rejection, special-registry differences, thumbnail preservation, and the existing Page-compatible registry contract.

Because this is a Payload Admin/schema change, verification will include:

1. Payload type generation and an assertion that no unintended stored schema shape changed.
2. Payload import-map generation if the final implementation changes Admin component imports; native metadata alone should make this a checked no-op.
3. Focused block registry, thumbnail, Page, Reusable Section, and News/Event detail-template contracts.
4. TypeScript and ESLint checks.
5. `pnpm project-context:update` followed by inspection of generated changes.
6. `pnpm project-context:check` and the final change-impact review.

The maintained block-system reference and operator guide will document the catalog owner, group vocabulary, customization workflow, and special-registry differences.

## Explicit Non-Goals

This tranche does not add:

- a custom block-picker component;
- collapsed or reveal-on-demand advanced blocks;
- recent, favorite, or personalized block lists;
- page recipes or automatic starter layouts;
- permission-based block visibility;
- CMS-editable block-category settings;
- per-tenant catalogs or tenant switching; or
- changes to public block presentation.

Page recipes are the logical next authoring improvement after real editors have used the curated native drawer and its remaining friction is understood.

## Rollout and Recovery

The catalog can ship without content migration. Editors will see the new grouping the next time the Admin bundle loads. Existing pages and drafts remain unchanged.

Recovery is a source rollback: restoring the previous explicit schema arrays returns the old drawer ordering without modifying stored documents. Any newly created layout remains compatible because the same block slugs continue to be registered.
