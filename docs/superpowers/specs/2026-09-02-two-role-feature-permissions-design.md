# Two-Role Feature Permissions Design

## Status

Approved for implementation planning. Keep the specification and implementation uncommitted until
the user explicitly changes that instruction.

## Objective

Replace the current three-role editorial-governance model with a simpler administrative model:

- the only roles are **Admin** and **Site Manager**;
- any Admin may create multiple Admin and Site Manager accounts;
- Admins always have complete access;
- each Site Manager receives an explicit set of Admin-panel features;
- each grant corresponds to one visible Payload Admin destination;
- Site Managers may manage and publish content within a granted feature, but may never permanently
  delete records;
- public review submissions remain unpublished until an Admin or an appropriately authorized Site
  Manager approves them; and
- generic editorial Workflow tabs are removed without removing Payload drafts, previews, versions,
  Trash, operational tasks, or auditing.

This is an authorization redesign, not merely a navigation customization. Hiding a link is a user-
experience consequence of access control; server-side access remains authoritative for Admin,
REST, GraphQL, Local API, preview, and custom endpoint operations.

## Research Basis

Payload supports operation-specific collection, global, field, and Admin access control. Its Admin
access operation uses those rules to derive what the authenticated user can see and do. Payload also
supports role data in the authenticated user token, drafts and version history independently from a
custom editorial workflow, and access-aware soft deletion versus permanent deletion.

The design follows these security principles:

- least privilege and deny by default;
- authorization on every request rather than navigation-only checks;
- one canonical permission definition used by both presentation and enforcement;
- explicit handling of indirect relationship access;
- separation of account administration from site operation;
- no privilege escalation through user self-editing or untrusted Local API calls; and
- auditability for high-impact actions.

Primary references:

- <https://payloadcms.com/docs/access-control/overview>
- <https://payloadcms.com/docs/access-control/collections>
- <https://payloadcms.com/docs/local-api/access-control>
- <https://payloadcms.com/docs/authentication/token-data>
- <https://payloadcms.com/docs/versions/drafts>
- <https://payloadcms.com/docs/trash/overview>
- <https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html>

## Chosen Approach

### Feature-per-destination authorization

Use one boolean grant for every grantable collection or global shown in the Payload Admin sidebar.
Store the grants on Site Manager user records in a `features` group. Group the checkboxes in the
Users editor exactly as the Admin sidebar is grouped.

This approach is preferred over:

1. **Group bundles**, which are simpler but cannot independently grant links such as Forms and Form
   Submissions or Site Identity and Analytics.
2. **Operation-level matrices**, which allow separate read/create/update/publish/delete flags but
   create excessive configuration and opportunities for contradictory combinations in this small
   team.

Feature grants are intentionally coarse at the user interface and precise in the policy layer. Each
feature has one documented action bundle, and exceptional resources such as Audit Log and Action
Queue receive specialized policies.

## Roles and Account Administration

### Admin

- Has implicit access to every feature, regardless of stored feature values.
- Can create any number of Admin and Site Manager accounts.
- Can update roles and Site Manager feature grants.
- Can unlock, trash, restore, and permanently delete user accounts subject to the last-
  Admin invariant.
- Can permanently delete records from Trash.
- Can see the complete Action Queue and Audit Log.

### Site Manager

- Can enter the Admin panel.
- Always sees Dashboard and their own account controls.
- Sees and operates only explicitly granted features.
- Cannot access the Users destination or user-management APIs.
- Cannot view or alter their role or feature grants.
- Cannot permanently delete any record.

### Account invariants

- The first account remains bootstrapped as an Admin.
- Creating subsequent accounts requires an authenticated Admin.
- The system must never allow the last active Admin to be demoted, trashed, or permanently
  deleted.
- Role and feature updates must invalidate the affected user's active sessions so revocation takes
  effect immediately rather than waiting for an existing token to expire.
- Role and feature changes create operational audit events containing actor, target user, previous
  role/grants, and next role/grants. Passwords and tokens must never enter audit data.
- An Admin user has no editable feature checklist because their access is unconditional.
- A newly created Site Manager starts with no features unless the creating Admin explicitly selects
  them.

## Canonical Feature Registry

A single typed registry owns feature keys, Admin labels, groups, descriptions, resource bindings,
dependency reads, and policy kind. Access helpers, Admin visibility functions, dashboard queries,
tests, migration code, and the Users feature checklist consume this registry rather than duplicating
string lists.

