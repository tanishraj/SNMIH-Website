import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import { System404Block } from '@/blocks/System404/config'
import { SystemComingSoonBlock } from '@/blocks/SystemComingSoon/config'
import { SystemMaintenanceBlock } from '@/blocks/SystemMaintenance/config'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createBaseSystemPageFields } from '@/blocks/systemPageFields'
import { Footers } from '@/collections/Footers'
import { Headers } from '@/collections/Headers'
import { Pages } from '@/collections/Pages'
import { ReusableSections } from '@/collections/ReusableSections'
import { Reviews } from '@/collections/Reviews'
import { SystemPages } from '@/collections/SystemPages'

type NamedField = {
  defaultValue?: unknown
  fields?: unknown[]
  name: string
  type?: string
}

const flattenNamedFields = (fields: unknown[]): NamedField[] => {
  return fields.flatMap((field) => {
    if (typeof field !== 'object' || field === null) {
      return []
    }

    const nestedFields =
      'fields' in field && Array.isArray(field.fields) ? flattenNamedFields(field.fields) : []
    const tabFields =
      'tabs' in field && Array.isArray(field.tabs)
        ? field.tabs.flatMap((tab) =>
            typeof tab === 'object' && tab !== null && 'fields' in tab && Array.isArray(tab.fields)
              ? flattenNamedFields(tab.fields)
              : [],
          )
        : []
    const currentField =
      'name' in field && typeof field.name === 'string'
        ? [
            {
              name: field.name,
              type: 'type' in field && typeof field.type === 'string' ? field.type : undefined,
              defaultValue: 'defaultValue' in field ? field.defaultValue : undefined,
            },
          ]
        : []

    return [...currentField, ...nestedFields, ...tabFields]
  })
}

const getNamedField = (fields: unknown[], fieldName: string): NamedField => {
  const field = flattenNamedFields(fields).find((candidate) => candidate.name === fieldName)

  if (!field) {
    throw new Error(`Expected to find "${fieldName}".`)
  }

  return field
}

const collectBlockSlugs = (fields: unknown[]): string[] => {
  return fields.flatMap((field) => {
    if (typeof field !== 'object' || field === null) return []

    const slugs =
      'blocks' in field && Array.isArray(field.blocks)
        ? field.blocks.flatMap((block) =>
            typeof block === 'object' &&
            block !== null &&
            'slug' in block &&
            typeof block.slug === 'string'
              ? [block.slug]
              : [],
          )
        : []
    const nested =
      'fields' in field && Array.isArray(field.fields) ? collectBlockSlugs(field.fields) : []
    const tabs =
      'tabs' in field && Array.isArray(field.tabs)
        ? field.tabs.flatMap((tab) =>
            typeof tab === 'object' && tab !== null && 'fields' in tab && Array.isArray(tab.fields)
              ? collectBlockSlugs(tab.fields)
              : [],
          )
        : []

    return [...slugs, ...nested, ...tabs]
  })
}

