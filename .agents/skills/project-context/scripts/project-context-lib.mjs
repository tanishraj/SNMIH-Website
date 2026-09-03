import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, promises as fs } from 'node:fs'
import path from 'node:path'

import ts from 'typescript'

const getPropertyName = (node) => {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text
  }

  return undefined
}

const getStringValue = (node) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text
  }

  return undefined
}

const unwrapExpression = (node) => {
  let current = node

  while (
    ts.isAsExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression
  }

  return current
}

const objectStringProperties = (object) =>
  Object.fromEntries(
    object.properties
      .filter(ts.isPropertyAssignment)
      .map((property) => [getPropertyName(property.name), getStringValue(property.initializer)])
      .filter(([name, value]) => Boolean(name && value)),
  )

export function parseSource(source, filePath) {
  const scriptKind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS

  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, scriptKind)
}

export function extractImports(source, filePath) {
  const imports = {}
  const ast = parseSource(source, filePath)

  for (const statement of ast.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue
    }

    const bindings = statement.importClause?.namedBindings

    if (!bindings || !ts.isNamedImports(bindings)) {
      continue
    }

    for (const element of bindings.elements) {
      imports[element.name.text] = statement.moduleSpecifier.text
    }
  }

  return Object.fromEntries(
    Object.entries(imports).sort(([left], [right]) => left.localeCompare(right)),
  )
}

export function extractArrayPropertyIdentifiers(source, filePath, targetProperty) {
  const identifiers = []
  const ast = parseSource(source, filePath)

  const visit = (node) => {
    if (
      ts.isPropertyAssignment(node) &&
      getPropertyName(node.name) === targetProperty &&
      ts.isArrayLiteralExpression(unwrapExpression(node.initializer))
    ) {
      const array = unwrapExpression(node.initializer)

      for (const element of array.elements) {
        if (ts.isIdentifier(element)) {
          identifiers.push(element.text)
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(ast)
  return identifiers
}

export function extractBlockGroupIdentifiers(source, filePath, exportName) {
  const ast = parseSource(source, filePath)

  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName) continue
      if (!declaration.initializer) {
        throw new Error(`${exportName} has no initializer in ${filePath}`)
      }

      const initializer = unwrapExpression(declaration.initializer)
      if (!ts.isArrayLiteralExpression(initializer)) {
        throw new Error(`${exportName} is not an array literal in ${filePath}`)
      }

      const identifiers = []

      for (const groupElement of initializer.elements) {
        const group = unwrapExpression(groupElement)
        if (!ts.isObjectLiteralExpression(group)) {
          throw new Error(`Invalid block group in ${exportName} from ${filePath}`)
        }

        const blocksProperty = group.properties.find(
          (property) =>
            ts.isPropertyAssignment(property) && getPropertyName(property.name) === 'blocks',
        )

        if (!blocksProperty || !ts.isPropertyAssignment(blocksProperty)) {
          throw new Error(`Block group is missing blocks in ${exportName} from ${filePath}`)
        }

        const blocks = unwrapExpression(blocksProperty.initializer)
        if (!ts.isArrayLiteralExpression(blocks)) {
          throw new Error(`Block group blocks must be an array in ${exportName} from ${filePath}`)
        }

        for (const block of blocks.elements) {
          if (!ts.isIdentifier(block)) {
            throw new Error(
              `Block group contains a non-identifier in ${exportName} from ${filePath}`,
            )
          }
          identifiers.push(block.text)
        }
      }

      return identifiers
    }
  }

  throw new Error(`Missing ${exportName} in ${filePath}`)
}

export function extractBlockDefinition(source, filePath) {
  const ast = parseSource(source, filePath)

  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue
    }

    const isExported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    )

    if (!isExported) {
      continue
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        continue
      }

      const initializer = unwrapExpression(declaration.initializer)
      let object
      let deriveFactoryInterface = false

      if (ts.isObjectLiteralExpression(initializer)) {
        object = initializer
      } else if (
        ts.isCallExpression(initializer) &&
        ts.isIdentifier(initializer.expression) &&
        initializer.expression.text === 'createSystemPageBlock' &&
        initializer.arguments[0]
      ) {
        const argument = unwrapExpression(initializer.arguments[0])

        if (ts.isObjectLiteralExpression(argument)) {
          object = argument
          deriveFactoryInterface = true
        }
      }

      if (!object) {
        continue
      }

      const values = objectStringProperties(object)

      if (!values.slug) {
        continue
      }

      const derivedInterface = `${values.slug.charAt(0).toUpperCase()}${values.slug.slice(1)}Block`

      return {
        configPath: filePath,
        interfaceName: values.interfaceName ?? (deriveFactoryInterface ? derivedInterface : null),
        slug: values.slug,
        symbol: declaration.name.text,
      }
    }
  }

  throw new Error(`No exported block definition found in ${filePath}`)
}