The registry must remain server-safe and must not import collection configuration back into the
access layer. Collection and global configs reference feature keys; the registry does not import
those configs.

### Grantable features

| Admin group    | Stable feature key         | Admin destination     | Granted Site Manager actions                                                               |
| -------------- | -------------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| Content        | `pages`                    | Pages                 | Create, read, edit, preview, publish/unpublish, view versions, trash, and restore          |
| Content        | `articles`                 | Articles              | Create, read, edit, preview, publish/unpublish, view versions, trash, and restore          |
| Content        | `reviews`                  | Reviews               | Manage editorial reviews and moderate public review submissions                            |
| Content        | `reusableSections`         | Reusable Sections     | Create, edit, version, trash, and restore reusable sections                                |
| News & Events  | `newsEvents`               | News & Events         | Create, edit, preview, publish/unpublish, version, trash, and restore entries              |
| News & Events  | `newsEventClassifications` | Classifications       | Create, edit, and archive; deletion is Admin-only and retains existing relationship guards |
| News & Events  | `newsEventsDetailTemplate` | Detail Page Template  | Edit, preview, and publish the shared detail-page layout                                   |
| Taxonomy       | `topics`                   | Topics                | Create, edit, archive/trash, restore, and use Topics                                       |
| Taxonomy       | `tags`                     | Tags                  | Create, edit, archive/trash, restore, and use Tags                                         |
| Navigation     | `navigationLinks`          | Navigation Links      | Create, edit, version, trash, restore, and publish reusable destinations                   |
| Navigation     | `redirects`                | Redirects             | Create, edit, enable/disable, version, trash, and restore redirects                        |
| Site Structure | `headers`                  | Headers               | Create, edit, preview, version, publish, trash, and restore Header presets                 |
| Site Structure | `footers`                  | Footers               | Create, edit, preview, version, publish, trash, and restore Footer presets                 |
| Site Structure | `officeLocations`          | Office Locations      | Create, edit, version, trash, and restore office locations                                 |
| Site Structure | `systemPages`              | System Pages          | Create, edit, preview, publish/unpublish, version, trash, and restore system pages         |
| Media          | `media`                    | Media                 | Upload, read, edit metadata, replace, version, trash, and restore media                    |
| Media          | `galleryAlbums`            | Gallery Albums        | Create, edit, reorder, version, trash, and restore albums                                  |
| Forms          | `forms`                    | Forms                 | Create, edit, configure, version, trash, and restore forms                                 |
| Forms          | `formSubmissions`          | Form Submissions      | Read submissions and update assignment, operational status, and internal notes             |
| Administration | `actionQueue`              | Action Queue          | Read and operate relevant generated tasks; never create or delete queue records            |
| Administration | `auditLog`                 | Audit Log             | Read-only access to audit events associated with otherwise granted features                |
| Settings       | `siteIdentity`             | Site Identity         | Edit and publish branding, contact, address, legal, and social settings                    |
| Settings       | `appearance`               | Appearance            | Edit and publish theme and color-mode settings                                             |
| Settings       | `seoMetadata`              | SEO & Metadata        | Edit and publish global metadata, robots, and verification settings                        |
| Settings       | `analyticsTracking`        | Analytics & Tracking  | Edit and publish GTM or GA4 settings                                                       |
| Settings       | `cookieConsent`            | Cookie Consent Banner | Edit and publish consent visibility, copy, links, and presentation                         |
| Configuration  | `layoutDefaults`           | Layout Defaults       | Select homepage/Header/Footer and configure the global announcement                        |
| Configuration  | `searchSettings`           | Search Settings       | Edit and publish suggested-search configuration                                            |
| Configuration  | `maintenanceModes`         | Maintenance & Modes   | Configure and activate normal, maintenance, or coming-soon behavior                        |

There are 29 grantable features.

### Non-grantable destinations and operations

- **Dashboard** is available to every authenticated account and shows only authorized data.
- **My Account** is available for self-service account and password actions, excluding role and
  feature fields.
- **Users** remains Admin-only.
- **Permanent deletion** remains Admin-only for every Trash-enabled collection.
- **Role assignment, feature assignment, user unlocking, and user recovery** remain Admin-only.
- **REST, GraphQL, preview, and custom endpoint access** are not separate grants; they enforce the
  same feature policy as their resource.

## Common Action Policy

For an Admin, every policy helper returns full access unless a resource has an existing integrity
restriction that also applies to Admins.

