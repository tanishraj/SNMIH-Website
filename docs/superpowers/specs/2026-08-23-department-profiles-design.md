# Department Profiles Block Design

**Date:** 2026-08-23

## Objective

Create a reusable `departmentProfiles` Page block for a searchable, department-filtered staff directory. Editors configure an ordered department list once, assign exactly one configured department to each profile, and independently enable or disable visitor search and department tabs. The frontend presents static portrait cards containing only department, name, and designation.

## Scope

The block is available anywhere the regular Page block set is available, including Pages, Reusable Sections, production rendering, and live preview. It follows the existing shared section, appearance, typography, spacing, action, tab, media, and thumbnail contracts.

The block does not create a global Departments collection, profile detail pages, card links, remote search, server pagination, or inferred staff data.

## Content Model

### Section content

- Optional eyebrow.
- Optional title.
- Optional accent title.
- Optional description.
- Up to two shared section actions.
- Up to two shared footer actions.

The block may render profiles without a section title. If every header field and section action is empty, the header wrapper and its spacing are omitted.

### Departments

`departments` is an ordered block-local array. Each row contains:

- Payload's stable array-row `id`.
- A required department name.

Department names are trimmed and must be unique after case-insensitive normalization. Their authored order controls the public tab order. A renamed department retains its row ID, so assigned profiles continue to resolve to the renamed label.

### Profiles

`profiles` is a flat, ordered array. Each row contains:

- Required profile image related to Media.
- Required profile name.
- Optional designation.
- Required department ID selected from the block's configured department rows.
- Image position: Center, Top, Bottom, Left, or Right.

Each profile belongs to exactly one department. Cards are static and non-clickable.

### Dynamic department picker

Payload's static Select field cannot add options from a neighboring block-local array. A focused client Admin field therefore reads the current block's department rows through Payload form state and renders a single-value `SelectInput` using department row IDs as stored values and department names as labels.

The picker must:

- Resolve the containing block path from its own field path rather than assuming a Page layout index.
- Update immediately when department rows are added, renamed, reordered, or removed.
- Preserve the stored ID when a department is renamed.
- Show a clear empty state when no departments exist.
- Retain an invalid saved value long enough to show a meaningful validation error rather than silently clearing data.

Server validation rejects a profile department ID that does not exist in the same block's department list. Deleting an assigned department therefore produces a clear validation error until profiles are reassigned.

## Directory Controls

The block exposes these independent controls:

- `showSearch`, default `true`.
- `searchPlaceholder`, default `Search profiles`.
- `showDepartmentTabs`, default `true`.
- `allTabLabel`, default `All`.
- `tabVariant`: Pill, Underline, or Contained; default Pill.
- `profilesPerLoad`: 12, 16, 20, or 24; default 20.
- `loadMoreLabel`, default `Load More`.
- `noResultsMessage`, default `No matching profiles found.`

Search and tabs can be hidden independently. When tabs are disabled, the effective department filter is always All. Empty departments remain authorable but are omitted from the visitor tab rail.

## Shared Section Settings

The block reuses project patterns for:

- Section appearance and semantic foreground resolution.
- Split or stacked header layout.
- Left, center, or right section-content alignment.
- Split-header description placement and right-column vertical alignment.
- Section padding: None, Compact, Default, or Comfortable.
- Profile columns: 2, 3, or 4.
- Shared section and footer actions.

The grid renders one column on phones, at most two columns on tablets, and the selected two, three, or four columns at the established desktop breakpoint.

## Card Presentation

Every profile uses a fixed `4:5` portrait image with a full-card overlay. The identity stack is fixed at the bottom-left:

1. Department as the highlighted uppercase mono eyebrow.
2. Profile name in the project sans-serif family.
3. Optional designation in smaller secondary text.

Cards use the project's rounded border treatment and remain non-interactive. Missing designation closes naturally without an empty row.

The block exposes the shared Overlay Tone, Strength, Direction, and Coverage settings used by other image-overlay blocks. Tone supports Auto, Light, Dark, and Brand; Strength supports Light, Dark, and Darker; Direction supports Even/Vertical and all four directional gradients; Coverage supports Full and Split (50%). Even/Vertical normalizes to Full coverage. Missing settings preserve Dark tone, Dark strength, Bottom-to-Top direction, and Full coverage. The implementation must choose surface-aware label colors for every exposed tone and strength combination.

## Toolbar and Responsive Behavior

The visitor toolbar appears only when search or tabs are enabled.

- Search renders as a labelled rounded input with a magnifier icon and the configured placeholder.
- Department filters reuse the existing content-tab variants and keyboard interaction.
- Desktop places search before the tab rail when space permits.
- Mobile stacks the full-width search input above a single horizontally scrollable tab row.
- The tab rail never wraps and preserves configured department order.
- All is always first and initially active when tabs are enabled.