export function extractSwitchCases(source) {
  return [...source.matchAll(/case\s+['"]([^'"]+)['"]\s*:/g)].map((match) => match[1])
}

export function extractThumbnailDefinitions(source, filePath) {
  const ast = parseSource(source, filePath)
  const definitions = []

  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'defineThumbnail' &&
      node.arguments[0]
    ) {
      const argument = unwrapExpression(node.arguments[0])

      if (!ts.isObjectLiteralExpression(argument)) {
        throw new Error(`Invalid thumbnail definition in ${filePath}`)
      }

      const values = objectStringProperties(argument)

      if (!values.slug || !values.filename) {
        throw new Error(`Thumbnail definition is missing slug or filename in ${filePath}`)
      }

      definitions.push({ filename: values.filename, slug: values.slug })
    }

    ts.forEachChild(node, visit)
  }

  visit(ast)
  return definitions
}

export function extractExportedObjectKeys(source, filePath, exportName) {
  const ast = parseSource(source, filePath)

  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName) {
        continue
      }

      if (!declaration.initializer) {
        throw new Error(`${exportName} has no initializer in ${filePath}`)
      }

      const initializer = unwrapExpression(declaration.initializer)

      if (!ts.isObjectLiteralExpression(initializer)) {
        throw new Error(`${exportName} is not an object literal in ${filePath}`)
      }

      return initializer.properties
        .map((property) => getPropertyName(property.name))
        .filter(Boolean)
    }
  }

  throw new Error(`Missing ${exportName} in ${filePath}`)
}

export function extractExportNames(source, filePath) {
  const ast = parseSource(source, filePath)
  const names = []

  for (const statement of ast.statements) {
    const isExported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    )

    if (!isExported) {
      continue
    }

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      names.push(statement.name.text)
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          names.push(declaration.name.text)
        }
      }
    }
  }

  return names.sort()
}

const sortObjectKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys)
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, sortObjectKeys(nested)]),
  )
}

export const stableStringify = (value) => `${JSON.stringify(sortObjectKeys(value), null, 2)}\n`

export const sha256 = (value) => createHash('sha256').update(value).digest('hex')

const toPosix = (value) => value.split(path.sep).join('/')

async function readText(projectRoot, relativePath) {
  return fs.readFile(path.join(projectRoot, relativePath), 'utf8')
}

async function walkFiles(projectRoot, relativeDirectory, predicate = () => true) {
  const absoluteDirectory = path.join(projectRoot, relativeDirectory)

  if (!existsSync(absoluteDirectory)) {
    return []
  }

  const files = []

  for (const entry of await fs.readdir(absoluteDirectory, { withFileTypes: true })) {
    const relativePath = toPosix(path.join(relativeDirectory, entry.name))

    if (entry.isDirectory()) {
      files.push(...(await walkFiles(projectRoot, relativePath, predicate)))
    } else if (entry.isFile() && predicate(relativePath)) {
      files.push(relativePath)
    }
  }

  return files.sort()
}

const resolveConfigImportPath = (ownerPath, importPath) => {
  let resolved

  if (importPath.startsWith('@/')) {
    resolved = `src/${importPath.slice(2)}`
  } else {
    resolved = toPosix(path.posix.join(path.posix.dirname(ownerPath), importPath))
  }

  if (/\.(ts|tsx)$/.test(resolved)) {
    return resolved
  }

  return `${resolved}.ts`
}

