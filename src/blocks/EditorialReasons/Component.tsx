import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import {
  contentIntroClasses,
  contentItemDescriptionClasses,
  contentItemLinkClasses,
  contentItemMetadataClasses,
  contentItemTitleClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import {
  resolveCmsActions,
  resolveCmsLink,
  type CmsActionValue,
  type CmsLinkValue,
} from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

type EditorialReasonValue = Omit<CmsLinkValue, 'linkType'> & {
  description?: string | null
  id?: string | null
  linkType?: 'custom' | 'none' | 'page' | null
  title?: string | null
}

type EditorialReasonsLayoutProportion = 'balanced' | 'fullWidth' | 'introFocus' | 'listFocus'

type EditorialReasonsListPosition = 'left' | 'right'

type EditorialReasonsContentAlignment = 'center' | 'left' | 'right'

type EditorialReasonsListColumns = '1' | '2' | '3' | '4'

type EditorialReasonsListBorderStyle = 'framed' | 'open' | 'ruled'

type EditorialReasonsNumberLayout = 'columns' | 'inline' | 'stacked'

type EditorialReasonsActionsPosition = 'bottom' | 'inline'

type EditorialReasonsBlockLike = {
  accentTitle?: string | null
  actionsPosition?: EditorialReasonsActionsPosition | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: EditorialReasonsContentAlignment | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  introVerticalAlignment?: 'bottom' | 'center' | 'top' | null
  layoutProportion?: EditorialReasonsLayoutProportion | null
  listActions?: CmsActionValue[] | null
  listBorderStyle?: EditorialReasonsListBorderStyle | null
  listColumns?: EditorialReasonsListColumns | null
  listPosition?: EditorialReasonsListPosition | null
  numberLayout?: EditorialReasonsNumberLayout | null
  reasons?: EditorialReasonValue[] | null
  size?: RegularBlockSize | null
  stickyIntro?: boolean | null
  title?: string | null
}

type ResolvedEditorialReason = {
  description?: string
  href?: string
  id: number | string
  openInNewTab: boolean
  title: string
}

const introAlignmentClasses = {
  top: 'lg:self-start',
  center: 'lg:self-center',
  bottom: 'lg:self-end',
} as const

const contentAlignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const

const listColumnClasses = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-1 md:grid-cols-2 md:[&>*:nth-child(2n)]:border-l',
  '3': 'grid-cols-1 md:grid-cols-2 md:[&>*:nth-child(2n)]:border-l xl:grid-cols-3 xl:[&>*:nth-child(3n+1)]:border-l-0 xl:[&>*:nth-child(3n+2)]:border-l xl:[&>*:nth-child(3n)]:border-l',
  '4': 'grid-cols-1 md:grid-cols-2 md:[&>*:nth-child(2n)]:border-l xl:grid-cols-4 xl:[&>*:nth-child(4n+3)]:border-l',
} as const

const listBorderStyleClasses = {
  open: 'overflow-hidden',
  ruled: 'overflow-hidden border-y border-current/15',
  framed: 'overflow-hidden rounded-card border border-current/15',
} as const

const layoutProportionClasses = {
  listFocus: 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
  balanced: 'lg:grid-cols-2',
  introFocus: 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
} as const

const leftListLayoutProportionClasses = {
  listFocus: 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
  balanced: 'lg:grid-cols-2',
  introFocus: 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
} as const

const layoutProportions = new Set<EditorialReasonsLayoutProportion>([
  'listFocus',
  'balanced',
  'introFocus',
  'fullWidth',
])

const listPositions = new Set<EditorialReasonsListPosition>(['right', 'left'])

const contentAlignments = new Set<EditorialReasonsContentAlignment>(['left', 'center', 'right'])

const listColumnValues = new Set<EditorialReasonsListColumns>(['1', '2', '3', '4'])

const listBorderStyles = new Set<EditorialReasonsListBorderStyle>(['open', 'ruled', 'framed'])

const numberLayoutValues = new Set<EditorialReasonsNumberLayout>(['stacked', 'inline', 'columns'])

const resolveLayoutProportion = (
  value: EditorialReasonsLayoutProportion | null | undefined,
): EditorialReasonsLayoutProportion =>
  layoutProportions.has(value as EditorialReasonsLayoutProportion) ? value! : 'listFocus'

const resolveListPosition = (
  value: EditorialReasonsListPosition | null | undefined,
): EditorialReasonsListPosition =>
  listPositions.has(value as EditorialReasonsListPosition) ? value! : 'right'

