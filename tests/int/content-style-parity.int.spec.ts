import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  contentIntroClasses,
  contentItemDescriptionClasses,
  contentItemLinkClasses,
  contentItemMetadataClasses,
  contentItemTitleClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'

const contentHighlightsSource = readFileSync('src/components/content-highlights.tsx', 'utf8')
const editorialReasonsSource = readFileSync('src/blocks/EditorialReasons/Component.tsx', 'utf8')

describe('shared block content styles', () => {
  it('keeps Content Highlights and Editorial Reasons on the same content contracts', () => {
    const sharedContracts = [
      'contentIntroClasses',
      'contentSectionHeadingClasses',
      'contentSectionDescriptionClasses',
      'contentItemTitleClasses',
      'contentItemDescriptionClasses',
      'contentItemMetadataClasses',
    ]

    for (const contract of sharedContracts) {
      expect(contentHighlightsSource).toContain(contract)
      expect(editorialReasonsSource).toContain(contract)
    }
  })

  it('records the established content typography and interactions once', () => {
    expect(contentIntroClasses).toBe('flex max-w-3xl flex-col gap-4')
    expect(contentSectionHeadingClasses).toBe(
      'font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl',
    )
    expect(contentSectionDescriptionClasses).toBe(
      'text-base leading-7 text-balance text-current',
    )
    expect(contentItemTitleClasses).toBe(
      'rounded-compact font-sans text-md leading-tight font-semibold text-current underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current sm:text-lg',
    )
    expect(contentItemLinkClasses).toBe('transition-opacity hover:opacity-70 hover:underline')
    expect(contentItemDescriptionClasses).toBe('text-sm leading-5 text-current')
    expect(contentItemMetadataClasses).toBe(
      'font-mono text-xs font-medium tracking-[0.14em] text-current',
    )
  })
})
