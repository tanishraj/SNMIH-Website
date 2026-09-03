import { execSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { config } from 'dotenv'

config()

const databaseUrl = process.env.MONGODB_URI

if (!databaseUrl) {
  console.error('MONGODB_URI is required in .env')
  process.exit(1)
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '')
const backupsDir = join(process.cwd(), 'backups')
const archivePath = join(backupsDir, `payload-db-${timestamp}.archive`)

mkdirSync(backupsDir, { recursive: true })

try {
  execSync(`mongodump --uri="${databaseUrl}" --archive="${archivePath}" --gzip`)
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
