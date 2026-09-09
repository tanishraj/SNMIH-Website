# Users, Features, and Publication Governance

## Roles

The CMS has exactly two roles:

| Role         | Access model                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Admin        | Implicit access to every feature, Users administration, account recovery, and permanent deletion |
| Site Manager | Denied by default; receives only the features selected by an Admin                               |

An Admin may create any number of Admins and Site Managers. New Site Managers begin with no feature
grants. Changing a role or feature grant clears that user's active sessions so revocation takes effect
immediately. The last active Admin cannot be demoted, trashed, or permanently deleted.

## Account authentication

Optional per-account TOTP is implemented by the Users `beforeLogin` hook, including native REST,
GraphQL and Local API login and password-reset operations. REST clients send `twoFactorCode` in the
JSON body; GraphQL and Local API callers may use the `x-two-factor-code` request header. Password-only
accounts remain unchanged. Recovery codes are single-use substitutes for TOTP, not for the password.

`two-factor-credentials` is an internal collection: it has no Admin destination, GraphQL API, Trash,
or client CRUD access, including for Admins. Its user ID is unique. AES-256-GCM encrypts TOTP seeds
with a key derived from Payload's runtime secret and binds ciphertext to its account. Recovery codes
contain 128 random bits and are stored only as SHA-256 hashes. Preserve the original `PAYLOAD_SECRET`
with encrypted backups: rotating it without re-enrollment or a deliberate re-encryption migration
makes enrolled authenticator seeds unreadable.

Revision-conditional database writes atomically reserve attempts, consume codes and change settings.
Those writes intentionally live outside the Users login transaction so rejected logins cannot roll
back rate limits or code consumption. A separate collection avoids contending with the native session
write. A session cutoff on Users reads invalidates old sessions, including password-only logins that
were in flight during enrollment. Native authentication still owns password verification, tokens,
cookies, and session refresh. The password-confirmation path aborts its temporary login before token
issuance; it does not create an additional authenticated session.

The account endpoint accepts only the authenticated account, same-origin JSON mutations, and current
password confirmation. Enabling requires proof of the pending secret; disabling or replacing recovery
codes also requires the existing factor. Setup secrets expire after ten minutes. Enrollment, disable,
and recovery-code replacement create Admin-only audit events. Permanent user deletion removes the
credential document in the same transaction.

There is no remote Admin bypass for lost factors. An operator-assisted reset requires verifying the
account owner's identity and a controlled database change that disables that account's factor, removes
its secrets/recovery hashes, advances its revision and session cutoff, and records the intervention.
Do not delete the credential document to reset an account: its cutoff must remain to invalidate old sessions.

Run `pnpm test:two-factor` for the isolated browser journey. It uses a disposable MongoDB replica set
and a standalone production build of a temporary application copy, refuses an existing server on port 3011, and never loads the site's
`.env` into that copy. The real-Payload authentication regression suite is
`tests/int/two-factor-auth.int.spec.ts`.

## Site Manager Features

Each checkbox corresponds to one Payload Admin destination. A grant controls both navigation and
server-side access through Admin, REST, GraphQL, preview, and user-scoped Local API calls.

