import type { Block, Field } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  blockPickerGroups,
  buildBlockRegistry,
  newsEventsDetailBuilderBlocks,
  pageBuilderBlocks,
  reusableSectionBuilderBlocks,
} from '@/blocks/blockCatalog'
import { PageHeaderBlock } from '@/blocks/PageHeader/config'
import { Pages } from '@/collections/Pages'
import { ReusableSections } from '@/collections/ReusableSections'
import { NewsEventsDetailTemplate } from '@/globals/NewsEventsDetailTemplate'

const slugsForGroup = (blocks: Block[], group: string) =>
  blocks.filter((block) => block.admin?.group === group).map((block) => block.slug)

const recommendedGroups = [
  blockPickerGroups.start,
  blockPickerGroups.explain,
  blockPickerGroups.explore,
  blockPickerGroups.prove,
  blockPickerGroups.convert,
]

const findBlocksFieldValue = (fields: Field[]): Block[] | undefined => {
  for (const field of fields) {
    if (field.type === 'blocks') return field.blocks

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const match = findBlocksFieldValue(tab.fields)
        if (match) return match
      }
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const match = findBlocksFieldValue(field.fields)
      if (match) return match
    }
  }

  return undefined
}

describe('curated block catalog', () => {
  it('offers the approved 20-block vocabulary before the advanced library', () => {
    expect(slugsForGroup(pageBuilderBlocks, blockPickerGroups.start)).toEqual([
      'pageHeader',
      'heroBanner',
      'reusableSection',
    ])
    expect(slugsForGroup(pageBuilderBlocks, blockPickerGroups.explain)).toEqual([
      'richText',
      'aboutSection',
      'featureSpotlight',
      'contentHighlights',
      'academicProgrammes',
    ])
    expect(slugsForGroup(pageBuilderBlocks, blockPickerGroups.explore)).toEqual([
      'newsEventsTabs',
      'calendar',
      'annualCalendar',
      'departmentProfiles',
      'galleryAlbumTabs',
      'qaAccordion',
    ])
    expect(slugsForGroup(pageBuilderBlocks, blockPickerGroups.prove)).toEqual([
      'statsStrip',
      'testimonialSpotlight',
      'accreditationCards',
    ])
    expect(slugsForGroup(pageBuilderBlocks, blockPickerGroups.convert)).toEqual([
      'bannerCta',
      'contact24',
      'downloadList',
    ])

    const recommended = pageBuilderBlocks.filter((block) =>
      recommendedGroups.includes(block.admin?.group as (typeof recommendedGroups)[number]),
    )
    const groupsInDrawerOrder = [...new Set(pageBuilderBlocks.map((block) => block.admin?.group))]

    expect(recommended).toHaveLength(20)
    expect(groupsInDrawerOrder).toEqual([...recommendedGroups, blockPickerGroups.advanced])
  })

  it('registers every Page block exactly once and classifies the remainder as advanced', () => {
    const pageSlugs = pageBuilderBlocks.map((block) => block.slug)
    const advancedSlugs = slugsForGroup(pageBuilderBlocks, blockPickerGroups.advanced)

    expect(pageSlugs).toHaveLength(62)
    expect(new Set(pageSlugs).size).toBe(pageSlugs.length)
    expect(advancedSlugs).toHaveLength(42)
    expect(advancedSlugs).toContain('integration23')
    expect(advancedSlugs).toContain('bankDetails')
    expect(advancedSlugs).toContain('documentChecklist')
    expect(advancedSlugs).toContain('contactNumbers')
    expect(advancedSlugs).toContain('celebration')
    expect(advancedSlugs).toContain('pgFeeStructure')
    expect(pageBuilderBlocks.every((block) => typeof block.admin?.group === 'string')).toBe(true)
  })

  it('preserves the documented special-registry differences', () => {
    const pageSlugs = pageBuilderBlocks.map((block) => block.slug)
    const reusableSlugs = reusableSectionBuilderBlocks.map((block) => block.slug)
    const detailSlugs = newsEventsDetailBuilderBlocks.map((block) => block.slug)

    expect(reusableSlugs).toEqual(pageSlugs.filter((slug) => slug !== 'reusableSection'))
    expect(detailSlugs.slice(1)).toEqual(pageSlugs)
    expect(detailSlugs[0]).toBe('newsEventsContent')
    expect(newsEventsDetailBuilderBlocks[0]?.admin?.group).toBe(blockPickerGroups.templateCore)
    expect(pageSlugs).not.toContain('newsEventsContent')
    expect(reusableSlugs).not.toContain('newsEventsContent')
  })

  it('decorates without losing thumbnail metadata or mutating the source object', () => {
    const pageHeader = pageBuilderBlocks.find((block) => block.slug === 'pageHeader')

    expect(pageHeader).not.toBe(PageHeaderBlock)
    expect(PageHeaderBlock.admin?.group).toBeUndefined()
    expect(pageHeader?.admin?.group).toBe(blockPickerGroups.start)
    expect(pageHeader?.admin?.images?.thumbnail).toMatchObject({
      alt: 'Page Header block preview',
      url: '/block-thumbnails/page-header.jpg',
    })
  })

  it('rejects duplicate slugs instead of silently rendering an ambiguous catalog', () => {
    const duplicate: Block = { fields: [], slug: 'duplicate' }

    expect(() =>
      buildBlockRegistry([
        { blocks: [duplicate], group: blockPickerGroups.start },
        { blocks: [duplicate], group: blockPickerGroups.advanced },
      ]),
    ).toThrowError('Duplicate block slug in catalog: duplicate')
  })

  it('is the exact schema source for all three composition surfaces', () => {
    expect(findBlocksFieldValue(Pages.fields)).toBe(pageBuilderBlocks)
    expect(findBlocksFieldValue(ReusableSections.fields)).toBe(reusableSectionBuilderBlocks)
    expect(findBlocksFieldValue(NewsEventsDetailTemplate.fields)).toBe(
      newsEventsDetailBuilderBlocks,
    )
  })
})
