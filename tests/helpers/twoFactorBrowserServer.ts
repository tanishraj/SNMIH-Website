import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { createTestMongoServer } from './mongoMemoryServer'

// This harness never reads application .env files or reuses an application database,
// server, or Next build directory. Only temporary fixture data is created.
const root = process.cwd()
await mkdir(path.join(root, '.next'), { recursive: true })
const directory = await mkdtemp(path.join(root, '.next/two-factor-browser-'))
const mongo = await createTestMongoServer()
Object.assign(process.env, {
  MONGODB_URI: mongo.uri,
  DATABASE_NAME: 'two-factor-browser-tests',
  PAYLOAD_SECRET: 'isolated-browser-test-secret-32-characters',
  EMAIL_PROVIDER: 'none',
  MEDIA_PROVIDER: 'localDisk',
  NEXT_PUBLIC_SERVER_URL: 'http://localhost:3011',
})
delete process.env.VERCEL

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config')
const payload = await getPayload({ config })
await Promise.all(Object.values(payload.db.collections).map((model) => model.init()))
await payload.create({
  collection: 'users',
  data: { email: 'security@example.test', password: 'Test-browser-password-123!', role: 'admin' },
})
await payload.destroy()

for (const file of [
  'src',
  'public',
  'next.config.ts',
  'next-env.d.ts',
  'tsconfig.json',
  'postcss.config.mjs',
  'package.json',
]) {
  await cp(path.join(root, file), path.join(directory, file), { recursive: true })
}
await symlink(path.join(root, 'node_modules'), path.join(directory, 'node_modules'), 'dir')
// Keep standalone dependency tracing inside the common root of the temporary
// source copy and its shared, read-only dependency installation.
const nextConfigPath = path.join(directory, 'next.config.ts')
await writeFile(
  nextConfigPath,
  (await readFile(nextConfigPath, 'utf8'))
    .replace(
      "output: 'standalone',",
      `output: 'standalone', outputFileTracingRoot: ${JSON.stringify(root)},`,
    )
    .replace('root: path.resolve(dirname)', `root: ${JSON.stringify(root)}`),
)
const buildCode = await new Promise<number | null>((resolve) => {
  const build = spawn(
    process.execPath,
    [path.join(root, 'node_modules/next/dist/bin/next'), 'build', '--webpack'],
    {
      cwd: directory,
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'inherit',
    },
  )
  build.once('exit', resolve)
})
if (buildCode !== 0) {
  await mongo.stop()
  await rm(directory, { recursive: true, force: true })
  throw new Error(`Browser fixture build failed (${buildCode})`)
}
const standalone = path.join(directory, '.next/standalone', path.relative(root, directory))
await cp(path.join(directory, 'public'), path.join(standalone, 'public'), { recursive: true })
await cp(path.join(directory, '.next/static'), path.join(standalone, '.next/static'), {
  recursive: true,
})
const child = spawn(process.execPath, [path.join(standalone, 'server.js')], {
  cwd: standalone,
  env: { ...process.env, NODE_ENV: 'production', HOSTNAME: 'localhost', PORT: '3011' },
  stdio: 'inherit',
})
let stopping: Promise<void> | undefined
const stop = () => {
  if (stopping) return stopping
  stopping = (async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()))
      child.kill('SIGTERM')
      await exited
    }
    await mongo.stop()
    await rm(directory, { recursive: true, force: true })
  })()
  return stopping
}
process.on('SIGTERM', () => {
  void stop()
})
process.on('SIGINT', () => {
  void stop()
})
child.on('exit', (code) => {
  void stop().then(() => process.exit(code ?? 0))
})
