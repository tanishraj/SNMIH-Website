import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Article } from '../../src/payload-types'
import { createTestMongoServer } from './mongoMemoryServer'

// This harness never reads application .env files or reuses an application database,
// server, or Next build directory. Only temporary fixture data is created.
const root = process.cwd()
await mkdir(path.join(root, '.next'), { recursive: true })
const directory = await mkdtemp(path.join(root, '.next/ssg-smoke-'))
const mongo = await createTestMongoServer()
let child: ReturnType<typeof spawn> | undefined
let disposePayload: (() => Promise<void>) | undefined
try {
  Object.assign(process.env, {
    MONGODB_URI: mongo.uri,
    DATABASE_NAME: 'ssg-smoke-tests',
    PAYLOAD_SECRET: 'isolated-browser-test-secret-32-characters',
    EMAIL_PROVIDER: 'none',
    MEDIA_PROVIDER: 'localDisk',
    NEXT_PUBLIC_SERVER_URL: 'http://localhost:3012',
  })
  delete process.env.VERCEL

  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config })
  disposePayload = () => payload.destroy()
  // Finish collection/version index creation before opening Payload transactions.
  await Promise.all(
    [
      ...Object.values(payload.db.collections),
      ...Object.values(payload.db.versions),
      payload.db.globals,
    ].map((model) => model.init()),
  )
  await payload.create({
    collection: 'users',
    data: { email: 'security@example.test', password: 'Test-browser-password-123!', role: 'admin' },
  })
  // Seed published snapshots directly only in this disposable database: seeding runs
  // outside Next.js, so publication hooks have no live cache store to invalidate.
  const category = await payload.db.collections.categories.create({
    title: 'Fixture Topic',
    slug: 'fixture-topic',
  })
  const tag = await payload.db.collections.tags.create({
    title: 'Fixture Tag',
    slug: 'fixture-tag',
  })
  const parent = await payload.db.collections.pages.create({
    title: 'Fixture Parent',
    slug: 'ssg-parent',
    _status: 'published',
    layout: [],
  })
  await payload.db.collections.pages.create({
    title: 'Fixture Child',
    slug: 'child',
    parent: parent._id,
    _status: 'published',
    layout: [],
  })
  await payload.db.collections.pages.create({
    title: 'News index',
    slug: 'news-events',
    _status: 'published',
    layout: [],
  })
  const body: Article['body'] = {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: [
        {
          type: 'paragraph',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: [
            {
              type: 'text',
              version: 1,
              text: 'Fixture article body',
              format: 0,
              detail: 0,
              mode: 'normal',
              style: '',
            },
          ],
        },
      ],
    },
  }
  const articleData = {
    title: 'Published fixture article',
    slug: 'fixture-article',
    generateSlug: false,
    _status: 'published',
    primaryCategory: category._id,
    categories: [category._id],
    tags: [tag._id],
    excerpt: 'Fixture excerpt',
    authorName: 'Fixture Author',
    body,
  }
  const article = await payload.db.collections.articles.create(articleData)
  await payload.create({
    collection: 'articles',
    draft: true,
    data: {
      ...articleData,
      primaryCategory: String(category._id),
      categories: [String(category._id)],
      tags: [],
      slug: 'private-article',
      title: 'Private fixture draft',
      _status: 'draft',
    },
  })
  await payload.db.collections.reviews.create({
    title: 'Fixture review',
    slug: 'fixture-review',
    _status: 'published',
    primaryCategory: category._id,
    categories: [category._id],
    rating: '5',
    reviewTitle: 'Fixture review',
    reviewBody: 'Fixture review body',
    reviewerName: 'Fixture Reviewer',
    isGenuineExperience: true,
  })
  await payload.db.collections.reviews.create({
    title: 'Hidden submitted review',
    slug: 'hidden-review',
    _status: 'published',
    sourceSubmission: parent._id,
    moderationStatus: 'pending',
    primaryCategory: category._id,
    rating: '5',
  })
  const classification = await payload.db.collections['news-event-classifications'].create({
    title: 'Story',
    slug: 'story',
    behavior: 'story',
    calendarColor: 'blue',
    active: true,
  })
  await payload.db.collections['news-events'].create({
    title: 'Fixture news story',
    slug: 'fixture-news',
    _status: 'published',
    classification: classification._id,
    contentType: 'news',
    excerpt: 'News excerpt',
    body,
    publishedAt: new Date('2026-01-01'),
  })
  await payload.destroy()
  disposePayload = undefined

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
    throw new Error(`SSG fixture build failed (${buildCode})`)
  }
  const standalone = path.join(directory, '.next/standalone', path.relative(root, directory))
  await cp(path.join(directory, 'public'), path.join(standalone, 'public'), { recursive: true })
  await cp(path.join(directory, '.next/static'), path.join(standalone, '.next/static'), {
    recursive: true,
  })
  child = spawn(process.execPath, [path.join(standalone, 'server.js')], {
    cwd: standalone,
    env: { ...process.env, NODE_ENV: 'production', HOSTNAME: 'localhost', PORT: '3012' },
    stdio: 'inherit',
  })

  const manifest = JSON.parse(
    await readFile(path.join(directory, '.next/prerender-manifest.json'), 'utf8'),
  )
  for (const route of [
    '/ssg-parent',
    '/ssg-parent/child',
    '/articles/fixture-article',
    '/reviews/fixture-review',
    '/news-events/fixture-news',
    '/articles/category/fixture-topic',
    '/articles/tag/fixture-tag',
    '/reviews/category/fixture-topic',
  ]) {
    assert.ok(manifest.routes[route], `Missing prebuilt page ${route}`)
    assert.equal(manifest.routes[route].initialRevalidateSeconds, 300)
  }
  assert.ok(!manifest.routes['/articles/private-article'])
  assert.ok(!manifest.routes['/reviews/hidden-review'])
  const origin = 'http://localhost:3012'
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      await fetch(`${origin}/api/users/me`)
      break
    } catch {
      if (attempt === 99) throw new Error('Fixture server did not start')
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }
  async function page(route: string, expectedStatus = 200) {
    const response = await fetch(`${origin}${route}`)
    assert.equal(response.status, expectedStatus, route)
    return { response, html: await response.text() }
  }
  let published = await page('/articles/fixture-article')
  assert.match(published.html, /Published fixture article/)
  assert.equal(published.response.headers.get('x-nextjs-cache'), 'HIT')
  await page('/articles/private-article', 404)
  await page('/reviews/hidden-review', 404)
  await page('/preview/articles/private-article', 404)
  await page('/preview/news-events/fixture-news', 404)
  const login = await fetch(`${origin}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'security@example.test',
      password: 'Test-browser-password-123!',
    }),
  })
  assert.equal(login.status, 200, 'Fixture admin login')
  const { token } = (await login.json()) as { token: string }
  async function mutate(route: string, method: string, data?: unknown) {
    const response = await fetch(`${origin}/api/${route}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
      ...(data ? { body: JSON.stringify(data) } : {}),
    })
    const result = await response.json()
    assert.ok(response.ok, `${method} ${route}: ${JSON.stringify(result)}`)
    return result
  }
  const preview = await fetch(`${origin}/preview/articles/private-article`, {
    headers: { Authorization: `JWT ${token}` },
  })
  assert.equal(preview.status, 200, 'Authenticated draft preview')
  assert.match(await preview.text(), /Private fixture draft/)
  assert.match(preview.headers.get('cache-control') || '', /no-store/)
  const updated = await mutate(`articles/${article.id}`, 'PATCH', {
    title: 'Updated fixture article',
  })
  assert.equal(updated.doc.slug, 'fixture-article', 'Editing content preserves the fixture URL')
  published = await page('/articles/fixture-article')
  assert.match(published.html, /Updated fixture article/)
  assert.doesNotMatch(published.html, /Published fixture article/)
  await mutate(`articles/${article.id}`, 'PATCH', { _status: 'draft' })
  await page('/articles/fixture-article', 404)
  await mutate(`articles/${article.id}`, 'PATCH', { _status: 'published' })
  assert.match((await page('/articles/fixture-article')).html, /Updated fixture article/)
  // A URL absent from the build, including a previously cached 404, must appear
  // after publication and become a cache hit without another deployment.
  await page('/articles/new-after-build', 404)
  const created = await mutate('articles', 'POST', {
    ...articleData,
    primaryCategory: String(category._id),
    categories: [String(category._id)],
    tags: [],
    slug: 'new-after-build',
    title: 'New after build',
  })
  assert.match((await page('/articles/new-after-build')).html, /New after build/)
  assert.equal(
    (await page('/articles/new-after-build')).response.headers.get('x-nextjs-cache'),
    'HIT',
  )
  await mutate(`articles/${created.doc.id}`, 'DELETE')
  await page('/articles/new-after-build', 404)
  console.log(
    'SSG smoke test passed: prebuilt HTML, cache hits, private previews, publication, takedown, new paths, and deletion.',
  )
} finally {
  if (child && child.exitCode === null && child.signalCode === null) {
    const server = child
    const exited = new Promise<void>((resolve) => server.once('exit', () => resolve()))
    child.kill('SIGTERM')
    await exited
  }
  await disposePayload?.()
  await mongo.stop()
  await rm(directory, { recursive: true, force: true })
}
