import { describe, expect, it } from 'vitest'

import { HeaderNavbar12Block } from '@/blocks/HeaderNavbar12/config'
import { Headers } from '@/collections/Headers'

const getLayoutField = () =>
  Headers.fields.find(
    (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'layout',
  ) as { blocks?: Array<{ slug: string }>; type?: string } | undefined

describe('header presets', () => {
  it('registers a reusable header layout blocks field', () => {
    const layoutField = getLayoutField()

    expect(layoutField?.type).toBe('blocks')
    expect(layoutField?.blocks?.map((block) => block.slug)).toEqual(['headerNavbar12'])
  })

  it('defines the header navbar schema', () => {
    const tabsField = HeaderNavbar12Block.fields[0] as
      | { tabs?: Array<{ fields: unknown[]; label: string }>; type?: string }
      | undefined
    const contentTab = tabsField?.tabs?.find((tab) => tab.label === 'Content')
    const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')
    const stickyField = layoutTab?.fields.find(
      (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'sticky',
    ) as { defaultValue?: boolean; type?: string } | undefined
    const sizeField = layoutTab?.fields.find(
      (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'size',
    ) as { defaultValue?: string; options?: Array<{ value: string }>; type?: string } | undefined
    const navAlignmentField = layoutTab?.fields.find(
      (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'navAlignment',
    ) as { defaultValue?: string; options?: Array<{ value: string }>; type?: string } | undefined
    const ctaButtonsField = contentTab?.fields.find(
      (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'ctaButtons',
    ) as { maxRows?: number; type?: string } | undefined

    expect(tabsField?.type).toBe('tabs')
    expect(tabsField?.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(stickyField?.type).toBe('checkbox')
    expect(stickyField?.defaultValue).toBe(true)
    expect(sizeField?.type).toBe('select')
    expect(sizeField?.defaultValue).toBe('default')
    expect(sizeField?.options?.map((option) => option.value)).toEqual(['compact', 'default', 'large'])
    expect(navAlignmentField?.type).toBe('select')
    expect(navAlignmentField?.defaultValue).toBe('center')
    expect(navAlignmentField?.options?.map((option) => option.value)).toEqual(['left', 'center', 'right'])
    expect(ctaButtonsField?.type).toBe('array')
    expect(ctaButtonsField?.maxRows).toBe(2)
  })
})
