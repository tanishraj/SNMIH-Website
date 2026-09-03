import { spawn, type ChildProcess } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

import { blockThumbnailDefinitions } from '../src/block-thumbnails/definitions'

const host = '127.0.0.1'
const port = Number(process.env.BLOCK_THUMBNAIL_PORT ?? 3199)
const generatedServerBaseUrl = `http://${host}:${port}`
const existingServerBaseUrl =
  process.env.BLOCK_THUMBNAIL_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
const outputDirectory = path.resolve(process.cwd(), 'public', 'block-thumbnails')
const serverTimeoutMs = 60_000
const previewTimeoutMs = 30_000
const requestedSlug = process.env.BLOCK_THUMBNAIL_SLUG?.trim()
const selectedDefinitions = requestedSlug
  ? blockThumbnailDefinitions.filter(({ slug }) => slug === requestedSlug)
  : blockThumbnailDefinitions
const firstSelectedDefinition = selectedDefinitions[0]

if (!firstSelectedDefinition) {
  throw new Error(`Unknown block thumbnail slug: ${requestedSlug ?? '(none)'}`)
}

const delay = (durationMs: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, durationMs))

const startServer = () => {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const child = spawn(
    command,
    ['exec', 'next', 'dev', '--hostname', host, '--port', String(port)],
    {
      cwd: process.cwd(),
      detached: process.platform !== 'win32',
      env: {
        ...process.env,
        NODE_OPTIONS: '--no-deprecation',
      },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  const logs: string[] = []
  const collectLog = (chunk: Buffer) => {
    logs.push(chunk.toString())

    if (logs.length > 80) {
      logs.shift()
    }
  }

  child.stdout?.on('data', collectLog)
  child.stderr?.on('data', collectLog)

  return { child, logs }
}

const getPreviewUrl = (baseUrl: string, slug: string) =>
  `${baseUrl}/block-thumbnail-previews/${slug}`

const hasReadyPreviewServer = async (baseUrl: string, slug: string) => {
  try {
    const response = await fetch(getPreviewUrl(baseUrl, slug))
    return response.ok
  } catch {
    return false
  }
}

const waitForServer = async (
  child: ChildProcess,
  logs: string[],
  baseUrl: string,
  slug: string,
) => {
  const deadline = Date.now() + serverTimeoutMs
  let lastError: unknown

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `Thumbnail server exited with code ${child.exitCode}.\n${logs.join('').trim()}`,
      )
    }

    try {
      const response = await fetch(getPreviewUrl(baseUrl, slug))

      if (response.ok) {
        return
      }

      lastError = new Error(`Thumbnail server returned HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }

    await delay(500)
  }

  const detail = lastError instanceof Error ? lastError.message : String(lastError)
  throw new Error(`Thumbnail server did not become ready within 60 seconds: ${detail}`)
}

const stopServer = async (child: ChildProcess) => {
  if (child.exitCode !== null || !child.pid) {
    return
  }

  if (process.platform === 'win32') {
    const terminator = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      shell: false,
      stdio: 'ignore',
    })
    await new Promise<void>((resolve) => terminator.once('exit', () => resolve()))
    return
  }

  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    child.kill('SIGTERM')
  }

  await Promise.race([
    new Promise<void>((resolve) => child.once('exit', () => resolve())),
    delay(5_000),
  ])

  if (child.exitCode === null) {
    try {
      process.kill(-child.pid, 'SIGKILL')
    } catch {
      child.kill('SIGKILL')
    }
  }
}

const launchBrowser = async () => {
  try {
    return await chromium.launch()
  } catch (bundledBrowserError) {
    for (const channel of ['chrome', 'msedge'] as const) {
      try {
        console.log(`Playwright browser is unavailable; trying the ${channel} channel`)
        return await chromium.launch({ channel })
      } catch {
        // Continue to the next locally installed browser channel.
      }
    }

    throw bundledBrowserError
  }
}

const generateThumbnails = async () => {
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid BLOCK_THUMBNAIL_PORT: ${process.env.BLOCK_THUMBNAIL_PORT}`)
  }

  await mkdir(outputDirectory, { recursive: true })

  let server: ReturnType<typeof startServer> | undefined
  let baseUrl = existingServerBaseUrl
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
  const failures: Array<{ error: unknown; slug: string }> = []

  try {
    if (await hasReadyPreviewServer(existingServerBaseUrl, firstSelectedDefinition.slug)) {
      console.log(`Using existing development server at ${existingServerBaseUrl}`)
    } else {
      server = startServer()
      baseUrl = generatedServerBaseUrl
      await waitForServer(server.child, server.logs, baseUrl, firstSelectedDefinition.slug)
    }

    browser = await launchBrowser()
    const context = await browser.newContext({
      colorScheme: 'light',
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      viewport: { height: 900, width: 1600 },
    })

    for (const definition of selectedDefinitions) {
      const page = await context.newPage()
      const browserErrors: string[] = []

      page.on('pageerror', (error) => browserErrors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') {
          browserErrors.push(message.text())
        }
      })

      try {
        const response = await page.goto(getPreviewUrl(baseUrl, definition.slug), {
          timeout: previewTimeoutMs,
          waitUntil: 'load',
        })

        if (!response?.ok()) {
          throw new Error(`Preview returned HTTP ${response?.status() ?? 'unknown'}`)
        }

        await page
          .locator('[data-block-thumbnail-ready="true"]')
          .waitFor({ state: 'visible', timeout: previewTimeoutMs })

        if (browserErrors.length > 0) {
          throw new Error(browserErrors.join('\n'))
        }

        const outputPath = path.join(outputDirectory, definition.filename)
        await page.screenshot({
          animations: 'disabled',
          fullPage: false,
          path: outputPath,
          quality: 90,
          type: 'jpeg',
        })

        const metadata = await sharp(outputPath).metadata()

        if (metadata.format !== 'jpeg' || metadata.width !== 1600 || metadata.height !== 900) {
          throw new Error(
            `Expected a 1600x900 JPEG, received ${metadata.width ?? '?'}x${metadata.height ?? '?'} ${metadata.format ?? 'unknown'}`,
          )
        }

        console.log(`✓ ${definition.slug} -> public/block-thumbnails/${definition.filename}`)
      } catch (error) {
        failures.push({ error, slug: definition.slug })
        const message = error instanceof Error ? error.message : String(error)
        console.error(`✗ ${definition.slug}: ${message}`)
      } finally {
        await page.close()
      }
    }

    await context.close()
  } finally {
    await browser?.close()

    if (server) {
      await stopServer(server.child)
    }
  }

  if (failures.length > 0) {
    process.exitCode = 1
  }
}

void generateThumbnails().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
