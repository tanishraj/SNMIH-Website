import { describe, expect, it, vi } from 'vitest'

import { Media } from '@/collections/Media'
import { preventMediaDeletionWhileInUse } from '@/hooks/preventMediaDeletionWhileInUse'
import { buildMediaUsageSummary, findMediaUsage } from '@/lib/mediaUsage'

describe('media governance resolver', () => {
  it('finds supported field-level usage across collections, globals, and nested blocks', async () => {
    const payload = {
      find: vi.fn(async ({ collection }: { collection: string }) => {
        switch (collection) {
          case 'pages':
            return {
              docs: [
                {
                  id: 10,
                  layout: [
                    {
                      blockType: 'hero36',
                      cards: [
                        {
                          image: 7,
                          visualType: 'image',
                        },
                        {
                          image: 7,
                          visualType: 'icon',
                        },
                      ],
                    },
                  ],
                  ogImage: 7,
                  title: 'Home',
                },
              ],
            }
          case 'articles':
            return {
              docs: [
                {
                  featuredImage: { id: 7 },
                  id: 20,
                  ogImage: 99,
                  title: 'Pricing Strategy',
                },
              ],
            }
          case 'reviews':
            return {
              docs: [
                {
                  featuredImage: 5,
                  id: 30,
                  layout: [
                    {
                      blockType: 'contentSpotlight',
                      image: 7,
                    },
                  ],
                  ogImage: 7,
                  title: 'Great Service',
                },
              ],
            }
          case 'news-events':
            return {
              docs: [
                {
                  featuredImage: 7,
                  id: 35,
                  ogImage: 7,
                  title: 'Open Day',
                },
              ],
            }
          case 'gallery-albums':
            return {
              docs: [
                {
                  id: 38,
                  images: [
                    { id: 'cover', image: 7 },
                    { id: 'other', image: 99 },
                  ],
                  title: 'Yoga Day',
                },
              ],
            }
          case 'headers':
            return {
              docs: [
                {
                  id: 40,
                  layout: [
                    {
                      blockType: 'headerNavbar12',
                      customLogoDark: 7,
                      customLogoLight: 7,
                      logoMode: 'customLogo',
                    },
                  ],
                  title: 'Main Header',
                },
              ],
            }
          case 'footers':
            return {
              docs: [
                {
                  id: 50,
                  layout: [
                    {
                      blockType: 'footer56',
                      customLogoDark: 7,
                      customLogoLight: 7,
                      logoMode: 'customLogo',
                    },
                  ],
                  title: 'Site Footer',
                },
              ],
            }
          case 'system-pages':
            return {
              docs: [
                {
                  id: 60,
                  layout: [],
                  title: 'Maintenance Mode',
                },
              ],
            }
          default:
            throw new Error(`Unexpected collection lookup: ${collection}`)
        }
      }),
      findGlobal: vi.fn(async ({ slug }: { slug: string }) => {
        switch (slug) {
          case 'news-events-detail-template':
            return {
              header: { backgroundImage: 7 },
            }
          case 'site-settings':
            return {
              favicon: 3,
              logo: 7,
            }
          case 'seo-settings':
            return {
              defaultImage: 7,
            }
          default:
            throw new Error(`Unexpected global lookup: ${slug}`)
        }
      }),
    }

    const references = await findMediaUsage({
      mediaID: 7,
      payload,
    })

    expect(references).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          documentID: 10,
          documentLabel: 'Home',
          fieldPath: 'ogImage',
          locationLabel: 'Pages > Home > ogImage',
          sourceSlug: 'pages',
          sourceType: 'collection',
        }),
        expect.objectContaining({
          documentID: 20,
          documentLabel: 'Pricing Strategy',
          fieldPath: 'featuredImage',
          locationLabel: 'Articles > Pricing Strategy > featuredImage',
          sourceSlug: 'articles',
          sourceType: 'collection',
        }),
        expect.objectContaining({
          documentID: 30,
          documentLabel: 'Great Service',
          fieldPath: 'ogImage',
          locationLabel: 'Reviews > Great Service > ogImage',
          sourceSlug: 'reviews',
          sourceType: 'collection',
        }),
        expect.objectContaining({
          documentID: 35,
          documentLabel: 'Open Day',
          fieldPath: 'featuredImage',
          locationLabel: 'News & Events > Open Day > featuredImage',
          sourceSlug: 'news-events',
          sourceType: 'collection',
        }),
        expect.objectContaining({
          documentID: 38,
          documentLabel: 'Yoga Day',
          fieldPath: 'images[0].image',
          locationLabel: 'Gallery Albums > Yoga Day > images[0].image',
          sourceSlug: 'gallery-albums',
          sourceType: 'collection',
        }),
        expect.objectContaining({
          documentID: 40,
          documentLabel: 'Main Header',
          fieldPath: 'layout[0].customLogoLight',
          locationLabel: 'Headers > Main Header > layout[0].customLogoLight',
          sourceSlug: 'headers',
          sourceType: 'collection',
        }),
        expect.objectContaining({
          documentID: 40,
          documentLabel: 'Main Header',
          fieldPath: 'layout[0].customLogoDark',
          locationLabel: 'Headers > Main Header > layout[0].customLogoDark',
          sourceSlug: 'headers',
          sourceType: 'collection',
        }),
        expect.objectContaining({
          documentID: 50,
          documentLabel: 'Site Footer',
          fieldPath: 'layout[0].customLogoLight',
          locationLabel: 'Footers > Site Footer > layout[0].customLogoLight',
          sourceSlug: 'footers',
          sourceType: 'collection',
        }),
        expect.objectContaining({
          documentID: 50,
          documentLabel: 'Site Footer',
          fieldPath: 'layout[0].customLogoDark',
          locationLabel: 'Footers > Site Footer > layout[0].customLogoDark',
          sourceSlug: 'footers',
          sourceType: 'collection',
        }),
        expect.objectContaining({
          documentLabel: 'News & Events Detail Template',
          fieldPath: 'header.backgroundImage',
          sourceSlug: 'news-events-detail-template',
          sourceType: 'global',
        }),
        expect.objectContaining({
          documentLabel: 'Site Identity',
          fieldPath: 'logo',
          locationLabel: 'Site Identity > Site Identity > logo',
          sourceSlug: 'site-settings',
          sourceType: 'global',
        }),
        expect.objectContaining({
          documentLabel: 'SEO & Metadata',
          fieldPath: 'defaultImage',
          locationLabel: 'SEO & Metadata > SEO & Metadata > defaultImage',
          sourceSlug: 'seo-settings',
          sourceType: 'global',
        }),
      ]),
    )

    expect(references).toHaveLength(13)
    expect(buildMediaUsageSummary(references)).toBe('Used in 13 locations across 10 entries.')
    expect(buildMediaUsageSummary([])).toBe('Unused asset.')
  })

  it('adds governance and usage fields to the media collection', () => {
    expect(JSON.stringify(Media.fields)).toContain('"name":"isCriticalAsset"')
    expect(JSON.stringify(Media.fields)).toContain('"name":"replacementNotes"')
    expect(JSON.stringify(Media.fields)).toContain('"name":"usageSummary"')
    expect(JSON.stringify(Media.fields)).toContain('"name":"usageDetails"')
    expect(JSON.stringify(Media.fields)).toContain('"virtual":true')
    expect(Media.hooks?.beforeDelete).toBeDefined()
  })

  it('does not add internal usage data for public or dependency-only Media reads', async () => {
    const afterRead = Media.hooks?.afterRead?.[0]
    if (!afterRead) throw new Error('Expected Media afterRead hook.')
    const find = vi.fn()

    const publicResult = await afterRead({
      doc: { id: 7 },
      findMany: false,
      req: { payload: { find }, user: null },
    } as never)
    const dependencyResult = await afterRead({
      doc: { id: 7 },
      findMany: false,
      req: { payload: { find }, user: { features: { pages: true }, role: 'siteManager' } },
    } as never)

    expect(publicResult).toEqual({ id: 7 })
    expect(dependencyResult).toEqual({ id: 7 })
    expect(find).not.toHaveBeenCalled()
  })

  it('requires alt text for images but allows documents without alt text', async () => {
    const beforeValidate = Media.hooks?.beforeValidate?.[0]

    expect(beforeValidate).toBeDefined()

    await expect(
      beforeValidate?.({
        data: {
          alt: '',
          assetType: 'general',
          mimeType: 'image/png',
        },
        operation: 'create',
        originalDoc: undefined,
      } as never),
    ).rejects.toThrow('Image assets require alt text.')

    await expect(
      beforeValidate?.({
        data: {
          alt: '',
          assetType: 'document',
          mimeType: 'application/pdf',
        },
        operation: 'create',
        originalDoc: undefined,
      } as never),
    ).resolves.toMatchObject({
      alt: '',
      assetType: 'document',
      mimeType: 'application/pdf',
    })
  })

  it('blocks deletion for referenced assets and allows unused assets', async () => {
    const referencedPayload = {
      find: vi.fn(async ({ collection }: { collection: string }) => ({
        docs:
          collection === 'pages'
            ? [
                {
                  id: 10,
                  ogImage: 7,
                  title: 'Home',
                },
              ]
            : [],
      })),
      findGlobal: vi.fn(async () => null),
    }

    await expect(
      preventMediaDeletionWhileInUse({
        id: 7,
        req: {
          payload: referencedPayload,
        },
      } as never),
    ).rejects.toThrow(
      'Cannot delete media asset because it is still referenced in: Pages > Home > ogImage',
    )

    const unusedPayload = {
      find: vi.fn(async () => ({
        docs: [],
      })),
      findGlobal: vi.fn(async () => null),
    }

    await expect(
      preventMediaDeletionWhileInUse({
        id: 77,
        req: {
          payload: unusedPayload,
        },
      } as never),
    ).resolves.toBeUndefined()
  })
})