The tab implementation supports Arrow Left, Arrow Right, Home, and End navigation, exposes the selected item, and associates the active control with the result panel. A polite result-count status communicates filtering changes without interrupting navigation.

## Search, Filtering, and Pagination

The server component normalizes all departments and profiles before passing a small serializable data set to the client directory. The client component owns only visitor interaction state.

Processing order is fixed:

1. Begin with every normalized profile, including profiles not yet revealed by Load More.
2. Apply the selected department unless All is active.
3. Apply the trimmed, case-insensitive search term to department name, profile name, and designation.
4. Slice the matching result list to the current visible count.

Changing the selected department or effective search query resets the visible count to `profilesPerLoad`. Load More increases the count by the same configured batch size. Load More is omitted when every matching profile is visible.

Search therefore always includes profiles hidden by initial pagination. Department filtering and search combine with AND semantics. When no profiles match, the configured no-results message replaces the grid and Load More control.

For this bounded CMS-authored list, filtering remains local. Derived departments and filtered results are memoized only where it prevents repeated list work; no effects mirror derived state.

## Normalization and Failure Handling

Runtime normalization:

- Trims all editor-authored strings.
- Removes blank or duplicate department rows deterministically, retaining the first valid normalized name.
- Resolves profiles by stable department ID.
- Omits profiles without a usable name, image, or valid department.
- Never invents department names, designations, credentials, or profile imagery.

If no valid profiles remain, the block renders nothing. If valid profiles exist but a visitor filter returns no matches, the client renders the configured no-results state.

## Component Boundaries

- `src/blocks/DepartmentProfiles/config.ts`: Payload block schema, validation, conditional Admin controls, and thumbnail registration.
- `src/blocks/DepartmentProfiles/Component.tsx`: server normalization, media resolution, appearance/header rendering, and client-safe props.
- `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`: search, tabs, result count, pagination, and card grid.
- `src/blocks/DepartmentProfiles/DepartmentSelectField.tsx`: dynamic Payload Admin department picker.
- `src/blocks/DepartmentProfiles/departmentOptions.ts`: framework-independent department option derivation used by the Admin picker and tests.
- `src/blocks/DepartmentProfiles/types.ts`: normalized client-safe directory types shared by server and client components.

The client module must not import Payload configuration or server-only utilities. The Admin field remains separate from the public client directory so it does not enter the visitor bundle.

## Registration and Documentation

The new block uses:

- Slug: `departmentProfiles`.
- Interface: `DepartmentProfilesBlock`.
- Label: `Department Profiles`.

It must be registered in Pages, Reusable Sections, production rendering, live-preview rendering, thumbnail definitions, production thumbnail fixtures, and generated Payload types. It receives a 1600x900 JPEG thumbnail generated through the existing workflow.

The block operator guide, feature inventory, maintained block-system reference, and generated project inventory must describe the new contract.

## Accessibility and Theme Requirements

- Search has a persistent accessible label even when the visible label is visually hidden.
- Search results are announced through a polite status region.
- Tabs reuse the project's accessible keyboard and focus-visible behavior.
- The active tab is not communicated by color alone.
- Cards use semantic headings based on whether a section heading exists.
- Image alt text falls back to the profile name through the existing media resolver.
- Every exposed overlay combination must meet WCAG AA for department, name, and designation text.
- Search, tabs, empty state, cards, borders, and actions use semantic theme tokens across light, dark, and brand section surfaces.
- Horizontal tab overflow must not cause page-level horizontal scrolling.

## Verification

Focused tests must cover:

- Block schema defaults, conditional controls, and field limits.
- Case-insensitive duplicate-department validation.
- Profile-to-department validation and the assigned-department deletion case.
- Dynamic Admin picker option derivation and invalid saved values.
- Runtime trimming and invalid-profile omission.
- Department order, automatic All tab, and empty-department omission.
- Independent search and tab visibility.
- Search across name, designation, and department.
- Search plus department AND behavior.
- Searching profiles beyond the initial visible batch.
- Configurable batch sizes, Load More increments, and reset behavior.
- Empty filtered results and full-result completion.
- Accessible tab semantics, keyboard behavior, result status, and search labelling.
- Responsive column and toolbar contracts.
- Theme and overlay contrast contracts.
- Pages and Reusable Sections registration.
- Production and live-preview renderer parity.
- Thumbnail definition, fixture, and generated asset contracts.

Required generators and checks include Payload types, the Admin import map, block thumbnails, focused tests, shared block registration/preview/thumbnail/theme tests, lint/type checks appropriate to changed files, and the complete project-context update/check loop.

## Constraints

- Do not create or migrate a global Departments collection.
- Do not add card links or profile detail actions.
- Do not perform remote search or API pagination.
- Do not calculate or infer profile content.
- Preserve all unrelated user changes in the dirty worktree.
- Do not commit implementation or planning changes unless the user explicitly requests a commit.
