# Nested Department Profiles Authoring Design

**Date:** 2026-08-31

## Objective

Replace the Department Profiles block's separate department and profile arrays with one nested
authoring structure. Editors expand a department to manage only the profiles that belong to it. Raise
the block-wide profile capacity from 200 to 400 while preserving existing content, drafts, and
versions.

## Scope

This change updates the existing `departmentProfiles` block wherever the regular Page block catalog
is used: Pages, Reusable Sections, and the News & Events Detail Template. It changes Payload Admin
authoring, saved block data, server normalization, generated types, tests, and maintained project
documentation. Visitor search, filtering, pagination, card layouts, featured carousel presentation,
appearance controls, and block registration remain unchanged unless the new ordering contract
requires otherwise.

## Content Model

`departments` remains a required ordered array with one to fifty rows. Each department row contains:

- Payload's stable array-row `id`.
- A required unique department name.
- A nested `profiles` array containing zero to 400 profile rows.

Each nested profile retains the existing fields:

- Optional Profile Image related to Media.
- Required Name.
- Optional Designation.
- Featured in Carousel, defaulting to false.
- Required Image Position: Center, Top, Bottom, Left, or Right.

The nested profile no longer stores `departmentId`; its containing department owns that association.
Empty departments remain valid so editors can prepare filter categories before profiles are ready.

Department-array validation owns block-wide rules:

- Department names must be non-empty and unique after trimmed, case-insensitive normalization.
- At least one profile must exist across all departments.
- No more than 400 profiles may exist across all departments.
- No more than twelve profiles may be featured across all departments.
- Every featured profile must have a Profile Image.

The nested array's own `maxRows: 400` prevents one department from exceeding the block-wide limit;
the parent validator enforces the combined total.

## Payload Admin Experience

Payload's native nested arrays provide the editor structure:

```text
Departments
└── Department
    ├── Department Name
    └── Profiles
        └── Profile fields
```

Departments and profiles initialize collapsed. Custom Admin row labels display the current
department name and profile name, falling back to numbered labels for incomplete new rows. Expanding
a department reveals only that department's profile list. Profiles remain sortable within their
department. Moving a profile to another department is an explicit content edit because separate
nested arrays do not provide cross-array drag-and-drop.

The obsolete `DepartmentSelectField` and its form-state option helper are removed, along with their
Admin import-map entry.

## Ordering and Public Behavior

The department array continues to control filter order. Runtime normalization walks departments in
their saved order and then profiles in each department's saved order. The public All view therefore
groups records by configured department order; department-specific filtering retains each nested
profile order.

The server still produces the existing client-safe `ResolvedProfileDepartment` and
`ResolvedDepartmentProfile` values. It derives `departmentId` and `departmentName` from the containing
department rather than a profile-owned selector. Visitor behavior remains unchanged:

- Search covers name, designation, and department before pagination.
- Tabs or Dropdown filtering uses populated departments only.
- Featured profiles are drawn from the same directory rows.
- Load More continues to reveal the configured batch size.
- Card presentation and responsive behavior remain unchanged.

## Migration and Compatibility

A reversible Payload MongoDB migration transforms every `departmentProfiles` block in:

- Current Page documents and Page versions.
- Current Reusable Section documents and Reusable Section versions.
- The current News & Events Detail Template global and its versions.

For each block, the upward migration moves every top-level profile into the nested `profiles` array of
the department whose stable row ID matches `departmentId`, preserves the profile row ID and all other
fields, removes `departmentId`, and removes the old top-level `profiles` array. Department order is
unchanged; profile order is preserved within each department based on the old flat ordering.

The migration fails with a clear error instead of silently losing data if a profile references a
missing department. The downward migration flattens nested profiles in department order, restores
each `departmentId`, and removes nested profile arrays. A down-migrated block may contain more than
the former 200-row Admin limit, but no profile is truncated.

During rollout, server normalization accepts both the new nested structure and the old flat
structure. Nested data is authoritative when any nested profile arrays are present; the legacy path
exists only for unmigrated deployments and is documented as temporary compatibility behavior.

## Failure Handling

Runtime normalization trims author text, removes blank or duplicate department rows deterministically,
and omits incomplete profiles using the existing presentation rules. Migration behavior is stricter:
it never drops a saved profile silently and aborts when an association cannot be preserved.

Validation messages identify the block-wide limit or featured-profile problem at the Departments
field. Incomplete drafts may display validation errors but retain their entered values for correction.

## Testing and Verification

Focused Department Profiles coverage will verify:

- The nested schema, row labels, and removal of the department picker.
- The combined minimum-one and maximum-400 profile rules.
- Featured limits and image requirements across multiple departments.
- Department-first public ordering and unchanged visitor interactions.
- New and legacy runtime normalization.
- Lossless up/down migration transforms, including invalid-association failure.
- Registration in Pages, Reusable Sections, production rendering, live preview, and the detail
  template.

After implementation, regenerate Payload types and the Admin import map, run the focused block tests
and affected block/preview/documentation contracts, then complete the project-context update/check
loop. No changes will be committed.
