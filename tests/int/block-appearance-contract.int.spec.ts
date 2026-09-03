import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { resolveBlockAppearanceClasses } from '@/blocks/shared/blockAppearance'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'

describe('block appearance contract', () => {
  it.each([
    ['none', '', ''],
    ['subtle', 'bg-subtle', 'text-foreground'],
    ['brand', 'bg-brand', 'text-primary-foreground'],
    ['gradient-subtle', 'bg-gradient-subtle', 'text-foreground'],
    ['gradient-brand', 'bg-gradient-brand', 'text-primary-foreground'],
  ] as const)('pairs the %s surface with its semantic foreground', (background, surface, text) => {
    expect(resolveBlockAppearanceClasses({ background })).toMatchObject({
      backgroundClassName: surface,
      textClassName: text,
    })
  })

  it('does not expose the unreachable text-color override', () => {
    const appearance = createBlockAppearanceFields()
    const fieldNames = appearance.fields
      .filter((field) => typeof field === 'object' && field !== null && 'name' in field)
      .map((field) => field.name)
    const factorySource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/shared/blockAppearanceFields.ts'),
      'utf8',
    )
    const configSources = fs
      .readdirSync(path.resolve(process.cwd(), 'src/blocks'), { recursive: true })
      .filter((entry): entry is string => typeof entry === 'string' && entry.endsWith('.ts'))
      .map((entry) =>
        fs.readFileSync(path.resolve(process.cwd(), 'src/blocks', entry), 'utf8'),
      )
      .join('\n')

    expect(fieldNames).toEqual(['background', 'border'])
    expect(factorySource).not.toContain('textColor')
    expect(factorySource).not.toContain('includeTextOverride')
    expect(configSources).not.toContain('includeTextOverride')
  })

  it('uses semantic typography variables for rich text', () => {
    const componentSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/RichTextBlock/Component.tsx'),
      'utf8',
    )
    const stylesSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/rich-text/richTextStyles.ts'),
      'utf8',
    )

    expect(componentSource).not.toContain('prose-neutral')
    expect(componentSource).not.toContain('dark:prose-invert')
    expect(componentSource).toContain('longFormRichTextClasses')
    expect(stylesSource).toContain('[--tw-prose-body:currentColor]')
    expect(stylesSource).toContain('[--tw-prose-links:var(--primary)]')
    expect(stylesSource).toContain('[--tw-prose-hr:var(--border)]')
    expect(stylesSource).toContain('[&_a]:focus-visible:ring-2')
  })
})