async function readBlockDefinitions(projectRoot) {
  const configPaths = await walkFiles(projectRoot, 'src/blocks', (filePath) =>
    filePath.endsWith('/config.ts'),
  )
  const definitions = []

  for (const configPath of configPaths) {
    const definition = extractBlockDefinition(await readText(projectRoot, configPath), configPath)
    const directory = path.posix.dirname(configPath)
    const files = await walkFiles(projectRoot, directory, (filePath) =>
      /\.(ts|tsx)$/.test(filePath),
    )

    definitions.push({
      ...definition,
      clientFiles: files.filter((filePath) => /Client\.tsx$/.test(filePath)),
      componentPath: files.find((filePath) => filePath.endsWith('/Component.tsx')) ?? null,
      files,
      presentationPath: files.find((filePath) => filePath.endsWith('/Presentation.tsx')) ?? null,
      previewComponentPath:
        files.find((filePath) => filePath.endsWith('/PreviewComponent.tsx')) ?? null,
    })
  }

  return definitions.sort((left, right) => left.slug.localeCompare(right.slug))
}

async function getRegistrySlugs(projectRoot, collectionPath, definitionsBySymbol) {
  const source = await readText(projectRoot, collectionPath)

  return extractArrayPropertyIdentifiers(source, collectionPath, 'blocks').map((symbol) => {
    const definition = definitionsBySymbol.get(symbol)

    if (!definition) {
      throw new Error(`Unknown block symbol ${symbol} in ${collectionPath}`)
    }

    return definition.slug
  })
}

async function getPageCatalogSlugs(projectRoot, definitionsBySymbol) {
  const catalogPath = 'src/blocks/blockCatalog.ts'
  const source = await readText(projectRoot, catalogPath)
  const symbols = extractBlockGroupIdentifiers(
    source,
    catalogPath,
    'pageBlockGroupDefinitions',
  )

  return symbols.map((symbol) => {
    const definition = definitionsBySymbol.get(symbol)

    if (!definition) {
      throw new Error(`Unknown block symbol ${symbol} in ${catalogPath}`)
    }

    return definition.slug
  })
}

async function getRegisteredConfigs(projectRoot, propertyName) {
  const configPath = 'src/payload.config.ts'
  const source = await readText(projectRoot, configPath)
  const imports = extractImports(source, configPath)

  return extractArrayPropertyIdentifiers(source, configPath, propertyName).map((symbol) => {
    const importPath = imports[symbol]

    if (!importPath) {
      throw new Error(`Missing import for ${symbol} in ${configPath}`)
    }

    return {
      source: resolveConfigImportPath(configPath, importPath),
      symbol,
    }
  })
}

async function getSourceDigest(projectRoot) {
  const monitoredFiles = [
    ...(await walkFiles(projectRoot, 'src', (filePath) => /\.(ts|tsx|css|scss)$/.test(filePath))),
    ...(await walkFiles(projectRoot, 'tests', (filePath) => /\.(ts|tsx)$/.test(filePath))),
    ...(await walkFiles(projectRoot, 'docs/architecture', (filePath) => filePath.endsWith('.md'))),
    ...(await walkFiles(projectRoot, 'docs/guides', (filePath) => filePath.endsWith('.md'))),
    ...(await walkFiles(projectRoot, 'docs/operations', (filePath) => filePath.endsWith('.md'))),
    'AGENTS.md',
    'Dockerfile',
    'README.md',
    'next.config.ts',
    'package.json',
    'tsconfig.json',
  ]
  const files = [...new Set(monitoredFiles)].sort()
  const chunks = []

  for (const filePath of files) {
    chunks.push(`${filePath}\0${await readText(projectRoot, filePath)}\0`)
  }

  return {
    files,
    sha256: sha256(chunks.join('')),
  }
}

