# Admin IA Simplification Design

## Objective

Reduce perceived admin complexity without removing current CMS capabilities or changing the underlying content architecture.

The CMS should remain:

- editorial-first
- client-handoff-safe
- full-featured for `Admin`
- simpler and more self-explanatory for `Site Manager` and `Content Manager`

This design focuses on admin information architecture only:

- grouping
- labels
- role-based visibility behavior
- operator documentation alignment

It does **not** change:

- collection/global slugs
- API routes
- stored data shape
- workflows
- capabilities model
- frontend routes

## Current Problem

The current CMS has reached a solid functional state, but the admin surface still feels broader and more technical than necessary for day-to-day website operators.

The main usability issue is not missing functionality. It is the number of visible sections and the vocabulary used to describe them.

For a balanced audience of:

- `Admin`
- `Site Manager`
- `Content Manager`

the admin should feel like a website operations product, not a developer-organized list of internals.

## Design Goals

1. Preserve all current functionality.
2. Keep `Admin` fully visible with no hidden sections.
3. Make the left navigation more intuitive for non-admin users.
4. Prefer job-to-be-done grouping over technical grouping.
5. Keep operational areas visible but visually secondary.
6. Rename only ambiguous labels, not already-familiar CMS concepts.
7. Keep implementation low-risk by changing admin IA rather than architecture.

## Recommended Approach

Use a hybrid editorial information architecture:

- main groups are task-oriented
- advanced operational areas remain visible but secondary
- familiar labels stay familiar
- confusing labels are polished into clearer operator language

This is preferred over:

- a purely technical grouping model, which remains abstract for non-technical users
- a full vocabulary rewrite, which would create unnecessary churn and drift from standard CMS terminology

## Navigation Structure

### Website Content

- Pages
- Articles
- Reviews
- Media
- Categories
- Tags

### Website Structure

- Headers
- Footers
- Navigation Links
- Redirects
- System Pages

### Lead Capture

- Forms
- Form Submissions

### Site Settings

- Website Defaults
- Site Settings
- Theme Settings
- SEO Settings
- Website Modes

### Operations

- Users
- Action Queue
- Activity Log

## Grouping Rules

- `Operations` stays last in the left panel.
- Website-facing groups remain primary.
- Items must not be duplicated across groups.
- Group order must remain stable across roles.
- Empty groups must be hidden after capability filtering.

## Label Strategy

### Labels To Change

- `Links` → `Navigation Links`
- `Site Defaults` → `Website Defaults`
- `System Modes` → `Website Modes`
- `Operational Audit Events` → `Activity Log`
- `Work Queue` → `Action Queue`

### Labels To Keep

- Pages
- Articles
- Reviews
- Media
- Categories
- Tags
- Headers
- Footers
- Redirects
- System Pages
- Forms
- Form Submissions
- Site Settings
- Theme Settings
- SEO Settings
- Users

### Rationale

These kept labels are already understandable enough for both operators and implementers. Renaming them would create churn without meaningful UX benefit.

The changed labels are the ones most likely to confuse non-technical users:

- `Links` is too generic
- `Site Defaults` is understandable but still system-facing
- `System Modes` sounds technical
- `Operational Audit Events` is accurate but heavy
- `Work Queue` is understandable only after explanation

## Role Visibility Behavior

### Admin

- sees the full IA
- sees all groups
- sees all sections
- nothing is hidden for simplicity reasons alone

### Site Manager And Content Manager

- only see sections allowed by their capabilities
- only see groups that contain at least one visible section
- inherit the same stable group ordering as `Admin`

This preserves a consistent mental model while still reducing clutter.

## Reviews Positioning

`Reviews` remains a first-class content section.

Reasoning:

- review intake starts in forms
- approved reviews become public website content
- editors should think of them as editorial content once approved

Forms remain the intake surface. Reviews remain the published-content surface.

## Architecture Impact

This design should only touch admin presentation metadata and supporting docs.

Expected implementation touchpoints:

- collection `admin.group`
- collection/global labels
- capability labels and descriptions where old wording remains
- operator docs and guide index
- tests that assert admin IA and capability visibility expectations

This design must not change:

- collection slugs
- global slugs
- route structure
- content models
- access-control logic semantics

## Testing Strategy

### Automated

- verify updated collection/global labels
- verify updated `admin.group` assignments
- verify capability-driven visibility still behaves correctly
- verify no slug or API contract changes
- verify documentation references match the new IA

### Manual

- restart admin
- check full left panel as `Admin`
- check capability-filtered navigation as `Site Manager`
- check capability-filtered navigation as `Content Manager`
- confirm `Operations` appears last
- confirm renamed labels feel self-explanatory in context

## Documentation Impact

The operator documentation must align with the new IA.

At minimum, update:

- guide index and reading order
- section names that changed
- any usage examples or references that still point to old operator-facing labels

The docs should continue to explain the same system, but using the new operator vocabulary.

## Risks

### Risk: Over-polishing labels

Too much renaming would make the system feel disconnected from common CMS vocabulary.

Mitigation:

- keep familiar concepts unchanged
- rename only the most ambiguous items

### Risk: Role-based nav feels inconsistent

If group order changes or items move unpredictably between roles, users may become confused.

Mitigation:

- keep ordering stable
- only remove inaccessible sections
- hide only empty groups

### Risk: Docs drift from UI

If labels change in admin but not in docs, onboarding gets worse instead of better.

Mitigation:

- treat docs update as part of the same change

## Out Of Scope

- removing collections
- changing capabilities
- changing editorial workflows
- simplifying content models
- frontend redesign
- block-library expansion
- route restructuring

## Final Recommendation

Proceed with a moderate-polish hybrid admin IA:

- task-oriented top-level groups
- operations as a smaller secondary area
- role-based group hiding through existing capabilities
- selective label cleanup only where the current wording feels technical or ambiguous

This gives the starter a more polished operator experience without destabilizing the CMS foundation.