For a Site Manager:

- `create`, authenticated `read`, `update`, and `readVersions` require the bound feature;
- publication is included when the bound feature supports drafts;
- public anonymous read behavior remains unchanged;
- soft-delete and restore require the bound feature;
- permanent delete always returns false;
- Admin navigation is hidden when the bound feature is absent; and
- direct Admin URLs and APIs remain denied even if manually entered.

Payload Local API calls made on behalf of an authenticated user must pass that user and set
`overrideAccess: false`. Trusted system operations may bypass access only through a documented,
purpose-specific context, such as validated public form intake or migrations.

## Relationship Dependency Reads

Feature isolation must not break authorized editing. A Site Manager may receive bounded read/select
access to a supporting resource when another granted feature needs that relationship. Dependency
access never exposes the supporting sidebar destination and never permits create, update, publish,
trash, restore, or permanent delete.

The initial dependency graph is:

| Granted feature            | Supporting read/select access                                                      |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `pages`                    | Published or selectable Media, Reusable Sections, Pages, and relevant link records |
| `articles`                 | Published or selectable Media, Topics, and Tags                                    |
| `reviews`                  | Published or selectable Media, Topics, Tags, and linked source submission metadata |
| `newsEvents`               | Published or selectable Media, Classifications, Topics, and Tags                   |
| `newsEventsDetailTemplate` | Blocks' existing selectable Media and supporting records                           |
| `headers`                  | Navigation Links and Media needed by Header fields                                 |
| `footers`                  | Navigation Links, Office Locations, Pages, and Media needed by Footer fields       |
| `layoutDefaults`           | Pages, Headers, and Footers used by the global                                     |
| `maintenanceModes`         | System Pages used by the global                                                    |
| `galleryAlbums`            | Media used by an album                                                             |
| `forms`                    | Media or Pages referenced by form configuration, where applicable                  |
| `formSubmissions`          | User IDs/names required for assignment controls, without Users navigation          |
| `actionQueue`              | Only source titles and links for features the user also holds                      |
| `auditLog`                 | Only events associated with features the user also holds                           |

Dependency reads must select only fields required by the Admin relationship control or source label.
Sensitive fields such as reviewer email, submission payloads, user email, storage internals, and
credentials do not become readable through a dependency grant.

## Review Moderation

### Intake

The public form endpoint continues to validate the configured review-intent form and stores the
immutable Form Submission. Its trusted promotion service creates or updates a linked Review with:

- `_status: 'draft'`;
- `moderationStatus: 'pending'`;
- immutable `sourceSubmission` relationship;
- no moderator or approval timestamp; and
- a context marker restricted to the trusted review-promotion operation.

Public input can never set `_status`, moderation status, moderator identity, timestamps, internal
notes, taxonomy, or SEO fields.

### Moderation states

Public-submission Reviews use three states:

- `pending`: unpublished and awaiting a decision;
- `approved`: published after all required Review fields validate; and
- `rejected`: retained but unpublished.

The Review editor replaces the generic Workflow tab with a compact **Moderation** sidebar section.
It shows source, status, decision metadata, and an optional internal moderation note. The Reviews
list defaults to showing moderation status and supports a Pending filter. The Dashboard shows a
Pending Reviews count only to Admins and Site Managers with `reviews`.

### Authorization and transitions

- Admins may moderate every Review.
- Site Managers require `reviews` to read, edit, approve, reject, publish, or unpublish Reviews.
- A public-submission Review cannot be published unless its moderation status becomes `approved` in
  the same authorized operation.
- Approval sets `_status: 'published'`, `moderatedAt`, `moderatedBy`, `publishedAt`, and `publishedBy`.
- Rejection sets `_status: 'draft'`, `moderatedAt`, and `moderatedBy` and records the optional note.
- Moving an approved public Review back to draft does not silently return it to pending; its last
  decision metadata remains for auditability until an explicit new moderation transition.
- Raw `_status` changes, bulk operations, REST, GraphQL, and Local API calls must not bypass the
  moderation guard.
- Approval, rejection, republishing, and unpublishing create audit events.

Reviews created directly by authorized staff have no source submission and may use Payload's normal
draft/publish behavior. They still record publication actor and time.

### Queue behavior

A pending public Review owns one deduplicated moderation Action Queue item. Approval or rejection
resolves that condition. There is no general `in_review` or scheduled-publication queue state after
this redesign.

## Removing the Generic Editorial Workflow

