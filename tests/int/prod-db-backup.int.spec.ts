import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  buildProdBackupObjectKey,
  normalizeR2BackupEndpoint,
  planProdBackupPruning,
  PROD_DATABASE_NAME,
  PROD_DB_BACKUP_BUCKET,
  PROD_DB_BACKUP_PREFIX,
  PROD_DB_BACKUP_RETENTION_COUNT,
} from '../../scripts/lib/prodDbBackupPolicy'

describe('production database backup policy', () => {
  it('is fixed to the private production backup destination', () => {
    expect(PROD_DATABASE_NAME).toBe('prod')
    expect(PROD_DB_BACKUP_BUCKET).toBe('snmih-prod-db-backups')
    expect(PROD_DB_BACKUP_PREFIX).toBe('prod-db-backup/')
    expect(PROD_DB_BACKUP_RETENTION_COUNT).toBe(30)
    expect(buildProdBackupObjectKey(new Date('2026-09-06T02:00:00.000Z'))).toBe(
      'prod-db-backup/prod-2026-09-06T02-00-00-000Z.archive.gz',
    )
  })

  it('accepts only origin-only Cloudflare R2 S3 endpoints', () => {
    expect(normalizeR2BackupEndpoint('https://account-id.eu.r2.cloudflarestorage.com/')).toBe(
      'https://account-id.eu.r2.cloudflarestorage.com',
    )

    expect(() => normalizeR2BackupEndpoint('http://account-id.r2.cloudflarestorage.com')).toThrow()
    expect(() => normalizeR2BackupEndpoint('https://backups.example.com')).toThrow()
    expect(() =>
      normalizeR2BackupEndpoint('https://account-id.r2.cloudflarestorage.com/a-path'),
    ).toThrow()
  })

  it('keeps the newest 30 archives and prunes paired or orphaned checksums', () => {
    const archives = Array.from({ length: 32 }, (_, index) => {
      const createdAt = new Date(Date.UTC(2026, 7, index + 1, 2))

      return {
        Key: buildProdBackupObjectKey(createdAt),
        LastModified: createdAt.toISOString(),
      }
    })
    const oldestArchiveKeys = archives.slice(0, 2).map(({ Key }) => Key)
    const orphanedChecksum = `${PROD_DB_BACKUP_PREFIX}prod-orphan.archive.gz.sha256`
    const pruningPlan = planProdBackupPruning([
      ...archives,
      ...archives.map(({ Key, LastModified }) => ({ Key: `${Key}.sha256`, LastModified })),
      { Key: orphanedChecksum, LastModified: '2026-07-01T00:00:00.000Z' },
      { Key: 'another-prefix/unmanaged.archive.gz', LastModified: '2020-01-01T00:00:00.000Z' },
    ])

    expect(pruningPlan.archiveKeys).toEqual(oldestArchiveKeys)
    expect(pruningPlan.checksumKeys).toEqual(
      [...oldestArchiveKeys.map((key) => `${key}.sha256`), orphanedChecksum].sort(),
    )
  })

  it('runs daily and can also be triggered manually', () => {
    const workflow = readFileSync('.github/workflows/prod-db-backup.yml', 'utf8')

    expect(workflow).toContain("cron: '0 2 * * *'")
    expect(workflow).toContain('workflow_dispatch:')
    expect(workflow).toContain('environment: production-backup')
    expect(workflow).toContain('run: pnpm backup:prod-db')
  })
})