| Admin group    | Feature               | Included Site Manager actions                                               |
| -------------- | --------------------- | --------------------------------------------------------------------------- |
| Content        | Pages                 | Create, read, edit, preview, publish/unpublish, version, trash, and restore |
| Content        | Articles              | Create, read, edit, preview, publish/unpublish, version, trash, and restore |
| Content        | Reviews               | Manage staff Reviews and approve/reject public review submissions           |
| Content        | Reusable Sections     | Create, edit, version, trash, and restore                                   |
| News & Events  | News & Events         | Create, edit, preview, publish/unpublish, version, trash, and restore       |
| News & Events  | Classifications       | Create, edit, and archive; deletion remains Admin-only                      |
| News & Events  | Detail Page Template  | Edit, preview, version, and publish the shared detail layout                |
| Taxonomy       | Topics                | Create, edit, archive, trash, restore, and select                           |
| Taxonomy       | Tags                  | Create, edit, archive, trash, restore, and select                           |
| Navigation     | Navigation Links      | Create, edit, publish, version, trash, and restore                          |
| Navigation     | Redirects             | Create, edit, enable/disable, version, trash, and restore                   |
| Site Structure | Headers               | Create, edit, preview, publish, version, trash, and restore                 |
| Site Structure | Footers               | Create, edit, preview, publish, version, trash, and restore                 |
| Site Structure | Office Locations      | Create, edit, version, trash, and restore                                   |
| Site Structure | System Pages          | Create, edit, preview, publish/unpublish, version, trash, and restore       |
| Media          | Media                 | Upload, edit, replace, version, trash, and restore                          |
| Media          | Gallery Albums        | Create, edit, reorder, version, trash, and restore                          |
| Forms          | Forms                 | Create, edit, configure, version, trash, and restore                        |
| Forms          | Form Submissions      | Read submissions and update assignment, status, and internal notes          |
| Administration | Action Queue          | Operate generated tasks only for other features the user also holds         |
| Administration | Audit Log             | Read events only for other features the user also holds                     |
| Settings       | Site Identity         | Edit branding, contact, address, legal, and social settings                 |
| Settings       | Appearance            | Edit theme and color-mode settings                                          |
| Settings       | SEO & Metadata        | Edit global metadata, robots, and verification settings                     |
| Settings       | Analytics & Tracking  | Edit GTM or GA4 settings                                                    |
| Settings       | Cookie Consent Banner | Edit consent visibility, copy, links, and presentation                      |
| Configuration  | Layout Defaults       | Select homepage/Header/Footer and edit the announcement                     |
| Configuration  | Search Settings       | Edit suggested-search configuration                                         |
| Configuration  | Maintenance & Modes   | Configure normal, maintenance, and coming-soon behavior                     |

Dashboard and My Account are available to every authenticated user. Users, role assignment, feature
assignment, unlocking accounts, and permanent deletion are never grantable.

## Dependency Reads

Editing a granted feature can require relationship options from another destination. The access layer
allows bounded read/select access for those dependencies while keeping their sidebar destinations and
all mutation operations unavailable. Examples include Media for Articles, Topics and Tags for Reviews,
Pages and Media for Headers, and Pages/Headers/Footers for Layout Defaults.

Form Submission and Action Queue assignment controls may resolve other users to an opaque `User #ID`
label. Another user's email, role, grants, sessions, and credentials are not returned to a Site Manager.

## Publication

Pages, Articles, News & Events, Reviews, and System Pages use Payload's native `_status` as the only
draft/publication state. The former generic Workflow tab and its in-review/scheduled states no longer
exist. Publishing requires the owning feature, stamps `publishedAt` and `publishedBy`, and is rejected
while an open or blocked approval/publish-issue queue item exists for that record.

Site Managers may trash and restore records in granted Trash-enabled features. Only Admins may
permanently delete them.

## Public Review Moderation

A valid public review form submission creates a linked Review with `_status: draft` and
`moderationStatus: pending`. The source submission is immutable.

- `approved` publishes the Review and stamps moderator and publication metadata;
- `rejected` retains it as a draft and stamps the moderator decision; and
- direct publication while pending or rejected is denied.

Only an Admin or a Site Manager with Reviews can approve or reject. Public Review reads additionally
require either a staff-authored Review or an approved submitted Review, providing a defensive boundary
against inconsistent legacy data.

## Action Queue and Audit Log

Action Queue items are system-created and non-deletable. Site Managers need Action Queue plus the
item's source feature. System-owned source and deduplication fields are write-protected; operators may
change only triage fields such as status, assignment, priority, due date, notes, and resolution.

Audit Log is read-only. Site Managers need Audit Log plus the event's source feature. Unmapped legacy
events and user lifecycle events remain visible only to Admins. Permanent deletion of a grantable
collection record is logged with its feature and record ID without copying deleted content into the
audit entry.

## Migration and Rollout

The reversible migration `20260902_000000_two_role_feature_permissions` maps legacy roles and
capabilities, migrates current content and relevant versions, initializes review moderation, assigns
queue ownership, and resolves retired generic workflow items. Conflicting legacy manage/publish flags
remain ungranted and are reported for Admin review.

Run a read-only report only against an explicit target. For local Docker:

```bash
pnpm report:permissions-migration -- --database-uri "mongodb://127.0.0.1:27017/payload-cms-starter-kit"
```

Before any shared or production migration:

1. take a fresh database backup;
2. run and inspect the dry-run report;
3. review every conflict, unknown role, demoted contradictory publication, and unmapped queue item;
4. obtain separate approval for that exact database; and
5. run the registered Payload migration through the normal deployment process.

Do not use a production URI merely to test the reporter or migration.
