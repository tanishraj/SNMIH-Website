# Release Gate Hardening Design

## Objective

Make the starter safe and reproducible enough for the next one-client deployment by closing the audited public-data and cache-correctness gaps, removing unsafe repository/build-context artifacts, restoring the verification baseline, and adding continuous verification.

This work preserves the product model: one curated client, one deployment, and one Payload dataset. It does not add tenants, tenant switching, a theme marketplace, or SaaS-builder infrastructure.

## Scope

The release gate contains five independently reviewable units:

1. Public CMS access and authenticated preview authorization.
2. Publish, unpublish, delete, and redirect cache invalidation.
3. Repository, container, and production-secret hygiene.
4. Block registry and maintained-contract recovery.
5. Continuous integration for the supported MongoDB stack.

Database archive history rewriting is explicitly excluded. The current files will be removed from the working tree and prevented from re-entering Git or Docker contexts. A separate operator procedure will cover archive inspection, credential rotation, and coordinated history cleanup when necessary.

## Access-Control Design

Anonymous collection reads must be constrained at the Payload access layer rather than relying on frontend loader filters. The existing capability helpers remain the single policy vocabulary:

- Authenticated users with the relevant capability retain their current document access.
- Anonymous readers receive a Payload `Where` constraint for published content when the collection supports drafts.
- Collections that are intentionally private remain false for anonymous readers.
- Fields containing internal form notes, notification recipients, storage diagnostics, or other operational data receive field-level read access that excludes anonymous requests.

The implementation will audit every collection using `allowPublicReadOrCapability` and migrate only collections whose public contract is published content. It will not blindly make operational collections public or add `_status` queries to collections that do not own drafts.

Preview routes will continue to require authentication and will additionally execute user-scoped Local API operations with the authenticated user and `overrideAccess: false`. Users without the relevant read or preview capability receive the route's existing denied/not-found behavior. Preview responses must not reveal whether an inaccessible draft exists.

`SearchSettings` will join the capability model, receive version history for recovery, and use the existing settings-management capability rather than introducing a new role system.

## Cache-Correctness Design

Cache invalidation hooks will derive transition state from both documents:

- `previousDoc` determines whether public content existed before the operation.
- `doc` determines whether public content exists after the operation.
- A published document being updated, unpublished, moved to draft, or deleted invalidates its relevant cache tags and paths.
- A draft-only edit that never had a public representation does not create unnecessary public invalidation.

Pages, Articles, Reviews, News & Events, and Redirects will follow the same transition vocabulary while preserving their existing tag/path ownership. Tests will exercise published-to-published updates, published-to-draft transitions, draft-only changes, and deletion where supported.

## Repository and Runtime Hygiene

Tracked database archives will be removed from the current tree. `.gitignore` will reject local backup archives and `.dockerignore` will exclude Git metadata, environment files, backups, reports, tests, local media, and other non-runtime artifacts from the Docker build context without excluding files required by the standalone Next.js build.

The runtime contract will reject a missing, placeholder, or insufficiently strong `PAYLOAD_SECRET` in production. Development and test environments may retain explicit local defaults only where the existing test/runtime contract requires them. The Payload config will consume the validated value instead of silently falling back to an empty string.

GraphQL Playground will be unavailable in production. Existing REST and GraphQL endpoints remain supported. CSP and broader origin-policy work stay in the following production-hardening phase because they require coordinated treatment of Payload Admin, previews, inline scripts, analytics, and storage origins.

The operator documentation will state that removed archives may still exist in Git history. It will provide a decision procedure for inspecting data, rotating affected credentials, and scheduling a coordinated history rewrite without running that destructive operation automatically.

## Contract Recovery

`DepartmentProfilesBlock` will be added to the News & Events detail-template schema registry in the same relative order as the Page and Reusable Section registries. Existing server/client rendering boundaries remain explicit; this work will not create a universal registry that mixes server-only and client-capable modules.

The Rich Text appearance contract will assert against the current shared style owner rather than a stale component location. The SNMIH theme contract will compare the intended numeric color values without treating insignificant trailing-zero serialization as a visual palette change.

Generated Payload types and the project-context inventory will be refreshed after schema and registration changes. Narrative architecture references will be updated only where this implementation changes an operator or runtime contract.

## Continuous Integration

A GitHub Actions workflow will run for pull requests and protected-branch pushes using the repository's pinned Node and pnpm expectations. The required sequence is:

1. Frozen dependency installation.
2. Project-context consistency check.
3. Payload generated-type consistency.
4. TypeScript checking.
5. ESLint with no command errors.
6. Integration tests against a supported MongoDB service configured for the transaction behavior exercised by the application.
7. Production build.

Browser and Docker smoke expansion may follow in the production-hardening phase. The release gate must not weaken or skip Mongo-dependent tests merely to obtain a green workflow.

## Testing and Failure Behavior

Access regression tests will prove that anonymous REST/GraphQL-style access decisions expose published documents but exclude drafts and protected fields. Authenticated capability tests will prove that legitimate editors retain access and unauthorized authenticated users cannot use previews as an access bypass.

Cache tests will prove invalidation for published updates, published-to-draft transitions, and deletion. Tests will verify both cache tags and path/redirect invalidation where the hook owns them.

Runtime tests will cover production rejection of absent, placeholder, and weak Payload secrets plus acceptance of a high-entropy value. Development behavior will remain explicit and deterministic.

Repository-hygiene tests will cover ignored backup patterns and the Docker context contract. Existing block parity, theme, Rich Text, generated inventory, TypeScript, lint, integration, and build checks must pass before handoff.

## Rollout and Recovery

The changes will be implemented as reviewable slices in this order: access, cache, hygiene/runtime, contracts, CI. Each slice receives focused tests before the complete verification run.

No data migration is required for the access and cache fixes. `SearchSettings` versioning changes only future persistence behavior. Removing repository archives does not delete an external backup location; operators must first confirm that an approved backup exists outside the repository.

If stricter access reveals a frontend query that accidentally depended on anonymous draft access, that query must be corrected to request published content or to run as an explicitly trusted server operation. The access policy must not be relaxed to preserve an unsafe caller.

## Success Criteria

- Anonymous Payload API reads cannot return drafts or protected operational fields.
- Preview access is capability-enforced through Payload, not authentication-only.
- Public content is removed from caches after unpublish or deletion.
- Database archives and environment files cannot enter new Git changes or Docker contexts.
- Production cannot start with an empty or weak Payload secret, and GraphQL Playground is disabled there.
- Page-compatible schema registries and maintained tests agree.
- Project context is current.
- The required CI workflow passes without weakening existing tests.
- The starter remains explicitly one client per deployment.
