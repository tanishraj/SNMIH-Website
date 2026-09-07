'use client'

import Image from 'next/image'
import { Accordion as AccordionPrimitive } from 'radix-ui'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import {
  contentIntroClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { compactRichTextClasses } from '@/components/rich-text/richTextStyles'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import { cn } from '@/lib/utils'

import {
  resolveQaAccordionLayout,
  type QaAccordionLayoutInput,
  type QaAccordionSectionVerticalAlignment,
  type QaAccordionSplitProportion,
} from './layoutContract'

type RichTextData = React.ComponentProps<typeof RichText>['data']

type RichTextValue = {
  root?: {
    children?: unknown[]
  } | null
} | null

type QaAccordionItemValue = {
  answer?: RichTextValue
  question?: string | null
}

type QaAccordionContact = {
  actions?: CmsActionValue[] | null
  description?: string | null
  title?: string | null
}

type QaAccordionProfile = {
  image?: unknown
  name?: string | null
  title?: string | null
}

type QaAccordionBlockLike = QaAccordionLayoutInput & {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'center' | 'left' | 'right' | null
  defaultOpenFirst?: boolean | null
  description?: string | null
  footerActions?: CmsActionValue[] | null
  accordionPlacement?: 'left' | 'right' | null
  title?: string | null
  items?: QaAccordionItemValue[] | null
  sideColumn?: {
    contact?: QaAccordionContact | null
    profile?: QaAccordionProfile | null
  } | null
  size?: 'none' | 'comfortable' | 'compact' | 'default' | null
  supportingActionsPosition?: 'bottom' | 'inline' | null
}

const contentAlignmentClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
} as const

const rightQaProportionClasses: Record<QaAccordionSplitProportion, string> = {
  balanced: 'lg:grid-cols-2',
  qaFocus: 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
  sectionFocus: 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
}

const leftQaProportionClasses: Record<QaAccordionSplitProportion, string> = {
  balanced: 'lg:grid-cols-2',
  qaFocus: 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
  sectionFocus: 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
}

const sectionVerticalAlignmentClasses: Record<QaAccordionSectionVerticalAlignment, string> = {
  bottom: 'lg:justify-end',
  center: 'lg:justify-center',
  top: 'lg:justify-start',
}

const accordionPlacementClasses = {
  left: 'lg:order-1',
  right: 'lg:order-2',
} as const

const sidePlacementClasses = {
  left: 'lg:order-2',
  right: 'lg:order-1',
} as const

const emptyRichText = {
  root: {
    type: 'root',
    children: [],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
} satisfies RichTextData

function QaAccordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root className={cn('space-y-0', className)} {...props} />
}

function QaAccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={className} {...props} />
}

function QaAccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          'group/accordion-trigger flex flex-1 items-start border-0 p-0 text-left transition-all outline-none disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          className="ml-auto h-5 w-5 shrink-0 text-current/70 group-data-[state=open]/accordion-trigger:hidden"
          aria-hidden="true"
        />
        <ChevronUpIcon
          className="ml-auto hidden h-5 w-5 shrink-0 text-current/70 group-data-[state=open]/accordion-trigger:inline"
          aria-hidden="true"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function QaAccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={className}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

function QaContentActions({ className, ...props }: React.ComponentProps<typeof ContentActions>) {
  return (
    <ContentActions
      {...props}
      className={cn(
        '[&_a]:max-w-full [&_a]:whitespace-normal [&_a]:[overflow-wrap:anywhere] [&_[data-slot=button]]:h-auto [&_[data-slot=button]]:min-h-10 [&_[data-slot=button]]:py-2',
        className,
      )}
    />
  )
}

