import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()
const pageEntryPath = path.join(projectRoot, 'src/components/live-preview/PageLivePreview.tsx')
const newsEventEntryPath = path.join(
  projectRoot,
  'src/components/live-preview/NewsEventLivePreview.tsx',
)
const extensions = ['', '.ts', '.tsx', '.js', '.jsx'] as const

const resolveLocalImport = (fromPath: string, specifier: string): string | null => {
  const unresolved = specifier.startsWith('@/')
    ? path.join(projectRoot, 'src', specifier.slice(2))
    : specifier.startsWith('.')
      ? path.resolve(path.dirname(fromPath), specifier)
      : null

  if (!unresolved) {
    return null
  }

  for (const extension of extensions) {
    const candidate = `${unresolved}${extension}`

    if (existsSync(candidate)) {
      return candidate
    }

    const indexCandidate = path.join(unresolved, `index${extension}`)

    if (existsSync(indexCandidate)) {
      return indexCandidate
    }
  }

  return null
}

const hasRuntimeBinding = (declaration: ts.ImportDeclaration): boolean => {
  const clause = declaration.importClause

  if (!clause) {
    return true
  }

  if (clause.isTypeOnly) {
    return false
  }

  if (clause.name || !clause.namedBindings) {
    return true
  }

  if (ts.isNamespaceImport(clause.namedBindings)) {
    return true
  }

  return clause.namedBindings.elements.some((element) => !element.isTypeOnly)
}

const collectReachableRuntimeModules = (entry: string): Set<string> => {
  const visited = new Set<string>()
  const pending = [entry]

  while (pending.length) {
    const current = pending.pop()

    if (!current || visited.has(current)) {
      continue
    }

    visited.add(current)
    const sourceText = readFileSync(current, 'utf8')
    const sourceFile = ts.createSourceFile(
      current,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      current.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    )

    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement) || !hasRuntimeBinding(statement)) {
        continue
      }

      if (!ts.isStringLiteral(statement.moduleSpecifier)) {
        continue
      }

      const resolved = resolveLocalImport(current, statement.moduleSpecifier.text)

      if (resolved && !visited.has(resolved)) {
        pending.push(resolved)
      }
    }
  }

  return new Set(
    [...visited].map((filePath) => path.relative(projectRoot, filePath).split(path.sep).join('/')),
  )
}

const expectNoServerOnlyModules = (reachablePaths: Set<string>) => {
  for (const reachablePath of reachablePaths) {
    const source = readFileSync(path.join(projectRoot, reachablePath), 'utf8')

    expect(source, `${reachablePath} imported server-only`).not.toContain("import 'server-only'")
  }
}

describe('live-preview client import boundary', () => {
  it('keeps Page preview on the client-safe renderer', () => {
    const source = readFileSync(pageEntryPath, 'utf8')

    expect(source).toContain("from '@/blocks/renderLivePreviewPageBlocks'")
    expect(source).not.toContain("from '@/blocks/renderPageBlocks'")
  })

  it('keeps News Event preview off the production detail and Page renderers', () => {
    const source = readFileSync(newsEventEntryPath, 'utf8')

    expect(source).toContain("from '@/blocks/renderLivePreviewNewsEventDetailBlocks'")
    expect(source).not.toContain("from '@/components/news-events/NewsEventDetailPage'")
    expect(source).not.toContain("from '@/blocks/renderPageBlocks'")
  })

  it('keeps Page preview from reaching Payload-backed modules', () => {
    const reachablePaths = collectReachableRuntimeModules(pageEntryPath)

    for (const serverPath of [
      'src/payload.config.ts',
      'src/lib/reviewFeed.ts',
      'src/lib/reviewRatingSummary.ts',
      'src/blocks/ReviewFeed/Component.tsx',
      'src/blocks/RatingSpotlight/Component.tsx',
      'src/lib/newsEvents.ts',
      'src/blocks/NewsEventsHighlights/Component.tsx',
      'src/lib/siteOffices.ts',
      'src/lib/eventGallery.ts',
      'src/blocks/ImageMosaic/Component.tsx',
    ]) {
      expect(reachablePaths.has(serverPath), `${serverPath} entered the client graph`).toBe(false)
    }

    expectNoServerOnlyModules(reachablePaths)
    expect(reachablePaths.has('src/lib/eventGalleryShared.ts')).toBe(true)
    expect(reachablePaths.has('src/blocks/ImageMosaic/PreviewComponent.tsx')).toBe(true)
  })

  it('keeps News Event preview from reaching production or server-only modules', () => {
    const reachablePaths = collectReachableRuntimeModules(newsEventEntryPath)

    for (const serverPath of [
      'src/payload.config.ts',
      'src/blocks/renderPageBlocks.tsx',
      'src/blocks/renderNewsEventDetailBlocks.tsx',
      'src/components/news-events/NewsEventDetailPage.tsx',
      'src/lib/reviewFeed.ts',
      'src/lib/reviewRatingSummary.ts',
      'src/blocks/ReviewFeed/Component.tsx',
      'src/blocks/RatingSpotlight/Component.tsx',
      'src/lib/newsEvents.ts',
      'src/blocks/NewsGrid/Component.tsx',
      'src/blocks/NewsEventsHighlights/Component.tsx',
      'src/lib/siteOffices.ts',
      'src/lib/eventGallery.ts',
      'src/blocks/ImageMosaic/Component.tsx',
    ]) {
      expect(reachablePaths.has(serverPath), `${serverPath} entered the client graph`).toBe(false)
    }

    expectNoServerOnlyModules(reachablePaths)
    expect(reachablePaths.has('src/blocks/renderLivePreviewPageBlocks.tsx')).toBe(true)
    expect(reachablePaths.has('src/blocks/NewsEventsContent/Component.tsx')).toBe(true)
    expect(reachablePaths.has('src/blocks/ImageMosaic/PreviewComponent.tsx')).toBe(true)
  })
})