describe('system page block schemas', () => {
  it('defines the shared block appearance schema defaults and options', () => {
    const appearanceField = createBlockAppearanceFields()
    const appearanceFields = ('fields' in appearanceField ? appearanceField.fields : []) as Array<{
      defaultValue?: unknown
      name?: string
      options?: Array<{ value: string }>
    }>

    const appearanceBackgroundField = appearanceFields.find((field) => field.name === 'background')
    const appearanceBorderField = appearanceFields.find((field) => field.name === 'border')

    expect(appearanceField?.type).toBe('group')
    expect(appearanceBackgroundField?.defaultValue).toBe('none')
    expect(appearanceBorderField?.defaultValue).toBe('none')
    expect(appearanceBackgroundField?.options?.map((option) => option.value)).toEqual([
      'none',
      'subtle',
      'brand',
      'gradient-subtle',
      'gradient-brand',
    ])
    expect(appearanceFields.map((field) => field.name)).not.toContain('textColor')
    expect(appearanceBorderField?.options?.map((option) => option.value)).toEqual([
      'none',
      'top',
      'bottom',
      'topAndBottom',
    ])
  })

  it('renders only system page blocks', () => {
    const source = readFileSync('src/blocks/RenderBlocks.tsx', 'utf8')

    expect(source).toContain("import { PageBlockStack } from './PageBlockStack'")
    expect(source).toContain('<PageBlockStack>')
    for (const slug of ['system404', 'systemMaintenance', 'systemComingSoon']) {
      expect(source).toContain(`case '${slug}'`)
    }
    for (const slug of ['hero36', 'form', 'contentSpotlight']) {
      expect(source).not.toContain(`case '${slug}'`)
    }
  })

  it('registers page, header, footer, and system blocks only on their intended collections', () => {
    const pageSlugs = collectBlockSlugs(Pages.fields)
    const reusableSectionSlugs = collectBlockSlugs(ReusableSections.fields)

    expect(pageSlugs).toHaveLength(57)
    expect(pageSlugs).toContain('academicProgrammes')
    expect(pageSlugs).not.toContain('programGrid')
    expect(new Set(pageSlugs).size).toBe(pageSlugs.length)
    expect(pageSlugs).toContain('programMatrix')
    expect(pageSlugs).toContain('newsGrid')
    expect(pageSlugs).toContain('breadcrumb')
    expect(pageSlugs).toContain('iconCardShowcase')
    expect(pageSlugs).not.toContain('studyPathways')
    expect(pageSlugs).not.toContain('feature166')
    expect(reusableSectionSlugs.slice().sort()).toEqual(
      pageSlugs.filter((slug) => slug !== 'reusableSection').sort(),
    )
    expect(reusableSectionSlugs).toHaveLength(56)
    expect(pageSlugs).toContain('pgFeeStructure')
    expect(reusableSectionSlugs).toContain('pgFeeStructure')
    expect(pageSlugs).toContain('bankDetails')
    expect(reusableSectionSlugs).toContain('bankDetails')
    expect(reusableSectionSlugs).not.toContain('programGrid')
    expect(collectBlockSlugs(Reviews.fields)).toEqual([])
    expect(collectBlockSlugs(Headers.fields)).toEqual(['headerNavbar12'])
    expect(collectBlockSlugs(Footers.fields)).toEqual(['footer56', 'footerMinimal'])
    expect(collectBlockSlugs(SystemPages.fields)).toEqual([
      'system404',
      'systemMaintenance',
      'systemComingSoon',
    ])
  })

  it('keeps the block assembly thin and the field factory reusable', () => {
    expect(typeof createBaseSystemPageFields).toBe('function')
  })

  it('keeps the shared core fields across all system page blocks', () => {
    for (const block of [System404Block, SystemMaintenanceBlock, SystemComingSoonBlock]) {
      const fieldNames = flattenNamedFields(block.fields).map((field) => field.name)
      const tabsField = block.fields[0] as
        { tabs?: Array<{ label: string }>; type?: string } | undefined

      expect(tabsField?.type).toBe('tabs')
      expect(tabsField?.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
      expect(fieldNames).toEqual(
        expect.arrayContaining([
          'appearance',
          'background',
          'border',
          'badge',
          'heading',
          'description',
          'supportingNote',
          'primaryAction',
          'secondaryAction',
        ]),
      )
    }
  })

  it('adds the shared appearance group to every system page block', () => {
    for (const block of [System404Block, SystemMaintenanceBlock, SystemComingSoonBlock]) {
      const tabsField = block.fields[0] as
        { tabs?: Array<{ fields: unknown[]; label: string }>; type?: string } | undefined
      const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')
      const appearanceField = layoutTab?.fields.find(
        (field) =>
          typeof field === 'object' &&
          field !== null &&
          'name' in field &&
          field.name === 'appearance',
      )

      expect(appearanceField).toMatchObject({
        name: 'appearance',
        type: 'group',
      })
    }
  })

  it('keeps the minimal shared schema and removes rich-layout fields', () => {
    const removedFields = [
      'helpLinks',
      'serviceMessage',
      'expectedBackAt',
      'eyebrow',
      'signupNote',
      'image',
    ]

    for (const block of [System404Block, SystemMaintenanceBlock, SystemComingSoonBlock]) {
      const fieldNames = flattenNamedFields(block.fields).map((field) => field.name)

      for (const fieldName of removedFields) {
        expect(fieldNames).not.toContain(fieldName)
      }
    }
  })

  it('prefills simple user-friendly default copy for each system page type', () => {
    expect(getNamedField(System404Block.fields, 'badge').defaultValue).toBe('404')
    expect(getNamedField(System404Block.fields, 'heading').defaultValue).toBe(
      "We couldn't find that page",
    )
    expect(getNamedField(System404Block.fields, 'description').defaultValue).toBe(
      'It may have been moved, deleted, or the web address might be incorrect.',
    )

    expect(getNamedField(SystemMaintenanceBlock.fields, 'badge').defaultValue).toBe('Maintenance')
    expect(getNamedField(SystemMaintenanceBlock.fields, 'heading').defaultValue).toBe(
      'This website is temporarily unavailable',
    )
    expect(getNamedField(SystemMaintenanceBlock.fields, 'description').defaultValue).toBe(
      'We are carrying out scheduled updates to improve the website. Please check back shortly.',
    )

    expect(getNamedField(SystemComingSoonBlock.fields, 'badge').defaultValue).toBe('Coming Soon')
    expect(getNamedField(SystemComingSoonBlock.fields, 'heading').defaultValue).toBe(
      'This website is being prepared',
    )
    expect(getNamedField(SystemComingSoonBlock.fields, 'description').defaultValue).toBe(
      'We are finalizing the website and its information. Please check back again soon.',
    )
  })
})