Remove the custom Workflow tabs and the following generic workflow concepts from Pages, Articles,
News & Events, Reviews, and System Pages:

- `workflowState`;
- `scheduledPublishAt`;
- `changeSummary`; and
- `lastReviewedAt` / `lastReviewedBy`.

Retain:

- Payload `_status` drafts and publishing;
- versions and preview;
- `publishedAt` and `publishedBy`, moved to compact read-only publication metadata rather than a
  Workflow tab;
- publication audit events;
- relevant blocking publish issues from the Action Queue; and
- existing public cache invalidation.

Replace the broad editorial-workflow hook with a focused publication-policy hook that:

1. detects transitions to published;
2. verifies the bound feature for user-scoped operations;
3. enforces unresolved publish-issue blockers that remain applicable;
4. stamps publication actor and time; and
5. does not introduce a second status alongside `_status`.

Public queries, sitemap, feeds, search, calendar, metadata, previews, media sanitization, dashboard
counts, and tests must stop requiring `workflowState: 'published'` and use the existing `_status`
publication boundary instead.

Native Payload scheduled publishing is outside this change. The current custom `scheduled` state
does not automatically publish and will be removed rather than retained as a misleading control.

## Admin Experience

### User editor

- Role select contains only Admin and Site Manager.
- Feature Access appears only when Site Manager is selected.
- Feature checkboxes are grouped under Content, News & Events, Taxonomy, Navigation, Site Structure,
  Media, Forms, Administration, Settings, and Configuration.
- Each checkbox uses the exact sidebar label and a short explanation of its action bundle.
- New Site Managers begin with every feature unchecked.
- Selecting Admin hides and clears irrelevant editable feature controls; runtime Admin access remains
  implicit.

### Dashboard

- All authenticated accounts can open Dashboard.
- Admins see all resource summaries.
- Site Managers see summaries only for granted features.
- Generic In Review and Scheduled cards are removed.
- Pending Reviews appears only when Reviews is authorized.
- Operational counts retain explicit unavailable/error states rather than silently displaying zero.

### Navigation

Collection and global `admin.hidden` functions use the same `hasFeature` policy helpers as server
access. Empty Admin groups naturally disappear. Users remains visible only to Admins.

## Action Queue and Audit Scope

The Action Queue remains an optional feature because it also tracks non-editorial operational work,
including form follow-up, review moderation, redirect issues, media issues, and system issues.

For Site Managers:

- the `actionQueue` grant allows operating queue records only when the corresponding source feature
  is also granted;
- source details from unauthorized features are neither returned nor linked; and
- queue records remain system-created and non-deletable.

The Audit Log remains read-only. Site Managers require both `auditLog` and the source feature for an
event. Events with no safe source-feature mapping remain Admin-only.

## Data Migration

Implement a reversible Payload migration that updates active documents and relevant version
snapshots where the removed fields affect public-read compatibility.

### Users

- `admin` remains `admin`.
- `siteManager` remains `siteManager`.
- `contentManager` and legacy editor roles become `siteManager`.
- legacy publisher/marketing roles become `siteManager`.
- Admin feature maps are ignored at runtime.
- Non-Admin capabilities map to the 29 feature keys using an explicit compatibility table.
- For content where the old manage and publish flags disagree, migrate deny-by-default and emit a
  migration report requiring Admin review rather than silently increasing privilege.
- Remove the obsolete `require_editorial_workflow` behavior.
- Preserve a reversible record of prior role/capability values for rollback without exposing it in
  normal Admin/API reads.

### Editorial content

- Preserve `_status`, content, versions, publication timestamps, publication actors, and all public
  URLs.
- Remove runtime dependence on workflow fields before retiring stored workflow data.
- A document that is currently public remains public only when `_status` is already `published` and
  its legacy workflow state is `published`.
- Any contradictory or incomplete legacy state migrates to `_status: 'draft'` and is reported for
  review.
- Do not publish anything as a side effect of migration.

### Reviews

- A public-linked Review that is published under the old model becomes `approved`.
- An unpublished public-linked Review becomes `pending` unless an explicit prior rejection can be
  identified; ambiguous records remain pending.
- Staff-created Reviews do not require a moderation state.
- Existing source-submission links and private reviewer data remain unchanged.

The migration must support dry-run reporting, operate against an explicit database target, use
request-aware Payload operations where hooks must run, guard recursion, and be tested locally before
any production execution. Production migration execution requires a fresh database backup and
separate user approval.

