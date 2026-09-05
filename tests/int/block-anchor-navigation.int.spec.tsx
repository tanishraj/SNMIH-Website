import { readFileSync } from 'node:fs'
import type { Field } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  newsEventsDetailBuilderBlocks,
  pageBuilderBlocks,
  reusableSectionBuilderBlocks,
} from '@/blocks/blockCatalog'
import { renderLivePreviewPageBlocks } from '@/blocks/renderLivePreviewPageBlocks'
import { renderPageBlocks } from '@/blocks/renderPageBlocks'
import {
  claimBlockAnchorID,
  normalizeBlockAnchorID,
  validateBlockAnchorID,
  validateUniqueBlockAnchorIDs,
} from '@/blocks/shared/blockAnchor'
import { EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT } from '@/lib/newsEventsPreviewShared'
import { EMPTY_REVIEW_PREVIEW_SNAPSHOT } from '@/lib/reviewPreviewShared'
import type { Page } from '@/payload-types'

const hasAnchorField = (fields: Field[]): boolean =>
  fields.some((field) => 'name' in field && field.name === 'anchorId' && field.type === 'text')

const announcementBlock = (anchorId: string, description: string) => ({
  anchorId,
  blockType: 'announcement' as const,
  displayMode: 'vertical' as const,
  items: [{ description }],
})

describe('Page block anchor navigation', () => {
  it('adds one optional Section Anchor ID field to every composable block registry', () => {
    for (const registry of [
      pageBuilderBlocks,
      reusableSectionBuilderBlocks,
      newsEventsDetailBuilderBlocks,
    ]) {
      expect(registry.every((block) => hasAnchorField(block.fields))).toBe(true)
      expect(
        registry.every(
          (block) =>
            block.fields.filter((field) => 'name' in field && field.name === 'anchorId').length ===
            1,
        ),
      ).toBe(true)
    }

    const anchorField = pageBuilderBlocks[0]?.fields.find(
      (field) => 'name' in field && field.name === 'anchorId',
    )

    expect(anchorField).toMatchObject({
      admin: {
        placeholder: 'admissions',
      },
      label: 'Section Anchor ID',
      maxLength: 80,
      type: 'text',
    })
  })

  it('accepts URL-safe anchor IDs and reports malformed, reserved, or duplicate values', () => {
    expect(validateBlockAnchorID(undefined)).toBe(true)
    expect(validateBlockAnchorID('admissions')).toBe(true)
    expect(validateBlockAnchorID('research-2026')).toBe(true)
    expect(validateBlockAnchorID('#admissions')).toContain('Start with a lowercase letter')
    expect(validateBlockAnchorID('Admissions')).toContain('Start with a lowercase letter')
    expect(validateBlockAnchorID('research--2026')).toContain('single hyphens')
    expect(validateBlockAnchorID(' admissions ')).toContain('without spaces')
    expect(validateBlockAnchorID('main-content')).toContain('reserved')

    expect(
      validateUniqueBlockAnchorIDs([
        { anchorId: 'admissions', blockType: 'pageHeader' },
        { anchorId: 'research', blockType: 'richText' },
      ]),
    ).toBe(true)
    expect(
      validateUniqueBlockAnchorIDs([
        { anchorId: 'admissions', blockType: 'pageHeader' },
        { anchorId: 'admissions', blockType: 'richText' },
      ]),
    ).toContain('used more than once')
  })

  it('normalizes safe legacy values and lets the first duplicate anchor win', () => {
    expect(normalizeBlockAnchorID(' admissions ')).toBe('admissions')
    expect(normalizeBlockAnchorID('<script>')).toBeUndefined()

    const usedAnchorIDs = new Set(['main-content'])
    expect(claimBlockAnchorID('admissions', usedAnchorIDs)).toBe('admissions')
    expect(claimBlockAnchorID('admissions', usedAnchorIDs)).toBeUndefined()
    expect(claimBlockAnchorID('main-content', usedAnchorIDs)).toBeUndefined()
  })

  it('renders anchors in document order for production blocks and Reusable Sections', () => {
    const layout = [
      announcementBlock('campus-life', 'First anchored section'),
      announcementBlock('campus-life', 'Duplicate anchor remains visible'),
      {
        anchorId: 'shared-information',
        blockType: 'reusableSection',
        section: {
          id: 'shared-section',
          layout: [announcementBlock('inside-shared', 'Anchored reusable content')],
          title: 'Shared information',
        },
      },
    ] as unknown as NonNullable<Page['layout']>
    const html = renderToStaticMarkup(renderPageBlocks(layout))

    expect(html.match(/id="campus-life"/g)).toHaveLength(1)
    expect(html).toContain('id="shared-information"')
    expect(html).toContain('id="inside-shared"')
    expect(html).toContain('data-block-anchor="true"')
    expect(html).toContain('Duplicate anchor remains visible')
  })

  it('keeps anchor markup identical in authenticated live preview', () => {
    const layout = [
      announcementBlock('preview-section', 'Preview anchor'),
    ] as unknown as NonNullable<Page['layout']>
    const html = renderToStaticMarkup(
      renderLivePreviewPageBlocks(
        layout,
        EMPTY_REVIEW_PREVIEW_SNAPSHOT,
        EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
        [],
        [],
      ),
    )

    expect(html).toContain('id="preview-section"')
    expect(html).toContain('data-block-anchor="true"')
  })

  it('keeps anchor scrolling smooth without animating full route transitions', () => {
    const globalStyles = readFileSync('src/styles/globals.css', 'utf8')
    const frontendLayout = readFileSync('src/app/(frontend)/layout.tsx', 'utf8')

    expect(globalStyles).toContain('scroll-behavior: smooth')
    expect(globalStyles).toContain('scroll-padding-top: var(--block-anchor-offset, 1rem)')
    expect(globalStyles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?scroll-behavior: auto/,
    )
    expect(frontendLayout).toContain("'--block-anchor-offset': blockAnchorOffset")
    expect(frontendLayout).toContain('isGlobalHeaderSticky(activeHeader)')
    expect(frontendLayout).toContain('data-scroll-behavior="smooth"')
  })
})