export async function buildProjectInventory(projectRoot) {
  const root = path.resolve(projectRoot)
  const packageJson = JSON.parse(await readText(root, 'package.json'))
  const definitions = await readBlockDefinitions(root)
  const definitionsBySymbol = new Map(
    definitions.map((definition) => [definition.symbol, definition]),
  )
  const pageBlockSlugs = await getPageCatalogSlugs(root, definitionsBySymbol)
  const thumbnailDefinitions = extractThumbnailDefinitions(
    await readText(root, 'src/block-thumbnails/definitions.ts'),
    'src/block-thumbnails/definitions.ts',
  )
  const thumbnailFixtures = extractExportedObjectKeys(
    await readText(root, 'src/block-thumbnails/fixtures.tsx'),
    'src/block-thumbnails/fixtures.tsx',
    'blockThumbnailFixtures',
  )
  const generatedTypes = await readText(root, 'src/payload-types.ts')
  const graphMetaPath = path.join(root, '.understand-anything/meta.json')
  const graphMeta = existsSync(graphMetaPath)
    ? JSON.parse(await fs.readFile(graphMetaPath, 'utf8'))
    : null
  const sharedPaths = await walkFiles(root, 'src/blocks/shared', (filePath) =>
    /\.(ts|tsx)$/.test(filePath),
  )

  return {
    schemaVersion: 1,
    project: {
      frameworks: {
        next: packageJson.dependencies?.next ?? null,
        payload: packageJson.dependencies?.payload ?? null,
        react: packageJson.dependencies?.react ?? null,
        tailwindcss: packageJson.dependencies?.tailwindcss ?? null,
        typescript: packageJson.devDependencies?.typescript ?? null,
        vitest: packageJson.devDependencies?.vitest ?? null,
      },
      name: packageJson.name,
      scripts: Object.keys(packageJson.scripts ?? {}).sort(),
      version: packageJson.version,
    },
    payload: {
      collections: await getRegisteredConfigs(root, 'collections'),
      globals: await getRegisteredConfigs(root, 'globals'),
    },
    blocks: {
      definitions,
      footer: await getRegistrySlugs(root, 'src/collections/Footers.ts', definitionsBySymbol),
      generatedInterfaces: [...generatedTypes.matchAll(/export interface (\w+Block)\b/g)]
        .map((match) => match[1])
        .sort(),
      header: await getRegistrySlugs(root, 'src/collections/Headers.ts', definitionsBySymbol),
      livePreviewRenderer: extractSwitchCases(
        await readText(root, 'src/blocks/renderLivePreviewPageBlocks.tsx'),
      ),
      page: pageBlockSlugs,
      productionRenderer: extractSwitchCases(
        await readText(root, 'src/blocks/renderPageBlocks.tsx'),
      ),
      reusableSection: pageBlockSlugs.filter((slug) => slug !== 'reusableSection'),
      shared: await Promise.all(
        sharedPaths.map(async (filePath) => ({
          exports: extractExportNames(await readText(root, filePath), filePath),
          file: filePath,
        })),
      ),
      systemPage: await getRegistrySlugs(
        root,
        'src/collections/SystemPages.ts',
        definitionsBySymbol,
      ),
      thumbnails: {
        assets: await walkFiles(root, 'public/block-thumbnails', (filePath) =>
          filePath.endsWith('.jpg'),
        ),
        definitions: thumbnailDefinitions,
        fixtures: thumbnailFixtures,
      },
    },
    knowledgeGraph: graphMeta
      ? {
          analyzedFiles: graphMeta.analyzedFiles,
          gitCommitHash: graphMeta.gitCommitHash,
          lastAnalyzedAt: graphMeta.lastAnalyzedAt,
        }
      : null,
    sourceDigest: await getSourceDigest(root),
    surfaces: {
      access: await walkFiles(root, 'src/access', (filePath) => filePath.endsWith('.ts')),
      config: await walkFiles(root, 'src/config', (filePath) => filePath.endsWith('.ts')),
      fields: await walkFiles(root, 'src/fields', (filePath) => filePath.endsWith('.ts')),
      hooks: await walkFiles(root, 'src/hooks', (filePath) => filePath.endsWith('.ts')),
      libraries: await walkFiles(root, 'src/lib', (filePath) => /\.(ts|tsx)$/.test(filePath)),
      routes: await walkFiles(root, 'src/app', (filePath) =>
        /\/(page|route|layout|robots|sitemap|opengraph-image)\.(ts|tsx)$/.test(filePath),
      ),
      tests: await walkFiles(root, 'tests', (filePath) => /\.spec\.(ts|tsx)$/.test(filePath)),
      themes: await walkFiles(root, 'src/styles/themes', (filePath) => filePath.endsWith('.css')),
    },
  }
}

export async function writeProjectInventory(projectRoot, inventory, explicitTarget) {
  const target =
    explicitTarget ??
    path.join(projectRoot, '.agents/skills/project-context/references/project-inventory.json')
  const temporary = `${target}.tmp`

  await fs.mkdir(path.dirname(target), { recursive: true })

  try {
    await fs.writeFile(temporary, stableStringify(inventory))
    await fs.rename(temporary, target)
  } catch (error) {
    await fs.rm(temporary, { force: true })
    throw error
  }

  return target
}

