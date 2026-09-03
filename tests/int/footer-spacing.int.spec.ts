import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { regularBlockContainerClasses } from '@/blocks/shared/blockSpacing'
import { Footer56 } from '@/components/footer56'

describe('footer spacing', () => {
  it('uses the shared default mobile padding and content gutter', () => {
    const html = renderToStaticMarkup(createElement(Footer56))

    expect(html).toContain('py-12 md:py-16')
    expect(html).toContain(regularBlockContainerClasses)
  })
})
