import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockMobilePaddingClasses,
  regularBlockContainerClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import {
  contentIntroClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'
import { TabsContentClient, type ResolvedTab } from './TabsContentClient'

type TabItem = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  description?: string | null
  eyebrow?: string | null
  id?: string | null
  image?: string | number | Media | null
  items?: Array<{
    icon?: string | null
    id?: string | null
    title?: string | null
  }> | null
  label?: string | null
  title?: string | null
}

type TabsContentBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'left' | 'center' | 'right' | null
  contentLayout?: 'imageRight' | 'imageLeft' | 'imageTop' | 'textOnly' | 'curriculum' | null
  curriculumColumns?: '1' | '2' | '3' | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  sectionLayout?: 'stacked' | 'split' | null
  size?: RegularBlockSize | null
  tabContentAlignment?: 'left' | 'center' | null
  tabAlignment?: 'left' | 'center' | 'right' | 'stretch' | null
  tabStyle?: 'underline' | 'pills' | 'boxed' | 'segmented' | null
  tabs?: TabItem[] | null
  title?: string | null
}

export function TabsContentBlockComponent({
  accentTitle,
  actions,
  appearance,
  contentAlignment = 'center',
  contentLayout = 'imageRight',
  curriculumColumns = '2',
  description,
  eyebrow,
  footerActions,
  sectionLayout = 'stacked',
  size = 'default',
  tabContentAlignment = 'left',
  tabAlignment = 'center',
  tabStyle = 'underline',
  tabs,
  title,
}: TabsContentBlockLike) {
  const resolvedAccentTitle = accentTitle?.trim() || undefined
  const validTabs = (tabs ?? []).filter((t) => t.label?.trim())
  if (validTabs.length < 2) return null

  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const resolvedContentAlignment = contentAlignment ?? 'center'
  const resolvedActions = resolveCmsActions(actions)
  const hasHeader = Boolean(
    eyebrow?.trim() || title?.trim() || description?.trim() || resolvedActions.length > 0,
  )
  const usesSplitLayout = sectionLayout === 'split' && hasHeader

  const resolvedTabs: ResolvedTab[] = validTabs.map((tab, index) => {
    const imageProps = getMediaImageProps({ media: tab.image, preset: 'generic' })
    return {
      id: tab.id ?? index,
      label: tab.label!.trim(),
      eyebrow: tab.eyebrow?.trim() || undefined,
      title: tab.title?.trim() || undefined,
      accentTitle: tab.accentTitle?.trim() || undefined,
      description: tab.description?.trim() || undefined,
      imageSrc: imageProps?.src,
      imageAlt: imageProps?.alt,
      items: (tab.items ?? []).flatMap((item, itemIndex) => {
        const itemTitle = item.title?.trim()
        return itemTitle
          ? [{ icon: item.icon?.trim() || undefined, id: item.id ?? itemIndex, title: itemTitle }]
          : []
      }),
      actions: resolveCmsActions(tab.actions),
    }
  })

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], appearanceClassName)}
      data-tabs-content="true"
    >
      <div className={regularBlockContainerClasses}>
        <div
          className={cn(
            usesSplitLayout
              ? 'grid gap-10 md:gap-12 lg:grid-cols-[minmax(16rem,0.75fr)_minmax(0,1.25fr)] lg:items-start lg:gap-12 xl:gap-16'
              : 'flex flex-col gap-10 md:gap-12',
          )}
          data-tabs-section-layout={usesSplitLayout ? 'split' : 'stacked'}
        >
          {hasHeader ? (
            <header
              className={cn(
                contentIntroClasses,
                resolvedContentAlignment === 'center' && 'mx-auto items-center text-center',
                resolvedContentAlignment === 'left' && 'items-start text-left',
                resolvedContentAlignment === 'right' && 'ml-auto items-end text-right',
              )}
              data-content-alignment={resolvedContentAlignment}
            >
              {eyebrow?.trim() ? (
                <SectionEyebrow surface={appearance?.background ?? 'none'}>
                  {eyebrow.trim()}
                </SectionEyebrow>
              ) : null}
              {title?.trim() ? (
                <h2 className={contentSectionHeadingClasses}>
                  {resolvedAccentTitle ? (
                    <>
                      <span className="block font-[inherit]">{title.trim()}</span>
                      <em className="block font-[inherit]">{resolvedAccentTitle}</em>
                    </>
                  ) : (
                    title.trim()
                  )}
                </h2>
              ) : null}
              {description?.trim() ? (
                <p className={contentSectionDescriptionClasses}>{description.trim()}</p>
              ) : null}
              {resolvedActions.length > 0 ? (
                <div className="mt-2">
                  <ContentActions actions={resolvedActions} alignment={resolvedContentAlignment} />
                </div>
              ) : null}
            </header>
          ) : null}

          <TabsContentClient
            compactGap={usesSplitLayout}
            sectionBackground={appearance?.background ?? 'none'}
            tabs={resolvedTabs}
            tabAlignment={tabAlignment}
            tabStyle={tabStyle}
            contentLayout={contentLayout}
            curriculumColumns={curriculumColumns}
            tabContentAlignment={tabContentAlignment ?? 'left'}
          />
        </div>
        <BlockFooterActions actions={footerActions} />
      </div>
    </section>
  )
}
