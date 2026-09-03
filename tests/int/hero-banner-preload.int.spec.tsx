import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { renderPageBlocks } from '@/blocks/renderPageBlocks'

describe('Hero Banner preload selection', () => {
  it('preloads the first renderable Hero Banner across Reusable Sections', () => {
    const html = renderToStaticMarkup(
      renderPageBlocks([
        {
          blockType: 'heroBanner',
          backgroundImage: null,
          title: 'Missing hero',
        },
        {
          blockType: 'reusableSection',
          section: {
            id: 'nested-section',
            layout: [
              {
                blockType: 'heroBanner',
                backgroundImage: { alt: 'Nested campus', url: '/media/nested.jpg' },
                title: 'Nested valid hero',
              },
            ],
          },
        },
        {
          blockType: 'heroBanner',
          backgroundImage: { alt: 'Later campus', url: '/media/later.jpg' },
          title: 'Later hero',
        },
      ] as never),
    )

    expect(html.match(/<link rel="preload" as="image"/g)).toHaveLength(1)
    expect(html.match(/fetchPriority="high"/g)).toHaveLength(2)
    expect(html).toMatch(/<link rel="preload" as="image"[^>]+%2Fmedia%2Fnested\.jpg/)
    expect(html).toMatch(/<img[^>]+fetchPriority="high"[^>]+nested\.jpg/)
    expect(html).toContain('Nested valid hero')
    expect(html).toContain('Later hero')
  })
})
