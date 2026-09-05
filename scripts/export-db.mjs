import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { config } from 'dotenv'

config()

const databaseUrl = process.env.MONGODB_URI
const databaseName = process.env.DATABASE_NAME?.trim() || ''

if (!databaseUrl) {
  console.error('MONGODB_URI is required in .env')
  process.exit(1)
}

if (
  databaseName &&
  (databaseName.length > 63 ||
    !/^[A-Za-z0-9_-]+$/.test(databaseName) ||
    ['admin', 'config', 'local'].includes(databaseName.toLowerCase()))
) {
  console.error(
    'DATABASE_NAME must use at most 63 letters, numbers, hyphens, or underscores and cannot be admin, config, or local.',
  )
  process.exit(1)
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '')
const backupsDir = join(process.cwd(), 'backups')
const archivePath = join(backupsDir, `payload-db-${timestamp}.archive`)

mkdirSync(backupsDir, { recursive: true })

try {
  const args = ['--uri', databaseUrl]

  if (databaseName) {
    args.push('--db', databaseName)
  }

  args.push('--archive', archivePath, '--gzip')
  execFileSync('mongodump', args)
} catch (error) {
  const maybeError = error instanceof Error ? error : undefined
  const stderr =
    maybeError && 'stderr' in maybeError && maybeError.stderr != null
      ? maybeError.stderr.toString()
      : ''
  const output =
    maybeError && maybeError.stderr != null
      ? `${maybeError.message}\n${stderr.toString()}`
      : (maybeError?.message ?? '')

  const missingCommandHint =
    output.includes('not found') ||
    output.includes('command not found') ||
    output.includes('No such file or directory')

  if (missingCommandHint) {
    console.error(
      'mongodump was not found. Install MongoDB Database Tools or use Docker to run mongodump.',
    )
  } else {
    console.error(output || 'Failed to run mongodump.')
  }

  process.exit(1)
}

console.log(`Exported database snapshot to: ${archivePath}`)