## Security and Failure Handling

- Unknown roles, malformed feature maps, and unknown feature keys fail closed as Site Manager with
  no grants.
- Role and feature fields have Admin-only field access in addition to collection-level restrictions.
- Access helpers return false rather than throwing on malformed user data.
- Custom routes that act for a user use `overrideAccess: false`.
- Trusted public intake bypasses are narrowly scoped and cannot accept authorization fields from
  request data.
- A stale or revoked session cannot retain former privileges after a role/feature update.
- Unauthorized Admin routes return the standard Payload denial behavior without leaking resource
  data.
- Failed review promotion preserves the Form Submission and its existing operator-visible error.
- Failed moderation leaves the Review unpublished and does not partially stamp decision metadata.
- Feature changes, review decisions, user lifecycle changes, permanent deletion, and high-risk
  settings changes remain auditable.

## Testing Strategy

### Unit and integration coverage

- exactly two valid roles and fail-closed role normalization;
- first-user Admin bootstrap and multi-Admin/multi-Site-Manager creation;
- Admin implicit access to all features;
- new Site Manager defaulting to no features;
- role/feature fields writable only by Admins;
- last-Admin demotion/deletion protection;
- session invalidation after grant or role changes;
- one registry entry for every grantable Payload Admin destination and no orphaned feature keys;
- each collection/global hidden state and CRUD/readVersions policy for feature on/off;
- anonymous public-read behavior remains unchanged;
- soft delete/restore for an authorized Site Manager and permanent-delete denial;
- direct REST, GraphQL, Local API, preview, and custom endpoint authorization;
- dependency relationship reads expose only required safe fields and no management access;
- dashboard counts and links include only authorized features;
- queue and audit row-level filtering by source feature;
- public review intake creates a pending draft;
- unauthorized review approval and direct `_status` publication fail;
- authorized approval/rejection transitions and metadata are atomic;
- public feeds and review detail pages include only published/approved reviews;
- publication queries no longer depend on `workflowState`;
- migration dry-run, forward mapping, contradictory-state handling, rollback metadata, and idempotency.

### End-to-end coverage

Test at least these browser personas:

1. Admin with complete navigation and Users access.
2. Site Manager with no grants.
3. Site Manager with a single content grant.
4. Site Manager with Reviews and Action Queue grants.
5. Site Manager with a high-risk Settings or Configuration grant.

Verify sidebar visibility, direct URL denial, create/edit/publish behavior, soft deletion, permanent-
delete denial, relationship selection, review approval, and immediate revocation after an Admin
changes grants.

## Documentation and Generated Artifacts

Implementation must update:

- generated Payload types;
- Admin import map only if custom Admin components change;
- editorial-governance and developer/operator documentation;
- project-context Payload model and architecture references;
- feature/access-control integration tests; and
- any migration runbook required for production rollout.

## Rollout

1. Add the new feature registry and compatibility readers without changing stored data.
2. Add the migration and dry-run report.
3. Update authorization, Admin visibility, and Users administration.
4. Replace generic editorial workflow with publication and Review moderation policies.
5. Update all public queries and Admin dashboard consumers.
6. Run focused tests, full integration tests, types, lint, build, and project-context checks.
7. Back up production.
8. Run and inspect the production dry run.
9. Obtain explicit approval for the production migration.
10. Execute migration, deploy, refresh/invalidate sessions, and verify representative Admin and Site
    Manager accounts.

## Acceptance Criteria

- Only Admin and Site Manager roles exist in the active schema and generated types.
- Multiple accounts of either role can be created by an Admin.
- Users and authorization controls remain unavailable to Site Managers.
- The Users editor exposes exactly 29 grantable, sidebar-aligned features for Site Managers.
- Admin access is unconditional; Site Manager access is deny-by-default and feature-specific.
- Navigation visibility and every server/API operation enforce the same policy.
- Granting a feature includes its documented management and publication behavior.
- Authorized Site Managers may trash and restore records but never permanently delete them.
- Relationship dependencies work without exposing unrelated navigation or mutation access.
- Generic Workflow tabs and workflow-state behavior are removed.
- Payload drafts, versions, previews, publication metadata, Trash, Action Queue, audit, cache
  invalidation, and public filtering remain valid.
- Public-submission Reviews cannot become public without authorized approval.
- Permission revocation takes effect immediately through session invalidation.
- Existing public content does not become unpublished or newly published unexpectedly during
  migration.