export function QaAccordionBlockComponent({
  accentTitle,
  actions,
  appearance,
  contentAlignment = 'center',
  defaultOpenFirst = true,
  description,
  footerActions,
  accordionPlacement = 'right',
  title,
  items,
  layoutMode,
  sectionVerticalAlignment,
  sideColumn,
  size = 'default',
  splitProportion,
  supportingActionsPosition,
}: QaAccordionBlockLike) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const resolvedContentAlignment = contentAlignment ?? 'center'
  const resolvedAccordionPlacement = accordionPlacement ?? 'right'
  const resolvedSize = size ?? 'default'
  const validItems = (items ?? []).flatMap((item) => {
    const question = item?.question?.trim()

    if (!question) {
      return []
    }

    return [
      {
        answer: item.answer ?? emptyRichText,
        question,
      },
    ]
  })

  if (!validItems.length) {
    return null
  }

  const resolvedTitle = title?.trim()
  const resolvedAccentTitle = accentTitle?.trim()
  const profile = sideColumn?.profile
  const contact = sideColumn?.contact
  const profileImage = getMediaImageProps({
    media: profile?.image as never,
    preset: 'generic',
    fallbackAlt: profile?.name?.trim() || title,
  })
  const resolvedHeaderActions = resolveCmsActions(actions)
  const contactActions = resolveCmsActions(contact?.actions)

  const resolvedLayout = resolveQaAccordionLayout({
    layoutMode,
    sectionVerticalAlignment,
    splitProportion,
  })
  const isSplitLayout = resolvedLayout.layoutMode === 'split'
  const proportionClasses =
    resolvedAccordionPlacement === 'left' ? leftQaProportionClasses : rightQaProportionClasses
  const hasProfile =
    isSplitLayout && Boolean(profileImage || profile?.name?.trim() || profile?.title?.trim())
  const hasContactCopy =
    isSplitLayout && Boolean(contact?.title?.trim() || contact?.description?.trim())
  const hasContactActions = isSplitLayout && contactActions.length > 0
  const hasSideColumn = hasProfile || hasContactCopy || hasContactActions
  const pinSupportingActions = hasContactActions && supportingActionsPosition === 'bottom'
  const hasInlineSupportingContent =
    hasProfile || hasContactCopy || (hasContactActions && !pinSupportingActions)
  const hasIntroduction = Boolean(
    resolvedTitle ||
    resolvedAccentTitle ||
    description?.trim() ||
    (!isSplitLayout && resolvedHeaderActions.length > 0),
  )

  const supportingContent = hasInlineSupportingContent ? (
    <aside
      className={cn(
        'flex flex-col gap-8 lg:gap-12',
        contentAlignmentClasses[resolvedContentAlignment],
      )}
      data-qa-accordion-side-column="true"
    >
      {hasProfile ? (
        <div className="flex items-start gap-3 sm:gap-4">
          {profileImage ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-card sm:h-16 sm:w-16">
              <Image
                fill
                alt={profileImage.alt}
                className="object-cover"
                src={profileImage.src}
                sizes="64px"
              />
            </div>
          ) : null}
          {profile?.name?.trim() || profile?.title?.trim() ? (
            <div className="min-w-0">
              {profile?.name?.trim() ? (
                <p className="mb-1 text-sm font-semibold text-current sm:text-base">
                  {profile.name.trim()}
                </p>
              ) : null}
              {profile?.title?.trim() ? (
                <p className="text-sm text-current/70 sm:text-base">{profile.title.trim()}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasContactCopy ? (
        <div className="w-full space-y-4 lg:space-y-6">
          {contact?.title?.trim() ? (
            <p className="text-lg leading-tight font-semibold text-current sm:text-xl">
              {contact.title.trim()}
            </p>
          ) : null}
          {contact?.description?.trim() ? (
            <p className="text-sm leading-relaxed text-current/70 sm:text-base">
              {contact.description.trim()}
            </p>
          ) : null}
        </div>
      ) : null}

      {!pinSupportingActions ? (
        <QaContentActions
          actions={contactActions}
          alignment={resolvedContentAlignment}
          data-qa-accordion-contact-actions="true"
        />
      ) : null}
    </aside>
  ) : null

  const sectionContentGroup =
    hasIntroduction || hasInlineSupportingContent ? (
      <div
        className={cn(
          'flex flex-col gap-8 lg:gap-12',
          isSplitLayout && [
            'lg:flex-1',
            sectionVerticalAlignmentClasses[resolvedLayout.sectionVerticalAlignment],
          ],
        )}
        data-qa-accordion-content-group="true"
      >
        {hasIntroduction ? (
          <div
            className={cn(
              contentIntroClasses,
              'w-full max-w-none',
              contentAlignmentClasses[resolvedContentAlignment],
            )}
            data-qa-accordion-intro="true"
          >
            {resolvedTitle || resolvedAccentTitle ? (
              <h2 className={contentSectionHeadingClasses}>
                {resolvedAccentTitle ? (
                  <>
                    {resolvedTitle ? (
                      <span className="block font-[inherit]">{resolvedTitle}</span>
                    ) : null}
                    <em className="block font-[inherit]">{resolvedAccentTitle}</em>
                  </>
                ) : (
                  resolvedTitle
                )}
              </h2>
            ) : null}
            {description?.trim() ? (
              <p className={contentSectionDescriptionClasses}>{description.trim()}</p>
            ) : null}
            {!isSplitLayout ? (
              <QaContentActions
                actions={resolvedHeaderActions}
                alignment={resolvedContentAlignment}
                data-qa-accordion-header-actions="true"
              />
            ) : null}
          </div>
        ) : null}

        {supportingContent}
      </div>
    ) : null

  const sectionContent =
    isSplitLayout || sectionContentGroup ? (
      <div
        className={cn(
          'order-1',
          isSplitLayout
            ? [sidePlacementClasses[resolvedAccordionPlacement], 'lg:h-full']
            : 'mb-10 w-full lg:mb-16',
          'flex flex-col',
        )}
        data-qa-accordion-section-content="true"
      >
        {sectionContentGroup}
        {isSplitLayout && (pinSupportingActions || resolvedHeaderActions.length > 0) ? (
          <div
            className={cn(
              'flex flex-col gap-4',
              sectionContentGroup && 'mt-8',
              'lg:mt-auto',
              sectionContentGroup && 'lg:pt-8',
            )}
            data-qa-accordion-bottom-actions="true"
          >
            {pinSupportingActions ? (
              <QaContentActions
                actions={contactActions}
                alignment={resolvedContentAlignment}
                data-qa-accordion-contact-actions="true"
              />
            ) : null}
            <QaContentActions
              actions={resolvedHeaderActions}
              alignment={resolvedContentAlignment}
              data-qa-accordion-header-actions="true"
              data-qa-accordion-section-actions="true"
            />
          </div>
        ) : null}
      </div>
    ) : null

  const accordionContent = (
    <div
      className={cn(
        'order-2',
        isSplitLayout ? accordionPlacementClasses[resolvedAccordionPlacement] : 'w-full',
      )}
      data-qa-accordion-main="true"
    >
      <QaAccordion
        className="max-w-none"
        collapsible
        defaultValue={defaultOpenFirst ? 'item-0' : undefined}
        type="single"
      >
        {validItems.map((item, index) => (
          <QaAccordionItem
            className={cn(
              'border-0',
              index !== validItems.length - 1 && 'border-b border-current/15',
            )}
            key={`${item.question}-${index}`}
            value={`item-${index}`}
          >
            <QaAccordionTrigger
              className={cn(
                'justify-between py-6 text-left text-base font-semibold hover:no-underline sm:text-lg lg:text-xl',
                isSplitLayout && index === 0 ? 'lg:pt-0 lg:pb-8' : 'lg:py-8',
              )}
            >
              <span className="pr-4">{item.question}</span>
            </QaAccordionTrigger>
            <QaAccordionContent className="pb-6 pr-8 text-left text-sm leading-relaxed text-current/70 sm:text-base">
              <div className={cn(compactRichTextClasses, 'text-left')}>
                <RichText data={item.answer as RichTextData} />
              </div>
            </QaAccordionContent>
          </QaAccordionItem>
        ))}
      </QaAccordion>
    </div>
  )

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClasses.className)}
      data-qa-accordion-background={appearance?.background ?? 'none'}
      data-qa-accordion-content-alignment={resolvedContentAlignment}
      data-qa-accordion-has-side-column={hasSideColumn ? 'true' : 'false'}
      data-qa-accordion-layout={resolvedLayout.layoutMode}
      data-qa-accordion-placement={resolvedAccordionPlacement}
      data-qa-accordion-section-vertical-alignment={resolvedLayout.sectionVerticalAlignment}
      data-qa-accordion-side-column={hasSideColumn ? 'true' : 'false'}
      data-qa-accordion-size={resolvedSize}
      data-qa-accordion-split-proportion={resolvedLayout.splitProportion}
      data-qa-accordion-supporting-actions-position={pinSupportingActions ? 'bottom' : 'inline'}
    >
      <div className={regularBlockContainerClasses}>
        <div className="w-full">
          {isSplitLayout ? (
            <div
              className={cn(
                'grid gap-10 lg:gap-16',
                proportionClasses[resolvedLayout.splitProportion],
              )}
            >
              {sectionContent}
              {accordionContent}
            </div>
          ) : (
            <>
              {sectionContent}
              {accordionContent}
            </>
          )}
        </div>
        <BlockFooterActions actions={footerActions} />
      </div>
    </section>
  )
}
