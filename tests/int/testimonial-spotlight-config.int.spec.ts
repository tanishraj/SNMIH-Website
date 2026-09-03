import type { Block, Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { TestimonialSpotlightBlock } from '@/blocks/TestimonialSpotlight/config'
import { Pages } from '@/collections/Pages'
import { ReusableSections } from '@/collections/ReusableSections'

const collectRegisteredBlocks = (fields: Field[]): Block[] =>
  fields.flatMap((field) => {
    if (field.type === 'blocks') return field.blocks
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => collectRegisteredBlocks(tab.fields))
    }
    if ('fields' in field && Array.isArray(field.fields)) {
      return collectRegisteredBlocks(field.fields)
    }
    return []
  })

const getNamedField = <T>(fields: unknown[], name: string) =>
  fields.find(
    (field): field is T =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === name,
  ) as (T & { name: string }) | undefined

describe('testimonial spotlight config', () => {
  it('uses the canonical Payload identity and two-tab editor structure', () => {
    expect(TestimonialSpotlightBlock.slug).toBe('testimonialSpotlight')
    expect(TestimonialSpotlightBlock.interfaceName).toBe('TestimonialSpotlightBlock')
    expect(TestimonialSpotlightBlock.labels).toEqual({
      singular: 'Testimonial Spotlight',
      plural: 'Testimonial Spotlights',
    })

    const tabsField = TestimonialSpotlightBlock.fields[0] as {
      tabs?: Array<{ fields: unknown[]; label: string }>
      type?: string
    }

    expect(tabsField.type).toBe('tabs')
    expect(tabsField.tabs?.map(({ label }) => label)).toEqual(['Content', 'Theme Settings'])
  })

  it('defines section content around the required testimonial composition', () => {
    const tabsField = TestimonialSpotlightBlock.fields[0] as {
      tabs?: Array<{ fields: unknown[]; label: string }>
    }
    const contentFields = tabsField.tabs?.find(({ label }) => label === 'Content')?.fields ?? []

    expect(contentFields.map((field) => (field as { name?: string }).name)).toEqual([
      'sectionEyebrow',
      'sectionTitle',
      'sectionDescription',
      'actions',
      'image',
      'eyebrow',
      'title',
      'testimonial',
      'description',
      'personName',
      'designation',
      'footerActions',
    ])
    expect(
      getNamedField<{ relationTo?: string; required?: boolean; type?: string }>(
        contentFields,
        'image',
      ),
    ).toMatchObject({
      relationTo: 'media',
      required: true,
      type: 'upload',
    })
    for (const name of ['title', 'personName']) {
      expect(getNamedField<{ required?: boolean }>(contentFields, name)?.required).toBe(true)
    }
    expect(
      getNamedField<{ required?: boolean; type?: string }>(contentFields, 'testimonial'),
    ).toMatchObject({ type: 'textarea' })
    expect(
      getNamedField<{ required?: boolean }>(contentFields, 'testimonial')?.required,
    ).toBeUndefined()
    for (const name of ['sectionEyebrow', 'sectionTitle', 'sectionDescription']) {
      expect(getNamedField<{ required?: boolean }>(contentFields, name)?.required).toBeUndefined()
    }
    for (const [name, label] of [
      ['actions', 'Section Actions'],
      ['footerActions', 'Footer Actions'],
    ] as const) {
      expect(
        getNamedField<{ label?: string; maxRows?: number; type?: string }>(contentFields, name),
      ).toMatchObject({
        label,
        maxRows: 2,
        type: 'array',
      })
    }
  })

  it('reuses shared appearance and the complete split-layout control set', () => {
    const tabsField = TestimonialSpotlightBlock.fields[0] as {
      tabs?: Array<{ fields: unknown[]; label: string }>
    }
    const fields = tabsField.tabs?.find(({ label }) => label === 'Theme Settings')?.fields ?? []
    const expected = {
      containerBackground: {
        defaultValue: 'default',
        labels: ['Match Section', 'Primary', 'Secondary', 'Muted', 'Accent'],
        values: ['default', 'primary', 'secondary', 'muted', 'accent'],
      },
      containerOutline: {
        defaultValue: 'outline',
        labels: ['None', 'Outline'],
        values: ['none', 'outline'],
      },
      mediaPosition: { defaultValue: 'left', values: ['left', 'right'] },
      imagePosition: {
        defaultValue: 'center',
        values: ['center', 'top', 'bottom', 'left', 'right'],
      },
      mediaFillMode: {
        defaultValue: 'contained',
        values: ['contained', 'containedFill', 'edgeToEdge'],
      },
      size: {
        defaultValue: 'default',
        values: ['none', 'compact', 'default', 'comfortable'],
      },
      contentVerticalAlignment: {
        defaultValue: 'center',
        values: ['top', 'center', 'bottom'],
      },
      sectionContentAlignment: {
        defaultValue: 'center',
        values: ['left', 'center'],
      },
    }

    expect(getNamedField<{ type?: string }>(fields, 'appearance')?.type).toBe('group')
    for (const [name, contract] of Object.entries(expected)) {
      const field = getNamedField<{
        defaultValue?: string
        options?: Array<{ label: string; value: string }>
        required?: boolean
        type?: string
      }>(fields, name)
      expect(field?.type).toBe('select')
      expect(field?.required).toBe(true)
      expect(field?.defaultValue).toBe(contract.defaultValue)
      expect(field?.options?.map(({ value }) => value)).toEqual(contract.values)
      if ('labels' in contract) {
        expect(field?.options?.map(({ label }) => label)).toEqual(contract.labels)
      }
    }
    expect(getNamedField(fields, 'layoutMode')).toBeUndefined()
    expect(getNamedField(fields, 'contentAlignment')).toBeUndefined()
    expect(
      getNamedField<{ label?: string }>(fields, 'sectionContentAlignment')?.label,
    ).toBe('Section Content Alignment')
  })

  it('registers the block for Pages and Reusable Sections', () => {
    const pageSlugs = collectRegisteredBlocks(Pages.fields).map(({ slug }) => slug)
    const reusableSlugs = collectRegisteredBlocks(ReusableSections.fields).map(({ slug }) => slug)

    expect(pageSlugs).toContain('testimonialSpotlight')
    expect(reusableSlugs).toContain('testimonialSpotlight')
    const pageBlock = collectRegisteredBlocks(Pages.fields).find(
      ({ slug }) => slug === 'testimonialSpotlight',
    )
    const reusableBlock = collectRegisteredBlocks(ReusableSections.fields).find(
      ({ slug }) => slug === 'testimonialSpotlight',
    )

    expect(pageBlock?.admin?.group).toBe('Prove')
    expect(reusableBlock?.admin?.group).toBe('Prove')
  })
})
