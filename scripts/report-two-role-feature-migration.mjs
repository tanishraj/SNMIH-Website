import process from 'node:process'

const readArgument = (name) => {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const databaseURI = readArgument('--database-uri')

if (!databaseURI) {
  console.error(
    'Usage: pnpm report:permissions-migration -- --database-uri "mongodb://localhost:27017/database"',
  )
  process.exitCode = 1
} else {
  process.env.MONGODB_URI = databaseURI

  const maskDatabaseURI = (value) => {
    try {
      const parsed = new URL(value)
      if (parsed.username) parsed.username = '***'
      if (parsed.password) parsed.password = '***'
      return parsed.toString()
    } catch {
      return '[invalid database URI]'
    }
  }

  const [{ getPayload }, { default: config }, { collectTwoRoleFeatureMigrationReport }] =
    await Promise.all([
      import('payload'),
      import('../src/payload.config.ts'),
      import('../src/migrations/20260902_000000_two_role_feature_permissions.ts'),
    ])

  const payload = await getPayload({ config })

  try {
    const report = await collectTwoRoleFeatureMigrationReport(payload)
    console.log(`Database: ${maskDatabaseURI(databaseURI)}`)
    console.log('Mode: read-only dry run')
    console.log(JSON.stringify(report, null, 2))
  } finally {
    await payload.destroy()
  }
}