const resolveContentAlignment = (
  value: EditorialReasonsContentAlignment | null | undefined,
): EditorialReasonsContentAlignment =>
  contentAlignments.has(value as EditorialReasonsContentAlignment) ? value! : 'left'

const resolveListColumns = (
  value: EditorialReasonsListColumns | null | undefined,
): EditorialReasonsListColumns =>
  listColumnValues.has(value as EditorialReasonsListColumns) ? value! : '2'

const resolveListBorderStyle = (
  value: EditorialReasonsListBorderStyle | null | undefined,
): EditorialReasonsListBorderStyle =>
  listBorderStyles.has(value as EditorialReasonsListBorderStyle) ? value! : 'ruled'

const resolveNumberLayout = (
  value: EditorialReasonsNumberLayout | null | undefined,
): EditorialReasonsNumberLayout =>
  numberLayoutValues.has(value as EditorialReasonsNumberLayout) ? value! : 'stacked'

export function EditorialReasonsBlockComponent({
  accentTitle,
  actions,
  actionsPosition = 'inline',
  appearance,
  contentAlignment = 'left',
  description,
  eyebrow,
  footerActions,
  introVerticalAlignment = 'top',
  layoutProportion = 'listFocus',
  listActions,
  listBorderStyle = 'ruled',
  listColumns = '2',
  listPosition = 'right',
  numberLayout = 'stacked',
  reasons,
  size = 'default',
  stickyIntro = true,
  title,
}: EditorialReasonsBlockLike) {
  const resolvedTitle = title?.trim()
  if (!resolvedTitle) return null

  const resolvedReasons = (reasons ?? []).flatMap((reason, index): ResolvedEditorialReason[] => {
    const reasonTitle = reason.title?.trim()
    if (!reasonTitle) return []

    const destination = resolveCmsLink({
      linkType: reason.linkType === 'none' ? null : reason.linkType,
      openInNewTab: reason.openInNewTab,
      page: reason.page,
      url: reason.url,
    })

    return [
      {
        description: reason.description?.trim() || undefined,
        href: destination.href,
        id: reason.id ?? index,
        openInNewTab: destination.openInNewTab ?? false,
        title: reasonTitle,
      },
    ]
  })

  if (!resolvedReasons.length) return null

  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const resolvedAccentTitle = accentTitle?.trim()
  const resolvedActions = resolveCmsActions(actions)
  const resolvedDescription = description?.trim()
  const resolvedEyebrow = eyebrow?.trim()
  const resolvedContentAlignment = resolveContentAlignment(contentAlignment)
  const resolvedLayoutProportion = resolveLayoutProportion(layoutProportion)
  const resolvedListBorderStyle = resolveListBorderStyle(listBorderStyle)
  const resolvedNumberLayout = resolveNumberLayout(numberLayout)
  const resolvedListColumns =
    resolvedNumberLayout === 'columns' ? '1' : resolveListColumns(listColumns)
  const resolvedListPosition = resolveListPosition(listPosition)
  const resolvedListActions = resolveCmsActions(listActions)
  const isFullWidth = resolvedLayoutProportion === 'fullWidth'
  const resolvedIntroAlignment = isFullWidth ? 'top' : (introVerticalAlignment ?? 'top')
  const resolvedSectionBackground = appearance?.background ?? 'none'
  const resolvedSize = size ?? 'default'
  // Dropping the actions to the foot of the column needs the column to fill the
  // row, which a sticky element cannot do — so this wins over stickyIntro.
  const pushesActionsDown = !isFullWidth && (actionsPosition ?? 'inline') === 'bottom'
  const resolvedStickyIntro = !isFullWidth && !pushesActionsDown && (stickyIntro ?? true)

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClassName)}
      data-editorial-reasons="true"
    >
      <div
        className={cn(regularBlockContainerClasses)}
        data-editorial-reasons-layout={resolvedLayoutProportion}
        data-editorial-reasons-list-position={isFullWidth ? 'below' : resolvedListPosition}
      >
        <div
          className={cn(
            'grid gap-10 lg:gap-16',
            !isFullWidth &&
              (resolvedListPosition === 'left'
                ? leftListLayoutProportionClasses[resolvedLayoutProportion]
                : layoutProportionClasses[resolvedLayoutProportion]),
          )}
        >
          <div
            className={cn(
              'min-w-0',
              !isFullWidth &&
                (pushesActionsDown
                  ? 'lg:flex lg:flex-col lg:self-stretch'
                  : introAlignmentClasses[resolvedIntroAlignment]),
              !isFullWidth && (resolvedListPosition === 'right' ? 'lg:order-1' : 'lg:order-2'),
            )}
            data-editorial-reasons-intro="true"
            data-editorial-reasons-actions-position={pushesActionsDown ? 'bottom' : 'inline'}
            data-editorial-reasons-intro-alignment={resolvedIntroAlignment}
          >
            <div
              className={cn(
                contentIntroClasses,
                contentAlignmentClasses[resolvedContentAlignment],
                pushesActionsDown && 'lg:h-full',
                !isFullWidth && resolvedStickyIntro && 'lg:sticky lg:top-28',
              )}
              data-content-alignment={resolvedContentAlignment}
              data-editorial-reasons-content-alignment={resolvedContentAlignment}
              data-editorial-reasons-sticky={resolvedStickyIntro ? 'true' : 'false'}
            >
              {resolvedEyebrow ? (
                <SectionEyebrow surface={resolvedSectionBackground}>
                  {resolvedEyebrow}
                </SectionEyebrow>
              ) : null}

              <h2 className={contentSectionHeadingClasses}>
                <span className="block font-[inherit]">{resolvedTitle}</span>
                {resolvedAccentTitle ? (
                  <em className="block font-[inherit]">{resolvedAccentTitle}</em>
                ) : null}
              </h2>

              {resolvedDescription ? (
                <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
              ) : null}

              <ContentActions
                actions={resolvedActions}
                alignment={resolvedContentAlignment}
                className={cn(pushesActionsDown && 'lg:mt-auto')}
                data-editorial-reasons-actions="true"
              />
            </div>
          </div>

          <div
            className={cn(
              'min-w-0',
              !isFullWidth && (resolvedListPosition === 'right' ? 'lg:order-2' : 'lg:order-1'),
            )}
          >
            <div
              className={cn(listBorderStyleClasses[resolvedListBorderStyle])}
              data-editorial-reasons-border-style={resolvedListBorderStyle}
              data-editorial-reasons-columns={resolvedListColumns}
              data-editorial-reasons-list="true"
            >
              <div
                className={cn(
                  '-mb-px grid',
                  resolvedListBorderStyle !== 'framed' && '-mx-6',
                  listColumnClasses[resolvedListColumns],
                )}
                data-editorial-reasons-grid="true"
              >
                {resolvedReasons.map((reason, index) => {
                  const reasonTitle = reason.href ? (
                    <h3>
                      <a
                        className={cn(contentItemTitleClasses, contentItemLinkClasses)}
                        href={reason.href}
                        rel={reason.openInNewTab ? 'noreferrer' : undefined}
                        target={reason.openInNewTab ? '_blank' : undefined}
                      >
                        {reason.title}
                      </a>
                    </h3>
                  ) : (
                    <h3 className={contentItemTitleClasses}>{reason.title}</h3>
                  )

                  return (
                    <article
                      className={cn(
                        'min-w-0 border-b border-current/15 px-6 py-7 sm:py-8',
                        resolvedNumberLayout === 'columns'
                          ? 'grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-5 gap-y-2 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-x-6 lg:grid-cols-[4.5rem_minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-x-8'
                          : resolvedNumberLayout === 'inline'
                            ? 'grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-5 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-6'
                            : 'flex flex-col',
                      )}
                      data-editorial-reason="true"
                      data-editorial-reason-number-layout={resolvedNumberLayout}
                      key={reason.id}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          contentItemMetadataClasses,
                          resolvedNumberLayout === 'stacked'
                            ? 'mb-6 tabular-nums'
                            : 'pt-1 tabular-nums',
                        )}
                        data-section-eyebrow-surface={resolvedSectionBackground}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      {resolvedNumberLayout === 'columns' ? (
                        <>
                          <div
                            className={cn('min-w-0', !reason.description && 'lg:col-span-2')}
                            data-editorial-reason-title="true"
                          >
                            {reasonTitle}
                          </div>
                          {reason.description ? (
                            <p
                              className={cn(
                                contentItemDescriptionClasses,
                                'col-start-2 lg:col-start-3 lg:row-start-1',
                              )}
                              data-editorial-reason-description="true"
                            >
                              {reason.description}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <div className="min-w-0">
                          {reasonTitle}
                          {reason.description ? (
                            <p className={cn(contentItemDescriptionClasses, 'mt-2')}>
                              {reason.description}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>

            {resolvedListActions.length > 0 ? (
              <ContentActions
                actions={resolvedListActions}
                alignment={resolvedContentAlignment}
                className="mt-8"
                data-editorial-reasons-list-actions="true"
              />
            ) : null}
          </div>
        </div>
        <BlockFooterActions actions={footerActions} />
      </div>
    </section>
  )
}
