import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { resolveBlockAppearanceClasses } from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import {
  contentIntroClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

import { BankDetailsClient } from './BankDetailsClient'
import { normalizeBankAccounts, normalizeBankDetailsLedgerText } from './normalizeBankDetails'
import type { BankDetailsBlockLike } from './types'

export function BankDetailsBlockComponent({
  accentTitle,
  accounts,
  actions,
  appearance,
  contentAlignment = 'left',
  description,
  displayMode,
  eyebrow,
  footerActions,
  ledgerText,
  officialAccountLabel,
  panelDescription,
  panelPosition,
  panelTitle,
  size = 'default',
  tabStyle = 'underline',
  tabWidth = 'content',
  title,
}: BankDetailsBlockLike) {
  const resolvedAccounts = normalizeBankAccounts(accounts)
  const resolvedLedgerText = normalizeBankDetailsLedgerText(ledgerText)

  if (resolvedAccounts.length === 0) return null

  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const alignment = contentAlignment === 'center' ? 'center' : 'left'
  const resolvedSize =
    size === 'none' || size === 'compact' || size === 'comfortable' ? size : 'default'
  const resolvedActions = resolveCmsActions(actions)
  const resolvedEyebrow = eyebrow?.trim()
  const resolvedTitle = title?.trim()
  const resolvedAccentTitle = accentTitle?.trim()
  const resolvedDescription = description?.trim()
  const resolvedDisplayMode = displayMode === 'scanner' ? 'scanner' : 'text'
  const resolvedOfficialLabel =
    typeof officialAccountLabel === 'string'
      ? officialAccountLabel.trim()
      : 'Official college account'
  const resolvedPanelDescription = panelDescription?.trim()
  const resolvedPanelPosition = panelPosition === 'right' ? 'right' : 'left'
  const resolvedPanelTitle =
    typeof panelTitle === 'string' ? panelTitle.trim() : 'Bank transfer details'
  const hasHeader = Boolean(
    resolvedEyebrow || resolvedTitle || resolvedDescription || resolvedActions.length,
  )

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClasses.className)}
      data-bank-details="true"
      data-content-alignment={alignment}
    >
      <div className={cn(regularBlockContainerClasses, 'flex flex-col gap-8 md:gap-10')}>
        {hasHeader ? (
          <div
            className={cn(
              contentIntroClasses,
              alignment === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left',
            )}
            data-content-alignment={alignment}
          >
            {resolvedEyebrow ? (
              <SectionEyebrow surface={appearanceClasses.background}>
                {resolvedEyebrow}
              </SectionEyebrow>
            ) : null}
            {resolvedTitle ? (
              <h2 className={contentSectionHeadingClasses}>
                {resolvedAccentTitle ? (
                  <>
                    <span className="block">{resolvedTitle}</span>
                    <em className="block">{resolvedAccentTitle}</em>
                  </>
                ) : (
                  resolvedTitle
                )}
              </h2>
            ) : null}
            {resolvedDescription ? (
              <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
            ) : null}
            <ContentActions actions={resolvedActions} alignment={alignment} />
          </div>
        ) : null}

        <BankDetailsClient
          accounts={resolvedAccounts}
          displayMode={resolvedDisplayMode}
          ledgerText={resolvedLedgerText}
          officialAccountLabel={resolvedOfficialLabel}
          panelDescription={resolvedPanelDescription}
          panelPosition={resolvedPanelPosition}
          panelTitle={resolvedPanelTitle}
          sectionBackground={appearanceClasses.background}
          tabStyle={tabStyle}
          tabWidth={tabWidth}
        />

        <BlockFooterActions actions={footerActions} alignment={alignment} className="mt-0" />
      </div>
    </section>
  )
}
