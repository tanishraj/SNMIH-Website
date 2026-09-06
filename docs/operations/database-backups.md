# Production Database Backups

The production-only backup job runs daily at 02:00 UTC (06:00 Asia/Dubai) and can also be started
manually from GitHub Actions. It exports only the MongoDB `prod` database, uploads the compressed
archive and its SHA-256 checksum to the private `snmih-prod-db-backups` R2 bucket, verifies the
remote size and checksum metadata, and retains the newest 30 managed archives.

Archives use keys shaped like:

```text
prod-db-backup/prod-2026-09-06T02-00-00-000Z.archive.gz
prod-db-backup/prod-2026-09-06T02-00-00-000Z.archive.gz.sha256
```

R2 presents `prod-db-backup/` as a folder, but it is an object-key prefix. The retention code only
manages `.archive.gz` files and their checksum sidecars under this prefix. It never deletes objects
outside the prefix. Rotation starts only after the new archive upload passes size and SHA-256
verification. A failed deletion fails the job and retains extra data rather than risking deletion
of the newly created backup.

## Cloudflare R2 Prerequisites

Keep `snmih-prod-db-backups` private:

- do not enable its `r2.dev` URL;
- do not attach a public custom domain;
- create a dedicated Object Read & Write R2 token scoped only to this bucket;
- do not reuse the website media-storage token.

R2 encrypts objects at rest, but the archive still contains sensitive production application data.
Limit access to operators responsible for database recovery and apply the institution's approved
retention and data-residency policies.

## GitHub Setup

Create a GitHub Environment named `production-backup`. Do not add a required-reviewer gate if the
daily scheduled run must remain unattended. Add these environment secrets:

| Secret                        | Purpose                                                         |
| ----------------------------- | --------------------------------------------------------------- |
| `PROD_MONGODB_URI`            | Atlas connection URI for a production backup-only database user |
| `R2_BACKUP_ENDPOINT`          | R2 S3 endpoint, without a bucket name or path                   |
| `R2_BACKUP_ACCESS_KEY_ID`     | Bucket-scoped R2 access key                                     |
| `R2_BACKUP_SECRET_ACCESS_KEY` | Bucket-scoped R2 secret key                                     |

The MongoDB user needs only the permissions required to read and export the `prod` database. The R2
token needs read, list, write, and delete access because the job verifies uploads and removes
archives beyond the 30-backup cap. Ensure Atlas network access permits the runner. Prefer a runner
with controlled egress instead of broadly opening Atlas solely for this workflow.

Scheduled workflows run from the repository's default branch, so merge
`.github/workflows/prod-db-backup.yml` into that branch before expecting automatic backups.

## Running And Monitoring

Run a manual backup from **Actions → Production Database Backup → Run workflow** before relying on
the schedule. A successful run prints only the object key, archive size, and retention result; it
does not print database or R2 credentials.

The equivalent local command is:

```bash
pnpm backup:prod-db
```

It requires `mongodump`, AWS CLI v2, and the four environment values above. The command uses a
restricted temporary directory and removes its local archive after the upload attempt.

## Recovery Readiness

This is a logical, single-database `mongodump`. Because MongoDB does not allow `--oplog` together
with a database-limited dump, it is not guaranteed to represent a single instant if production
writes happen during the export. Schedule it during a low-write period and retain Atlas Cloud
Backup or point-in-time recovery as the primary disaster-recovery mechanism.

Before treating the automation as complete:

1. download one archive and its checksum from the private bucket;
2. verify the SHA-256 checksum;
3. run `mongorestore --dryRun` against an isolated non-production database;
4. perform a real isolated restore and verify Payload collections, indexes, and media records;
5. record the restore duration and repeat this drill periodically.

Never restore this archive over `prod`, `stage`, or `test` as part of a backup verification drill.
