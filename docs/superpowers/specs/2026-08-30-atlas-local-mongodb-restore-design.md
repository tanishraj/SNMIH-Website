# Atlas To Local MongoDB Restore Design

## Goal

Replace the repository's local Docker MongoDB data with a verified snapshot of the supplied
MongoDB Atlas database while retaining a recoverable copy of the previous local data.

## Current State

- The application connects to `mongodb://127.0.0.1:27017/payload-cms-starter-kit` from the host.
- Atlas contains the source database as `test` with 50 collections and 3,859 documents.
- The previous local database contained 51 collections and 2,637 documents.
- Both databases have already been exported to gzip-compressed archives under the ignored
  `backups/` directory.
- Atlas runs MongoDB 8.0.29. The unpinned `mongo:latest` Compose image resolved to MongoDB
  8.2.12, and `mongorestore` warned that restoring across those versions is unsupported.

## Design

Pin the local Compose service to `mongo:8.0.29`, matching Atlas exactly. Move the service to a
new Compose-managed data volume so MongoDB 8.0.29 never opens files previously touched by the
8.2.12 container. Leave the previous Docker volume intact as an additional recovery path.

Recreate only the `mongo` service. Restore the archive with namespace mapping from `test.*` to
`payload-cms-starter-kit.*`, preserving the application's existing connection string and avoiding
environment changes. The Atlas credential remains command input only and is not written to source,
environment, documentation, or Git history.

## Data Flow

1. Validate that the local recovery archive and Atlas archive are present and non-empty.
2. Recreate the Compose `mongo` service with MongoDB 8.0.29 and fresh storage.
3. Confirm the target database is empty before restore.
4. Restore every `test` collection and index into `payload-cms-starter-kit`.
5. Compare local collection names and document counts with a fresh read-only Atlas summary.
6. Confirm the local service remains healthy and the application URI can connect.

## Failure Handling

- Never delete either archive during this workflow.
- Never remove the previous Docker data volume during this workflow.
- Stop if the pinned image cannot start, the target is unexpectedly non-empty, any restore item
  fails, or verification differs from the source.
- If restore fails after writing data, recreate the new empty volume and retry from the Atlas
  archive; the former local database remains recoverable from its archive and prior volume.

## Verification

The restore is successful only when:

- the local server reports MongoDB 8.0.29;
- the restore reports zero failed documents;
- local and Atlas collection-name sets match;
- local and Atlas per-collection document counts match;
- the aggregate local result is 50 collections and 3,859 documents;
- restored indexes are present; and
- the repository's project-context update/check loop passes.

## Repository Impact

The durable repository change is limited to pinning the local Mongo image and naming its new
version-compatible volume. Active MongoDB operations documentation will record why the local image
is pinned. No application schema, Payload configuration, generated types, or production database
configuration changes.
