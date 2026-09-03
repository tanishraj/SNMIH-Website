import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { QaAccordionBlock } from '@/blocks/QaAccordion/config'
import { RichTextBlock } from '@/blocks/RichTextBlock/config'
import { Articles } from '@/collections/Articles'
import { NewsEvents } from '@/collections/NewsEvents'
import {
  compactRichTextClasses,
  longFormRichTextClasses,
} from '@/components/rich-text/richTextStyles'
import { projectEditor } from '@/fields/bodyEditorConfig'

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

type RichTextFieldUse = {
  editor: unknown
  path: string
}

const collectRichTextFields = (fields: Field[], prefix: string): RichTextFieldUse[] =>
  fields.flatMap((field) => {
    const fieldName = 'name' in field && typeof field.name === 'string' ? field.name : ''
    const segment = field.type === 'array' && fieldName ? `${fieldName}[]` : fieldName
    const path = segment ? `${prefix}.${segment}` : prefix

    if (field.type === 'richText') {
      return [{ editor: field.editor, path }]
    }

    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => collectRichTextFields(tab.fields, path))
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      return collectRichTextFields(field.fields, path)
    }

    return []
  })

describe('shared Lexical presentation', () => {
  it('defines the complete long-form semantic and responsive contract', () => {
    const compactTokens = compactRichTextClasses.split(/\s+/)
    const longFormTokens = longFormRichTextClasses.split(/\s+/)

    expect(longFormRichTextClasses).toContain('font-[family-name:var(--font-text)]')
    expect(longFormRichTextClasses).toContain('prose-headings:font-[family-name:var(--font-text)]')
    expect(longFormRichTextClasses).not.toContain('var(--font-display)')
    expect(longFormTokens).toContain('prose-headings:text-current/90')
    expect(longFormTokens).not.toContain('prose-headings:text-current')
    expect(compactTokens).toContain('prose-headings:text-current/90')
    expect(compactTokens).not.toContain('prose-headings:text-current')

    for (const className of [
      'prose-h1:text-4xl',
      'sm:prose-h1:text-5xl',
      'prose-h2:text-2xl',
      'sm:prose-h2:text-prose-h2',
      'prose-h3:text-xl',
      'sm:prose-h3:text-2xl',
      'prose-h4:text-lg',
      'sm:prose-h4:text-xl',
      'prose-h5:text-base',
      'sm:prose-h5:text-lg',
      'prose-h6:text-sm',
      'sm:prose-h6:text-base',
    ]) {
      expect(longFormRichTextClasses).toContain(className)
    }

    expect(source('src/styles/globals.css')).toContain('--text-prose-h2: 1.75rem')

    for (const className of [
      'prose-p:text-base',
      'sm:prose-p:text-lg',
      'prose-p:leading-7',
      'prose-p:text-current/80',
      'prose-li:text-base',
      'sm:prose-li:text-lg',
      'prose-li:leading-7',
      'prose-li:text-current/80',
      'prose-strong:text-current',
      '[&_figcaption]:text-current/80',
      'prose-ul:pl-6',
      'prose-ol:pl-6',
      'prose-blockquote:bg-muted/60',
      'prose-blockquote:text-current/80',
      'prose-blockquote:text-base',
      'sm:prose-blockquote:text-lg',
      'prose-blockquote:leading-7',
      'prose-strong:font-semibold',
      'prose-em:text-current',
      '[&_span[style*="underline"]]:underline-offset-4',
      '[&_span[style*="line-through"]]:text-current/65',
      'prose-code:font-mono',
      'prose-pre:overflow-x-auto',
      'prose-a:text-primary',
      '[&_a]:focus-visible:ring-2',
      '[&_picture]:max-w-full',
      '[&_img]:h-auto',
      '[&_img]:max-w-full',
      '[&_figcaption]:text-sm',
      'prose-hr:border-border',
      '[&_.list-check]:list-none',
      '[&_li[role=checkbox]_input]:accent-primary',
      '[&_li[aria-checked=true]_label]:line-through',
      '[&_li[role=checkbox]_br]:hidden',
      '[&_[style*="padding-inline-start"]]:max-w-full',
      '[&_p:has(>br:only-child)]:hidden',
      '[&>*:first-child]:mt-0',
      '[&>*:last-child]:mb-0',
      'prose-h2:mt-9',
      'prose-h2:mb-2.5',
      'prose-h3:mt-7',
      'prose-h3:mb-2.5',
      'prose-h4:mt-6',
      'prose-h4:mb-1.5',
      'prose-h5:mt-5',
      'prose-h5:mb-1.5',
      'prose-h6:mt-4',
      'prose-h6:mb-1.5',
      'prose-p:my-3',
      'prose-ul:my-4',
      'prose-ol:my-4',
      'prose-li:my-1',
      '[&_ul_ul]:my-1.5',
      '[&_ul_ol]:my-1.5',
      '[&_ol_ul]:my-1.5',
      '[&_ol_ol]:my-1.5',
      'prose-blockquote:my-5',
      'prose-pre:my-5',
      'prose-figure:my-5',
      'prose-hr:my-6',
    ]) {
      expect(longFormRichTextClasses).toContain(className)
    }

    expect(longFormRichTextClasses).not.toContain('prose-p:leading-8')
    expect(longFormRichTextClasses).not.toContain('[&_figcaption]:text-current/65')
    expect(longFormTokens).not.toContain('prose-blockquote:text-current')
    expect(compactTokens).not.toContain('prose-blockquote:text-current')
    expect(longFormRichTextClasses).toContain('prose-a:text-primary')
    expect(longFormRichTextClasses).toContain('prose-pre:text-card-foreground')
  })

  it('keeps the compact preset dense while sharing semantic treatment', () => {
    expect(compactRichTextClasses).toContain('text-sm')
    expect(compactRichTextClasses).toContain('sm:text-base')
    expect(compactRichTextClasses).toContain('prose-p:my-2')
    expect(compactRichTextClasses).toContain('prose-p:text-current/80')
    expect(compactRichTextClasses).toContain('prose-li:my-1')
    expect(compactRichTextClasses).toContain('prose-li:text-current/80')
    expect(compactRichTextClasses).toContain('[&_ul_ul]:my-2')
    expect(compactRichTextClasses).toContain('prose-a:text-primary')
    expect(compactRichTextClasses).toContain('prose-code:font-mono')

    for (const className of [
      'prose-h1:text-3xl',
      'prose-h2:text-xl',
      'prose-h3:text-lg',
      'prose-h4:text-base',
      'prose-h5:text-sm',
      'prose-h6:text-xs',
      'prose-h2:mt-4',
      'prose-h3:mt-3',
      'prose-h4:mt-3',
      'prose-h5:mt-3',
      'prose-h6:mt-3',
    ]) {
      expect(compactRichTextClasses).toContain(className)
    }

    expect(compactRichTextClasses).not.toContain('var(--font-display)')
    expect(compactRichTextClasses).not.toContain('prose-h2:text-3xl')
    expect(compactRichTextClasses.split(/\s+/)).not.toContain('prose-blockquote:text-base')
    expect(compactRichTextClasses.split(/\s+/)).not.toContain('sm:prose-blockquote:text-lg')
    expect(compactRichTextClasses.split(/\s+/)).not.toContain('prose-blockquote:leading-7')
  })

  it('is adopted by every long-form Lexical consumer', () => {
    for (const path of [
      'src/components/news-events/NewsEventStory.tsx',
      'src/components/articles/ArticlePage.tsx',
      'src/blocks/RichTextBlock/Component.tsx',
    ]) {
      expect(source(path)).toContain('longFormRichTextClasses')
    }
  })

  it('uses the compact preset for Q&A answers', () => {
    expect(source('src/blocks/QaAccordion/Component.tsx')).toContain('compactRichTextClasses')
  })
})

