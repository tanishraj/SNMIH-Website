export const PROD_DATABASE_NAME = 'prod'
export const PROD_DB_BACKUP_BUCKET = 'snmih-prod-db-backups'
export const PROD_DB_BACKUP_PREFIX = 'prod-db-backup/'
export const PROD_DB_BACKUP_RETENTION_COUNT = 30

export type R2ListedObject = {
  Key?: string
  LastModified?: string
}

export type ProdBackupPruningPlan = {
  archiveKeys: string[]
  checksumKeys: string[]
}

const ARCHIVE_SUFFIX = '.archive.gz'
const CHECKSUM_SUFFIX = '.sha256'

export const buildProdBackupObjectKey = (createdAt: Date): string => {
  if (Number.isNaN(createdAt.getTime())) {
    throw new Error('Cannot create a production backup key from an invalid date.')
  }

  const timestamp = createdAt.toISOString().replace(/[:.]/g, '-')

  return `${PROD_DB_BACKUP_PREFIX}prod-${timestamp}${ARCHIVE_SUFFIX}`
}

export const buildProdMongoDumpArguments = (mongodbURI: string, archivePath: string): string[] => [
  `--uri=${mongodbURI}`,
  `--db=${PROD_DATABASE_NAME}`,
  `--archive=${archivePath}`,
  '--gzip',
]

export const normalizeR2BackupEndpoint = (value: string): string => {
  let endpoint: URL

  try {
    endpoint = new URL(value.trim())
  } catch {
    throw new Error('R2_BACKUP_ENDPOINT must be a valid Cloudflare R2 HTTPS endpoint.')
  }

  const isCloudflareR2 = endpoint.hostname.endsWith('.r2.cloudflarestorage.com')
  const hasOnlyOrigin =
    !endpoint.username &&
    !endpoint.password &&
    endpoint.pathname === '/' &&
    !endpoint.search &&
    !endpoint.hash

  if (endpoint.protocol !== 'https:' || !isCloudflareR2 || !hasOnlyOrigin) {
    throw new Error(
      'R2_BACKUP_ENDPOINT must be an HTTPS Cloudflare R2 S3 endpoint without credentials, a path, query, or fragment.',
    )
  }

  return endpoint.origin
}

const getObjectTimestamp = (object: R2ListedObject): number => {
  if (!object.LastModified) return 0

  const timestamp = Date.parse(object.LastModified)

  return Number.isNaN(timestamp) ? 0 : timestamp
}

export const planProdBackupPruning = (
  objects: R2ListedObject[],
  retentionCount = PROD_DB_BACKUP_RETENTION_COUNT,
): ProdBackupPruningPlan => {
  if (!Number.isInteger(retentionCount) || retentionCount < 1) {
    throw new Error('Production backup retention count must be a positive integer.')
  }

  const archiveObjects = objects
    .filter(
      (object): object is R2ListedObject & { Key: string } =>
        typeof object.Key === 'string' &&
        object.Key.startsWith(PROD_DB_BACKUP_PREFIX) &&
        object.Key.endsWith(ARCHIVE_SUFFIX),
    )
    .sort((left, right) => {
      const timestampDifference = getObjectTimestamp(right) - getObjectTimestamp(left)

      return timestampDifference || right.Key.localeCompare(left.Key)
    })

  const archiveKeySet = new Set(archiveObjects.map(({ Key }) => Key))
  const archiveKeys = archiveObjects
    .slice(retentionCount)
    .map(({ Key }) => Key)
    .sort()
  const checksumKeys = new Set(archiveKeys.map((key) => `${key}${CHECKSUM_SUFFIX}`))

  for (const object of objects) {
    if (
      typeof object.Key !== 'string' ||
      !object.Key.startsWith(PROD_DB_BACKUP_PREFIX) ||
      !object.Key.endsWith(`${ARCHIVE_SUFFIX}${CHECKSUM_SUFFIX}`)
    ) {
      continue
    }

    const archiveKey = object.Key.slice(0, -CHECKSUM_SUFFIX.length)

    if (!archiveKeySet.has(archiveKey)) {
      checksumKeys.add(object.Key)
    }
  }

  return {
    archiveKeys,
    checksumKeys: [...checksumKeys].sort(),
  }
}
