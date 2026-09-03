import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const projectRoot = process.cwd()
const require = createRequire(path.join(projectRoot, 'package.json'))
const { chromium } = require('@playwright/test')
const definitionsSource = await readFile(
  path.join(projectRoot, 'src/block-thumbnails/definitions.ts'),
  'utf8',
)
const slugs = [...definitionsSource.matchAll(/slug: '([^']+)'/g)].map((match) => match[1])
const themes = ['default', 'blue', 'sunset', 'kodama', 'snmih']
const schemes = ['light', 'dark']
const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
}
const screenshots = [
  ['contact33', 'desktop', 'light'],
  ['tabsContent', 'desktop', 'light'],
  ['timeline', 'desktop', 'light'],
  ['galleryShowcase', 'mobile', 'light'],
  ['headerNavbar12', 'mobile', 'dark'],
  ['footer56', 'mobile', 'dark'],
]
const baseUrl = (process.env.BLOCK_THEME_AUDIT_BASE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
)
const outputDirectory = path.resolve(
  process.env.BLOCK_THEME_AUDIT_OUTPUT ?? '/private/tmp/payload-theme-layout-qa',
)

await mkdir(outputDirectory, { recursive: true })

let browser

try {
  browser = await chromium.launch()
} catch {
  browser = await chromium.launch({ channel: 'chrome' })
}

const context = await browser.newContext({
  colorScheme: 'light',
  reducedMotion: 'reduce',
  viewport: viewports.desktop,
})
const page = await context.newPage()
const failures = []

const waitForPreview = async () => {
  await page.locator('[data-block-thumbnail-canvas="true"]').waitFor({ state: 'attached' })
  await page.waitForFunction(() => {
    const canvas = document.querySelector('[data-block-thumbnail-canvas="true"]')
    return canvas?.getAttribute('data-block-thumbnail-ready') === 'true' || canvas?.getAttribute('data-block-thumbnail-error')
  })

  return page.locator('[data-block-thumbnail-canvas="true"]').getAttribute('data-block-thumbnail-error')
}

for (const slug of slugs) {
  console.log(`Auditing ${slug}`)
  let response

  try {
    await page.setViewportSize(viewports.desktop)
    response = await page.goto(`${baseUrl}/block-thumbnail-previews/${slug}`, {
      waitUntil: 'load',
    })
    const previewError = await waitForPreview()

    if (previewError) {
      failures.push({ slug, issue: previewError })
      continue
    }
  } catch (error) {
    failures.push({
      slug,
      issue: error instanceof Error ? error.message : String(error),
    })
    continue
  }

  if (!response?.ok()) {
    failures.push({ slug, issue: `HTTP ${response?.status() ?? 'unknown'}` })
    continue
  }

  for (const [viewportName, viewport] of Object.entries(viewports)) {
    await page.setViewportSize(viewport)

    for (const theme of themes) {
      for (const scheme of schemes) {
        const result = await page.evaluate(
          ({ selectedScheme, selectedTheme }) => {
            const root = document.documentElement
            const canvas = document.querySelector('[data-block-thumbnail-canvas="true"]')
            const content = canvas?.querySelector(':scope > div')
            root.dataset.themeColor = selectedTheme
            root.dataset.colorScheme = selectedScheme
            root.classList.toggle('dark', selectedScheme === 'dark')
            root.classList.toggle('light', selectedScheme === 'light')
            root.style.colorScheme = selectedScheme

            if (canvas instanceof HTMLElement) {
              canvas.style.height = `${window.innerHeight}px`
              canvas.style.width = `${window.innerWidth}px`
            }

            if (content instanceof HTMLElement) {
              content.style.left = '0'
              content.style.top = '0'
              content.style.transform = 'none'
              content.style.width = `${window.innerWidth}px`
            }

            return {
              overflow:
                content instanceof HTMLElement ? content.scrollWidth - window.innerWidth : 0,
              primary: getComputedStyle(root).getPropertyValue('--primary').trim(),
            }
          },
          { selectedScheme: scheme, selectedTheme: theme },
        )

        if (result.overflow > 1) {
          failures.push({
            issue: `horizontal overflow ${result.overflow}px`,
            scheme,
            slug,
            theme,
            viewport: viewportName,
          })
        }

        if (!result.primary) {
          failures.push({ issue: 'missing --primary', scheme, slug, theme, viewport: viewportName })
        }
      }
    }
  }
}

for (const [slug, viewportName, scheme] of screenshots) {
  try {
    await page.setViewportSize(viewports.desktop)
    await page.goto(`${baseUrl}/block-thumbnail-previews/${slug}`, { waitUntil: 'load' })
    const previewError = await waitForPreview()

    if (previewError) {
      throw new Error(previewError)
    }

    await page.setViewportSize(viewports[viewportName])
    await page.evaluate(
      ({ selectedScheme }) => {
        const root = document.documentElement
        const canvas = document.querySelector('[data-block-thumbnail-canvas="true"]')
        const content = canvas?.querySelector(':scope > div')
        root.dataset.themeColor = 'snmih'
        root.dataset.colorScheme = selectedScheme
        root.classList.toggle('dark', selectedScheme === 'dark')
        root.classList.toggle('light', selectedScheme === 'light')
        root.style.colorScheme = selectedScheme

        if (canvas instanceof HTMLElement) {
          canvas.style.height = `${window.innerHeight}px`
          canvas.style.width = `${window.innerWidth}px`
        }

        if (content instanceof HTMLElement) {
          content.style.left = '0'
          content.style.top = '0'
          content.style.transform = 'none'
          content.style.width = `${window.innerWidth}px`
        }
      },
      { selectedScheme: scheme },
    )
    await page.screenshot({
      animations: 'disabled',
      path: path.join(outputDirectory, `${slug}-${viewportName}-${scheme}.png`),
    })
  } catch (error) {
    failures.push({
      issue: `screenshot failed: ${error instanceof Error ? error.message : String(error)}`,
      scheme,
      slug,
      viewport: viewportName,
    })
  }
}

const report = {
  combinations: slugs.length * themes.length * schemes.length * Object.keys(viewports).length,
  failures,
}

await writeFile(path.join(outputDirectory, 'report.json'), JSON.stringify(report, null, 2))
await browser.close()

console.log(JSON.stringify(report, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