describe('shared Lexical editor configuration', () => {
  it('uses one complete fixed-toolbar editor and reserves H1 for document titles', () => {
    const editorConfig = source('src/fields/bodyEditorConfig.ts')

    expect(editorConfig).toContain(
      "HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5', 'h6'] })",
    )
    expect(editorConfig).toContain('FixedToolbarFeature()')
    expect(editorConfig).toContain('export const projectEditor = lexicalEditor({')
    expect(editorConfig).not.toContain('InlineToolbarFeature')
    expect(editorConfig).not.toContain('embeddedContentEditor')
  })

  it('assigns the canonical editor to every production rich-text field', () => {
    const uses = [
      ...collectRichTextFields(Articles.fields, 'articles'),
      ...collectRichTextFields(NewsEvents.fields, 'newsEvents'),
      ...collectRichTextFields(RichTextBlock.fields, 'richText'),
      ...collectRichTextFields(QaAccordionBlock.fields, 'qaAccordion'),
    ].sort((left, right) => left.path.localeCompare(right.path))

    expect(uses.map(({ path }) => path)).toEqual([
      'articles.body',
      'newsEvents.body',
      'qaAccordion.items[].answer',
      'richText.content',
    ])

    for (const use of uses) {
      expect(use.editor, use.path).toBe(projectEditor)
    }
  })

  it('uses the canonical editor as Payload fallback', () => {
    const payloadConfig = source('src/payload.config.ts')

    expect(payloadConfig).toContain("import { projectEditor } from './fields/bodyEditorConfig'")
    expect(payloadConfig).toContain('editor: projectEditor')
    expect(payloadConfig).not.toContain('editor: lexicalEditor()')
  })
})