const findDuplicates = (values) =>
  [...new Set(values.filter((value, index) => values.indexOf(value) !== index))].sort()

const findMissing = (expected, actual) => expected.filter((value) => !actual.includes(value))

const sameOrderedValues = (left, right) => stableStringify(left) === stableStringify(right)

export async function validateProjectContracts(projectRoot, inventory, options = {}) {
  const errors = []
  const warnings = []

  for (const slug of findDuplicates(inventory.blocks.page)) {
    errors.push(`Duplicate Page block slug: ${slug}`)
  }

  for (const slug of findDuplicates(
    inventory.blocks.definitions.map((definition) => definition.slug),
  )) {
    errors.push(`Duplicate block definition slug: ${slug}`)
  }

  const interfaceNames = inventory.blocks.definitions
    .map((definition) => definition.interfaceName)
    .filter(Boolean)

  for (const interfaceName of findDuplicates(interfaceNames)) {
    errors.push(`Duplicate block interfaceName: ${interfaceName}`)
  }

  for (const definition of inventory.blocks.definitions) {
    if (!definition.interfaceName) {
      errors.push(`Block ${definition.slug} has no interfaceName in ${definition.configPath}`)
    } else if (!inventory.blocks.generatedInterfaces.includes(definition.interfaceName)) {
      errors.push(
        `Generated Payload type ${definition.interfaceName} is missing for ${definition.slug}.`,
      )
    }
  }

  for (const slug of findMissing(inventory.blocks.page, inventory.blocks.productionRenderer)) {
    errors.push(`Page block ${slug} is missing from src/blocks/renderPageBlocks.tsx`)
  }

  for (const slug of findMissing(inventory.blocks.page, inventory.blocks.livePreviewRenderer)) {
    errors.push(`Page block ${slug} is missing from src/blocks/renderLivePreviewPageBlocks.tsx`)
  }

  if (
    !sameOrderedValues(
      [...inventory.blocks.productionRenderer].sort(),
      [...inventory.blocks.livePreviewRenderer].sort(),
    )
  ) {
    errors.push('Production and live-preview Page renderer coverage differs.')
  }

  const expectedReusable = inventory.blocks.page.filter((slug) => slug !== 'reusableSection')

  if (!sameOrderedValues(expectedReusable, inventory.blocks.reusableSection)) {
    errors.push(
      'Reusable Sections must expose every Page block except reusableSection in Page order.',
    )
  }

  const restrictedSlugs = [
    ...inventory.blocks.header,
    ...inventory.blocks.footer,
    ...inventory.blocks.systemPage,
  ]

  for (const slug of restrictedSlugs.filter((value) => inventory.blocks.page.includes(value))) {
    errors.push(`Restricted block ${slug} must not be registered on Pages.`)
  }

  const registeredSlugs = [...new Set([...inventory.blocks.page, ...restrictedSlugs])]
  const thumbnailDefinitionSlugs = inventory.blocks.thumbnails.definitions.map(
    (definition) => definition.slug,
  )
  const thumbnailAssetNames = inventory.blocks.thumbnails.assets.map((filePath) =>
    path.posix.basename(filePath),
  )

  for (const slug of findDuplicates(thumbnailDefinitionSlugs)) {
    errors.push(`Duplicate thumbnail definition: ${slug}`)
  }

  for (const slug of registeredSlugs) {
    const definition = inventory.blocks.thumbnails.definitions.find(
      (thumbnail) => thumbnail.slug === slug,
    )

    if (!definition) {
      errors.push(`Registered block ${slug} has no thumbnail definition.`)
    }

    if (!inventory.blocks.thumbnails.fixtures.includes(slug)) {
      errors.push(`Registered block ${slug} has no thumbnail fixture.`)
    }

    if (definition && !thumbnailAssetNames.includes(definition.filename)) {
      errors.push(
        `Registered block ${slug} is missing public/block-thumbnails/${definition.filename}.`,
      )
    }
  }

  const pageRendererSource = await readText(projectRoot, 'src/blocks/renderPageBlocks.tsx')

  if (!pageRendererSource.includes('if (depth > 10) return null')) {
    errors.push('Reusable Section renderer depth guard must remain at 10.')
  }

  const gitHead =
    options.gitHead ??
    execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: projectRoot,
      encoding: 'utf8',
    }).trim()

  if (
    inventory.knowledgeGraph?.gitCommitHash &&
    inventory.knowledgeGraph.gitCommitHash !== gitHead
  ) {
    warnings.push(
      `Knowledge graph is stale: analyzed ${inventory.knowledgeGraph.gitCommitHash}, current ${gitHead}.`,
    )
  }

  return {
    errors: errors.sort(),
    warnings: warnings.sort(),
  }
}

