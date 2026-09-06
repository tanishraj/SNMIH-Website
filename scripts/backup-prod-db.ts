import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, createReadStream, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

import { config } from 'dotenv'

import {
  buildProdBackupObjectKey,
  buildProdMongoDumpArguments,
  normalizeR2BackupEndpoint,
  planProdBackupPruning,
  PROD_DATABASE_NAME,
  PROD_DB_BACKUP_BUCKET,
  PROD_DB_BACKUP_PREFIX,
  PROD_DB_BACKUP_RETENTION_COUNT,
  type R2ListedObject,
} from './lib/prodDbBackupPolicy'

config()

const requireEnvironmentValue = (name: string): string => {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} is required.`)
  }

  return value
}

const hashFile = (filePath: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const input = createReadStream(filePath)

    input.on('data', (chunk) => hash.update(chunk))
    input.on('error', reject)
    input.on('end', () => resolve(hash.digest('hex')))
  })

const runCommand = (
  label: string,
  command: string,
  args: string[],
  options: Parameters<typeof execFileSync>[2] = {},
): void => {
  try {
    execFileSync(command, args, options)
  } catch {
    throw new Error(`${label} failed. Review the command output above.`)
  }
}

const captureCommand = (
  label: string,
  command: string,
  args: string[],
  environment: NodeJS.ProcessEnv,
): string => {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      env: environment,
      stdio: ['ignore', 'pipe', 'inherit'],
    })
  } catch {
    throw new Error(`${label} failed. Review the command output above.`)
  }
}

const runProdDatabaseBackup = async (): Promise<void> => {
  const mongodbURI = requireEnvironmentValue('PROD_MONGODB_URI')
  const r2Endpoint = normalizeR2BackupEndpoint(requireEnvironmentValue('R2_BACKUP_ENDPOINT'))
  const r2AccessKeyID = requireEnvironmentValue('R2_BACKUP_ACCESS_KEY_ID')
  const r2SecretAccessKey = requireEnvironmentValue('R2_BACKUP_SECRET_ACCESS_KEY')

  if (!mongodbURI.startsWith('mongodb://') && !mongodbURI.startsWith('mongodb+srv://')) {
    throw new Error('PROD_MONGODB_URI must be a MongoDB connection string.')
  }

  const awsEnvironment = {
    ...process.env,
    AWS_ACCESS_KEY_ID: r2AccessKeyID,
    AWS_DEFAULT_REGION: 'auto',
    AWS_EC2_METADATA_DISABLED: 'true',
    AWS_MAX_ATTEMPTS: '5',
    AWS_REGION: 'auto',
    AWS_SECRET_ACCESS_KEY: r2SecretAccessKey,
  }
  const awsArguments = ['--endpoint-url', r2Endpoint, '--region', 'auto']
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'snmih-prod-db-backup-'))
  const objectKey = buildProdBackupObjectKey(new Date())
  const archivePath = join(temporaryDirectory, basename(objectKey))
  const checksumPath = `${archivePath}.sha256`

  try {
    console.log(`Creating a compressed backup of the ${PROD_DATABASE_NAME} database...`)
    runCommand('mongodump', 'mongodump', buildProdMongoDumpArguments(mongodbURI, archivePath), {
      stdio: ['ignore', 'inherit', 'inherit'],
    })

    chmodSync(archivePath, 0o600)
    const archiveSize = statSync(archivePath).size

    if (archiveSize < 1) {
      throw new Error('mongodump created an empty archive.')
    }

    const checksum = await hashFile(archivePath)
    writeFileSync(checksumPath, `${checksum}  ${basename(archivePath)}\n`, { mode: 0o600 })

    const archiveURI = `s3://${PROD_DB_BACKUP_BUCKET}/${objectKey}`
    const checksumKey = `${objectKey}.sha256`
    const checksumURI = `s3://${PROD_DB_BACKUP_BUCKET}/${checksumKey}`

    console.log(`Uploading ${objectKey} to the private R2 backup bucket...`)
    runCommand(
      'R2 archive upload',
      'aws',
      [
        ...awsArguments,
        's3',
        'cp',
        archivePath,
        archiveURI,
        '--content-type',
        'application/gzip',
        '--metadata',
        `sha256=${checksum}`,
        '--only-show-errors',
      ],
      { env: awsEnvironment, stdio: ['ignore', 'inherit', 'inherit'] },
    )
    runCommand(
      'R2 checksum upload',
      'aws',
      [
        ...awsArguments,
        's3',
        'cp',
        checksumPath,
        checksumURI,
        '--content-type',
        'text/plain',
        '--only-show-errors',
      ],
      { env: awsEnvironment, stdio: ['ignore', 'inherit', 'inherit'] },
    )

    const headOutput = captureCommand(
      'R2 archive verification',
      'aws',
      [
        ...awsArguments,
        's3api',
        'head-object',
        '--bucket',
        PROD_DB_BACKUP_BUCKET,
        '--key',
        objectKey,
        '--output',
        'json',
      ],
      awsEnvironment,
    )
    const remoteArchive = JSON.parse(headOutput) as {
      ContentLength?: number
      Metadata?: Record<string, string>
    }

    if (
      remoteArchive.ContentLength !== archiveSize ||
      remoteArchive.Metadata?.sha256 !== checksum
    ) {
      throw new Error('The uploaded R2 archive did not pass size and SHA-256 verification.')
    }

    const listOutput = captureCommand(
      'R2 backup listing',
      'aws',
      [
        ...awsArguments,
        's3api',
        'list-objects-v2',
        '--bucket',
        PROD_DB_BACKUP_BUCKET,
        '--prefix',
        PROD_DB_BACKUP_PREFIX,
        '--output',
        'json',
      ],
      awsEnvironment,
    )
    const listedObjects = JSON.parse(listOutput) as { Contents?: R2ListedObject[] }
    const pruningPlan = planProdBackupPruning(listedObjects.Contents ?? [])

    for (const key of [...pruningPlan.archiveKeys, ...pruningPlan.checksumKeys]) {
      runCommand(
        `R2 retention deletion for ${key}`,
        'aws',
        [
          ...awsArguments,
          's3api',
          'delete-object',
          '--bucket',
          PROD_DB_BACKUP_BUCKET,
          '--key',
          key,
        ],
        { env: awsEnvironment, stdio: ['ignore', 'inherit', 'inherit'] },
      )
    }

    console.log(
      `Production database backup complete: ${objectKey} (${archiveSize} bytes). Retention is capped at ${PROD_DB_BACKUP_RETENTION_COUNT} archives.`,
    )
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true })
  }
}

runProdDatabaseBackup().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown backup error.'

  console.error(`Production database backup failed: ${message}`)
  process.exitCode = 1
})