export async function checkProjectContext(projectRoot) {
  const expected = await buildProjectInventory(projectRoot)
  const inventoryPath = path.join(
    projectRoot,
    '.agents/skills/project-context/references/project-inventory.json',
  )

  if (!existsSync(inventoryPath)) {
    return {
      errors: ['Project inventory is missing. Run pnpm project-context:update.'],
      warnings: [],
    }
  }

  const checkedIn = JSON.parse(await fs.readFile(inventoryPath, 'utf8'))
  const result = await validateProjectContracts(projectRoot, expected)
  const referenceErrors = await validateSkillReferences(projectRoot)
  result.errors.push(...referenceErrors)

  const changedFiles = execFileSync('git', ['diff', '--name-only', 'HEAD'], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .map((filePath) => filePath.trim())
    .filter(Boolean)
  result.warnings.push(...getNarrativeReviewWarnings(changedFiles))

  if (stableStringify(checkedIn) !== stableStringify(expected)) {
    result.errors.unshift('Project inventory is stale. Run pnpm project-context:update.')
  }

  return result
}

const requiredSkillFiles = [
  'SKILL.md',
  'agents/openai.yaml',
  'references/architecture.md',
  'references/block-system.md',
  'references/change-impact-map.md',
  'references/payload-model.md',
  'references/project-inventory.json',
]

export async function validateSkillReferences(projectRoot) {
  const skillRoot = path.join(projectRoot, '.agents/skills/project-context')
  const errors = []

  for (const relativePath of requiredSkillFiles) {
    if (!existsSync(path.join(skillRoot, relativePath))) {
      errors.push(`Missing required project-context file: ${relativePath}.`)
    }
  }

  const markdownFiles = requiredSkillFiles.filter((filePath) => filePath.endsWith('.md'))

  for (const relativePath of markdownFiles) {
    const documentPath = path.join(skillRoot, relativePath)

    if (!existsSync(documentPath)) {
      continue
    }

    const markdown = await fs.readFile(documentPath, 'utf8')

    for (const match of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0]

      if (!target || /^(?:https?:|mailto:)/.test(target)) {
        continue
      }

      const resolved = path.resolve(path.dirname(documentPath), decodeURIComponent(target))

      if (!existsSync(resolved)) {
        errors.push(`Broken project-context reference: ${target} from ${relativePath}.`)
      }
    }
  }

  return errors.sort()
}

const narrativeGroups = [
  {
    label: 'Payload model',
    matches: (filePath) =>
      filePath === 'src/payload.config.ts' ||
      /^src\/(access|collections|fields|globals|hooks|plugins)\//.test(filePath),
    reference: '.agents/skills/project-context/references/payload-model.md',
  },
  {
    label: 'block system',
    matches: (filePath) =>
      /^src\/(block-thumbnails|blocks)\//.test(filePath) ||
      /^src\/collections\/(Pages|ReusableSections|SystemPages)\.ts$/.test(filePath),
    reference: '.agents/skills/project-context/references/block-system.md',
  },
  {
    label: 'architecture',
    matches: (filePath) =>
      /^src\/(app|config|lib|styles)\//.test(filePath) ||
      [
        'Dockerfile',
        'next.config.ts',
        'package.json',
        'src/middleware.ts',
        'tsconfig.json',
      ].includes(filePath),
    reference: '.agents/skills/project-context/references/architecture.md',
  },
]

export function getNarrativeReviewWarnings(changedFiles) {
  const warnings = []

  for (const group of narrativeGroups) {
    if (changedFiles.some(group.matches) && !changedFiles.includes(group.reference)) {
      warnings.push(
        `${group.label} files changed; review ${group.reference} and update it if the project contract changed.`,
      )
    }
  }

  return warnings.sort()
}
